"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

import { translateText, detectLanguage } from "@/actions/translate";

interface TranscriptionProps {
  userId: string;
  meetingId: string;
  speakerId?: string | null;
  listenerId?: string | null;
  deviceId?: string;
  targetLang: string;
  audioSource: "auto" | "microphone" | "system" | "both";
  screenShareAudioStream?: MediaStream | null;
  speakerAudioStream?: MediaStream | null;
  sttEngine: "deepgram" | "web-speech" | "fast-whisper";
  isMicMutedForSTT?: boolean;
  onFinalTranscript?: (text: string) => void;
}

const Transcription = ({
  userId,
  meetingId,
  speakerId,
  listenerId,
  deviceId,
  targetLang,
  audioSource,
  screenShareAudioStream,
  speakerAudioStream,
  sttEngine,
  isMicMutedForSTT,
  onFinalTranscript,
}: TranscriptionProps) => {
  const [finalTranscripts, setFinalTranscripts] = useState<string[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);
  const microphoneRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const auxStreamsRef = useRef<MediaStream[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const webSpeechActiveRef = useRef(false);
  const fastWhisperBusyRef = useRef(false);
  const deepgramBusyRef = useRef(false);
  const transcriptRowRef = useRef<string | null>(null);
  const transcriptBufferRef = useRef({ original: "", translated: "" });
  const isAiSpeakingRef = useRef(false);
  const isAiProcessingRef = useRef(false);

  const isShieldActive = () => isAiSpeakingRef.current || isAiProcessingRef.current;

  useEffect(() => {
    const start = () => { isAiSpeakingRef.current = true; };
    const end = () => { isAiSpeakingRef.current = false; };
    const seqStart = () => { isAiProcessingRef.current = true; };
    const seqEnd = () => { isAiProcessingRef.current = false; };
    window.addEventListener("ai-speaking-start", start);
    window.addEventListener("ai-speaking-end", end);
    window.addEventListener("ai-sequence-start", seqStart);
    window.addEventListener("ai-sequence-end", seqEnd);
    return () => {
      window.removeEventListener("ai-speaking-start", start);
      window.removeEventListener("ai-speaking-end", end);
      window.removeEventListener("ai-sequence-start", seqStart);
      window.removeEventListener("ai-sequence-end", seqEnd);
    };
  }, []);

  const resetClearTimer = () => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => {
      setFinalTranscripts([]);
      setInterimTranscript("");
    }, 8000); // Clear after 8 seconds of silence
  };

  const appendTranscript = (current: string, next: string) => {
    const trimmed = next.trim();
    if (!trimmed) return current;
    if (!current) return trimmed;
    return `${current}\n${trimmed}`;
  };

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

    onFinalTranscript?.(text);

    let translated = text;
    let detectedLang = "en";

    detectedLang = await detectLanguage(text);

    if (targetLang && targetLang !== detectedLang) {
      const tx = await translateText(text, targetLang);
      if (tx) translated = tx;
    }

    setFinalTranscripts((prev) => [...prev.slice(-2), translated]);
    setInterimTranscript("");
    resetClearTimer();
    await saveTranscript(text, translated, detectedLang);
  };

  const handleInterimTranscript = (text: string) => {
    if (!text || text.trim().length === 0) return;
    setInterimTranscript(text);
    resetClearTimer();
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

  const sendToDeepgram = async (blob: Blob) => {
    if (deepgramBusyRef.current) return null;
    deepgramBusyRef.current = true;
    try {
      const formData = new FormData();
      formData.append("file", blob, "audio.webm");

      const response = await fetch("/api/stt/deepgram", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("Deepgram request failed", response.status);
        return null;
      }

      const data = await response.json();
      return data?.text ?? null;
    } catch (error) {
      console.error("Deepgram REST error:", error);
      return null;
    } finally {
      deepgramBusyRef.current = false;
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
          audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        };
        return await navigator.mediaDevices.getUserMedia(constraints);
      }

      if (audioSource === "microphone") {
        const constraints: MediaStreamConstraints = {
          audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
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
            audio: {
              deviceId: deviceId ? { exact: deviceId } : undefined,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
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

  const deepgramWsRef = useRef<WebSocket | null>(null);

  const startDeepgram = async () => {
    try {
      const stream = await getAudioStream();
      if (!stream) return;
      
      streamRef.current = stream;

      // Get WebSocket connection info from our API
      const configRes = await fetch("/api/stt/deepgram-stream?model=nova-3&language=multi");
      if (!configRes.ok) {
        console.error("Failed to get Deepgram config");
        return;
      }
      const { url, token } = await configRes.json();

      // Create WebSocket connection to Deepgram
      const ws = new WebSocket(url, ["token", token]);
      deepgramWsRef.current = ws;

      ws.onopen = () => {
        console.log("Deepgram WebSocket connected");

        // Set up audio processing for raw PCM (linear16)
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN || isShieldActive() || isMicMutedForSTT) return;

          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = new Int16Array(inputData.length);
          
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          ws.send(pcmData.buffer);
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          const transcript = data?.channel?.alternatives?.[0]?.transcript;
          
          if (transcript) {
            if (data.is_final) {
              await handleFinalTranscript(transcript);
            } else {
              handleInterimTranscript(transcript);
            }
          }
        } catch (err) {
          console.error("Error parsing Deepgram response", err);
        }
      };

      ws.onerror = (error) => {
        console.error("Deepgram WebSocket error", error);
      };

      ws.onclose = () => {
        console.log("Deepgram WebSocket closed");
      };

    } catch (error) {
      console.error("Failed to start Deepgram streaming", error);
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
      if (isShieldActive() || isMicMutedForSTT) return;
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
        if (!event.data || event.data.size === 0 || isShieldActive() || isMicMutedForSTT) return;
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

    if (deepgramWsRef.current) {
        deepgramWsRef.current.close();
        deepgramWsRef.current = null;
    }
  };

  const saveTranscript = async (original: string, translated: string, sourceLang: string) => {
    if (!original || original.trim().length === 0) return;
    
    try {
      const resolvedListenerId = listenerId || userId;
      const resolvedSpeakerId = speakerId || resolvedListenerId;
      const nextOriginal = appendTranscript(
        transcriptBufferRef.current.original,
        original
      );
      const nextTranslated = appendTranscript(
        transcriptBufferRef.current.translated,
        translated || original
      );

      transcriptBufferRef.current = {
        original: nextOriginal,
        translated: nextTranslated,
      };

      const payload = {
        user_id: resolvedListenerId,
        meeting_id: meetingId,
        speaker_id: resolvedSpeakerId,
        listener_id: resolvedListenerId,
        source_lang: sourceLang || "auto", 
        target_lang: targetLang || "en",
        original_text: nextOriginal,
        translated_text: nextTranslated, 
      };

      if (transcriptRowRef.current) {
        const { error } = await supabase
          .from("translations")
          .update(payload)
          .eq("id", transcriptRowRef.current);

        if (error) {
          console.error("Failed to update transcript:", error);
        }
        return;
      }

      const { data, error } = await supabase
        .from("translations")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        console.error("Failed to create transcript row:", error);
        return;
      }

      transcriptRowRef.current = data?.id ?? null;
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

  if (finalTranscripts.length === 0 && !interimTranscript) return null;

  return (
    <div className="fixed bottom-20 left-0 z-[100] flex w-full flex-col items-center justify-center px-3 pointer-events-none sm:bottom-[110px] sm:px-4 gap-2">
      {finalTranscripts.map((text, idx) => {
        const hasEmphasis = text.includes("!") || (text.toUpperCase() === text && text.length > 5);
        const isQuestion = text.includes("?");
        return (
          <div 
            key={idx}
            className={`videoke-caption max-w-[95vw] rounded-md px-3 py-2 text-left text-[14px] leading-snug drop-shadow-[0_2px_2px_rgba(0,0,0,1)] backdrop-blur-md transition-all duration-300 sm:max-w-5xl ${
              hasEmphasis 
                ? "bg-red-600/80 text-white font-bold scale-110" 
                : isQuestion
                ? "bg-blue-600/80 text-white font-medium italic"
                : "bg-black/60 text-yellow-300 font-light"
            }`}
          >
            {text}
          </div>
        );
      })}
      {interimTranscript && (
        <div className="videoke-caption max-w-[95vw] rounded-md bg-black/40 px-3 py-1 text-left text-[13px] font-light italic leading-snug text-yellow-100/80 drop-shadow-[0_1px_1px_rgba(0,0,0,1)] backdrop-blur-sm sm:max-w-5xl">
          {interimTranscript}...
        </div>
      )}
    </div>
  );
};

export default Transcription;
