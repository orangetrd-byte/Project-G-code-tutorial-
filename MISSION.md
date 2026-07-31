# Project G-Code Tutorial — Mission

Project G-Code Tutorial teaches CNC and 3D-printer G-code to beginners through interpretation, recall, and consequence. The app should help a learner understand what a block of code tells the machine to do before asking them to memorize syntax.

## What This App Is

- A teaching app: cause and effect first, code formatting second.
- Beginner-first: readable prompts, safety concepts, and guardrails against guessing.
- Offline-ready PWA: installable, simple, fast, and static-host friendly.
- Machinist-authentic: examples should sound useful on the shop floor without pretending to be production-ready programs.
- Multi-track: CNC and 3D printing stay separate unless a review clearly labels shared concepts.

## What This App Is Not

- Not CAM, a simulator, a DRO, or machine control.
- Not a production G-code generator.
- Not a social network, cloud account system, or subscription product.
- Not an admin, scheduling, budgeting, or tool-tracking app.
- Not a place to add AI assistants, OCR, or unrelated shop utilities.

## Design Rules

- Job-first content: frame concepts as machine intent, not just code names.
- Visual over text: show motion, state change, or consequence when it improves understanding.
- Cue the concept, not the answer: avoid prompts that reveal the answer before recall.
- Misses should teach: wrong answers should lead to explanation, correction, and retry.
- Small changes: prefer surgical improvements over rewrites.
- Teaching over points: XP and streaks support habit, but understanding is the product.
- Keep MGP visible in version/build information.

## Rule of Thumb

If a feature teaches what G-code means or what a machine would do, it belongs here.
If a feature turns the app into machine operation, production programming, or shop management, it belongs somewhere else.

## Product Boundary

- `index.html`, `js/app.js`, `css/style.css`, `sw.js`: app shell, logic, UI, and offline behavior.
- `data/lessons.js`: curriculum and question content.
- `MISSION.md`: product guardrails.
- `BACKLOG.md`: prioritized learning improvements.
- `ROADMAP.md` and `CURRENT_PHASE.md`: phase-level direction and current focus.

Do not remove existing project docs unless the same information is intentionally migrated and verified.