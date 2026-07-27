# Project G-Code Proofread Changes

Use this file as the approved wording-change list. Unless a bullet explicitly names another output, apply the lesson-text substitutions to `data/lessons.js`. Do not change lesson IDs, quiz structure, answer values, options, or G-code examples unless a bullet explicitly allows that change. Run `node tests/validate-app.js` after making the edits.

## Document-wide
- Replace visible `## N. uN-lN — Title` headings with `## N. Title` in Markdown output only; do not change lesson `id` or `title` fields in `data/lessons.js`.
- Replace `Answer index:` with `Correct answer:` in the Markdown proofread output only; do not change quiz `answer` fields in `data/lessons.js`.
- Replace `feedrate` with `feed rate` in lesson text, explanations, and visible UI strings in `data/lessons.js`. Do not change property names, identifiers, or other non-visible data.

## Verify Theory Rendering
- Verified: `js/app.js` places `lesson.theory` inside the `theory-body` element, so the HTML is rendered rather than displayed as raw `<p>`, `<ul>`, `<li>`, and `<pre>` tags. No renderer change is required.

## Lesson 1 — What Is G-Code?
- `G-code is instruction text the machine reads.` → `G-code is a set of instructions that the machine reads.`
- `A semicolon depends on the system.` → `The meaning of a semicolon depends on the system.`
- `In many 3D-printer files it starts a comment.` → `In many 3D-printer files, it starts a comment.`
- `In some CNC/program formats it marks the end of a block, like pressing Enter for the next line.` → `In some CNC program formats, it marks the end of a block, like pressing Enter to start the next line.`
- In MCQ: `Which part of this block tells the machine WHERE to move?` → `Which part of this block tells the machine where to move?`
- `A semicolon may start a note/comment in many files, or mark the end of a block on some controls.` → `A semicolon may start a comment in many files or mark the end of a block on some controls.`
- `Always follow the control or post format.` → `Always follow the control or postprocessor format.`

## Lesson 2 — The Coordinate System
- `Coordinates decide where the tool actually goes.` → `Coordinates determine where the tool actually goes.`
- `If X, Z, zero, or diameter mode are misunderstood, even correct-looking code can cut the wrong place.` → `If you misunderstand X, Z, part zero, or diameter mode, even correct-looking code can cut in the wrong place.`
- `Absolute vs. Incremental on the lathe style taught here:` → `Absolute vs. incremental positioning in the lathe style taught here:`
- `Do not assume G90/G91 select positioning mode on a lathe.` → `Do not assume that G90/G91 select positioning mode on a lathe.`
- Replace the question wording: `What is the actual radius of cut?` → `In diameter mode, what radius is represented by X1.500?`
- `Which beginner lathe style is easiest to audit from a known work zero?` → `Which programming style is easiest for a beginner to verify from a known work zero?`

## Lesson 3 — Program Structure
- `CSS on, spindle on CW, feedrate` → `CSS on, spindle forward (M03), feed rate`
- `Clockwise = conventional for most turning ops` → `M03 commands forward spindle rotation in this example; verify the required direction for the tool, spindle, and setup.`
- `Why is a lathe safety block (e.g., G18 G20 G40 G80 G99) placed at the start of a program?` → `Why is a lathe safety block, such as G18 G20 G40 G80 G99, placed at the start of a program?`

## Lesson 4 — G00 — Rapid Positioning
- `Rapid moves are useful because they save time, but dangerous because they leave little time to react.` → `Rapid moves save time, but they leave little time to react.`
- `The reason for G00 is positioning, not cutting.` → `G00 is used to position the tool, not to cut.`
- `Worked example target: X2.500 at example Z0.100` → `Worked example: Move to X2.500 at the example coordinate Z0.100.`

## Lesson 5 — G01 — Linear Feed
- `Understanding why G01 uses feedrate explains when the tool is meant to cut instead of just travel.` → `Understanding how G01 uses feed rate helps you recognize when the tool is meant to cut rather than travel at rapid speed.`
- `G01 is your workhorse — straight-line cutting moves at a controlled feedrate.` → `G01 commands straight-line cutting moves at a controlled feed rate.`
- `IPM (inches per minute) — used in milling, some controls` → `IPM (inches per minute) — common in milling and on some controls`
- `Feedrate is modal — set it once and it carries forward until changed.` → `Feed rate is modal: once set, it remains active until it is changed.`
- `At constant 800 RPM in feed-per-revolution mode` → `At a constant 800 RPM in feed-per-revolution mode`

## Lesson 6 — G02 & G03 — Arc Moves
- `Moves to X1.500 Z-0.500 along a 0.250" radius arc, clockwise.` → `The tool moves to X1.500 Z-0.500 along a clockwise arc with a 0.250" radius.`
- `The R method is simpler for most cases.` → `The R method is simpler in most cases.`
- `CCW = counterclockwise` → `CCW means counterclockwise.`

