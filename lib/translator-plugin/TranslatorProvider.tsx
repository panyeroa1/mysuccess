'use client';

import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { Room, RoomEvent } from 'livekit-client';
import {
  AppMode,
  Language,
  LANGUAGES,
  RoomState,
  AudioSource,
  EmotionType,
} from '@/translator-plugin (2)/types';
import * as roomStateService from '@/translator-plugin (2)/services/roomStateService';
import * as geminiService from '@/translator-plugin (2)/services/geminiService';

const SUPABASE_URL = 'https://rcbuikbjqgykssiatxpo.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjYnVpa2JqcWd5a3NzaWF0eHBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ2NDcyMCwiZXhwIjoyMDgyMDQwNzIwfQ.VVtRWVNMURmi45snFLq733Q_Tzpf1CVXxWPXomxFYGw';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEFAULT_ROOM_STATE: RoomState = {
  activeSpeaker: null,
  raiseHandQueue: [],
  lockVersion: 0,
};

export type TranslatorContextValue = {
  mode: AppMode;
  roomState: RoomState;
  selectedLanguage: Language;
  userId: string;
  userName: string;
  audioSource: AudioSource;
  audioData: Uint8Array;
  liveStreamText: string;
  translatedStreamText: string;
  isTtsLoading: boolean;
  emotion: EmotionType;
  toggleListen: () => void;
  toggleSpeak: () => void;
  setSelectedLanguage: (lang: Language) => void;
  raiseHand: () => void;
  toggleAudioSource: () => void;
};

const TranslatorContext = React.createContext<TranslatorContextValue | null>(null);

export function useTranslator() {
  const context = React.useContext(TranslatorContext);
  if (!context) {
    throw new Error('useTranslator must be used within TranslatorProvider');
  }
  return context;
}

type TranslatorProviderProps = {
  roomName: string;
  participantName?: string;
  room: Room;
  children: React.ReactNode;
};

