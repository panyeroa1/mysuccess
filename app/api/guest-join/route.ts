import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";
import { randomUUID } from "crypto";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const apiSecret = process.env.STREAM_SECRET_KEY;

const normalizeCode = (code: string) =>
  code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

export async function POST(req: Request) {
  let body: { code?: string; name?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const rawName = typeof body?.name === "string" ? body.name.trim() : "";
  const name = rawName.slice(0, 60);
  const code = normalizeCode(typeof body?.code === "string" ? body.code : "");

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (!/^[A-Z0-9]{5}$/.test(code)) {
    return NextResponse.json(
      { error: "Enter a valid 5-character code." },
      { status: 400 }
    );
  }

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Stream API keys are missing." },
      { status: 500 }
    );
  }

  const client = new StreamClient(apiKey, apiSecret);
  const { calls } = await client.queryCalls({
    filter_conditions: {
      custom: {
        join_code: code,
      },
    },
    limit: 1,
  });

  if (!calls.length) {
    return NextResponse.json(
      { error: "Classroom code not found." },
      { status: 404 }
    );
  }

  const call = calls[0];
  const callId =
    (call as { id?: string }).id ||
    (call as { cid?: string }).cid?.split(":")[1];

  if (!callId) {
    return NextResponse.json(
      { error: "Failed to resolve classroom." },
      { status: 500 }
    );
  }

  const userId = `guest_${code.toLowerCase()}_${randomUUID()}`;
  await client.upsertUsers([
    {
      id: userId,
      name,
    },
  ]);

  const exp = Math.round(Date.now() / 1000) + 60 * 60;
  const issued = Math.floor(Date.now() / 1000) - 60;
  const token = client.createToken(userId, exp, issued);

  return NextResponse.json({ token, userId, name, callId });
}
