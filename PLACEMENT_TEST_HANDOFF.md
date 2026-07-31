# Placement Test — Implementation Handoff

## Goal
Add an optional 10-question placement test that determines the user's starting lesson based on their G-code knowledge.

## Why
- It reduces friction for users who already know the basics.
- It creates a "test my skills" entry point for experienced machinists.
- It personalizes the learning path without adding complexity.

---

## User Flows

### Flow A: New User (No placement test data)
1. User opens app → Home screen
2. Two calls to action are visible:
   - Primary: "Take 2-minute placement test" (recommended)
   - Secondary: "Start from beginning" (text link)
3. User selects one
4. If the learner takes the test: answer 10 questions → see the result → open the assigned lesson
5. If the learner skips the test: start at Unit 1, Lesson 1

### Flow B: Returning User (Has placement result saved)
- Skip the placement screen entirely.
- Go directly to the current lesson or progress screen.

### Flow C: Retest
- On the Progress screen, show a small "Retake placement test" link.
- Reset the placement data and run the test again.

---

## Placement Logic

### Question Tiers
Questions map to three tiers:

| Tier | Topic | Lesson Range |
|------|-------|-------------|
| 1 | G00/G01 feed/rapid, M03/M05 | Unit 1-2 |
| 2 | G02/G03 arcs, G90/G91, F/S/T | Unit 3-4 |
| 3 | G54 work offsets, G20/G21 units, subprograms | Unit 5+ |

### Scoring
- 0–3 correct → Tier 1 start (Unit 1, Lesson 1)
- 4–7 correct → Tier 2 start (Unit 3, Lesson 1)
- 8–10 correct → Tier 3 start (Unit 5, Lesson 1) + unlock "Challenge Mode"

### Storage
Save to `localStorage` as:
```
placementResult: {
  score: number,
  tier: 1 | 2 | 3,
  completedAt: ISO date string,
  answers: [{questionId, selected, correct}]
}
```

---

## 10 Sample Questions

Use multiple-choice questions with one correct answer and approximately 10–20 words per option.

1. **G00 vs G01**
   - "What does G00 do?"
   - A) Moves at rapid traverse (correct)
   - B) Moves at feed rate
   - C) Spindle on
   - D) End program

2. **G01**
   - "What does G01 require?"
   - A) F address (feed)
   - B) S address
   - C) T address
   - D) No address required

3. **M03**
   - "What does M03 do?"
   - A) Spindle forward (correct)
   - B) Spindle reverse
   - C) Coolant on
   - D) Program stop

4. **G02/G03**
   - "What does G02 do?"
   - A) Clockwise arc (correct)
   - B) Counterclockwise arc
   - C) Rapid move
   - D) Cancel tool-radius compensation

5. **G90 vs G91**
   - "In G90 mode, coordinates are:"
   - A) Absolute (correct)
   - B) Incremental
   - C) Modal
   - D) Non-modal

6. **G54**
   - "G54 typically stores:"
   - A) Work offset (correct)
   - B) Tool length offset
   - C) Cutter compensation
   - D) Feed override

7. **G20/G21**
   - "G21 selects:"
   - A) Metric units (correct)
   - B) Inch units
   - C) Inches per minute
   - D) Millimeters per revolution

8. **Modal codes**
   - "A modal G-code:"
   - A) Stays active until canceled (correct)
   - B) Only affects one block
   - C) Must be repeated every line
   - D) Only works with M codes

9. **Feed rate**
   - "On a Fanuc lathe, which code selects feed per revolution?"
   - A) G99 (correct)
   - B) G98
   - C) G94
   - D) G95

10. **Program end**
    - "Which code commonly ends a program and returns the program cursor to the beginning?"
    - A) M30 (correct)
    - B) M05
    - C) G28
    - D) M00

---

## UI Changes

### Home Screen (`index.html`)
Add above or alongside existing "Start Learning" CTA:

```html
<div id="placement-cta" class="placement-cta">
  <h2>Where should you start?</h2>
  <button id="btn-placement" class="btn-primary">Take 2-minute placement test</button>
  <button id="btn-skip-placement" class="btn-secondary">Start from beginning</button>
</div>
```

Hide this section once placement is completed or skipped.

### Progress Screen
Add small link:
```html
<a href="#" id="btn-retake-placement">Retake placement test</a>
```

### New Screen: `#screen-placement`
Simple full-screen quiz:
- Question text at top
- 4 option buttons stacked
- "Next" button (disabled until selection)
- Progress indicator: "Question 3 of 10"
- On completion: results screen showing tier + starting lesson

---

## Data Model Changes

### `data/lessons.js`
No changes are required. Placement maps to the existing `UNITS` array indices.

### `js/app.js` additions

#### New State
```javascript
state.placement = {
  completed: false,
  tier: null,        // 1 | 2 | 3
  startUnitIndex: null,
  score: null,
  answers: []
}
```

#### New Functions
```javascript
function startPlacement() { ... }
function renderPlacementQuestion(index) { ... }
function submitPlacementAnswer(selectedIndex) { ... }
function calculatePlacementResult() { ... }
function applyPlacementResult() { ... }  // sets currentLesson index
function retakePlacement() { ... }
```

#### Modified Functions
- `init()` — check `placementResult` in localStorage; if exists, skip placement flow
- `showScreen()` — handle `#screen-placement`
- `renderHome()` — hide/show placement CTA based on placement state

---

## Implementation Order

1. **Data layer** — add 10 questions to a new `data/placement.js` array with structure:
   ```javascript
   const PLACEMENT_QUESTIONS = [
     {
       id: 'p1',
       tier: 1,
       question: 'What does G00 do?',
       options: ['...', '...', '...', '...'],
       correctIndex: 0,
       explanation: 'G00 is rapid traverse...'
     },
     // ...
   ];
   ```

2. **Placement logic** — scoring and tier mapping (pure functions, no UI)

3. **Storage** — save/load `placementResult` from localStorage

4. **UI shell** — `#screen-placement` question + results screens

5. **Wire up** — home screen CTA, retake link, auto-skip on return visit

6. **Polish** — animations, progress bar, result explanation

---

## Acceptance Criteria

- [ ] User can skip placement and start at Unit 1
- [ ] User can take test and land on appropriate lesson
- [ ] Result persists across sessions (localStorage)
- [ ] Retake option available from Progress screen
- [ ] The test takes approximately two minutes to complete.
- [ ] No build step or dependency changes required

---

## Out of Scope

- Adaptive difficulty during the test itself (static 10 questions)
- Time-based scoring
- Account synchronization (`localStorage` only, as in the rest of the app)

---

## Questions to Resolve During Build

1. Should the placement test count toward XP/streaks? (Recommend: no — it's diagnostic, not a lesson)
2. Should wrong answers be shown after completion, or only explanations during the test? (Recommend: during only, to avoid discouragement)
3. Should there be a "review these topics" link at the end for wrong answers? (Nice to have, Phase 2)
