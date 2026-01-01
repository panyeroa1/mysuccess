"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

import { translateText } from "@/actions/translate";

interface TranscriptionProps {
  userId: string;
  meetingId: string;
  deviceId?: string;
  targetLang: string;
}

const Transcription = ({ userId, meetingId, deviceId, targetLang }: TranscriptionProps) => {
  const [transcriptDisplay, setTranscriptDisplay] = useState("");
  const deepgramRef = useRef<any>(null);
  const microphoneRef = useRef<MediaRecorder | null>(null);

  const startDeepgram = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
      if (!apiKey) {
        console.error("Deepgram API Key missing");
        return;
      }

      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        console.warn("Browser does not support audio/webm");
      }

      const microphone = new MediaRecorder(stream, { mimeType: "audio/webm" });
      microphoneRef.current = microphone;

      const deepgram = createClient(apiKey);
      
      const connection = deepgram.listen.live({
        model: "nova-3",
        language: "multi",
        smart_format: true,
        diarize: true,
        utterance_end_ms: 1000,
      });

      deepgramRef.current = connection;

      connection.on(LiveTranscriptionEvents.Open, () => {
        microphone.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0 && connection.getReadyState() === 1) {
            connection.send(event.data);
          }
        });

        microphone.start(250);
      });

      connection.on(LiveTranscriptionEvents.Transcript, async (data) => {
        const alternative = data.channel.alternatives[0];
        if (alternative && alternative.transcript) {
           const text = alternative.transcript;
           
           if (data.is_final) {
             let translated = text;
             let detectedLang = "en";

             // Detect language of the source text
             detectedLang = await detectLanguage(text);

             if (targetLang && targetLang !== detectedLang) { 
                const tx = await translateText(text, targetLang);
                if (tx) translated = tx;
             }
             
             // Keep only the last ~100 characters for the "single line" feel
             setTranscriptDisplay((prev) => {
                 const newText = prev + " " + (targetLang && targetLang !== detectedLang ? translated : text);
                 return newText.slice(-100); 
             });
             
             await saveTranscript(text, translated, detectedLang);
           } else {
             // Optional: Show interim results for smoother "streaming" feel
             // setTranscriptDisplay((prev) => (prev + " " + text).slice(-100));
           }
        }
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        // console.log("Deepgram connection closed");
      });

      connection.on(LiveTranscriptionEvents.Error, (err) => {
        console.error("Deepgram error", err);
      });

    } catch (error) {
      console.error("Failed to start Deepgram", error);
    }
  };

  const stopDeepgram = () => {
    if (microphoneRef.current && microphoneRef.current.state !== "inactive") {
      microphoneRef.current.stop();
      microphoneRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (deepgramRef.current) {
        deepgramRef.current.finish(); 
        deepgramRef.current = null;
    }
  };

  const saveTranscript = async (original: string, translated: string) => {
    if (!original || original.trim().length === 0) return;
    
    try {
      await supabase.from("translations").insert({
        user_id: userId,
        meeting_id: meetingId,
        source_lang: "auto", 
        target_lang: targetLang || "en",
        original_text: original,
        translated_text: translated, 
      });
    } catch (err) {
      console.error("Unexpected error saving transcript:", err);
    }
  };

  useEffect(() => {
    startDeepgram();
    return () => {
      stopDeepgram();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to handle device switching if already active
  useEffect(() => {
    if (deviceId && deepgramRef.current) {
        stopDeepgram();
        setTimeout(() => startDeepgram(), 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  if (!transcriptDisplay) return null;

  return (
    <div className="fixed bottom-[90px] left-0 w-full flex justify-center pointer-events-none z-50">
        <div className="bg-black/60 px-6 py-2 rounded-full text-white text-lg font-medium whitespace-nowrap overflow-hidden max-w-[80%] text-center shadow-lg backdrop-blur-sm">
            {transcriptDisplay}
        </div>
    </div>
  );
};

export default Transcription;
