# Project G-Code Tutorial Handoff

## Links

- Live app: https://orangetrd-byte.github.io/Project-G-code-tutorial-/
- Repository: https://github.com/orangetrd-byte/Project-G-code-tutorial-

## Current App Summary

Project G-Code Tutorial is a browser-based, installable PWA for learning CNC and 3D printer G-code. It is built with vanilla HTML, CSS, and JavaScript. There is no framework, no npm build step, no backend, and no database. The app is intended to stay simple enough to host on GitHub Pages while still feeling like a mobile learning app.

The current learning model is similar to Duolingo or Mimo:

- Short lesson theory
- Practice questions
- Immediate correct-or-incorrect feedback
- Explanations after answers
- XP and streak tracking
- Locked progression
- Unit reviews
- Weak Spot Review for missed questions

## Current Stack

- `index.html` - app shell and screen containers
- `css/style.css` - full visual system and responsive layout
- `js/app.js` - state, navigation, lessons, quiz engine, audio, settings, reviews
- `data/lessons.js` - CNC and 3D printing curriculum data
- `sw.js` - PWA cache
- `manifest.json` - install metadata

## Current Build State

- App version: `MGP v2.58.12`
- App build: `2026.07.31.09`
- Service worker cache: `pgct-2026.07.31.09`
- CNC path: 11 units / 21 lessons
- 3D printing path: 10 units / 18 lessons
- Current release scope: beginner-readable 3D-printing motion and cooling

## What Works Well

- The app is easy to open and review through GitHub Pages.
- The PWA structure is lightweight and offline-capable.
- CNC and 3D printing are separate tracks with separate progress.
- Settings include language, theme, and build number.
- Light and dark themes exist.
- Startup loading animation and answer sounds exist.
- Lesson unlocks now require correct practice completion.
- Missed questions are tracked as weak spots.
- Weak Spot Review prompts the learner to revisit missed material.
- Unit reviews mix questions across lessons instead of only pulling from the first lesson.
- Numeric fill-in answers request numeric or decimal keyboards on mobile.

## Recent Important Changes

- Corrected printing lessons that treated Klipper flow and bed-mesh behavior, parking coordinates, extrusion modes, pause moves, and Marlin M600 support too broadly.
- Added regression guards for printing firmware scope, mode-dependent movement, purge-mode restoration, and ABS ventilation guidance.

- Replaced vague and elliptical question stems with explicit nouns, complete questions, parallel answer choices, polished UI and roadmap feedback, and corrected Spanish accents.
- Replaced app/UI joke answers with plausible topic-related distractors while preserving each question's intended answer.
- Added regression checks for complete multiple-choice prompts, blank or duplicate choices, and non-domain distractors.
- Added visible educational-use and machine-safety guidance to setup, licensing, and legal-information screens.
- Reworked beginner-facing curriculum, quiz, reference, retention, and certification copy for clarity and consistent terminology.
- Replaced the ambiguous coordinate-only “weak beginner code” question with a modal-context question that explains that an earlier motion mode may remain active.
- Added a regression test that prevents the ambiguous question wording from returning.
- Added track-specific Today’s Line recall using previously taught material.
- Expanded both CNC and 3D-printing curricula and added source/dialect audit metadata.
- Added learned-code filtering, matching questions, mixed review, and stronger mobile/offline regression coverage.
- Added weak-question retention tracking.
- Added Home screen Weak Spot Review prompt.
- Increased lesson practice checks from 3 to 5 questions.
- Added beginner-style questions like missing-code and semicolon/comment meaning.
- Added Unit 5: Inspection & Adjustment.
- Added lessons for measuring parts, wear offsets, program edits, single block, and dry run.
- Added a Unit 5 card background treatment.
- Verified GitHub Pages served the latest build after deployment.

## Current Strengths

- Strong early learning loop.
- Good fit for mobile browser use.
- Practical CNC content, not generic textbook wording.
- Good zero-dependency architecture for a small educational PWA.
- Easy for outside reviewers to test without installing tools.
- Retention direction is now started with weak-spot review.

## Current Gaps

- The 3D printing track is still much shorter than the CNC track.
- Lesson screen and completion screen polish need another pass.
- Quiz types still need broader use of the formats that the app supports.
- Reference tab should be expanded into a stronger shop cheat sheet.
- Progress screen should eventually show weak areas and mastery.
- Some older text/emoji encoding artifacts are visible in source and may need cleanup later.
- No native Android or iPhone wrapper exists yet.

## Recommended Next Priorities

1. Expand the 3D printing track so it does not feel like a placeholder.
2. Add more question formats:
   - block ordering
   - missing-code selection
   - unsafe-code spotting
   - matching code to meaning
   - choose the safest line
3. Polish the lesson and completion screens.
4. Expand Reference with more G-codes, M-codes, tooling, offset, and printer code entries.
5. Improve Progress to show weak spots, review due, unit mastery, and track-specific stats.
6. Clean source encoding artifacts when there is time for a careful content pass.
7. After the browser app feels polished, consider native wrappers for Android and iPhone.

## Review Notes For Others

Use the live link first:

https://orangetrd-byte.github.io/Project-G-code-tutorial-/

Suggested review checklist:

- Does the app fit the screen on mobile?
- Is the text readable in light and dark mode?
- Does the learning path feel motivating?
- Are lesson explanations clear enough for a beginner?
- Are CNC and 3D printing concepts kept separate?
- Do wrong answers make the learner understand what to fix?
- Does Weak Spot Review make sense?
- Do unit cards and lesson screens feel polished enough?
- What question types would make the app more engaging?

## Architecture Cautions

- Keep plain script loading:
  - `data/lessons.js`
  - `js/app.js`
- Do not convert to modules unless the global data pattern is rewritten intentionally.
- Keep `.codex-remote-attachments/` ignored.
- Bump both `APP_BUILD` and `CACHE_VERSION` when changing deployed app behavior.
- Avoid adding a framework unless there is a clear reason.
- Keep browser/PWA behavior stable before starting native wrapper work.