export function TranslatorProvider({
  roomName,
  participantName,
  room,
  children,
}: TranslatorProviderProps) {
  const fallbackIdRef = React.useRef(`user_${Math.random().toString(36).substring(7)}`);
  const fallbackNameRef = React.useRef(
    `Member ${fallbackIdRef.current.split('_')[1]?.toUpperCase() || 'USER'}`,
  );

  const [userId, setUserId] = React.useState(
    room.localParticipant.identity || fallbackIdRef.current,
  );
  const [userName, setUserName] = React.useState(
    room.localParticipant.name || participantName || fallbackNameRef.current,
  );

  const [mode, setMode] = React.useState<AppMode>('idle');
  const [audioSource, setAudioSource] = React.useState<AudioSource>('mic');
  const [roomState, setRoomState] = React.useState<RoomState>(DEFAULT_ROOM_STATE);
  const [selectedLanguage, setSelectedLanguage] = React.useState<Language>(LANGUAGES[0]);
  const [transcriptHistory, setTranscriptHistory] = React.useState<string[]>([]);
  const [livePartialText, setLivePartialText] = React.useState<string>('');
  const [translatedStreamText, setTranslatedStreamText] = React.useState<string>('');
  const [emotion, setEmotion] = React.useState<EmotionType>('neutral');
  const [audioData, setAudioData] = React.useState<Uint8Array>(new Uint8Array(0));
  const [isTtsLoading, setIsTtsLoading] = React.useState(false);

  const selectedLanguageRef = React.useRef<Language>(LANGUAGES[0]);
  React.useEffect(() => {
    selectedLanguageRef.current = selectedLanguage;
  }, [selectedLanguage]);

  const recognitionRef = React.useRef<any>(null);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const isTtsActiveRef = React.useRef(false);
  const lastProcessedSegmentIdRef = React.useRef<string | null>(null);
  const currentSegmentBufferRef = React.useRef<string>('');

  const segmentQueueRef = React.useRef<any[]>([]);
  const realtimeChannelRef = React.useRef<any>(null);

  const meetingId = roomName || 'default';

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    setRoomState(roomStateService.getRoomState());
    const unsub = roomStateService.subscribeToRoomState(setRoomState);
    return () => unsub();
  }, []);

  const ensureAudioContext = React.useCallback(() => {
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
        source_lang: selectedLanguageRef.current.code,
        source_text: segment,
        last_segment_id: segmentId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'meeting_id' },
    );
  };

  const processNextInQueue = React.useCallback(async () => {
    if (segmentQueueRef.current.length === 0 || isTtsActiveRef.current) return;

    const row = segmentQueueRef.current.shift();
    if (!row || row.last_segment_id === lastProcessedSegmentIdRef.current) {
      processNextInQueue();
      return;
    }

    lastProcessedSegmentIdRef.current = row.last_segment_id;
    setIsTtsLoading(true);

    const currentTargetLang = selectedLanguageRef.current;
    const ctx = ensureAudioContext();

    try {
      isTtsActiveRef.current = true;

      await geminiService.streamTranslation(
        row.source_text,
        currentTargetLang.name,
        ctx,
        (data) => {
          setAudioData(data);
          setIsTtsLoading(false);
        },
        (text) => setTranslatedStreamText(text),
        () => {
          isTtsActiveRef.current = false;
          setAudioData(new Uint8Array(0));

          if (segmentQueueRef.current.length > 0) {
            processNextInQueue();
          } else {
            setTimeout(() => {
              if (segmentQueueRef.current.length === 0 && !isTtsActiveRef.current) {
                setTranslatedStreamText('');
              }
            }, 3000);
          }
        },
      );
    } catch (err) {
      console.error('Failed to process segment:', err);
      setIsTtsLoading(false);
      isTtsActiveRef.current = false;
      processNextInQueue();
    }
  }, [ensureAudioContext]);

  const handleIncomingRow = React.useCallback(
    (row: any) => {
      if (!row || row.speaker_id === userId) return;

      if (row.last_segment_id === lastProcessedSegmentIdRef.current) return;
      const isAlreadyQueued = segmentQueueRef.current.some(
        (q) => q.last_segment_id === row.last_segment_id,
      );
      if (isAlreadyQueued) return;

      segmentQueueRef.current.push(row);
      processNextInQueue();
    },
    [processNextInQueue, userId],
  );

  const fetchCurrentSegment = React.useCallback(async () => {
    const { data } = await supabase
      .from('transcript_segments')
      .select('*')
      .eq('meeting_id', meetingId)
      .maybeSingle();

    if (data) handleIncomingRow(data);
  }, [handleIncomingRow, meetingId]);

  React.useEffect(() => {
    if (mode === 'listening') {
      const channel = supabase
        .channel(`meeting:${meetingId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transcript_segments', filter: `meeting_id=eq.${meetingId}` },
          (payload) => {
            handleIncomingRow(payload.new);
          },
        )
        .subscribe();

      realtimeChannelRef.current = channel;

      fetchCurrentSegment();

      const pollInterval = setInterval(fetchCurrentSegment, 2000);

      return () => {
        if (realtimeChannelRef.current) {
          supabase.removeChannel(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        }
        clearInterval(pollInterval);
      };
    }
  }, [mode, handleIncomingRow, fetchCurrentSegment, meetingId]);

  const toggleListen = React.useCallback(async () => {
    ensureAudioContext();
    if (mode === 'listening') {
      setMode('idle');
      setTranslatedStreamText('');
      setAudioData(new Uint8Array(0));
      segmentQueueRef.current = [];
      lastProcessedSegmentIdRef.current = null;
    } else {
      setMode('listening');
      setLivePartialText('');
      setTranscriptHistory([]);
      setTranslatedStreamText('');
    }
  }, [mode, ensureAudioContext]);

  const toggleSpeak = React.useCallback(() => {
    ensureAudioContext();
    if (mode === 'speaking') {
      if (recognitionRef.current) recognitionRef.current.stop();
      setMode('idle');
      setLivePartialText('');
      setTranscriptHistory([]);
      roomStateService.releaseSpeaker(userId);
    } else {
      const acquired = roomStateService.tryAcquireSpeaker(userId, userName);
      if (acquired) {
        setMode('speaking');
        setTranscriptHistory([]);

        const recognition = new ((window as any).webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedLanguageRef.current.code;

        recognition.onresult = (event: any) => {
          let final = '';
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final = event.results[i][0].transcript;
              setTranscriptHistory((prev) => [...prev.slice(-2), final]);
              setLivePartialText('');
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          if (interim) {
            setLivePartialText(interim);
          }

          if (final) {
            currentSegmentBufferRef.current = final;
            shipSegment();
          }
        };
        recognition.start();
        recognitionRef.current = recognition;
      }
    }
  }, [mode, ensureAudioContext, userId, userName]);

  const liveStreamText = React.useMemo(() => {
    return [...transcriptHistory, livePartialText].filter(Boolean).join(' ');
  }, [transcriptHistory, livePartialText]);

  const value = React.useMemo<TranslatorContextValue>(
    () => ({
      mode,
      roomState,
      selectedLanguage,
      userId,
      userName,
      audioSource,
      audioData,
      liveStreamText,
      translatedStreamText,
      isTtsLoading,
      emotion,
      toggleListen,
      toggleSpeak,
      setSelectedLanguage,
      raiseHand: () => roomStateService.raiseHand(userId, userName),
      toggleAudioSource: () => setAudioSource(audioSource === 'mic' ? 'system' : 'mic'),
    }),
    [
      mode,
      roomState,
      selectedLanguage,
      userId,
      userName,
      audioSource,
      audioData,
      liveStreamText,
      translatedStreamText,
      isTtsLoading,
      emotion,
      toggleListen,
      toggleSpeak,
    ],
  );

  return <TranslatorContext.Provider value={value}>{children}</TranslatorContext.Provider>;
}
