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
  audioSource: "auto" | "microphone" | "system" | "both";
  screenShareAudioStream?: MediaStream | null;
  speakerAudioStream?: MediaStream | null;
  sttEngine: "deepgram" | "web-speech" | "fast-whisper";
}

const Transcription = ({
  userId,
  meetingId,
  deviceId,
  targetLang,
  audioSource,
  screenShareAudioStream,
  speakerAudioStream,
  sttEngine,
}: TranscriptionProps) => {
  const [transcriptDisplay, setTranscriptDisplay] = useState("");
  const deepgramRef = useRef<any>(null);
  const microphoneRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const auxStreamsRef = useRef<MediaStream[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const webSpeechActiveRef = useRef(false);
  const fastWhisperBusyRef = useRef(false);

  const cloneAudioStream = (source?: MediaStream | null): MediaStream | null => {
    const track = source
      ?.getAudioTracks()
      .find((item) => item.readyState === "live" && item.enabled);
    if (!track) return null;
    return new MediaStream([track.clone()]);
  };

  const getExternalStream = (): MediaStream | null =>
    cloneAudioStream(screenShareAudioStream) ??
    cloneAudioStream(speakerAudioStream);

  const handleFinalTranscript = async (text: string) => {
    if (!text || text.trim().length === 0) return;

    let translated = text;
    let detectedLang = "en";

    detectedLang = await detectLanguage(text);

    if (targetLang && targetLang !== detectedLang) {
      const tx = await translateText(text, targetLang);
      if (tx) translated = tx;
    }

    setTranscriptDisplay(translated);
    await saveTranscript(text, translated, detectedLang);
  };

  const handleInterimTranscript = (text: string) => {
    if (!text || text.trim().length === 0) return;
    setTranscriptDisplay(text);
  };

  const sendToFastWhisper = async (blob: Blob) => {
    if (fastWhisperBusyRef.current) return null;
    fastWhisperBusyRef.current = true;
    try {
      const formData = new FormData();
      formData.append("file", blob, "audio.webm");
      formData.append("language", "auto");

      const response = await fetch("/api/stt/fast-whisper", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("Fast Whisper request failed", response.status);
        return null;
      }

      const data = await response.json();
      return data?.text ?? null;
    } catch (error) {
      console.error("Fast Whisper error:", error);
      return null;
    } finally {
      fastWhisperBusyRef.current = false;
    }
  };

  const getAudioStream = async (): Promise<MediaStream | null> => {
    try {
      auxStreamsRef.current = [];

      if (audioSource === "auto") {
        const externalStream = getExternalStream();
        if (externalStream) {
          return externalStream;
        }

        const constraints: MediaStreamConstraints = {
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        };
        return await navigator.mediaDevices.getUserMedia(constraints);
      }

      if (audioSource === "microphone") {
        const constraints: MediaStreamConstraints = {
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        };
        return await navigator.mediaDevices.getUserMedia(constraints);
      } 
      
      if (audioSource === "system") {
         const externalStream = getExternalStream();
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
         
         let systemStream = getExternalStream();

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
             await handleFinalTranscript(text);
           } else {
             // Interim result: Show live "typing" effect
             // If we are translating, we still show the source text while speaking because we can't translate live easily without lag
             // User sees what they say, then it snaps to translation on pause.
             handleInterimTranscript(text);
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

  const startWebSpeech = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Web Speech API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    webSpeechActiveRef.current = true;
    recognition.onresult = (event: any) => {
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || "";
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) handleInterimTranscript(interim);
      if (finalText.trim()) handleFinalTranscript(finalText.trim());
    };

    recognition.onerror = (event: any) => {
      console.error("Web Speech error", event);
    };

    recognition.onend = () => {
      if (webSpeechActiveRef.current) {
        try {
          recognition.start();
        } catch (err) {
          console.error("Web Speech restart failed", err);
        }
      }
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
  };

  const startFastWhisper = async () => {
    try {
      const stream = await getAudioStream();
      if (!stream) return;

      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      microphoneRef.current = recorder;

      recorder.addEventListener("dataavailable", async (event) => {
        if (!event.data || event.data.size === 0) return;
        const text = await sendToFastWhisper(event.data);
        if (text) {
          await handleFinalTranscript(text);
        }
      });

      recorder.start(3000);
    } catch (error) {
      console.error("Failed to start Fast Whisper", error);
    }
  };

  const stopTranscription = () => {
    if (microphoneRef.current && microphoneRef.current.state !== "inactive") {
      microphoneRef.current.stop();
    }
    microphoneRef.current = null;
    
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

    if (speechRecognitionRef.current) {
        webSpeechActiveRef.current = false;
        try {
          speechRecognitionRef.current.onend = null;
          speechRecognitionRef.current.stop();
        } catch (error) {
          console.error("Failed to stop Web Speech", error);
        }
        speechRecognitionRef.current = null;
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
    if (sttEngine === "web-speech") {
      startWebSpeech();
    } else if (sttEngine === "fast-whisper") {
      startFastWhisper();
    } else {
      startDeepgram();
    }

    return () => {
      stopTranscription();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, audioSource, screenShareAudioStream, speakerAudioStream, sttEngine]); // Restart when device or source changes

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
