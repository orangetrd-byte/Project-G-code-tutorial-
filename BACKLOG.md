# Project G-Code Tutorial — Backlog

Last updated: 2026-07-16

---

## P1 — Teaching Differentiators

These define what Project G-Code can do better than a PDF, video playlist, or generic quiz app.

1. Wrong-path preview
   Learner picks a code or block; the app shows the expected motion/state beside the mistaken motion/state.
   Acceptance: learner can see why the wrong answer would move or behave differently.

2. Educational crash/alarm preview
   Add 4-6 dangerous beginner mistake patterns with consequence feedback.
   Acceptance: learner sees what the code could do to the part, tool, coordinate system, or print job without turning the app into a machine panel.

3. Workpiece/state panel
   Show simple educational state: active tool/nozzle, position, units, feed, spindle/temp, and active mode where relevant.
   Acceptance: state changes reflect the learner's selected code block.

4. Mistake bank with lesson link-back
   Every missed concept links back to the source lesson or explanation.
   Acceptance: user can jump from a weak spot to the exact concept in one tap.

5. Correction rewrite after a miss
   Status: completed. Wrong answers now require an active correction before progression.
   Acceptance met: the learner recalls the correction instead of only reading feedback.

---

## P2 — Learning Quality

These reduce guessing and improve retention.

1. Job-first lesson framing
   Status: in progress through CNC Unit 3 using visible why-before-how framing.
   Continue later units in small curriculum-only batches.

2. Beginner checkpoints
   Add short checkpoints for safety-critical concepts such as units, coordinates, rapid moves, offsets, canned cycles, homing, temperatures, and end commands.
   Acceptance: the next lesson stays locked until the learner demonstrates the checkpoint correctly.

3. Weak-spot retry queue
   First miss of the day should surface in practice before normal review.
   Acceptance: streak/gamification cannot hide unresolved weak spots.

4. Today's line
   One small daily card asks the learner to read or write exactly one useful G-code line.
   Acceptance: the line is short, track-specific, and recall-focused.

5. Question variety without answer leakage
   Keep mixing multiple choice, fill blank, matching, true/false, select-code, and order-the-block prompts.
   Acceptance: examples help understanding but do not directly reveal the answer before attempt.

---

## P3 — Fluency & Polish

Reliability and mobile usability once P1/P2 are stable.

1. Mobile safe-area handling for bottom nav, lesson footer, and practice cards.
2. Light theme contrast fixes for theory blocks, disabled text, and code panels.
3. Code Bank / Reference collection: learned-code filters, important codes, exact-match search, and lesson link-back.
4. Practice hub polish: daily drill, mistake repair, code bank, mixed review, and clear locked/ready states.
5. Lightweight rewards/ranks: milestone moments that reinforce recall without becoming noisy gamification.
6. Startup/loading screen cleanup: keep the accepted boot-rig style and remove unused legacy loading CSS when safe.