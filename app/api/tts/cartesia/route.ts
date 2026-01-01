import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "CARTESIA_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "Missing text." }, { status: 400 });
    }

    const modelId = process.env.CARTESIA_MODEL_ID || "sonic-3";
    const voiceId =
      process.env.CARTESIA_VOICE_ID ||
      "253fb497-77be-4c28-8068-475fa415fb65";

    const response = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "Cartesia-Version": "2025-04-16",
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_id: modelId,
        transcript: text,
        voice: {
          mode: "id",
          id: voiceId,
        },
        output_format: {
          container: "wav",
          encoding: "pcm_f32le",
          sample_rate: 44100,
        },
        speed: "normal",
        generation_config: {
          speed: 1,
          volume: 1,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || "Cartesia request failed." },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Cartesia TTS error:", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
