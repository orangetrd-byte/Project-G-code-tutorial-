# Mike's Machinist Roadmap — "From last-choice to 'Yeah, I can make that'"

Personal progression. Not shipped in the app. Built 2026-07-16.
Goal: become the machinist who can pick the right tool/insert, program G-code for
angled cuts, and run a small side income from a home benchtop mill.
Constraint: no capital yet. The benchtop mill is a MILESTONE, not the start.
The app (this repo) earns the cash for the machine OR teaches you in public.

How to use: do phases in order. Each phase = read the linked lesson(s) + hit the
milestone. Milestones are things you can DO, not just read. Tick them off as you go.

------------------------------------------------------------------------------
PHASE 1 — Close the gap you were cut off at (lathe confidence)
------------------------------------------------------------------------------
Why: your training stopped right after the Johnford HT 60CX-2D dual-turret lathe.
That machine is advanced — but the *basics* underneath it are what make you
the go-to guy. Lock those first.

Read:
  - CNC Unit 1 (Foundations): What Is G-Code?, Coordinate System, Program Structure
  - CNC Unit 2 (Motion): G00, G01, G02/G03
  - CNC Unit 3 (Turning Ops): G96/G97, G71, G76
Milestones (prove it):
  [ ] Can explain G00 vs G01 to a coworker without notes
  [ ] Can read a turning program block and name every code in it
  [ ] Can hand-write a simple G01 turning pass (coordinates + feed) on paper
  [ ] Understands what G96 (constant surface speed) protects against on the lathe

------------------------------------------------------------------------------
PHASE 2 — Offsets & setup (the "last choice" fix)
------------------------------------------------------------------------------
Why: setup/offsets are where shops decide who they trust. Own this and you move
up the list.

Read:
  - CNC Unit 4 (Tooling & Offsets): Tool Calls & Offsets, Work Offsets & G54
  - CNC Unit 5 (Measure/Adjust): Measure Compare Adjust, Wear vs Program Edits,
    Single Block & Dry Run
Milestones:
  [ ] Can set G54 work offset from a known part zero, by hand
  [ ] Can use wear offsets to fix a 0.002" oversize without editing the program
  [ ] Can run a new program in Single Block + Dry Run and spot a crash before it happens
  [ ] Can explain to a rookie why Dry Run still moves the machine

------------------------------------------------------------------------------
PHASE 3 — Fixtures & tooling (your stated strength, sharpen it)
------------------------------------------------------------------------------
Why: you can already make fixtures. Make it deliberate — know WHY a fixture works
and which insert to grab. This is the most sellable hands-on skill you have.

Read:
  - CNC Unit 6 (Modal/Safe): Units G20/G21, Feed Modes G98/G99, Modal State Checklist
  - CNC Unit 7 (Coolant/Stops): Coolant, Stops, Operator Control
Do (no machine needed yet — study + sketch):
  [ ] Can sketch a 3-step fixture plan for a simple block (locate, clamp, support)
  [ ] Knows the difference between roughing and finishing inserts (geometry/radius)
  [ ] Can name the insert type for: aluminum finish, steel rough, deep groove
  [ ] Understands feed-per-rev (G99) vs feed-per-min (G98) and when each matters

------------------------------------------------------------------------------
PHASE 4 — Angled cuts & drilling (the "code G-code for angles" goal)
------------------------------------------------------------------------------
Why: this is the literal thing you said you want — program angles, not just straight.

Read:
  - CNC Unit 8 (Subprograms): M98/M99, Repeated Motion
  - CNC Unit 9 (Drilling): G81, G83, R Plane, Return
Study (trig, on paper):
  [ ] Can compute X/Z move for a 30° chamfer from a known start point
  [ ] Understands G01 with both axes moving = an angle (not just G00)
  [ ] Can write a G83 peck drill cycle for a blind hole
  [ ] Knows why G80 cancels a cycle before the next operation

------------------------------------------------------------------------------
PHASE 5 — The home benchtop mill (milestone, not the start)
------------------------------------------------------------------------------
Why: only buy this once the app earns it OR you've banked side cash. Then it becomes
the real side shop.

Pre-req: Phases 1-4 done (knowledge) + some earned cash.
Do:
  [ ] Pick a benchtop mill (research: Tormach 440-class vs import — log pros/cons)
  [ ] Set it up, indicate the vise, prove G54 on the mill
  [ ] First paid part: make a simple fixture or plate for someone (even a friend)
  [ ] List a small service locally (fixtures, simple plates, prototypes)

------------------------------------------------------------------------------
SIDE-INCOME LANES (run alongside any phase)
------------------------------------------------------------------------------
A) App earns: the CNC tutorial app is already public. Options: affiliate links to
   tooling, a "cheat sheet" PDF, or ad-free paid version. This funds Phase 5.
B) Teach in public: post short "what this G-code does" clips. You're a learner,
   not a guru — that's the angle. Other learners trust a peer.
C) Local: once Phase 5 lands, real parts from a home shop.

Next action (today, free): complete Phase 1 milestones using the app. Tick boxes.
