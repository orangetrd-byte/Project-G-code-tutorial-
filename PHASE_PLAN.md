# G-Code Tutorial Phase Plan

Last updated: 2026-07-16

## Summary

G-Code Tutorial is the structured learning app for CNC and related machine-code fundamentals. It should keep the Duolingo-style lesson loop: short theory, quiz, feedback, XP, and unlock progression.

Default constraints:

- Keep the app static and offline-capable on GitHub Pages.
- Keep zero backend and no build toolchain.
- Keep curriculum content in data files and app behavior in JavaScript.
- Keep learning flow separate from CNC Work Helper's advanced utilities.

## Phase 1: Curriculum Reliability

- Clean up lesson copy, encoding artifacts, and visual consistency.
- Keep lesson flow reliable: theory, quiz, feedback, XP, unlock next lesson.
- Keep state persistence stable in localStorage.
- Ensure reference search and progress screens remain fast and mobile-friendly.
- Maintain source-backed reference coverage and controller/firmware scope for learner-facing definitions.

## Phase 2: Curriculum Expansion

- Add more lathe-focused Fanuc-compatible lessons in a clear progression.
- Improve multiple choice, fill-in-the-blank, hints, and explanations.
- Keep lessons short enough for mobile use.
- Add visuals only when they directly support the lesson objective.

## Phase 3: Multi-Track Learning

- Build on the CNC and 3D printing track switcher.
- Keep separate progress by track.
- Keep reference search and progress summaries clear per track.
- Keep Reference definitions track-specific and source-backed, especially where CNC controls and printer firmware use similar codes differently.
- Avoid mixing unrelated concepts inside the same lesson unit.

## Phase 4: Retention And Practice

- Maintain review mode, daily practice, weak-topic practice, and mixed review.
- Track missed questions as weak spots until the learner clears them in focused review or daily practice.
- Keep unit reviews balanced across the whole unit instead of over-sampling the first lesson.
- Keep the Practice hub focused on recall, mistakes, code-bank study, and mixed review.
- Polish matching as a game-like review mode with clear states in dark and light themes.
- Polish streaks, XP, progress summaries, and next-action momentum.
- Explore reward/rank moments only when they reinforce practice and do not add clutter.
- Add optional printable completion summary only after core learning and review flow remains solid.

## Acceptance Rules

- Every lesson must have a clear learning objective, feedback, and explanation.
- Track content must not blur CNC machining and 3D printing concepts.
- Reference definitions that vary by control or firmware must name the context and cite an authoritative source.
- Every PWA-facing change that affects cached files must bump the visible version and `sw.js` cache name.
- `.codex-remote-attachments/` must remain ignored.
- Before editing, confirm local `main` is clean and aligned with `origin/main`.
