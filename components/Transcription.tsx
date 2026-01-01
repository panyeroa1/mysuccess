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
  const [isListening, setIsListening] = useState(false);
  const [transcriptDisplay, setTranscriptDisplay] = useState("Initializing...");
  const deepgramRef = useRef<any>(null);
  const microphoneRef = useRef<MediaRecorder | null>(null);

  const startDeepgram = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
      if (!apiKey) {
        console.error("Deepgram API Key missing");
        return;
      }

      setTranscriptDisplay("Requesting microphone...");
      
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        console.warn("Browser does not support audio/webm");
        // Fallback or error handling
      }

      const microphone = new MediaRecorder(stream, { mimeType: "audio/webm" });
      microphoneRef.current = microphone;

      const deepgram = createClient(apiKey);
      
      const connection = deepgram.listen.live({
        model: "nova-3",
        language: "multi",
        smart_format: true,
        diarize: true,
      });

      deepgramRef.current = connection;

      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log("Deepgram connection open");
        setTranscriptDisplay("Listening...");
        setIsListening(true);

        microphone.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0 && connection.getReadyState() === 1) {
            connection.send(event.data);
          }
        });

        microphone.start(250); // Send distinct chunks every 250ms
      });

      connection.on(LiveTranscriptionEvents.Transcript, async (data) => {
        // Handle transcript
        const alternative = data.channel.alternatives[0];
        if (alternative && alternative.transcript) {
           const text = alternative.transcript;
           
           if (data.is_final) {
             let translated = text;
             if (targetLang && targetLang !== "en") { 
                const tx = await translateText(text, targetLang);
                if (tx) translated = tx;
             }
             
             setTranscriptDisplay((prev) => (prev + " " + text + ` (${translated})`).slice(-200));
             await saveTranscript(text, translated);
           } else {
             // For UI feedback, show interim
           }
        }
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log("Deepgram connection closed");
        setIsListening(false);
        setTranscriptDisplay("Connection closed.");
      });

      connection.on(LiveTranscriptionEvents.Error, (err) => {
        console.error("Deepgram error", err);
        setTranscriptDisplay("Error occurred.");
        setIsListening(false);
      });

    } catch (error) {
      console.error("Failed to start Deepgram", error);
      setTranscriptDisplay("Failed to start.");
      setIsListening(false);
    }
  };

  const stopDeepgram = () => {
    if (microphoneRef.current && microphoneRef.current.state !== "inactive") {
      microphoneRef.current.stop(); // This will stop recording
      // Also stop the tracks to release the mic
      microphoneRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (deepgramRef.current) {
        // Finish sending?
        deepgramRef.current.finish(); 
        deepgramRef.current = null;
    }
    setIsListening(false);
    setTranscriptDisplay("Stopped.");
  };

  const saveTranscript = async (original: string, translated: string) => {
    if (!original || original.trim().length === 0) return;
    
    try {
      const { error } = await supabase.from("translations").insert({
        user_id: userId,
        meeting_id: meetingId,
        source_lang: "auto", 
        target_lang: targetLang || "en",
        original_text: original,
        translated_text: translated, 
      });

      if (error) {
        console.error("Error saving transcript to Supabase:", error);
      }
    } catch (err) {
      console.error("Unexpected error saving transcript:", err);
    }
  };

  useEffect(() => {
    // If deviceId changes and we are listening, we should optionally restart
    // For now, let's just cleanup on unmount
    return () => {
      stopDeepgram();
    };
  }, []);

  // Effect to handle device switching if already listening
  useEffect(() => {
    if (isListening && deviceId) {
        console.log("Device changed to", deviceId, "restarting transcription...");
        stopDeepgram();
        // Give a bit of time for cleanup then restart
        setTimeout(() => startDeepgram(), 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  return (
    <div className="fixed bottom-20 left-4 z-50 bg-dark-1 p-3 rounded-lg text-white opacity-90 shadow-lg border border-gray-700">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <p className="text-xs font-semibold">{isListening ? 'Live Transcription' : 'Transcription Off'}</p>
        
        {!isListening ? (
             <button 
             onClick={startDeepgram} 
             className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition-colors"
         >
             Start
         </button>
        ) : (
            <button 
            onClick={stopDeepgram} 
            className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition-colors"
        >
            Stop
        </button>
        )}
       
      </div>
      <div className="mt-3 max-h-24 w-[250px] overflow-y-auto text-xs text-slate-300 font-mono bg-black/20 p-2 rounded">
          {transcriptDisplay}
      </div>
    </div>
  );
};

export default Transcription;
