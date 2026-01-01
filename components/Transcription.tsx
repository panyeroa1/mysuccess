"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

import { translateText, detectLanguage } from "@/actions/translate";

interface TranscriptionProps {
  userId: string;
  meetingId: string;
  deviceId?: string;
  targetLang: string;
  audioSource: "microphone" | "system" | "both";
  screenShareAudioStream?: MediaStream | null;
  speakerAudioStream?: MediaStream | null;
}

const Transcription = ({
  userId,
  meetingId,
  deviceId,
  targetLang,
  audioSource,
  screenShareAudioStream,
  speakerAudioStream,
}: TranscriptionProps) => {
  const [transcriptDisplay, setTranscriptDisplay] = useState("");
  const deepgramRef = useRef<any>(null);
  const microphoneRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const auxStreamsRef = useRef<MediaStream[]>([]);

  const cloneAudioStream = (source?: MediaStream | null): MediaStream | null => {
    const track = source?.getAudioTracks().find((item) => item.readyState === "live");
    if (!track) return null;
    return new MediaStream([track.clone()]);
  };

  const getAudioStream = async (): Promise<MediaStream | null> => {
    try {
      auxStreamsRef.current = [];

      if (audioSource === "microphone") {
        const constraints: MediaStreamConstraints = {
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        };
        return await navigator.mediaDevices.getUserMedia(constraints);
      } 
      
      if (audioSource === "system") {
         const externalStream =
           cloneAudioStream(screenShareAudioStream) ??
           cloneAudioStream(speakerAudioStream);
         if (externalStream) {
           return externalStream;
         }

         // Fallback: getDisplayMedia requires video to be valid
         const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
         const audioTrack = stream.getAudioTracks()[0];
         if (!audioTrack) {
            console.warn("No system audio track found. Did you check 'Share Audio'?");
            stream.getTracks().forEach(t => t.stop());
            return null;
         }
         stream.getVideoTracks().forEach(t => t.stop());
         return new MediaStream([audioTrack]);
      }

      if (audioSource === "both") {
         const constraints: MediaStreamConstraints = {
            audio: deviceId ? { deviceId: { exact: deviceId } } : true,
         };
         const micStream = await navigator.mediaDevices.getUserMedia(constraints);
         
         let systemStream =
           cloneAudioStream(screenShareAudioStream) ??
           cloneAudioStream(speakerAudioStream);

         if (!systemStream) {
            try {
                const sysStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                const sysAudioTrack = sysStream.getAudioTracks()[0];
                if (sysAudioTrack) {
                    // Stop video track immediately
                    sysStream.getVideoTracks().forEach(t => t.stop());
                    systemStream = new MediaStream([sysAudioTrack]);
                } else {
                     sysStream.getTracks().forEach(t => t.stop());
                }
            } catch (err) {
                console.warn("System audio capture cancelled or failed", err);
            }
         }
         
         if (!systemStream) {
             console.warn("No system audio. Using mic only.");
             return micStream;
         }

         // Mix them
         const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
         audioContextRef.current = ctx;

         const micSource = ctx.createMediaStreamSource(micStream);
         const sysSource = ctx.createMediaStreamSource(systemStream);
         const dest = ctx.createMediaStreamDestination();

         micSource.connect(dest);
         sysSource.connect(dest);

         auxStreamsRef.current.push(micStream, systemStream);

         return dest.stream;
      }

      return null;
    } catch (err) {
        console.error("Error getting stream:", err);
        return null;
    }
  };

  const startDeepgram = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
      if (!apiKey) {
        console.error("Deepgram API Key missing");
        return;
      }

      const stream = await getAudioStream();
      if (!stream) return;
      
      streamRef.current = stream;

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
             
             // Final result: Show it clearly (maybe clear after a delay or keep until next)
             setTranscriptDisplay(translated);
             
             await saveTranscript(text, translated, detectedLang);
           } else {
             // Interim result: Show live "typing" effect
             // If we are translating, we still show the source text while speaking because we can't translate live easily without lag
             // User sees what they say, then it snaps to translation on pause.
             setTranscriptDisplay(text);
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
      // Feedback to user
      const msg = error instanceof Error ? error.message : "Connection failed";
      // We can't use toast here easily without importing it or passing it in.
      // Ideally we pass toast as prop or use console.
      console.warn("Transcription Check: Deepgram failed to start.", msg);
    }
  };

  const stopDeepgram = () => {
    if (microphoneRef.current && microphoneRef.current.state !== "inactive") {
      microphoneRef.current.stop();
    }
    
    // Stop all tracks on the active stream
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }

    // Close AudioContext if open
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }

    if (auxStreamsRef.current.length) {
        auxStreamsRef.current.forEach((stream) => {
            stream.getTracks().forEach((track) => track.stop());
        });
        auxStreamsRef.current = [];
    }

    if (deepgramRef.current) {
        deepgramRef.current.finish(); 
        deepgramRef.current = null;
    }
  };

  const saveTranscript = async (original: string, translated: string, sourceLang: string) => {
    if (!original || original.trim().length === 0) return;
    
    try {
      await supabase.from("translations").insert({
        user_id: userId,
        meeting_id: meetingId,
        source_lang: sourceLang || "auto", 
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
  }, [deviceId, audioSource, screenShareAudioStream, speakerAudioStream]); // Restart when device or source changes

  if (!transcriptDisplay) return null;

  return (
    <div className="fixed bottom-20 left-0 z-[100] flex w-full justify-center px-3 pointer-events-none sm:bottom-[110px] sm:px-4">
      <div className="videoke-caption max-w-[95vw] rounded-lg bg-black/60 px-3 py-2 text-left text-lg font-semibold leading-snug text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,1)] backdrop-blur-md transition-all duration-100 sm:max-w-5xl sm:rounded-xl sm:px-6 sm:py-4 sm:text-3xl">
        {transcriptDisplay}
      </div>
    </div>
  );
};

export default Transcription;
