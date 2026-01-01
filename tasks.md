Task ID: T-0021
Title: Fix CSS Warnings
Status: DONE
Owner: Miles
Related repo: Zoom-Clone
Created: 2026-01-01 22:00
Last updated: 2026-01-01 22:02

START LOG

Timestamp: 2026-01-01 22:00
Current behavior or state:

- CSS warnings for property ordering (`backdrop-filter`).

Plan and scope for this task:

- Reorder `backdrop-filter` and `-webkit-backdrop-filter` in `globals.css`.

Files or modules expected to change:

- app/globals.css

Risks or things to watch out for:

- None.

WORK CHECKLIST

- [x] Code changes implemented according to the defined scope
- [x] No unrelated refactors or drive-by changes
- [x] Configuration and environment variables verified
- [x] Database migrations or scripts documented if they exist (None)
- [x] Logs and error handling reviewed

END LOG

Timestamp: 2026-01-01 22:02
Summary of what actually changed:

- Swapped the order of backdrop filter properties.

Files actually modified:

- app/globals.css

How it was tested:

- Code review.
- Build test (push to main).

Test result:

- PASS

Known limitations or follow-up tasks:

- None
