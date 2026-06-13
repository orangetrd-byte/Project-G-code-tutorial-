# G-Code Tutorial Project Architecture

## Project Purpose

G-Code Tutorial is a learning app for CNC G-code and related machine-programming concepts. It is structured like a lightweight lesson, quiz, and progress app rather than a shop-floor production tool.

Core scope:

- lessons
- quizzes
- review prompts
- XP and progress tracking
- beginner-friendly explanations
- CNC G-code learning track
- 3D printing learning track where supported
- offline static PWA behavior

## What Belongs Here

- curriculum content
- lesson sequencing
- quiz logic
- progress and review states
- track separation
- learning feedback
- tutorial examples

## What Does Not Belong Here

- production scheduling
- work orders and travelers
- machinist reference libraries
- touch-off shop guidance
- live machine control
- production-ready G-code generation

Those belong in CNC Cell Planner, CNC Work Helper, Green Hat, or Helper depending on the feature.

## Development Philosophy

Teach clearly first. Every lesson should explain why the concept matters before teaching syntax or procedure. Keep lessons safe, focused, and easy to review before expanding content depth.