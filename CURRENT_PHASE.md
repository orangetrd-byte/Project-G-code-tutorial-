# Current Phase

## Active Phase

Phase 6: Retention Polish

## Handoff Status

- Last updated: 2026-07-16.
- Continue from CURRENT_PHASE.md, PHASE_PLAN.md, and BACKLOG.md.
- Latest pushed commit: 59f7f0d add why-before-how to turning lessons.
- Current app build: MGP | Version v2.57.13 | Build 2026.07.16.01.
- Current service-worker cache: pgct-2026.07.16.01.
- Local main was aligned with origin/main before this audit pass.

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
- Accuracy: completed a source-backed curriculum pass across 39 lessons and 392 questions.
- Reference: added official Haas, Marlin, ASME, and NIST sources with machine-family link guards.
- Retention: added why-before-how framing through CNC Unit 3 and regression coverage for ordering.
- Keyboard: matching cards now support Enter/Space selection.
- Lesson engine: retry-number generation no longer returns the original value as its fallback.
- Lesson engine: retry-number replacement works inside parenthesized/delimited text.
- Weak-spot tracker: clearing a missed question now removes only by exact weak-set key/id.
- UX: tightened mobile chrome/complete-screen fit for smaller viewports.
- UX: matching scoring now correctly respects mismatches.
- Retention: added mistake-bank link-back so wrong answers can jump straight to the source lesson.

## Next Actions

- Continue the source-backed curriculum audit in small controller-specific batches.
- Extend why-before-how framing beyond CNC Unit 3 without mixing it into accuracy-only changes.
- Choose the next retention lane after the audit batch: Code Bank or lightweight reward/rank polish.
- Verify lesson completion, daily practice, weak review, matching, and mixed review after any behavior changes.
- Keep examples educational, not production-ready machine instructions.
- Tune reward/rank ideas carefully so they support retention instead of becoming noisy.
- Add curriculum depth in small batches only when review flows remain stable.
- Keep disputed definitions traceable to a named controller or firmware source before editing learner-facing text.
- Continue cross-checking offsets, prove-out controls, canned cycles, and printer recovery behavior against official documentation.

## Planned Ideas

- Extend the established why-before-how rule beyond CNC Unit 3.
- Add Code Bank / learned-code filtering so Reference feels like a collection as well as a lookup.
- Maintain the completed source-backed Reference QA rules as new cards are added.
- Add lightweight reward/rank moments for meaningful progress milestones.
- Keep matching as a game-like review mode, especially on mobile and light theme.
- Add more visual logic blocks for coordinates, motion, offsets, cycles, and troubleshooting patterns.
- Keep any sandbox educational and simulated only, not production-ready G-code generation or machine control.

## Permanent Version Rule

- Every version/build update must keep the letters MGP visible in the app's build or version information.
- MGP cannot be removed, hidden, renamed, or replaced during future updates.
- If version text is redesigned, MGP must move with the version/build information.
