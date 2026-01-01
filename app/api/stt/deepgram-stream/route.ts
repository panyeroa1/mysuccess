import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Deepgram API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(request.url);
  const model = searchParams.get("model") || "nova-3";
  const language = searchParams.get("language") || "multi";

  // Create WebSocket URL for Deepgram
  const deepgramUrl = new URL("wss://api.deepgram.com/v1/listen");
  deepgramUrl.searchParams.set("model", model);
  deepgramUrl.searchParams.set("language", language);
  deepgramUrl.searchParams.set("smart_format", "true");
  deepgramUrl.searchParams.set("diarize", "true");
  deepgramUrl.searchParams.set("interim_results", "true");
  deepgramUrl.searchParams.set("filler_words", "true");
  deepgramUrl.searchParams.set("utterance_end_ms", "1500");
  deepgramUrl.searchParams.set("endpointing", "300");
  deepgramUrl.searchParams.set("no_delay", "true");
  deepgramUrl.searchParams.set("numerals", "true");
  deepgramUrl.searchParams.set("encoding", "linear16");
  deepgramUrl.searchParams.set("sample_rate", "16000");

  // Return the WebSocket URL and key for client-side connection
  // Note: For production, you'd want a token-based approach
  return new Response(
    JSON.stringify({
      url: deepgramUrl.toString(),
      token: apiKey,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
