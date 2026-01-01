Task ID: T-0015
Title: Auto Language Detection
Status: DONE
Owner: Miles
Related repo: Zoom-Clone
Created: 2026-01-01 21:00
Last updated: 2026-01-01 21:05

START LOG

Timestamp: 2026-01-01 21:00
Current behavior or state:

- Transcription assumes "auto" language or uses source language, but we don't capture the specific code.
- User wants auto-detection of spoken language.
- Deepgram Live API doesn't return detected language in metadata.

Plan and scope for this task:

- Implement `detectLanguage` server action using Ollama (`gpt-oss-120b`).
- Update `Transcription.tsx` to call this action for final transcripts.
- Save detected language to `source_lang` in Supabase.

Files or modules expected to change:

- actions/translate.ts
- components/Transcription.tsx

Risks or things to watch out for:

- Latency: Adding another LLM call per sentence might delay the UI update or database insert slightly.

WORK CHECKLIST

- [x] Code changes implemented according to the defined scope
- [x] No unrelated refactors or drive-by changes
- [x] Configuration and environment variables verified
- [x] Database migrations or scripts documented if they exist (None)
- [x] Logs and error handling reviewed

END LOG

Timestamp: 2026-01-01 21:05
Summary of what actually changed:

- Added `detectLanguage` function to `actions/translate.ts` which asks Ollama to identify the ISO 639-1 code of the text.
- Integrated this detection into `Transcription.tsx` so every final transcript text is analyzed, and the result is saved as `source_lang`.

Files actually modified:

- actions/translate.ts
- components/Transcription.tsx

How it was tested:

- Code review.
- Build test (git push).

Test result:

- PASS

Known limitations or follow-up tasks:

- Detecting language on very short phrases (e.g., "Hello") might default to "en" or be ambiguous.
