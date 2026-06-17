# Concept-Retry System — Extension Handoff

## Problem
Retaking the exact same wrong question teaches memorization, not understanding. User clicks "A" because "that's what it was last time."

## Solution
Group questions by **concept**, then retake with a **different question from the same concept pool.**

---

## Data Model

### Question Shape (extend existing questions)

```javascript
{
  id: 'g01-feed',
  concept: 'g01-feed',          // NEW: concept tag
  pool: 'linear-motion',        // NEW: optional broader group
  tier: 1,
  type: 'multiple-choice',
  question: 'What does G01 require?',
  options: ['F address (feed)', 'S address', 'T address', 'No address required'],
  correctIndex: 0,
  explanation: 'G01 is linear interpolation at feed rate...'
}
```

### Concept → Retake Pool Map

```javascript
const CONCEPT_POOLS = {
  'g00-g01':       ['g00-g01-q1', 'g00-g01-q2', 'g00-g01-q3'],  // 3 variants
  'g02-g03':       ['g02-g03-q1', 'g02-g03-q2', 'g02-g03-q3'],
  'modal-codes':   ['modal-q1', 'modal-q2', 'modal-q3'],
  'm-codes':       ['m03-q1', 'm03-q2', 'm05-q1', 'm05-q2'],
  'coordinates':   ['g54-q1', 'g54-q2', 'g90-q1', 'g90-q2'],
  'units':         ['g20-g21-q1', 'g20-g21-q2']
};
```

**Rule:** Each concept has **at least 2 questions** in the pool. If a concept only has 1 question today, mark it as `needs-more-questions` and log it.

---

## Retake Flow

### Current behavior (broken)
```
Lesson finishes
  → show wrong questions list
  → user clicks retake
  → SAME questions in SAME order
```

### Target behavior
```
Lesson finishes
  → show weakness areas: "Arc directions (2 missed)" "Modal codes (1 missed)"
  → user clicks weakness area
  → app pulls DIFFERENT question from same concept pool
  → answer and get feedback
  → if wrong again: either repeat or flag for later review
```

### State additions
```javascript
state.weaknesses = {
  'g02-g03': { missedCount: 2, lastAttempt: '2026-06-17T10:30:00Z' },
  'modal-codes': { missedCount: 1, lastAttempt: '2026-06-17T10:32:00Z' }
};
```

---

## Retake Selection Algorithm

```javascript
function getRetakeQuestion(conceptId, originalQuestionId) {
  const pool = CONCEPT_POOLS[conceptId] || [originalQuestionId];

  // Filter out the question they just missed
  const available = pool.filter(id => id !== originalQuestionId);

  // Pick randomly from remaining
  if (available.length > 0) {
    return getQuestionById(available[Math.floor(Math.random() * available.length)]);
  }

  // Fallback: only 1 question in pool — repeat with warning
  return getQuestionById(originalQuestionId);
}
```

---

## UI Changes

### End-of-Lesson Weakness Screen
Replace or augment current wrong-answer list with:

```html
<div class="weakness-areas">
  <h3>Areas to strengthen</h3>
  <button class="weakness-btn" onclick="retakeConcept('g02-g03')">
    <span class="concept-name">Arc directions (G02/G03)</span>
    <span class="missed-badge">2 missed</span>
  </button>
  <button class="weakness-btn" onclick="retakeConcept('modal-codes')">
    <span class="concept-name">Modal vs non-modal codes</span>
    <span class="missed-badge">1 missed</span>
  </button>
</div>
<p class="pool-notice" style="display:none">
  More practice questions coming for this topic.
</p>
```

### Retake Session State
```javascript
state.activeRetake = {
  conceptId: 'g02-g03',
  originalQuestions: ['g02-g03-q1'],  // what they missed
  remaining: ['g02-g03-q2', 'g02-g03-q3']  // pool minus original
};
```

---

## Edge Cases

| Situation | Behavior |
|-----------|----------|
| Only 1 question in concept pool | Show original question, display notice: "More practice variants coming" |
| User misses retake question too | Add to weaknesses again, suggest review of lesson theory card |
| User passes retake | Remove from weaknesses, update streak/XP if desired |
| All retake pools exhausted | Fall back to lesson review mode (re-read theory, then quiz) |

---

## Implementation Order

1. **Tag all existing questions** with `concept` field — data work, no logic
2. **Build CONCEPT_POOLS** — map concepts to question arrays
3. **Add weakness tracking** — capture concept on wrong answer during lesson
4. **Replace end-of-lesson retake UI** — show concept areas instead of question list
5. **Wire retake logic** — `getRetakeQuestion()` with pool filtering
6. **Add pool-notice fallback** — graceful behavior when pool is thin
7. **Polish** — animation, count display, " mastered " feedback when weakness cleared

---

## Acceptance Criteria

- [ ] Wrong answers grouped by concept, not by question ID
- [ ] Retake pulls different question from same concept pool
- [ ] If pool exhausted, graceful fallback with notice
- [ ] Passing retake removes concept from weaknesses
- [ ] Failing retake re-queues concept
- [ ] No build step or dependency changes

---

## Questions to Resolve During Build

1. Should retake count toward daily streak? (Recommend: yes, small XP — it's genuine practice)
2. Should there be a "review theory first" option before retake? (Nice to have)
3. Should mastery threshold be 1 correct retake, or 2 in a row? (Recommend: 1 for speed, flag if they miss again later)
4. Should weakness data persist across sessions? (Recommend: yes — localStorage, cleared only when concept is mastered)
