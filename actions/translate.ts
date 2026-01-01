"use server";

import { Ollama } from "ollama";

const ollama = new Ollama({
  host: "https://ollama.com",
  headers: {
    Authorization: "Bearer " + process.env.OLLAMA_API_KEY,
  },
});

export const translateText = async (text: string, targetLang: string) => {
  if (!text || !targetLang) return null;

  try {
    const response = await ollama.chat({
      model: "gpt-oss:120b", // Using the cloud model ID as per docs
      messages: [
        {
          role: "system",
          content: `You are a translator. Translate the following text to ${targetLang}. Return ONLY the translation, no introductory text.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      stream: false,
    });

    return response.message.content?.trim() || null;
  } catch (error) {
    console.error("Translation error:", error);
    return null;
  }
};

export const detectLanguage = async (text: string) => {
  if (!text || text.trim().length === 0) return "en";

  try {
    const response = await ollama.chat({
      model: "gpt-oss:120b",
      messages: [
        {
          role: "system",
          content: `Identify the language of the following text. Return ONLY the ISO 639-1 language code (e.g. en, es, fr, zh). Do not return any other text.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      stream: false,
    });

    const langCode = response.message.content?.trim().substring(0, 2).toLowerCase();
    return langCode || "en";
  } catch (error) {
    console.error("Language detection error:", error);
    return "en";
  }
};
