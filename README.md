# Project G-Code Tutorial

**A Duolingo-style PWA for learning CNC G-code — bite-sized lessons, interactive quizzes, and a live reference, all in a single deployable folder.**

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [Feature Overview](#feature-overview)
3. [Product Guardrails](#product-guardrails)
4. [File Structure](#file-structure)
5. [Architecture Overview](#architecture-overview)
6. [Data Model](#data-model)
7. [State Management](#state-management)
8. [Lesson Engine](#lesson-engine)
9. [Visual System](#visual-system)
10. [Design Tokens](#design-tokens)
11. [PWA / Offline Support](#pwa--offline-support)
12. [Deployment (GitHub Pages)](#deployment-github-pages)
13. [Extending the Curriculum](#extending-the-curriculum)
14. [Adding New Visual Aids](#adding-new-visual-aids)
15. [Roadmap / Future Features](#roadmap--future-features)
16. [Tech Stack](#tech-stack)

---

## What It Does

Project G-Code Tutorial teaches CNC G-code (lathe-focused, Fanuc-compatible) using the same loop that makes Duolingo addictive:

```
Theory card → Quiz questions → Instant feedback → XP reward → Unlock next lesson
```

Everything runs in the browser without dependencies, a build step, or a backend. The app stores state in `localStorage` and can be installed as a PWA on supported Android and iOS devices.

---

## Feature Overview

| Feature | Description |
|---|---|
| **Lesson cards** | Theory + SVG visual aid for each concept |
| **Multiple-choice quiz** | Tap an option to receive immediate correct-or-incorrect feedback |
| **Fill-in-the-blank** | Type a G-code value, press Enter or Check |
| **Explanations** | Every quiz answer reveals a plain-language explanation |
| **XP system** | XP awarded per lesson, scaled by accuracy |
| **Streak tracking** | Daily study streak with 🔥 counter |
| **Lesson unlock tree** | Linear progression — complete lesson N to unlock N+1 |
| **G-code Reference** | Searchable accordion reference for all major codes |
| **Progress screen** | Per-unit progress bars + total XP |
| **PWA / offline** | Service worker caches local assets; robust offline fallback |

---

## Product Guardrails

Project direction is documented in `MISSION.md`, with prioritized teaching ideas in `BACKLOG.md`, phase direction in `ROADMAP.md`, and current work in `CURRENT_PHASE.md`.

The short version: Project G-Code is a learning app, not CAM, machine control, or shop management. Features should teach what G-code means, what the machine would do, and how to recover from mistakes.

---
## File Structure

```
project-gcode-tutorial/
│
├── index.html              ← Single-page app shell; all screens live here
├── manifest.json           ← PWA manifest (name, icons, display mode)
├── sw.js                   ← Service worker (network-first with cache fallback)
│
├── css/
│   └── style.css           ← Full design system + all component styles
│
├── js/
│   └── app.js              ← All application logic (state, routing, lesson engine)
│
├── data/
│   └── lessons.js          ← ALL lesson content (curriculum lives here)
│
├── icons/
│   ├── icon-192.png        ← PWA icon (home screen)
│   └── icon-512.png        ← PWA icon (splash screen)
│
├── generate_icons.py       ← Stdlib Python script to regenerate icons
└── README.md               ← This file
```

**Key constraint:** There is intentionally no build toolchain. No npm, no webpack, no framework. The app loads three `<script>` tags and one `<link>` — that's it. This makes it trivially deployable to GitHub Pages and editable directly in the GitHub web editor.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  index.html                                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  <header> Top Bar (streak, XP)                           │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Screens (display:none / display:flex toggled by JS)     │  │
│  │  ┌─────────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐  │  │
│  │  │ #screen-home│ │ #s-lesson │ │ #s-ref   │ │ #s-prog│  │  │
│  │  └─────────────┘ └───────────┘ └──────────┘ └────────┘  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  <nav> Bottom Nav (Home | Reference | Progress)          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Script load order:                                             │
│    1. data/lessons.js    → sets LESSONS[], UNITS[] globals      │
│    2. js/app.js          → reads those globals, boots State     │
└─────────────────────────────────────────────────────────────────┘
```

### Screen Routing

Routing is managed by `showScreen(id)` which simply toggles the `active` class:

```javascript
function showScreen(id) {
  document.querySelectorAll('.screen')
    .forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
```

The app does not need a router library. It does not track navigation history; the back button returns to Home instead of moving through browser history. This behavior supports the app's single-flow learning experience.

---

## Data Model

All curriculum content lives in `data/lessons.js`. This file exports two globals:

### `LESSONS` Array

Each lesson object has this shape:

```javascript
{
  id: "u1-l1",          // Unique ID — unit + lesson number
  unit: 1,              // Which unit (1–4+)
  unitName: "Foundations",
  lesson: 1,            // Position within unit
  title: "What Is G-Code?",
  icon: "📋",           // Displayed on home screen
  xp: 10,               // Max XP this lesson can award
  why: "Why this concept matters before syntax/details",
  theory: `<p>HTML string...</p>`,  // Rendered as innerHTML
  visual: "block-anatomy",          // Key into Visuals.render()
  quiz: [               // Array of quiz question objects
    {
      type: "multiple-choice",       // or "fill-blank"
      question: "Question text?",
      options: ["A", "B", "C", "D"], // MC only
      answer: 1,                     // Zero-indexed correct option (MC)
                                     // or string value (fill-blank)
      hint: "Hint text",             // fill-blank only
      explanation: "Why this is correct."
    }
  ]
}
```

### `UNITS` Array

```javascript
{
  id: 1,
  name: "Foundations",
  icon: "📋",
  color: "#1A6B5C",   // Currently unused; reserved for future unit theming
  lessons: 3          // Count (must match LESSONS entries)
}
```

---

## State Management

`State` is a plain JS object in `app.js`. Persistent fields are serialized to `localStorage` under the key `pgct_state`.

```javascript
const State = {
  // Persisted
  xp: 0,
  streak: 0,
  lastStudyDate: null,        // ISO date string
  completedLessons: [],       // ["u1-l1", "u1-l2", ...]
  lessonScores: {},           // { "u1-l1": { correct: 2, total: 3 } }

  // Runtime only (not saved)
  currentLesson: null,
  currentStep: 0,
  currentQuizAnswered: false,
  sessionCorrect: 0,
  sessionTotal: 0
}
```

### Key Methods

| Method | Purpose |
|---|---|
| `State.load()` | Reads `localStorage` at boot |
| `State.save()` | Writes to `localStorage` (called after lesson completion) |
| `State.isLessonDone(id)` | Returns a Boolean value |
| `State.isLessonUnlocked(lesson)` | Checks prerequisite chain |
| `State.completeLesson(id, correct, total)` | Awards XP, updates streak, saves |
| `State.getUnitProgress(unitId)` | Returns `{ done, total }` |

### Unlock Rules

```
Unit 1, Lesson 1 → always unlocked
Any other lesson → previous lesson in same unit must be completed
First lesson of Unit N → last lesson of Unit N-1 must be completed
```

---

## Lesson Engine

### Step Model

Each lesson has `1 + quiz.length` steps:

```
Step 0     → Theory card (always first)
Step 1..N  → Quiz questions (one per step)
Step N+1   → Completion screen (triggered after last quiz)
```

### Flow

```
startLesson(id)
  └─ renderLessonStep()
       ├─ if step === 0 → render theory HTML + visual aid
       └─ if step > 0   → renderQuiz(q, idx)
            ├─ multiple-choice: option buttons, click to answer
            └─ fill-blank: <input>, Enter or button to check

[User answers]
  └─ mark correct/wrong, show explanation
  └─ update action button: "Check" → "Next →" (or "Finish 🎉")

advanceStep()
  └─ increment currentStep
  └─ if last step → finishLesson()
  └─ else → renderLessonStep()

finishLesson()
  └─ State.completeLesson(...)
  └─ Render completion screen with XP earned, score, streak
  └─ Action button → back to Home
```

### Quiz Answer Validation

- **Multiple-choice questions:** compare the clicked index with `q.answer` (an integer)
- **Fill-blank:** case-insensitive string comparison after trimming whitespace. Accepts with or without leading `G`/`M` (the input normalizes to uppercase)

---

## Visual System

Inline SVG diagrams are rendered by `Visuals.render(type)` in `app.js`. Each visual is a self-contained SVG string returned by key lookup.

### Current Visuals

| Key | Shows |
|---|---|
| `block-anatomy` | Annotated breakdown of a G-code block |
| `lathe-axes` | X/Z axis diagram with part, chuck, tool |
| `rapid-path` | Safe rapid vs. feed path diagram |
| `arc-moves` | G02 concave vs. G03 convex arc shapes |
| `g71-cycle` | Multi-pass rough turning profile sketch |
| `threading` | Thread form with lead annotation |

All SVGs use the design-token colors from the `:root` CSS variables. The colors are hardcoded in the SVG strings because those strings cannot easily inherit CSS variables. When adding a new visual, match these existing color values:

- Background fills: `#1E2D3D`
- Primary strokes: `#1A6B5C`
- Accent: `#F5A623`
- Text: `#E8EDF2` / `#9BAFC4`
- Code color: `#7FDBCA`

---

## Design Tokens

All design decisions live in `:root` in `style.css`. Change these variables to apply a new theme throughout the app.

```css
:root {
  --c-bg:        #0F1923;   /* Page background — machine dark */
  --c-surface:   #172130;   /* Card surface */
  --c-surface2:  #1E2D3D;   /* Input / elevated surface */
  --c-border:    #2A3D52;   /* Borders and dividers */
  --c-primary:   #1A6B5C;   /* Coolant teal — progress, buttons */
  --c-primary-l: #22876E;   /* Primary hover */
  --c-accent:    #F5A623;   /* Chip gold — XP, highlights */
  --c-correct:   #28A745;   /* Correct answer green */
  --c-wrong:     #DC3545;   /* Wrong answer red */
  --c-code-bg:   #101820;   /* Code block background */
  --c-code-text: #7FDBCA;   /* Code syntax color */

  --f-display: 'JetBrains Mono', monospace;  /* Headers, logo, code */
  --f-body:    'Inter', system-ui, sans-serif;
  --f-code:    'JetBrains Mono', monospace;
}
```

### Typography Scale

| Role | Tag | Size |
|---|---|---|
| Screen title | `h1` | clamp(1.6–2.2rem) |
| Section header | `h2` | clamp(1.2–1.6rem) |
| Card title | `h3` | 1.1rem |
| Label / eyebrow | `h4` | 0.95rem (accent, uppercase) |
| Body | `p` | 1rem |
| Code | `code/pre` | 0.875rem |
| Caption | `.ref-category-title` | 0.72rem |

---

## PWA / Offline Support

### Service Worker Strategy

`sw.js` implements **network-first with cache fallback**:

1. On install: pre-cache local app files; Google Fonts are no longer precached to avoid cross-origin failures.
2. On fetch: serve a cached response when available; otherwise, request and cache the network response.
3. On activate: delete caches from old `CACHE_VERSION`.

`CACHE_VERSION` rotates automatically by date/timestamp, so repeated deploys don’t stick with stale cache entries.

```javascript
const CACHE_VERSION = 'pgct-v1.0';  // ← legacy static form; actual version is generated dynamically in sw.js
```

### Manifest

`manifest.json` sets:
- `display: "standalone"` — hides browser chrome when installed
- `theme_color: "#0F1923"` — status bar color on Android
- `orientation: "portrait-primary"` — locks to portrait

### Install Prompt

The browser handles the native "Add to Home Screen" prompt. The app does not include a custom installation interface, which keeps the experience simple.

---

## Deployment (GitHub Pages)

This repo is designed for zero-config GitHub Pages deployment.

### Steps

1. Push the project folder contents to a GitHub repo (e.g. `project-gcode-tutorial`)
2. Go to **Settings → Pages → Source: Deploy from branch → main / (root)**
3. Site publishes at `https://<username>.github.io/project-gcode-tutorial/`

### Subdirectory Note

If you deploy to a subdirectory (not the repo root), ensure `sw.js` `start_url` and cache paths match the subfolder. The safest approach is relative paths (already used throughout).

### GitHub Web Editor Compatibility

All files are plain text. The GitHub web editor can edit any of them:
- **Add a lesson:** edit `data/lessons.js`, append to `LESSONS[]`
- **Fix a typo:** edit `data/lessons.js` or `index.html`
- **Tweak colors:** edit `css/style.css` `:root` variables
- **Update cache version:** automatic via `sw.js` dynamic versioning

No terminal, no build step required.

---

## Extending the Curriculum

### Why-Before-How Curriculum Rule

Every new lesson should explain why the concept matters before showing syntax or asking quiz questions. Use the `why` field for the short reason, then use `theory` for the how-to details.

Effective `why` statements should answer:

- What machine behavior does this concept control?
- What mistake does this help prevent?
- Why should a learner care before memorizing the code?

Keep it practical, short, and tied to the lesson objective.

### Adding a Lesson

In `data/lessons.js`, append a new object to the `LESSONS` array:

```javascript
{
  id: "u5-l1",          // Must be unique
  unit: 5,
  unitName: "Mill Basics",
  lesson: 1,
  title: "G17 — XY Plane Selection",
  icon: "🔲",
  xp: 15,
  why: "Explain why this concept matters before syntax/details.",
  theory: `<p>Your theory HTML here...</p>`,
  visual: "xy-plane",   // Add matching entry to Visuals.render() in app.js
  quiz: [
    {
      type: "multiple-choice",
      question: "Which plane does G17 select?",
      options: ["XZ", "YZ", "XY", "UV"],
      answer: 2,
      explanation: "G17 selects the XY plane, used for most milling operations."
    }
  ]
}
```

Then add the unit to `UNITS[]` if it's a new unit.

### Adding a Fill-Blank Question

```javascript
{
  type: "fill-blank",
  question: "Write the code to run 800 RPM constant speed:\nG97 S___",
  answer: "800",
  hint: "S value = RPM in G97 mode",
  explanation: "In G97 (constant RPM) mode, S sets the spindle RPM directly."
}
```

---

## Adding New Visual Aids

In `js/app.js`, inside the `Visuals.render()` method, add a new key:

```javascript
'your-key': `
  <div class="visual-aid">
    <svg viewBox="0 0 360 120" xmlns="http://www.w3.org/2000/svg">
      <!-- your SVG here -->
      <!-- Use these colors to match the design system: -->
      <!-- Background fills: #1E2D3D  -->
      <!-- Primary strokes:  #1A6B5C  -->
      <!-- Accent/highlight: #F5A623  -->
      <!-- Text:             #E8EDF2  -->
      <!-- Code/teal:        #7FDBCA  -->
    </svg>
  </div>`
```

Then reference it in a lesson object's `visual` field.

---

## Roadmap / Future Features

These are not implemented but architecturally straightforward to add:

| Feature | Notes |
|---|---|
| **RPM / SFM Calculator** | Add a 4th nav tab with a widget (matches Green Hat pattern) |
| **Drill-down review** | Replay only incorrect questions from past sessions |
| **Unit tests / challenge mode** | Timed mixed-question set across a full unit |
| **Bookmarked reference codes** | Toggle star on ref cards, saved to localStorage |
| **Handoff log** | Timestamped notes (mirrors Green Hat's handoff log feature) |
| **Gemini AI hints** | "Get a hint" button calls Gemini API for a dynamic explanation |
| **Sound effects** | Correct/wrong audio feedback using Web Audio API |
| **Haptic feedback** | `navigator.vibrate()` on mobile for correct/wrong |
| **Dark/light mode toggle** | CSS class swap on `<body>` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Vanilla JS (ES6+, no TypeScript) |
| Styling | Plain CSS with custom properties |
| Fonts | Google Fonts (Inter + JetBrains Mono) |
| Icons | Emoji (zero dependency) |
| Diagrams | Inline SVG (zero dependency) |
| Storage | `localStorage` |
| Offline | Service Worker (Cache API) |
| Build | None |
| Host | GitHub Pages (static) |

---

*Project G-Code Tutorial is part of the `orangetrd-byte` CNC tool ecosystem, alongside Green Hat (beginner lathe companion) and CNC Cell Planner (production scheduling).*
## Current Project Status

**Status as of June 27, 2026:** Active learning-app repo.

Project G-Code Tutorial is the structured learning app for CNC G-code. It is educational and simulated only. It must not become a production G-code generator or machine-control tool.

Where it stands:

- Current focus is reducing guessing and improving concept retention.
- Lessons should teach why a concept matters before asking the learner to answer syntax questions.
- Streaks should remain accountability-focused, without noisy reward systems.
- Visual logic blocks and weak-spot relearn flows are valuable because they help learners understand motion, coordinates, offsets, cycles, and troubleshooting.
- MGP build/version information must remain visible and cannot be removed.

Next practical focus:

- Improve first-minute onboarding, question clarity, weak-spot relearn, visual explanations, and curriculum rules before adding larger sandbox features.

## Assistant Change Guidelines

Before making code or file changes in this repo:

1. Clarify the learning goal, audience level, constraints, assumptions, and measurable success criteria.
2. Use structured output for lesson plans, explanations, quiz changes, risks, and troubleshooting.
3. Compare options before changing curriculum structure, lesson flow, scoring, progress storage, dependencies, or AI behavior.
4. Use brainstorming for lesson ideas, practice questions, review prompts, and learning-track concepts.
5. Give technical explanations when changing G-code concepts, 3D printing concepts, quiz logic, progress logic, or assistant fallback paths.
6. Draft concise documentation or handoff notes for user-facing curriculum and workflow changes.
7. Use a troubleshooting checklist before fixing bugs in lessons, quizzes, mixed review, progress, storage, matching interaction, or PWA behavior.
8. Use learning paths as a core design tool for curriculum and skill progression.
9. Assess risks before adding generated content, AI fallback, scoring changes, curriculum changes, or track-mixing behavior.
10. Optimize only for a named goal such as learning clarity, reliability, readability, speed, offline use, or safe educational scope.

Permanent rule: MGP must remain visible in build/version information and cannot be removed, hidden, renamed, or replaced.

