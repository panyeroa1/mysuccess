import { NextResponse } from "next/server";

const buildDeepgramUrl = () => {
  const url = new URL("https://api.deepgram.com/v1/listen");
  url.searchParams.set("detect_entities", "true");
  url.searchParams.set("diarize", "true");
  url.searchParams.set("paragraphs", "true");
  url.searchParams.set("sentiment", "true");
  url.searchParams.set("smart_format", "true");
  url.searchParams.set("detect_language", "true");
  url.searchParams.set("model", "nova-3");
  return url.toString();
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "DEEPGRAM_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    const headers: HeadersInit = {
      Authorization: `Token ${apiKey}`,
    };

    let body: BodyInit;

    if (contentType.includes("application/json")) {
      const payload = await request.json();
      body = JSON.stringify(payload);
      headers["Content-Type"] = "application/json";
    } else {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || typeof file === "string") {
        return NextResponse.json(
          { error: "Audio file is required." },
          { status: 400 }
        );
      }

      const blob = file as Blob;
      const arrayBuffer = await blob.arrayBuffer();
      body = arrayBuffer;
      headers["Content-Type"] = blob.type || "audio/webm";
    }

    const response = await fetch(buildDeepgramUrl(), {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || "Deepgram request failed." },
        { status: response.status }
      );
    }

    const data = await response.json();
    const transcript =
      data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";

    return NextResponse.json({ text: transcript });
  } catch (error) {
    console.error("Deepgram proxy error:", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
