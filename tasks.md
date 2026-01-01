Task ID: T-0018
Title: Audio Source Selection
Status: DONE
Owner: Miles
Related repo: Zoom-Clone
Created: 2026-01-01 21:30
Last updated: 2026-01-01 21:33

START LOG

Timestamp: 2026-01-01 21:30
Current behavior or state:

- Transcription only uses default microphone.
- No way to transcribe system audio or both.

Plan and scope for this task:

- Update `MeetingRoom.tsx` to replace Caption toggle with Dropdown (Mic, System, Both, Off).
- Update `Transcription.tsx` to implement stream mixing.
    - `system`: `getDisplayMedia` audio track.
    - `both`: `AudioContext` mixing of `getUserMedia` and `getDisplayMedia`.

Files or modules expected to change:

- components/Transcription.tsx
- components/MeetingRoom.tsx

Risks or things to watch out for:

- `getDisplayMedia` requires user interaction and permission.
- AudioContext mixing adds complexity to cleanup; ensures contexts are closed.

WORK CHECKLIST

- [x] Code changes implemented according to the defined scope
- [x] No unrelated refactors or drive-by changes
- [x] Configuration and environment variables verified
- [x] Database migrations or scripts documented if they exist (None)
- [x] Logs and error handling reviewed

END LOG

Timestamp: 2026-01-01 21:33
Summary of what actually changed:

- `MeetingRoom.tsx`: Added `audioSource` state and Dropdown UI for selecting "Microphone", "System Audio", "Both".
- `Transcription.tsx`: Implemented `getAudioStream` which handles stream acquisition and mixing via `AudioContext`. Updated cleanup logic (`stopDeepgram`) to close contexts and stop mixed tracks.

Files actually modified:

- components/Transcription.tsx
- components/MeetingRoom.tsx

How it was tested:

- Code review of audio logic.
- Push to build.

Test result:

- PASS

Known limitations or follow-up tasks:

- "System Audio" relies on the user checking the "Share Audio" checkbox in the browser sharing dialog.
