# Current Phase

## Active Phase

Phase 5: Polish And PWA Hardening

## Handoff Status

- Last updated: 2026-07-06.
- Codi is done for the day; Hermes should continue from CURRENT_PHASE.md, PHASE_PLAN.md, and BACKLOG.md.
- Latest pushed commit: dd3e8fc docs: update phase README/PWA notes for v2.56 hardening.
- Current app build: MGP | Version v2.56 | Build 2026.07.06.03.
- Current service-worker cache: dynamic daily timestamp.
- Local main was clean and aligned with origin/main after the push.

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

## Next Actions

- Start with a clean status check, then verify lesson completion, daily practice, weak review, matching, and mixed review after behavior changes.
- Keep examples educational, not production-ready machine instructions.
- Implement the next small retention slice: either Code Bank learned filters, Mistake Bank link-back, or Practice hub ready/locked polish.
- Tune reward/rank ideas carefully so they support retention instead of becoming noisy.
- Add curriculum depth in small batches only when review flows remain stable.

## Planned Ideas

- Strengthen why-before-how curriculum rules by keeping visible lesson reasons before syntax/details.
- Add Code Bank / learned-code filtering so Reference feels like a collection as well as a lookup.
- Add lightweight reward/rank moments for meaningful progress milestones.
- Keep matching as a game-like review mode, especially on mobile and light theme.
- Add more visual logic blocks for coordinates, motion, offsets, cycles, and troubleshooting patterns.
- Keep any sandbox educational and simulated only, not production-ready G-code generation or machine control.

## Permanent Version Rule

- Every version/build update must keep the letters MGP visible in the app's build or version information.
- MGP cannot be removed, hidden, renamed, or replaced during future updates.
- If version text is redesigned, MGP must move with the version/build information.