## Lesson 7 — Spindle Speed: G96 & G97
- `Spindle runs at a fixed 1200 RPM regardless of diameter.` → `The spindle runs at a fixed 1200 RPM regardless of diameter.`
- `Do not choose spindle mode from operation name alone.` → `Do not choose the spindle mode based on the operation name alone.`
- `To clamp the maximum RPM so it doesn't spin dangerously fast at small diameters` → `To clamp the maximum RPM so the spindle does not turn dangerously fast at small diameters`
- `Write the line to run constant surface speed at 350 SFM, spindle CW:` → `Write the line for a constant surface speed of 350 SFM with forward spindle rotation (M03):`

## Lesson 8 — G71 — Rough Turning Cycle
- `to clean up to the final profile.` → `to machine the final profile.`
- `G70 is the finish turning cycle.` → `G70 is the finishing cycle.`
- `It follows the same P-Q profile blocks as the G71 rough, but at finishing feedrate and to the final dimension.` → `It follows the same P-Q profile blocks as G71 but uses the finishing feed rate and cuts to the final dimensions.`
- `U0.020 W0.005 in the G71 second block means:` → `What do U0.020 and W0.005 mean in the second G71 block?`

## Lesson 9 — Tool Calls & Offsets
- `Getting the tool/offset pairing right — and keeping tool number matched to offset number — prevents the control from cutting with the wrong geometry or wear values, which is a fast way to crash a tool or scrap a part.` → `Correctly pairing the tool and offset—and keeping their numbers matched—helps prevent the control from using the wrong geometry or wear values, which could cause a collision or scrap a part.`
- `Keeping tool number = offset number (T0101, T0202...) prevents confusion when troubleshooting offsets.` → `Keeping the tool and offset numbers matched (T0101, T0202, and so on) helps prevent confusion when troubleshooting offsets.`
- `T0304 = Tool station 3, using offset register 4.` → `T0304 selects tool station 3 and offset register 4.`
- `4 digits: tool number then offset number` → `Use four digits: the tool number followed by the offset number.`

## Lesson 10 — Work Offsets & G54
- `Every position in a program is measured from part zero, and the work offset is what tells the control where part zero is.` → `Programmed positions are measured from part zero, and the work offset tells the control where that zero is located.`
- `makes every move land in the wrong place` → `can make every move end at the wrong position`
- `Z-1.000 is 1.000" into the part from that face — 1.000" depth from the finished end.` → `Z-1.000 is 1.000" into the part from the finished face.`

## Lesson 11 — Measure, Compare, Adjust
- `After the first part, the job is not done. You measure the part, compare it to print, then adjust the program or wear offset.` → `After the first part, the job is not done. Measure the part, compare it with the print, and then adjust the program or wear offset as appropriate.`
- `before changing a machine.` → `before changing an offset on the machine.`
- `The measured diameter is larger than target by 0.0020.` → `The measured diameter is 0.0020 larger than the target.`
- `Do not transfer the sign blindly to another tool orientation or control.` → `Do not assume that the same sign applies to another tool orientation or control.`
- `A Z length is 0.010 too long. Which direction is the correction about?` → `A Z dimension is 0.010 too long. Which axis should be corrected?`
- `Move the boring cut farther from spindle centerline` → `Move the boring cut farther from the spindle centerline`

## Lesson 12 — Wear Offsets vs Program Edits
- `Small size errors and wrong geometry need different fixes.` → `Small size errors and incorrect geometry require different fixes.`
- `A wear offset nudges a correct path.` → `A wear offset makes a small adjustment to a correct path.`
- `Knowing which one to use — and that both still change machine motion — stops you from editing the program when an offset would do, or vice versa.` → `Knowing which one to use—and remembering that both change machine motion—helps you avoid editing the program when an offset would be appropriate, or vice versa.`
- `A turned diameter is 0.001 high` → `A turned diameter is 0.001 inch oversized`
- `Best first fix?` → `What is the best first correction?`
- `A groove is programmed at the wrong Z location. Best fix?` → `A groove is programmed at the wrong Z location. What is the best correction?`
- `If the correction is a tiny tool-position change` → `If the correction is a small tool-position change`
- `Program/toolpath edit` → `Program or toolpath edit`
- `OD is 0.0015 big` → `The OD is 0.0015 oversized`

## Lesson 13 — Single Block and Dry Run
- `Single Block and Dry Run let you check one move at a time and at reduced rates, but they still move the machine — so prove-out is a habit of watching and verifying, not a guarantee the path is safe.` → `Single Block lets you inspect one program block at a time, while Dry Run uses selected dry-run motion rates. Both modes still move the machine. Prove-out requires careful observation and verification; it does not guarantee that the path is safe.`
- `Single Block executes one program block per press of Cycle Start.` → `Single Block executes one program block each time the operator presses Cycle Start.`
- `replacing programmed rapid/feed rates` → `replacing programmed rapid and feed rates`
- `What should you watch on first motion?` → `What should you watch during the first move?`
- `Verify the tool moves the expected direction with safe clearance.` → `Verify that the tool moves in the expected direction with safe clearance.`
- `First rapid after tool change` → `The first rapid move after a tool change`
- `Assume nothing, verify each move` → `Assume nothing; verify each move.`

