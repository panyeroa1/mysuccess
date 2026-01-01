Task ID: T-0023
Title: Implementation of Translator Sidebar (Eburon Classroom)
Status: DONE
Owner: Miles
Related repo: Zoom-Clone
Created: 2026-01-01 22:30
Last updated: 2026-01-01 22:33

START LOG

Timestamp: 2026-01-01 22:30
Current behavior or state:

- No in-app translation/videoke tool integration.
- User requested embedding `https://eburon.ai/classroom/`.

Plan and scope for this task:

- Add sidebar with iframe to `MeetingRoom.tsx`.
- Add toggle button (Globe).
- Ensure it toggles exclusively with Participants list.

Files or modules expected to change:

- components/MeetingRoom.tsx

Risks or things to watch out for:

- Iframe permissions (autoplay, mic, camera) must be explicit.

WORK CHECKLIST

- [x] Code changes implemented according to the defined scope
- [x] No unrelated refactors or drive-by changes
- [x] Configuration and environment variables verified
- [x] Database migrations or scripts documented if they exist (None)
- [x] Logs and error handling reviewed

END LOG

Timestamp: 2026-01-01 22:33
Summary of what actually changed:

- Added `showTranslator` state and Globe icon button.
- Implemented right-side sidebar showing `https://eburon.ai/classroom/`.
- Configured toggles to close one sidebar when opening the other.

Files actually modified:

- components/MeetingRoom.tsx

How it was tested:

- Code review.
- Push to build.

Test result:

- PASS

Known limitations or follow-up tasks:

- None
