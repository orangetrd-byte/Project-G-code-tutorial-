# Weak-Spot Retry Variants — Codex Handoff

## Context
- Repo: `C:\Users\Dad\Documents\GitHub\Project-G-code-tutorial-`
- Current weak-spot retry shows the **exact same missed question** again.
- Remote already has concept pooling (`ConceptPools`) and a `getRetakeQuestion()` helper.
- Goal: use concept variants for weak-spot retries so learners cannot succeed by memorizing the previous answer.

## What Exists Now (remote)
- `js/app.js` has `ConceptPools`, `getQuestionConcept()`, `getRetakeQuestion()`, `getRetakeQuestions()`
- `data/lessons.js` quiz items now have `id` fields (Unit 1 confirmed)
- Upstream commits: `8a59c71 Use concept variants for retry questions`, `abcf5b8 Make read aloud button stoppable`

## What’s Missing / Needs Tightening
1. `startWeakReview()` builds its retry quiz from `State.weakQuestions` but may still replay the exact same item instead of a concept variant.
2. A fallback notice is needed when a concept pool has only one variant.
3. Stable IDs and concept tags must cover all lessons consistently.

## Implementation Steps

### Step 1 — Verify the retry path in `js/app.js`
Find `startWeakReview()`. Replace the quiz-building block with:

```javascript
const retryQuiz = (prioritized || []).map(item => {
  const q = item.question || {};
  const retaken = getRetakeQuestion(q);
  return {
    ...retaken,
    weakKey: item.key,
    sourceLessonId: q.sourceLessonId,
  };
});
```

Keep the existing sort + slice logic, XP, mode, and state resets.

### Step 2 — Add the single-variant fallback UI
Wherever `startWeakReview()` renders the lesson intro, add:

```javascript
const hasFallback = retryQuiz.some(q => q.retakeNotice);
if (hasFallback) {
  // Show a small inline notice:
  // "Some topics only have one practice question so far — more are being added."
}
```

### Step 3 — Tag remaining lessons consistently
In `data/lessons.js`, ensure that every quiz item has:
- `id` (string, unique within the lesson)
- `concept` (string, same value for items that test the same idea)

Examples:
```javascript
{ id: "u2-l1-q1", concept: "g00-g01", ... }
{ id: "g02-g03-q1", concept: "g02-g03", ... }
```

Use existing lesson ids as concept groups when needed:
- `u2-l1` → rapid moves → concept: `g00-g01`
- `u2-l3` → arcs → concept: `g02-g03`

### Step 4 — Add a second variant per concept
For each concept you want to retry, add at least **one alternate question** in the same or a different lesson.

| Concept | Existing | Minimum addition |
|---------|----------|-------------|
| modal-codes | ? | 1 more |
| g00-g01 | ? | 1 more |
| g02-g03 | ? | 1 more |
| work-offsets | ? | 1 more |

Check the repository’s existing `LESSONS` array and fill any gaps.

## Verification Checklist
- [ ] Weak spots screen still opens the retry flow
- [ ] Retry quiz shows a **different question** when a concept has multiple variants
- [ ] When only one variant exists, it replays with the fallback notice
- [ ] No console errors from `initConceptPools()` or `getRetakeQuestion()`
- [ ] Stable IDs do not break saving/loading of `weakQuestions`

## Risk Notes
- Do **not** rewrite `startWeakReview()` beyond the quiz-building section.
- Do **not** change `trackWeakQuestion()` or localStorage schema.
- If upstream changes `getRetakeQuestion()` later, this patch should still apply cleanly.

## Related Handoffs
- `PLACEMENT_TEST_HANDOFF.md` — placement test (on hold)
- `CONCEPT_RETRY_HANDOFF.md` — earlier draft of this feature
