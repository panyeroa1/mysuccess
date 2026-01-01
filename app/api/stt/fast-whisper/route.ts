import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const baseUrl = process.env.FAST_WHISPER_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "FAST_WHISPER_URL is not configured." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "Audio file is required." },
        { status: 400 }
      );
    }

    const model = process.env.FAST_WHISPER_MODEL || "large-v3";
    const language = formData.get("language");

    const upstreamForm = new FormData();
    upstreamForm.append("file", file);
    upstreamForm.append("model", model);
    upstreamForm.append("response_format", "json");
    if (language && typeof language === "string" && language !== "auto") {
      upstreamForm.append("language", language);
    }

    const apiKey = process.env.FAST_WHISPER_API_KEY;
    const headers: HeadersInit = apiKey
      ? { Authorization: `Bearer ${apiKey}` }
      : {};

    const endpoint = baseUrl.endsWith("/v1/audio/transcriptions")
      ? baseUrl
      : `${baseUrl.replace(/\/$/, "")}/v1/audio/transcriptions`;

    const response = await fetch(endpoint, {
      method: "POST",
      body: upstreamForm,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || "Fast Whisper request failed." },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ text: data?.text ?? "" });
  } catch (error) {
    console.error("Fast Whisper proxy error:", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
