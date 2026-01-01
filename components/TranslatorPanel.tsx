"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// Comprehensive language list with regional dialects
const languageOptions = [
  // Major Languages
  { label: "English (US)", value: "en-US", group: "English" },
  { label: "English (UK)", value: "en-GB", group: "English" },
  { label: "English (Australia)", value: "en-AU", group: "English" },
  { label: "English (India)", value: "en-IN", group: "English" },
  // Spanish
  { label: "Spanish (Spain)", value: "es-ES", group: "Spanish" },
  { label: "Spanish (Mexico)", value: "es-MX", group: "Spanish" },
  { label: "Spanish (Argentina)", value: "es-AR", group: "Spanish" },
  { label: "Spanish (Colombia)", value: "es-CO", group: "Spanish" },
  // French
  { label: "French (France)", value: "fr-FR", group: "French" },
  { label: "French (Canada)", value: "fr-CA", group: "French" },
  { label: "French (Belgium)", value: "fr-BE", group: "French" },
  // Portuguese
  { label: "Portuguese (Brazil)", value: "pt-BR", group: "Portuguese" },
  { label: "Portuguese (Portugal)", value: "pt-PT", group: "Portuguese" },
  // Chinese
  { label: "Chinese (Simplified)", value: "zh-CN", group: "Chinese" },
  { label: "Chinese (Traditional)", value: "zh-TW", group: "Chinese" },
  { label: "Chinese (Hong Kong)", value: "zh-HK", group: "Chinese" },
  // German
  { label: "German (Germany)", value: "de-DE", group: "German" },
  { label: "German (Austria)", value: "de-AT", group: "German" },
  { label: "German (Switzerland)", value: "de-CH", group: "German" },
  // Arabic
  { label: "Arabic (Standard)", value: "ar", group: "Arabic" },
  { label: "Arabic (Egypt)", value: "ar-EG", group: "Arabic" },
  { label: "Arabic (Saudi)", value: "ar-SA", group: "Arabic" },
  { label: "Arabic (UAE)", value: "ar-AE", group: "Arabic" },
  // Asian Languages
  { label: "Japanese", value: "ja", group: "Asian" },
  { label: "Korean", value: "ko", group: "Asian" },
  { label: "Vietnamese", value: "vi", group: "Asian" },
  { label: "Thai", value: "th", group: "Asian" },
  { label: "Indonesian", value: "id", group: "Asian" },
  { label: "Malay", value: "ms", group: "Asian" },
  { label: "Tagalog (Filipino)", value: "tl", group: "Asian" },
  // South Asian
  { label: "Hindi", value: "hi", group: "South Asian" },
  { label: "Bengali", value: "bn", group: "South Asian" },
  { label: "Urdu", value: "ur", group: "South Asian" },
  { label: "Tamil", value: "ta", group: "South Asian" },
  { label: "Telugu", value: "te", group: "South Asian" },
  { label: "Marathi", value: "mr", group: "South Asian" },
  { label: "Gujarati", value: "gu", group: "South Asian" },
  { label: "Punjabi", value: "pa", group: "South Asian" },
  // European
  { label: "Italian", value: "it", group: "European" },
  { label: "Dutch", value: "nl", group: "European" },
  { label: "Polish", value: "pl", group: "European" },
  { label: "Russian", value: "ru", group: "European" },
  { label: "Ukrainian", value: "uk", group: "European" },
  { label: "Greek", value: "el", group: "European" },
  { label: "Czech", value: "cs", group: "European" },
  { label: "Romanian", value: "ro", group: "European" },
  { label: "Hungarian", value: "hu", group: "European" },
  { label: "Bulgarian", value: "bg", group: "European" },
  { label: "Serbian", value: "sr", group: "European" },
  { label: "Croatian", value: "hr", group: "European" },
  { label: "Slovak", value: "sk", group: "European" },
  // Nordic
  { label: "Swedish", value: "sv", group: "Nordic" },
  { label: "Norwegian", value: "no", group: "Nordic" },
  { label: "Danish", value: "da", group: "Nordic" },
  { label: "Finnish", value: "fi", group: "Nordic" },
  { label: "Icelandic", value: "is", group: "Nordic" },
  // Middle Eastern
  { label: "Turkish", value: "tr", group: "Middle Eastern" },
  { label: "Persian (Farsi)", value: "fa", group: "Middle Eastern" },
  { label: "Hebrew", value: "he", group: "Middle Eastern" },
  // African
  { label: "Swahili", value: "sw", group: "African" },
  { label: "Afrikaans", value: "af", group: "African" },
  { label: "Amharic", value: "am", group: "African" },
  { label: "Yoruba", value: "yo", group: "African" },
  { label: "Zulu", value: "zu", group: "African" },
];

type TranslatorPanelProps = {
  sentences: string[];
  targetLang: string;
  onLanguageChange?: (lang: string) => void;
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

const TranslatorPanel = ({ sentences, targetLang, onLanguageChange }: TranslatorPanelProps) => {
  const [selectedLang, setSelectedLang] = useState(targetLang || "en-US");
  const [items, setItems] = useState<TranslationItem[]>([]);
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef(false);
  const lastIndexRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setSelectedLang(newLang);
    onLanguageChange?.(newLang);
  };

  const playAudio = async (blob: Blob) =>
    new Promise<void>((resolve) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
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
    const next = sentences.slice(lastIndexRef.current);
    lastIndexRef.current = sentences.length;
    if (next.length) {
      queueRef.current.push(...next);
      processQueue();
    }
  }, [sentences, selectedLang]);

  // Group languages for optgroup rendering
  const groupedLanguages = languageOptions.reduce((acc, lang) => {
    if (!acc[lang.group]) acc[lang.group] = [];
    acc[lang.group].push(lang);
    return acc;
  }, {} as Record<string, typeof languageOptions>);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header with Language Selector */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.2em] text-white/60">
          Live Translation
        </div>
        <div className="relative">
          <select
            value={selectedLang}
            onChange={handleLangChange}
            className="appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 pr-8 text-sm text-white outline-none transition hover:bg-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
          >
            {Object.entries(groupedLanguages).map(([group, langs]) => (
              <optgroup key={group} label={group} className="bg-[#1a1f2e] text-white">
                {langs.map((lang) => (
                  <option key={lang.value} value={lang.value} className="bg-[#1a1f2e]">
                    {lang.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
        </div>
      </div>

      {/* Translation List */}
      <div className="flex-1 space-y-4 overflow-y-auto text-[14px] font-light">
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
        Listening in: {languageOptions.find((l) => l.value === selectedLang)?.label || selectedLang}
      </div>
    </div>
  );
};

export default TranslatorPanel;

