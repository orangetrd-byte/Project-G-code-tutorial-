# Current Phase

## Active Phase

Phase 6: Retention Polish

## Handoff Status

- Last updated: 2026-07-06.
- Codi is done for the day; Hermes should continue from CURRENT_PHASE.md, PHASE_PLAN.md, and BACKLOG.md.
- Latest pushed commit: 747e49f fix: style app update reload button.
- Current app build: MGP | Version v2.56.7 | Build 2026.07.07.07.
- Current service-worker cache: pgct-2026.07.07.07.
- Local main is aligned with origin/main; only backup files are untracked and intentionally separate.

## Phase 5 Completion Summary

- Matching scoring bug — fixed/pushed.
- Mobile sizing for S23 Ultra — pushed.
- Mistake-bank link-back — implemented, styled, and pushed.
- PWA hardening — cache version/dynamic fallback/polish complete.
- Accessibility — aria-live, keyboard handlers, retry guard, weak tracker exact-key fix.
- APP_BUILD kept in sync with phase notes.

## Current Focus

- Mission guardrails live in MISSION.md; prioritized learning ideas live in BACKLOG.md.
- Core lesson reliability is stable enough to treat retention and practice as the active workstream.
- Keep the Practice hub useful without turning it into clutter.
- Keep lessons, quizzes, progress, daily practice, weak review, mixed review, and matching behavior dependable.
- Keep tutorial scope separate from CNC Work Helper and Green Hat.
- Maintain safe educational language and clear CNC / 3D printing track separation.

## Completed In This Pass

- PWA: removed cross-origin Google Fonts from service-worker precache to prevent offline install failures.
- PWA: cache version now rotates automatically with a daily+timestamp stamp.
- PWA: cross-origin fetch fallback returns an explicit offline response instead of breaking the network-first path.
- Styles: added missing `--c-error` and `--shadow-sm` design tokens for dark and light themes.
- Lesson visuals: added missing SVG visual strings for `program-structure`, `linear-feed`, and `spindle-speed`.
- Accessibility: added `aria-live="polite"` to `#lesson-content` for screen-reader question transitions.
- Keyboard: matching cards now support Enter/Space selection.
- Lesson engine: retry-number generation no longer returns the original value as its fallback.
- Lesson engine: retry-number replacement works inside parenthesized/delimited text.
- Weak-spot tracker: clearing a missed question now removes only by exact weak-set key/id.
- UX: tightened mobile chrome/complete-screen fit for smaller viewports.
- UX: matching scoring now correctly respects mismatches.
- Retention: added mistake-bank link-back so wrong answers can jump straight to the source lesson.

## Next Actions

- Choose the next polish lane from BACKLOG.md / PHASE_PLAN.md:
  - Code Bank + learned-code filtering
  - Why-before-how curriculum rules
  - Lightweight reward/rank polish
- Verify lesson completion, daily practice, weak review, matching, and mixed review after any behavior changes.
- Keep examples educational, not production-ready machine instructions.
- Tune reward/rank ideas carefully so they support retention instead of becoming noisy.
- Add curriculum depth in small batches only when review flows remain stable.
- Add a source-backed reference audit table before changing disputed definitions: `code`, `track`, `current definition`, `source/manual`, `confidence`, and `notes`.
- Cross-check semicolon/comment/block-end wording, `G04` dwell timing, printer firmware codes, CNC M-codes, units, feed, and spindle assumptions against official control/firmware docs before editing learner-facing definitions.

## Planned Ideas

- Strengthen why-before-how curriculum rules by keeping visible lesson reasons before syntax/details.
- Add Code Bank / learned-code filtering so Reference feels like a collection as well as a lookup.
- Build a source-backed Reference QA pass so code definitions are traceable to Fanuc-style CNC manuals or Marlin/Klipper firmware docs instead of unsourced general knowledge.
- Add lightweight reward/rank moments for meaningful progress milestones.
- Keep matching as a game-like review mode, especially on mobile and light theme.
- Add more visual logic blocks for coordinates, motion, offsets, cycles, and troubleshooting patterns.
- Keep any sandbox educational and simulated only, not production-ready G-code generation or machine control.

## Permanent Version Rule

- Every version/build update must keep the letters MGP visible in the app's build or version information.
- MGP cannot be removed, hidden, renamed, or replaced during future updates.
- If version text is redesigned, MGP must move with the version/build information.
