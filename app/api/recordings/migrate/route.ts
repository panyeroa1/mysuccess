import { NextResponse } from "next/server";
import { StreamClient, StreamVideoClient } from "@stream-io/node-sdk";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const streamApiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const streamApiSecret = process.env.STREAM_SECRET_KEY;
const migrationSecret = process.env.RECORDINGS_MIGRATION_SECRET;

const getCidParts = (cid: string) => {
  const [type, id] = cid.split(":");
  return { type, id };
};

const sanitizeFilename = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_");

export async function POST(req: Request) {
  const providedSecret = req.headers.get("x-recordings-secret");
  if (!migrationSecret || providedSecret !== migrationSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!streamApiKey || !streamApiSecret) {
    return NextResponse.json(
      { error: "Stream API keys are missing." },
      { status: 500 }
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase service role key is missing." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const deleteFromStream = body?.deleteFromStream !== false;
  const dryRun = body?.dryRun === true;
  const maxRecordings =
    typeof body?.limit === "number" && body.limit > 0 ? body.limit : null;

  const streamClient = new StreamClient(streamApiKey, streamApiSecret);
  const videoClient = new StreamVideoClient(streamClient);

  const report = {
    calls: 0,
    recordingsFound: 0,
    recordingsImported: 0,
    recordingsDeleted: 0,
    recordingsSkipped: 0,
    errors: [] as string[],
  };

  let next: string | undefined;
  let processedRecordings = 0;

  do {
    const response = await videoClient.queryCalls({
      sort: [{ field: "created_at", direction: -1 }],
      limit: 25,
      next,
    });

    next = response.next;
    report.calls += response.calls.length;

    for (const callState of response.calls) {
      const callInfo = callState.call;
      const { type, id } = getCidParts(callInfo.cid);
      const call = videoClient.call(type, id);

      let recordingsResponse;
      try {
        recordingsResponse = await call.listRecordings();
      } catch (error) {
        report.errors.push(`Failed to list recordings for ${callInfo.cid}`);
        continue;
      }

      const recordings = recordingsResponse.recordings ?? [];
      report.recordingsFound += recordings.length;

      for (const recording of recordings) {
        if (maxRecordings && processedRecordings >= maxRecordings) {
          return NextResponse.json(report);
        }

        processedRecordings += 1;
        const safeFilename = sanitizeFilename(recording.filename);
        const storagePath = `${type}/${id}/${safeFilename}`;

        const { data: existing } = await supabaseAdmin
          .from("recordings")
          .select("id")
          .eq("call_id", id)
          .eq("stream_filename", recording.filename)
          .maybeSingle();

        if (existing) {
          report.recordingsSkipped += 1;
          if (!dryRun && deleteFromStream && callInfo.current_session_id) {
            try {
              await call.deleteRecording({
                session: callInfo.current_session_id,
                filename: recording.filename,
              });
              report.recordingsDeleted += 1;
            } catch {
              report.errors.push(
                `Failed to delete recording ${recording.filename} from ${callInfo.cid}`
              );
            }
          }
          continue;
        }

        if (dryRun) {
          report.recordingsImported += 1;
          continue;
        }

        try {
          const recordingResponse = await fetch(recording.url, {
            cache: "no-store",
          });

          if (!recordingResponse.ok) {
            report.errors.push(
              `Failed to download ${recording.filename} from ${callInfo.cid}`
            );
            continue;
          }

          const contentType =
            recordingResponse.headers.get("content-type") || "video/mp4";
          const buffer = Buffer.from(await recordingResponse.arrayBuffer());

          const { error: uploadError } = await supabaseAdmin.storage
            .from("recordings")
            .upload(storagePath, buffer, { contentType, upsert: false });

          if (uploadError) {
            report.errors.push(
              `Failed to upload ${recording.filename} to Supabase`
            );
            continue;
          }

          const { data: urlData } = supabaseAdmin.storage
            .from("recordings")
            .getPublicUrl(storagePath);

          const title =
            (callInfo.custom?.description as string | undefined) ||
            recording.filename;

          const { error: insertError } = await supabaseAdmin
            .from("recordings")
            .insert({
              owner_id: callInfo.created_by?.id ?? "",
              call_id: id,
              call_type: type,
              title,
              stream_filename: recording.filename,
              stream_url: recording.url,
              storage_path: storagePath,
              storage_url: urlData?.publicUrl ?? "",
              started_at: recording.start_time,
              ended_at: recording.end_time,
            });

          if (insertError) {
            report.errors.push(
              `Failed to save metadata for ${recording.filename}`
            );
            continue;
          }

          report.recordingsImported += 1;

          if (deleteFromStream && callInfo.current_session_id) {
            try {
              await call.deleteRecording({
                session: callInfo.current_session_id,
                filename: recording.filename,
              });
              report.recordingsDeleted += 1;
            } catch {
              report.errors.push(
                `Failed to delete recording ${recording.filename} from ${callInfo.cid}`
              );
            }
          }
        } catch (error) {
          report.errors.push(
            `Unexpected error processing ${recording.filename}`
          );
        }
      }
    }
  } while (next);

  return NextResponse.json(report);
}
