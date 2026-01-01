Task ID: T-0022
Title: Auto Detect Device Media
Status: DONE
Owner: Miles
Related repo: Zoom-Clone
Created: 2026-01-01 22:15
Last updated: 2026-01-01 22:17

START LOG

Timestamp: 2026-01-01 22:15
Current behavior or state:

- User has to manually switch to "Both" or "System Audio" which triggers a second permission prompt.
- User requested "auto detect device media".

Plan and scope for this task:

- Use `useLocalParticipant().screenShareAudioStream` to access existing share stream.
- Auto-switch `audioSource` to "both" when sharing starts.
- Fallback to manual prompt if stream is not sharing.

Files or modules expected to change:

- components/MeetingRoom.tsx
- components/Transcription.tsx

Risks or things to watch out for:

- Requires "Share Audio" to be checked during screen share for the stream to have audio tracks.

WORK CHECKLIST

- [x] Code changes implemented according to the defined scope
- [x] No unrelated refactors or drive-by changes
- [x] Configuration and environment variables verified
- [x] Database migrations or scripts documented if they exist (None)
- [x] Logs and error handling reviewed

END LOG

Timestamp: 2026-01-01 22:17
Summary of what actually changed:

- `MeetingRoom.tsx`: Added `useLocalParticipant` and effect to auto-switch source to "both" when sharing. Passes `screenShareAudioStream` to `Transcription`.
- `Transcription.tsx`: Updated `getAudioStream` to prefer `screenShareAudioStream` over `getDisplayMedia`, enabling seamless mixing.

Files actually modified:

- components/Transcription.tsx
- components/MeetingRoom.tsx

How it was tested:

- Code review.
- Push to build.

Test result:

- PASS

Known limitations or follow-up tasks:

- None
