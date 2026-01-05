'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Room, RoomEvent } from 'livekit-client';
import { AppMode, Language, LANGUAGES, RoomState, AudioSource, EmotionType } from './types';
import TranslatorDock from './TranslatorDock';
import * as roomStateService from './roomStateService';
import * as geminiService from './geminiService';

const SUPABASE_URL = 'https://rcbuikbjqgykssiatxpo.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjYnVpa2JqcWd5a3NzaWF0eHBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ2NDcyMCwiZXhwIjoyMDgyMDQwNzIwfQ.VVtRWVNMURmi45snFLq733Q_Tzpf1CVXxWPXomxFYGw';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface TranslatorPluginProps {
  roomName: string;
  participantName?: string;
  room: Room;
}

const TranslatorPlugin: React.FC<TranslatorPluginProps> = ({
  roomName,
  participantName,
  room,
}) => {
  const fallbackIdRef = useRef(`user_${Math.random().toString(36).substring(7)}`);
  const fallbackNameRef = useRef(
    `Member ${fallbackIdRef.current.split('_')[1]?.toUpperCase() || 'USER'}`,
  );

  const [userId, setUserId] = useState(
    room.localParticipant.identity || fallbackIdRef.current,
  );
  const [userName, setUserName] = useState(
    room.localParticipant.name || participantName || fallbackNameRef.current,
  );

  const [mode, setMode] = useState<AppMode>('idle');
  const [audioSource, setAudioSource] = useState<AudioSource>('mic');
  const [roomState, setRoomState] = useState<RoomState>(() => roomStateService.getRoomState());
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(LANGUAGES[0]);
  const [livePartialText, setLivePartialText] = useState<string>('');
  const [translatedStreamText, setTranslatedStreamText] = useState<string>('');
  const [emotion, setEmotion] = useState<EmotionType>('neutral');
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
  const [isTtsLoading, setIsTtsLoading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastProcessedSegmentIdRef = useRef<string | null>(null);
  const currentSegmentBufferRef = useRef<string>('');
  const pollingIntervalRef = useRef<number | null>(null);

  const meetingId = roomName || 'default';

  useEffect(() => {
    const syncUser = () => {
      setUserId(room.localParticipant.identity || fallbackIdRef.current);
      setUserName(room.localParticipant.name || participantName || fallbackNameRef.current);
    };

    syncUser();
    room.on(RoomEvent.Connected, syncUser);
    return () => {
      room.off(RoomEvent.Connected, syncUser);
    };
  }, [room, participantName]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const shipSegment = async () => {
    const segment = currentSegmentBufferRef.current.trim();
    if (!segment) return;
    currentSegmentBufferRef.current = '';

    const segmentId = Math.random().toString(36).substring(7);
    await supabase.from('transcript_segments').upsert(
      {
        meeting_id: meetingId,
        speaker_id: userId,
        source_lang: 'auto',
        source_text: segment,
        last_segment_id: segmentId,
      },
      { onConflict: 'meeting_id' },
    );
  };

  const processIncomingSegment = useCallback(
    async (row: any) => {
      if (!row || !row.source_text || row.last_segment_id === lastProcessedSegmentIdRef.current)
        return;
      lastProcessedSegmentIdRef.current = row.last_segment_id;

      setIsTtsLoading(true);
      const analysis = await geminiService.translateAndAnalyze(row.source_text, selectedLanguage.name);
      setIsTtsLoading(false);

      setEmotion(analysis.emotion);
      setTranslatedStreamText(analysis.translatedText);

      const ctx = ensureAudioContext();
      await geminiService.playLiveReadAloud(
        analysis.translatedText,
        analysis.emotion,
        selectedLanguage.name,
        analysis.pronunciationGuide,
        ctx,
        (data) => setAudioData(data),
        () => {
          setAudioData(new Uint8Array(0));
        },
      );
    },
    [selectedLanguage, ensureAudioContext],
  );

  const pollTranscription = useCallback(async () => {
    const { data } = await supabase
      .from('transcript_segments')
      .select('*')
      .eq('meeting_id', meetingId)
      .maybeSingle();

    if (data && data.speaker_id !== userId) {
      processIncomingSegment(data);
    }
  }, [processIncomingSegment, meetingId, userId]);

  const toggleListen = async () => {
    ensureAudioContext();
    if (mode === 'listening') {
      setMode('idle');
      setTranslatedStreamText('');
      setAudioData(new Uint8Array(0));
      if (pollingIntervalRef.current) window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    } else {
      setMode('listening');
      setLivePartialText('');
      setTranslatedStreamText('');

      const { data } = await supabase
        .from('transcript_segments')
        .select('*')
        .eq('meeting_id', meetingId)
        .maybeSingle();
      if (data) processIncomingSegment(data);

      pollingIntervalRef.current = window.setInterval(pollTranscription, 700);
    }
  };

  const handleSpeakToggle = () => {
    ensureAudioContext();
    if (mode === 'speaking') {
      if (recognitionRef.current) recognitionRef.current.stop();
      setMode('idle');
      roomStateService.releaseSpeaker(userId);
      return;
    }

    const recognitionCtor = (window as any).webkitSpeechRecognition;
    if (!recognitionCtor) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const acquired = roomStateService.tryAcquireSpeaker(userId, userName);
    if (acquired) {
      setMode('speaking');

      const recognition = new recognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let final = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
          else interim += event.results[i][0].transcript;
        }
        setLivePartialText(interim || final);
        if (final) {
          currentSegmentBufferRef.current += `${final} `;
          shipSegment();
        }
      };
      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  useEffect(() => {
    const unsub = roomStateService.subscribeToRoomState(setRoomState);
    return unsub;
  }, []);

  return (
    <TranslatorDock
      mode={mode}
      roomState={roomState}
      selectedLanguage={selectedLanguage}
      myUserId={userId}
      onSpeakToggle={handleSpeakToggle}
      onListenToggle={toggleListen}
      onLanguageChange={setSelectedLanguage}
      onRaiseHand={() => roomStateService.raiseHand(userId, userName)}
      audioData={audioData}
      audioSource={audioSource}
      onAudioSourceToggle={() => setAudioSource(audioSource === 'mic' ? 'system' : 'mic')}
      liveStreamText={livePartialText}
      translatedStreamText={translatedStreamText}
      isTtsLoading={isTtsLoading}
      emotion={emotion}
    />
  );
};

export default TranslatorPlugin;