## Lesson 14 — Units: G20 and G21
- `Units decide how every number in the program is read.` → `Units determine how every number in the program is read.`
- `A wrong unit mode turns a safe move into a crash` → `The wrong unit mode can turn a safe move into a crash`
- `wrong units can make moves wildly wrong.` → `the wrong units can produce dangerously incorrect moves.`

## Lesson 15 — Feed Modes: G98 and G99
- `Feed mode decides what the F number actually means.` → `Feed mode determines what the F value means.`
- `Feedrate mode controls what the F value means.` → `Feed rate mode controls what the F value means.`
- `The letters depend on machine type, not brand.` → `The codes depend on the machine type, not the brand.`
- `Per spindle rev on a lathe` → `Per spindle revolution on a lathe`
- `Feed per rev keeps chip load related to spindle speed.` → `Feed per revolution keeps chip load related to spindle speed.`
- `Which line clearly sets lathe feed per rev?` → `Which line clearly sets lathe feed per revolution?`

## Lesson 16 — Modal State Checklist
- `A safe program does not rely on mystery state.` → `A safe program does not rely on an unknown state.`
- `Unknown modal state can make a correct-looking block behave wrong.` → `An unknown modal state can make a correct-looking block behave incorrectly.`
- `Read the active modes before cycle start` → `Read the active modes before starting the cycle`
- `Checking active modes helps catch wrong setup before motion.` → `Checking the active modes helps identify an incorrect setup before motion.`

## Lesson 17 — Coolant, Stops, and Operator Control
- `They do not usually define the toolpath, but they can decide whether the cut is safe, cool, paused, or finished.` → `They do not usually define the toolpath, but they can control coolant, pause the program, or end it.`
- `M08 is commonly coolant on.` → `M08 commonly turns the coolant on.`
- `M09 is commonly coolant off.` → `M09 commonly turns the coolant off.`
- `Which code should be near the end if coolant was used?` → `Which code should appear near the end of a program if coolant was used?`
- `before the program ends or tool parks.` → `before the program ends or the tool is parked.`

## Lesson 18 — M98, M99, and Repeated Motion
- `Local vs external subprograms:` → `Local vs. external subprograms:`
- `On Haas/Fanuc it usually points to another program` → `On many Haas/Fanuc-style controls, it usually points to another program`
- `understands what repeats and why — and remembers that one edit changes every repeat.` → `understands what repeats and why—and remembers that one edit changes every repeat.`
- `Cancels comp` → `Cancels compensation`
- `Sets feed per rev` → `Sets feed per revolution`
- `They can be hard to follow if undocumented` → `They can be hard to follow without clear documentation`

## Lesson 19 — G81, G83, R Plane, and Return
- `The tool feeds down by Q, then retracts fully to the R plane to break and clear the chip, then plunges again — repeating until it reaches Z.` → `In this controller-specific example, the tool feeds down by Q, retracts to the R plane to clear chips, and then plunges again. This sequence repeats until the tool reaches Z.`
- `Use pecking for deeper holes where a single plunge would pack chips or overheat.` → `Use pecking for deeper holes where a single plunge could pack chips or overheat the tool.`
- `Complete peck drilling:` → `Complete the peck-drilling block:`
- `Cancel a drilling cycle:` → `Complete the command that cancels a drilling cycle:`

## Lesson 20 — Feed Hold, Restart, and Alarm Thinking
- `What should be checked before cycle start after an alarm?` → `What should be checked before starting the cycle after an alarm?`
- `Recovery requires checking all state that affects motion.` → `Recovery requires checking every machine state that affects motion.`
- `Known state means modes, offsets, tool, and position are understood.` → `A known state means that the modes, offsets, tool, and position are understood.`

- `Ask or follow shop recovery procedure` → `Ask an experienced person for help or follow the shop recovery procedure`
- `Press cycle start anyway` → `Press Cycle Start anyway`
- `A written procedure or experienced help is safer than guessing.` → `A written procedure or help from an experienced person is safer than guessing.`
- `Recovery thinking should be:` → `A safe approach to recovery should be:`
- `Fast and guessed` → `Fast and based on guesses`
- `Only about XP` → `Focused only on XP`

## Lesson 21 — G76 — Haas Multiple-Pass Threading
- `absolute X location at maximum thread-depth diameter` → `absolute X position at full thread depth`
- `The official example also uses G97 fixed RPM.` → `The official example also uses G97 for fixed RPM.`

- `what lead value follows from F = 1/TPI?` → `what lead value results from F = 1 ÷ TPI?`

## Verification
- Apply a substitution only when its source text has one unambiguous match. Report missing or repeated matches instead of guessing.
- Confirm that lesson IDs, quiz structure, answer values, options, and G-code examples remain unchanged unless a listed substitution explicitly changes visible wording.
- Run `node tests/validate-app.js` and require a passing result.
- Review the final diff and confirm that it contains only the approved wording changes.
