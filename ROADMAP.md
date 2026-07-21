# G-Code Tutorial Roadmap

## Phase 1: Curriculum Reliability

- Keep lessons, quizzes, and review states stable.
- Preserve progress tracking and offline app behavior.
- Maintain build information, version number, and MGP identity.
- Keep CNC and 3D printing tracks clearly separated.

## Phase 2: Lesson Depth

- Expand beginner CNC G-code lessons.
- Add stronger examples and mixed review prompts.
- Improve explanations without turning the app into a generator.

## Phase 3: Multi-Track Learning

- Improve track switching and track-specific progress.
- Expand the 3D printing track where useful.
- Keep cross-track review intentional and clearly labeled.

## Phase 4: Learning Polish

- Improve mobile lesson flow and quiz feedback.
- Add better review pacing and completion states.
- Keep the app lightweight and static-host friendly.

## Phase 5: Reliability and Review Hardening — Complete

- Fixed matching scoring and added keyboard-friendly matching controls.
- Hardened lesson correction, retry, weak-review, mixed-review, and mistake-bank behavior.
- Improved mobile sizing, safe-area handling, accessibility, and offline PWA reliability.
- Added source-backed curriculum and reference validation with controller and firmware scope.

## Phase 6: Retention Polish — Active

Completed retention work:

- Added why-before-how framing across every CNC lesson, with regression coverage.
- Added Code Bank learned filtering, automatic unlocks, persistence, progress counts, and track separation.
- Added mistake-bank lesson link-back and active correction after missed answers.
- Added the track-specific Today’s Line free-recall exercise using only completed, previously taught material.
- Preserved daily practice, weak review, mixed review, matching, offline, and mobile behavior while adding retention features.

Phase 6 guardrails and next direction:

- Keep Today’s Line to one short free-recall prompt with no answer choices or new XP/rank system.
- Keep CNC and 3D printing retention content separated by track and completed-lesson history.
- Continue source-backed curriculum updates in small controller- or firmware-specific batches.
- Add retention polish only when it improves recall without cluttering the Practice hub.

## Planned Learning Architecture Ideas

These ideas belong to the future learning direction for the app. They should guide curriculum and feature planning, but they are not all immediate implementation tasks.

### Conceptual Foundation First

- Teach the why before the how.
- Explain the purpose behind each G-code concept before asking the learner to memorize syntax.
- Avoid cargo-cult learning where users repeat codes without understanding machine intent.

### Visual Logic Decomposition

- Add more visual logic blocks and diagrams for motion, coordinates, offsets, cycles, and cause/effect relationships.
- Use visual structure to help learners understand the algorithm or machine behavior before focusing on formatting details.
- Keep visuals directly tied to lesson objectives.

### Streak-Based Accountability

- Keep streaks as a simple habit and consistency metric.
- Avoid adding extra juvenile reward systems that distract from learning.
- Treat streaks as discipline tracking, not the main educational value.

### Optional Practice Workspace

- Plan a future sandbox or practice workspace where learners can apply concepts in small, safe exercises.
- Keep it educational and simulated only; do not turn the app into machine control or production-ready G-code generation.
- Build this after curriculum reliability, lesson depth, and review behavior are stable.

### Minimal Distraction Principle

- Keep lesson screens focused on the concept, visual, question, and explanation.
- Add polish only when it improves comprehension, retention, or safe practice.
- Avoid mascots, noisy rewards, and decorative UI that does not help the learner understand the material.
