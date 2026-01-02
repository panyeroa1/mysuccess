"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { languages } from "@/constants/languages";
import { Volume2, VolumeX, Mic, MicOff, MessageSquare, MessageSquareOff } from "lucide-react";

type TranslatorPanelProps = {
  sentences: string[];
  targetLang: string;
  onLanguageChange: (lang: string) => void;
  isMicMutedForMeeting?: boolean;
  onToggleMicMeeting?: () => void;
  isMicMutedForSTT?: boolean;
  onToggleMicSTT?: () => void;
};

type TranslationItem = {
  id: string;
  source: string;
  translated: string;
  status: "pending" | "ready" | "error";
};

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const TranslatorPanel = ({
  sentences,
  targetLang,
  onLanguageChange,
  isMicMutedForMeeting = false,
  onToggleMicMeeting,
  isMicMutedForSTT = false,
  onToggleMicSTT,
}: TranslatorPanelProps) => {
  const [selectedLang, setSelectedLang] = useState(targetLang || "en");
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [isMeetingMuted, setIsMeetingMuted] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(1.0);
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef(false);
  const lastIndexRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setSelectedLang(newLang);
    onLanguageChange(newLang);
  };

  const playAudio = useCallback(async (blob: Blob) =>
    new Promise<void>((resolve) => {
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      const audio = new Audio(url);
      audio.preload = "auto";
      audio.muted = false;
      audio.volume = voiceVolume;
      audioRef.current = audio;

      // Dispatch event to prevent feedback loop
      window.dispatchEvent(new CustomEvent("ai-speaking-start"));

      audio.onended = () => {
        // 500ms cooldown to account for reverb/echo tail
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("ai-speaking-end"));
          URL.revokeObjectURL(url);
          resolve();
        }, 500);
      };
      audio.onerror = () => {
        window.dispatchEvent(new CustomEvent("ai-speaking-end"));
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.play().catch(() => {
        window.dispatchEvent(new CustomEvent("ai-speaking-end"));
        resolve();
      });
    }), [voiceVolume]);

  const processQueue = useCallback(async () => {
    if (processingRef.current || !autoTranslate) return;
    processingRef.current = true;

    // Signal start of a translation sequence to close gaps between sentences
    window.dispatchEvent(new CustomEvent("ai-sequence-start"));

    while (queueRef.current.length > 0 && autoTranslate) {
      const sentence = queueRef.current.shift()?.trim();
      if (!sentence) continue;

      const id = createId();
      setItems((prev) =>
        [...prev, { id, source: sentence, translated: "", status: "pending" as const }].slice(
          -80
        )
      );

      let translatedText = sentence;
      try {
        if (selectedLang && selectedLang !== "auto") {
          const response = await fetch("/api/translate/ollama", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: sentence, targetLang: selectedLang }),
          });
          if (response.ok) {
            const data = await response.json();
            translatedText = data?.translatedText || sentence;
          }
        }
      } catch (error) {
        console.error("Translation failed:", error);
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                translated: translatedText,
                status: "ready",
              }
            : item
        )
      );

      try {
        const ttsResponse = await fetch("/api/tts/cartesia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: translatedText, language: selectedLang }),
        });

        if (ttsResponse.ok) {
          const blob = await ttsResponse.blob();
          await playAudio(blob);
        } else {
          console.error("TTS Response Error:", ttsResponse.status);
          setItems((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, status: "error" } : item
            )
          );
        }
      } catch (error) {
        console.error("TTS failed:", error);
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: "error" } : item
          )
        );
      }
    }

    processingRef.current = false;
    window.dispatchEvent(new CustomEvent("ai-sequence-end"));
  }, [selectedLang, autoTranslate, playAudio]);

  useEffect(() => {
    if (targetLang && targetLang !== selectedLang) {
      setSelectedLang(targetLang);
    }
  }, [targetLang, selectedLang]);

  useEffect(() => {
    const next = sentences.slice(lastIndexRef.current);
    lastIndexRef.current = sentences.length;
    if (next.length) {
      queueRef.current.push(...next);
      if (autoTranslate) {
        processQueue();
      }
    }
  }, [sentences, selectedLang, autoTranslate, processQueue]);

  useEffect(() => {
    if (autoTranslate) {
      processQueue();
    }
  }, [autoTranslate, processQueue]);

  useEffect(() => {
    if (!listRef.current || !stickToBottom) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [items.length, stickToBottom]);

  useEffect(() => {
    const syncMute = () => {
      const media = document.querySelectorAll("audio, video");
      media.forEach((m) => {
        if (m === audioRef.current) return;
        const el = m as HTMLMediaElement;
        if (el.muted !== isMeetingMuted) {
          el.muted = isMeetingMuted;
        }
      });
    };

    syncMute();
    
    // Regular interval sync for stubborn dynamically added elements
    const interval = setInterval(syncMute, 1000);
    
    const obs = new MutationObserver(syncMute);
    obs.observe(document.body, { childList: true, subtree: true });
    
    return () => {
        clearInterval(interval);
        obs.disconnect();
    };
  }, [isMeetingMuted]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = voiceVolume;
    }
  }, [voiceVolume]);

  const handleListScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const threshold = 24;
    const atBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight <= threshold;
    setStickToBottom(atBottom);
  };

  const handleClear = () => {
    setItems([]);
    queueRef.current = [];
    lastIndexRef.current = sentences.length;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header with Language Selector */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.2em] text-white/60">
          Live Translation
        </div>
        <label htmlFor="translation-language" className="sr-only">
          Translation language
        </label>
        <select
          id="translation-language"
          value={selectedLang}
          onChange={handleLangChange}
          className="rounded-md border border-white/10 bg-[#111827] px-2 py-1 text-[12px] font-light text-white/80 outline-none focus:border-blue-400"
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Broadcast Mic Controls */}
      <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/5 p-3">
        <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1 font-medium">Broadcast Settings</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMicMeeting}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-[12px] transition ${
              isMicMutedForMeeting
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            }`}
            title={isMicMutedForMeeting ? "Unmute Meeting Mic" : "Mute Meeting Mic"}
          >
            {isMicMutedForMeeting ? <MicOff size={14} /> : <Mic size={14} />}
            <span className="font-light">Meeting {isMicMutedForMeeting ? "Off" : "On"}</span>
          </button>
          <button
            type="button"
            onClick={onToggleMicSTT}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-[12px] transition ${
              isMicMutedForSTT
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-blue-500/30 bg-blue-500/10 text-blue-400"
            }`}
            title={isMicMutedForSTT ? "Unmute Translator Input" : "Mute Translator Input"}
          >
            {isMicMutedForSTT ? <MessageSquareOff size={14} /> : <MessageSquare size={14} />}
            <span className="font-light">STT {isMicMutedForSTT ? "Off" : "On"}</span>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAutoTranslate((prev) => !prev)}
          className={`inline-flex items-center justify-center rounded-md border px-3 py-2 text-[12px] font-light transition ${
            autoTranslate
              ? "border-blue-400 bg-blue-500/20 text-blue-200"
              : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
          }`}
          title="Toggle translation audio"
        >
          {autoTranslate ? "Stop translation audio" : "Start translate + speak"}
        </button>
        <button
          type="button"
          onClick={() => setIsMeetingMuted((prev) => !prev)}
          className={`inline-flex items-center justify-center rounded-md border p-2 transition ${
            isMeetingMuted
              ? "border-red-400 bg-red-500/20 text-red-200"
              : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
          }`}
          title={isMeetingMuted ? "Unmute meeting audio" : "Mute meeting audio (Focus on translation)"}
        >
          {isMeetingMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        
        {/* Volume Slider for AI Voice */}
        <div className="flex items-center gap-2 px-1">
          <label htmlFor="ai-voice-volume" className="sr-only">AI Volume</label>
          <input
            id="ai-voice-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={voiceVolume}
            onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
            className="h-1.5 w-16 cursor-pointer appearance-none rounded-lg bg-white/10 accent-blue-500"
            title="AI Voice Volume"
          />
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="ml-auto inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-2 py-2 text-[12px] font-light text-white/70 transition hover:border-white/20 hover:bg-white/10"
        >
          Clear
        </button>
      </div>

      {/* Translation List */}
      <div
        ref={listRef}
        onScroll={handleListScroll}
        className="flex-1 space-y-4 overflow-y-auto text-[14px] font-light"
      >
        {items.length === 0 ? (
          <div className="text-white/50">Waiting for speech...</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="text-white/80">{item.source}</div>
              <div
                className={
                  item.status === "error"
                    ? "text-red-300"
                    : "text-emerald-200"
                }
              >
                {item.translated || "Translating..."}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer showing selected language */}
      <div className="border-t border-white/10 pt-3 text-center text-xs text-white/40">
        Listening in: {languages.find((l) => l.value === selectedLang)?.label || selectedLang}
      </div>
    </div>
  );
};

export default TranslatorPanel;
