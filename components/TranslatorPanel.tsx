"use client";

import { useEffect, useRef, useState } from "react";
import { languages } from "@/constants/languages";
import { Volume2, VolumeX } from "lucide-react";

type TranslatorPanelProps = {
  sentences: string[];
  targetLang: string;
  onLanguageChange: (lang: string) => void;
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
}: TranslatorPanelProps) => {
  const [selectedLang, setSelectedLang] = useState(targetLang || "en");
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [isMeetingMuted, setIsMeetingMuted] = useState(false);
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

  const playAudio = async (blob: Blob) =>
    new Promise<void>((resolve) => {
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      const audio = new Audio(url);
      audio.preload = "auto";
      audio.muted = false;
      audio.volume = 1;
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.play().catch(() => resolve());
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const processQueue = async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    while (queueRef.current.length > 0) {
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
  };

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
        (m as HTMLMediaElement).muted = isMeetingMuted;
      });
    };

    syncMute();
    const obs = new MutationObserver(syncMute);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [isMeetingMuted]);

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
        <button
          type="button"
          onClick={handleClear}
          className="ml-auto inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-light text-white/70 transition hover:border-white/20 hover:bg-white/10"
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
