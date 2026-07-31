# Mike's Machinist Roadmap — "From Last Choice to 'Yes, I Can Make That'"

This personal progression plan is not shipped in the app. It was created on 2026-07-16.

Goal: Become a machinist who can select the right tool and insert, program G-code for angled cuts, and earn supplemental income with a home benchtop mill.

Constraint: There is no available capital yet. The benchtop mill is a milestone rather than the starting point. This app can either earn money toward the machine or support public learning.

How to use this roadmap: Complete the phases in order. For each phase, read the linked lessons and complete the milestones. Milestones demonstrate skills rather than reading progress. Mark each milestone as you complete it.

------------------------------------------------------------------------------
PHASE 1 — Close the Training Gap (Lathe Confidence)
------------------------------------------------------------------------------
Why: Your training stopped after your work with the Johnford HT 60CX-2D dual-turret lathe. That machine is advanced, but mastering its underlying fundamentals will help you become a dependable machinist. Strengthen those fundamentals first.

Read:
  - CNC Unit 1 (Foundations): What Is G-Code?, Coordinate System, Program Structure
  - CNC Unit 2 (Motion): G00, G01, G02/G03
  - CNC Unit 3 (Turning Ops): G96/G97, G71, G76
Milestones (prove it):
  [ ] Explain the difference between G00 and G01 to a coworker without notes
  [ ] Read a turning-program block and identify every code in it
  [ ] Handwrite a simple G01 turning pass, including coordinates and feed, on paper
  [ ] Explain why G96 constant surface speed requires careful spindle-speed control on a lathe

------------------------------------------------------------------------------
PHASE 2 — Offsets and Setup (Building Trust)
------------------------------------------------------------------------------
Why: Setup and offset skills help a shop determine which machinists can be trusted with additional responsibility. Practice these skills deliberately.

Read:
  - CNC Unit 4 (Tooling & Offsets): Tool Calls & Offsets, Work Offsets & G54
  - CNC Unit 5 (Measure/Adjust): Measure Compare Adjust, Wear vs Program Edits,
    Single Block & Dry Run
Milestones:
  [ ] Set a G54 work offset manually from a known part zero
  [ ] Use a wear offset to correct a 0.002-inch oversize condition without editing the program
  [ ] Use Single Block and Dry Run to identify a potential collision before running a new program
  [ ] Explain to a beginner why Dry Run can still move the machine

------------------------------------------------------------------------------
PHASE 3 — Fixtures and Tooling (Strengthen an Existing Skill)
------------------------------------------------------------------------------
Why: You can already make fixtures. Strengthen this skill by understanding why each fixture works and how to select an appropriate insert. This is one of your most marketable hands-on skills.

Read:
  - CNC Unit 6 (Modal/Safe): Units G20/G21, Feed Modes G98/G99, Modal State Checklist
  - CNC Unit 7 (Coolant/Stops): Coolant, Stops, Operator Control
Practice without a machine by studying and sketching:
  [ ] Sketch a three-step fixture plan for a simple block: locate, clamp, and support
  [ ] Explain the differences between roughing and finishing inserts, including geometry and nose radius
  [ ] Select an insert type for finishing aluminum, roughing steel, and cutting a deep groove
  [ ] Explain the difference between feed per revolution (G99) and feed per minute (G98) and when each mode matters

------------------------------------------------------------------------------
PHASE 4 — Angled Cuts and Drilling (Programming Angles)
------------------------------------------------------------------------------
Why: This phase addresses your goal of programming angled moves rather than only straight-axis moves.

Read:
  - CNC Unit 8 (Subprograms): M98/M99, Repeated Motion
  - CNC Unit 9 (Drilling): G81, G83, R Plane, Return
Study (trig, on paper):
  [ ] Calculate the X and Z movements for a 30-degree chamfer from a known starting point
  [ ] Explain how a G01 move with both axes changing can create an angled path
  [ ] Write an educational G83 peck-drilling example for a blind hole
  [ ] Explain why G80 cancels a canned cycle before the next operation

------------------------------------------------------------------------------
PHASE 5 — The Home Benchtop Mill (A Milestone, Not the Starting Point)
------------------------------------------------------------------------------
Why: Purchase the mill only after the app earns enough money or you save sufficient supplemental income. The mill can then become the foundation of a small home shop.

Prerequisites: Complete Phases 1–4 and save enough money for the purchase and setup.
Do:
  [ ] Select a benchtop mill after comparing a Tormach 440-class machine with an imported alternative and recording the advantages and disadvantages
  [ ] Set up the mill, indicate the vise, and verify G54
  [ ] Complete a first paid part, such as a simple fixture or plate
  [ ] Advertise a small local service for fixtures, simple plates, or prototypes

------------------------------------------------------------------------------
SUPPLEMENTAL-INCOME PATHS (Use Alongside Any Phase)
------------------------------------------------------------------------------
A) App income: The CNC tutorial app is already public. Possible income sources include tooling affiliate links, a reference-sheet PDF, or an advertisement-free paid version. This income can help fund Phase 5.
B) Public learning: Post short videos that explain what individual G-codes do. Present yourself honestly as a learner sharing progress rather than as an expert.
C) Local work: After completing Phase 5, offer appropriate small-part services from the home shop.

Next action: Complete the Phase 1 milestones with the app and mark each completed item.
