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
