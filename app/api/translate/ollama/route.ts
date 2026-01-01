import { NextResponse } from "next/server";
import { translateText } from "@/actions/translate";

export async function POST(request: Request) {
  try {
    const { text, targetLang } = await request.json();
    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "Missing text or targetLang." },
        { status: 400 }
      );
    }

    const translated = await translateText(text, targetLang);
    return NextResponse.json({ translatedText: translated || text });
  } catch (error) {
    console.error("Ollama translate error:", error);
    return NextResponse.json(
      { error: "Translation failed." },
      { status: 500 }
    );
  }
}
