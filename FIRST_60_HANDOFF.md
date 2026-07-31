# First 60-Second Win — Codex Handoff

## Goal
Make a brand-new user feel safe, guided, and accomplished before they’ve even answered a second question.

## Why
Retention is decided in the first 60 seconds. If the first question feels hard or abstract, the user closes the app and never returns.

---

## Changes to Make

### 1. Trim Lesson 1 Intro
- **Current:** Theory card includes a general “what is G-code” philosophy paragraph.
- **Change:** Cut it to one plain-English sentence and one concrete example.
- **Target:** `data/lessons.js` → Lesson 1 (`u1-l1`) theory field.

Example target theory:
> G-code is the instructions the machine reads. Each line does one thing: move, stop, or change a mode.

That’s it. No history, no motivation paragraph, no “why this matters” essay in the first lesson.

### 2. Make First Question Trivially Winnable
- The first quiz question after the theory must be answerable directly from the theory text just shown.
- No “gotcha,” no ambiguity, no option that could be argued.
- Current first question for Lesson 1 should already be easy; if it’s not, replace it.

### 3. Keep Feedback Instant and Clear
- When the user answers correctly, show:
  - Green feedback bar
  - The correct answer in the accent color
  - The explanation
- When the answer is incorrect, show the same explanation immediately.
- No “too bad, try again” shame

### 4. Complete Screen Must Show Unlock
- After Lesson 1 completes, the completion screen should clearly show:
  - XP earned
  - “Next lesson unlocked”
  - The **next lesson card** in the curriculum view should no longer be grayed out or locked
- That visual unlock creates the pull to return

### 5. No Rewards Before First Correct Answer
- Do not show XP or streak effects until after the first correct answer.
- This timing makes the reward feel earned rather than cosmetic.

---

## Files to Touch
- `data/lessons.js` — trim Lesson 1 theory, ensure Q1 is trivial
- `js/app.js` — if completion screen wording or unlock indicator needs tweaking
- `css/style.css` — if the “unlocked” state isn’t visually obvious

## Boundaries
- Do NOT change the unlock chain logic
- Do NOT add new screens or modals
- Do NOT touch unrelated lessons (Unit 2+)

## Success Criteria
A brand-new user can open the app, complete Lesson 1, see XP awarded, and see the next lesson available—all in under 90 seconds, without confusion or friction.

---
Write a complete, copy-paste-ready patch set that implements these changes exactly and modifies only `data/lessons.js`, `js/app.js`, and `css/style.css`. Do not use placeholders like "// TODO" in production code; validate syntax before finalizing.
