# Current Phase

## Active Phase

Phase 6: Retention Polish

## Handoff Status

- Last updated: 2026-08-01.
- Continue from CURRENT_PHASE.md, PHASE_PLAN.md, and BACKLOG.md.
- Latest application-content release: beginner definitions and firmware-scoped resume guidance for Printing Unit 9.
- Current app build: MGP | Version v2.58.19 | Build 2026.08.01.07.
- Current service-worker cache: pgct-2026.08.01.07.
- Local `main` is aligned with `origin/main`.

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

- Beginner language: defined print recovery, pause, resume, filament runout, priming, and clearance in Printing Unit 9.
- Accuracy: kept Marlin pause commands scoped and made priming conditional on the printer's documented resume routine.

- Beginner language: defined multi-material printing, tool, tool change, filament change, purging, and purge tower in Printing Unit 8.
- Accuracy: separated the modeled tool-selection and purge sequence from M600 and added machine-specific safety scope.

- Beginner language: defined firmware, firmware flavor, vendor firmware, macro, and configuration section in Printing Unit 7.
- Accuracy: corrected M486 S2 from object cancellation to current-object identification and named required feature scope.

- Beginner language: defined overhang, support, bridge, and support distance in Printing Unit 6.
- Accuracy: declared relative extrusion, scoped the fan example, and removed universal bridge-speed advice.

- Beginner language: defined material profile, active profile, part cooling, and enclosure in Printing Unit 5.
- Accuracy: scoped the fan example to Marlin and replaced broad PETG cooling advice with filament-specific profile guidance.

- Beginner language: defined adhesion, Z offset, bed leveling, under-extrusion, over-extrusion, and extrusion-factor override in Printing Unit 4.
- Accuracy: declared XYZ and extrusion modes in modeled Unit 4 moves and replaced the printing lesson's lathe-axis visual.

- Beginner language: defined start/end G-code, probing, priming, target temperatures, parking, stepper motors, coordinate mode, axis limits, clearance, comments, and toolpaths before use in Printing Unit 3.
- Accuracy: scoped Unit 3 examples to Marlin and removed the assumption that every coordinated move containing an E value deposits filament.

- Accuracy: corrected printing firmware scope, machine-specific parking guidance, extrusion-mode handling, pause recovery examples, and ABS ventilation guidance.
- Regression: added guards that prevent the corrected printing claims and unsafe unscoped examples from returning.

- PWA: removed cross-origin Google Fonts from service-worker precache to prevent offline install failures.
- PWA: cache version now rotates automatically with a daily+timestamp stamp.
- PWA: cross-origin fetch fallback returns an explicit offline response instead of breaking the network-first path.
- Styles: added missing `--c-error` and `--shadow-sm` design tokens for dark and light themes.
- Lesson visuals: added missing SVG visual strings for `program-structure`, `linear-feed`, and `spindle-speed`.
- Accessibility: added `aria-live="polite"` to `#lesson-content` for screen-reader question transitions.
- Accuracy: completed source-backed coverage across all existing lessons and questions.
- Reference: added official Haas, Marlin, ASME, and NIST sources with machine-family link guards.
- Retention: completed why-before-how framing across every CNC lesson with regression coverage.
- Retention: completed Code Bank filtering, metadata-backed unlocks, persistence, progress counts, and track separation.
- Accuracy: audited Haas recovery behavior and converted Unit 11 to the official Haas one-block G76 format.
- Retention: added track-specific Today’s Line free recall using only completed, previously taught lesson examples; no XP or rank changes.
- Keyboard: matching cards now support Enter/Space selection.
- Lesson engine: retry-number generation no longer returns the original value as its fallback.
- Lesson engine: retry-number replacement works inside parenthesized/delimited text.
- Weak-spot tracker: clearing a missed question now removes only by exact weak-set key/id.
- UX: tightened mobile chrome/complete-screen fit for smaller viewports.
- UX: matching scoring now correctly respects mismatches.
- Retention: added mistake-bank link-back so wrong answers can jump straight to the source lesson.

## Next Actions

- Continue the source-backed curriculum audit in small controller-specific batches.
- Maintain Today’s Line as a single free-recall prompt sourced from completed lessons.
- Verify lesson completion, daily practice, weak review, matching, and mixed review after any behavior changes.
- Keep examples educational, not production-ready machine instructions.
- Tune reward/rank ideas carefully so they support retention instead of becoming noisy.
- Add curriculum depth in small batches only when review flows remain stable.
- Keep disputed definitions traceable to a named controller or firmware source before editing learner-facing text.
- Continue cross-checking offsets, prove-out controls, canned cycles, and printer recovery behavior against official documentation.

## Planned Ideas

- Maintain the established why-before-how rule for every new CNC lesson.
- Maintain Code Bank / learned-code filtering as curriculum questions evolve.
- Maintain the completed source-backed Reference QA rules as new cards are added.
- Add lightweight reward/rank moments for meaningful progress milestones.
- Keep matching as a game-like review mode, especially on mobile and light theme.
- Add more visual logic blocks for coordinates, motion, offsets, cycles, and troubleshooting patterns.
- Keep any sandbox educational and simulated only, not production-ready G-code generation or machine control.

## Permanent Version Rule

- Every version/build update must keep the letters MGP visible in the app's build or version information.
- MGP cannot be removed, hidden, renamed, or replaced during future updates.
- If version text is redesigned, MGP must move with the version/build information.
