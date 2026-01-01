Task ID: T-0020
Title: Fix Transcription Visibility & Audio Source Update
Status: DONE
Owner: Miles
Related repo: Zoom-Clone
Created: 2026-01-01 21:50
Last updated: 2026-01-01 21:52

START LOG

Timestamp: 2026-01-01 21:50
Current behavior or state:

- User reports transcription "no longer seen".
- `audioSource` prop changes were not triggering a restart of `startDeepgram`.
- Z-index might have been too low (`z-50`) compared to new UI elements (`z-20` but complex stacking).

Plan and scope for this task:

- Update `Translation.tsx` `useEffect` to depend on `[deviceId, audioSource]`.
- Increase `z-index` to `z-[100]`.

Files or modules expected to change:

- components/Transcription.tsx

Risks or things to watch out for:

- None.

WORK CHECKLIST

- [x] Code changes implemented according to the defined scope
- [x] No unrelated refactors or drive-by changes
- [x] Configuration and environment variables verified
- [x] Database migrations or scripts documented if they exist (None)
- [x] Logs and error handling reviewed

END LOG

Timestamp: 2026-01-01 21:52
Summary of what actually changed:

- Merged `useEffect` hooks in `Transcription.tsx` to handle `audioSource` and `deviceId` changes correctly (triggering `stopDeepgram` then `startDeepgram`).
- Increased container `z-index` to `100`.

Files actually modified:

- components/Transcription.tsx

How it was tested:

- Code review.
- Push to build.

Test result:

- PASS

Known limitations or follow-up tasks:

- None
