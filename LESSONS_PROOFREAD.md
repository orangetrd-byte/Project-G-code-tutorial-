# Proofread: Project G-Code Lessons

Total lessons: 39

## 1. What Is G-Code?

**Why:** G-code gives the machine clear instructions, one line at a time.


**Theory:**

G-code is a set of instructions that the machine reads. One block can combine compatible motion, coordinates, feed, speed, and auxiliary words; the control determines their execution order.

G00 X2.000 Z0.100 ; example position — clearance is setup-specific

The meaning of a semicolon depends on the system. In many 3D-printer files, it starts a comment. In some CNC program formats, it marks the end of a block, like pressing Enter to start the next line.

G00 X30.500 Z1.0;
X30.478 Z0;
G01 X-3.00;
G0 X3.0;
M0;


**Quiz:**

- Q1 [multiple-choice]: What is G-code?
  - Instructions the machine reads
  - A machine drawing
  - A measurement tool
  - A type of cutting insert
  - Correct answer: 0
  - Explanation: G-code is the set of instructions a CNC machine reads to move, stop, or change a mode.
- Q2 [multiple-choice]: Which part of this block tells the machine where to move?
N020 G00 X2.000 Z0.100 S800 M03
  - N020
  - G00
  - X2.000 Z0.100
  - S800 M03
  - Correct answer: 2
  - Explanation: X and Z are coordinate words. They define the destination position for the move.
- Q3 [fill-blank]: Model rapid move:
G00 X2.000 Z0.100

Your turn: complete the rapid block:
N010 ___ X0 Z0.1
  - Correct answer: G00
  - Hint: G00 = rapid positioning
  - Explanation: G00 is the rapid traverse code. G0 is also accepted on many systems; both mean rapid positioning, but G00 is easier for beginners to scan.
- Q4 [matching]: Match each G-code part to what it means in this beginner block.
  - Explanation: G00 commands a rapid positioning move, and X/Z tell it where to go. A semicolon may start a comment in many files or mark the end of a block on some controls.
  - Pairs: G00→Rapid positioning, X / Z→Position coordinates, ;→Comment or block end
- Q5 [true-false]: A semicolon can mean different things depending on the control or file type.
  - Correct answer: true
  - Explanation: True. In many printer files it starts a comment; in some CNC/program formats it marks the end of a block. Always follow the control or postprocessor format.
- Q6 [multiple-choice]: What is missing from this rapid move?
___ X2.000 Z0.100
  - G00
  - M30
  - S800
  - T0101
  - Correct answer: 0
  - Explanation: G00 is the rapid positioning command. X and Z give the destination.
- Q7 [multiple-choice]: Which block is a complete rapid positioning move?
  - X2.000 Z0.100
  - G00 X2.000 Z0.100
  - M03 S800
  - N010
  - Correct answer: 1
  - Explanation: G00 sets the motion type, and X/Z give the destination position.

---

## 2. The Coordinate System

**Why:** Coordinates determine where the tool actually goes. If you misunderstand X, Z, part zero, or diameter mode, even correct-looking code can cut in the wrong place.


**Theory:**

On a CNC lathe, position is described with two axes:

**Z-axis** — runs along the spindle centerline. 
 In the conventional front-working setup illustrated here, negative Z moves toward the chuck and positive Z moves away. Verify the actual machine orientation.

**X-axis** — controls radial position. Many production lathes program X in diameter units, but diameter/radius behavior is controller- and setting-specific.

A common turning convention sets X0 at the spindle centerline and Z0 at the finished face, but Z0 may use another documented datum.

**Absolute vs. incremental positioning in the lathe style taught here:**

`X` and `Z` command absolute positions from the active work zero.

`U` and `W` command incremental X and Z distances from the current position.

Do not assume that G90/G91 select positioning mode on a lathe. On Haas lathes, G90 is an OD/ID turning cycle. Verify the exact controller dialect before running code.


**Quiz:**

- Q1 [multiple-choice]: On a CNC lathe, what does moving Z in the negative direction mean?
  - Increasing the cut diameter
  - Moving the tool away from the chuck
  - Moving the tool toward the chuck
  - Lowering the tool height
  - Correct answer: 2
  - Explanation: In the conventional setup illustrated here, negative Z moves toward the chuck. Confirm the actual machine coordinate direction before motion.
- Q2 [multiple-choice]: You program X1.500 on a lathe in diameter mode. In diameter mode, what radius is represented by X1.500?
  - 1.500"
  - 3.000"
  - 0.750"
  - 0.375"
  - Correct answer: 2
  - Explanation: X values in diameter mode represent the full diameter. X1.500 = 1.500" diameter = 0.750" radius.
- Q3 [multiple-choice]: On the Haas/Fanuc-style lathe convention taught here, which word commands an incremental Z move?
  - Z
  - W
  - G90
  - G91
  - Correct answer: 1
  - Explanation: W commands an incremental Z distance on this lathe convention. Z commands an absolute position from the active work zero.
- Q4 [matching]: Match each lathe coordinate word to its meaning.
  - Explanation: On common Haas/Fanuc-style lathes, X/Z are absolute coordinates and U/W are incremental distances. Verify the machine manual.
  - Pairs: X→Absolute X position, Z→Absolute Z position, U→Incremental X distance, W→Incremental Z distance
- Q5 [true-false]: In the conventional front-working lathe setup illustrated below, negative Z moves toward the chuck.
  - Correct answer: true
  - Explanation: True for the illustrated setup. Confirm axis direction on the actual machine coordinate display and manual.
- Q6 [multiple-choice]: Which word commands an absolute Z position from the active work zero on the lathe convention taught here?
  - Z
  - W
  - G90
  - G91
  - Correct answer: 0
  - Explanation: Z is the absolute axial coordinate. W is an incremental Z distance; G90 may be a turning cycle on a lathe.
- Q7 [multiple-choice]: Which programming style is easiest for a beginner to verify from a known work zero?
  - Use X/Z absolute positions and reserve U/W for intentional incrementals
  - Use U/W for every destination
  - Issue G90 without checking the control
  - Switch conventions every block
  - Correct answer: 0
  - Explanation: X/Z positions point back to the active work zero on this convention. U/W should be used only when an incremental move is intentional.

---

## 3. Program Structure

**Why:** Program structure makes code predictable. Knowing the setup, safety, cutting, and ending sections helps you find problems before the machine runs.


**Theory:**

Many part programs use a recognizable preparation, cutting, and completion structure. The exact blocks and codes depend on the controller, machine options, and approved postprocessor.

% ; Tape start / rewind stop
O1001 ; Program number
(PART: SHAFT 001) ; Comment / description
(TOOL: T0101 - OD ROUGH) ; Tool description comment

N10 G18 G20 G40 G80 G99 ; Haas-style example: verify every mode on your control
N20 G28 U0. W0. ; Machine home
N30 T0101 ; Tool call + offset call
N40 G96 S400 M03 F0.012 ; CSS on, spindle forward (M03), feed rate
N50 G00 X2.200 Z0.100 ; Rapid to start position

( --- CUT --- )
N60 G01 Z-1.500 ; Feed move
N70 X2.400 ; Pull off diameter
N80 G00 Z0.100 ; Rapid back

N90 M05 ; Spindle off
N100 G28 U0. W0. ; Home
N110 M30 ; End program, rewind
%

A setup block makes required modal state explicit before motion. Use the exact block approved for the named machine and controller; no single “safety block” is universal.

`G28 U0. W0.` is controller-specific and performs a reference return. Confirm the intermediate-path behavior and clear the full route before use.

**M-codes** are machine functions: M03 = spindle CW, M05 = spindle off, 
 M30 = end program.


**Quiz:**

- Q1 [multiple-choice]: What is the purpose of M30?
  - Turn the spindle on
  - Call a subroutine
  - End the program and rewind to the start
  - Set the feed rate
  - Correct answer: 2
  - Explanation: M30 commonly ends and resets a Haas/Fanuc-style part program. Other controls and workflows may use different end behavior, so verify the machine manual.
- Q2 [multiple-choice]: Why is a lathe safety block, such as G18 G20 G40 G80 G99, placed at the start of a program?
  - It sets the spindle speed
  - It cancels leftover modal codes from a previous program
  - It homes the machine
  - It defines the work offset
  - Correct answer: 1
  - Explanation: Modal codes persist between programs on many controls. A lathe safety block makes the plane, units, feed mode, canned-cycle state, and compensation state explicit before motion starts.
- Q3 [fill-blank]: Write the M-code that turns the spindle ON clockwise:
  - Correct answer: M03
  - Hint: M03 commands forward spindle rotation in this example; verify the required direction for the tool, spindle, and setup.
  - Explanation: M03 = spindle on clockwise. M04 = counterclockwise. M05 = spindle off.

---

## 4. G00 — Rapid Positioning

**Why:** Use G00 to position the tool fast. To avoid crashes, rapid only where you've verified a safe clearance.


**Theory:**

`G00` commands rapid positioning. The actual rate is limited by the machine and may be reduced with a dedicated rapid override; the programmed `F` word does not set G00 speed.

G00 X2.200 Z0.100

**Rules of G00:**

Do not rapid into stock, workholding, tooling, or an unverified clearance envelope.

Feed override and rapid override are different controls; verify the machine behavior.

A multi-axis rapid may follow a dogleg or another controller-defined path, not a straight diagonal.

G00 is modal until another motion code replaces it.

**Typical uses:** approaching the part, pulling clear after a cut, and moving between features.

No fixed clearance is universally safe. Establish clearance from the actual stock, jaws, tool geometry, offsets, and full rapid path; then prove it with the approved simulation and machine procedure.


**Quiz:**

- Q1 [multiple-choice]: Which clearance is safe before a G00 approach?
  - A fixed 0.001 inch
  - Any positive Z value
  - The setup-approved clearance verified for the full path
  - A fixed 0.100 inch
  - Correct answer: 2
  - Explanation: No fixed number is universally safe. Clearance must account for stock, jaws, tool geometry, offsets, and the controller's complete rapid path.
- Q2 [multiple-choice]: What can reduce G00 speed on a control that provides it?
  - The programmed F word
  - A dedicated rapid override
  - A spindle override
  - A feed override
  - Correct answer: 1
  - Explanation: The F word does not set G00 speed. Many controls provide a separate rapid override, but its behavior must be verified in the machine manual.
- Q3 [fill-blank]: Worked example: Move to X2.500 at the example coordinate Z0.100. (not a universal safe position). Complete the block:
G00 X___ Z0.100
  - Correct answer: 2.500
  - Hint: Example diameter value = 2.500
  - Explanation: X2.500 completes the example. Z0.100 is only an example coordinate; the actual setup must establish and prove a safe clearance.

---

## 5. G01 — Linear Feed

**Why:** Feed moves are controlled cutting moves. Understanding how G01 uses feed rate helps you recognize when the tool is meant to cut rather than travel at rapid speed.


**Theory:**

`G01` commands straight-line cutting moves at a controlled feed rate.

G01 X1.500 Z-1.000 F0.010

The `F` word sets the feed rate:

**IPR** (inches per revolution) — common for turning. Example values are not cutting recommendations;
 use tooling-manufacturer data and the approved process for the actual feed.

**IPM** (inches per minute) — commonly used in milling

G01 can move in X only, Z only, or both simultaneously (taper cuts).

; Facing cut (X only)
G01 X-0.062 F0.008

; Turning cut (Z only) 
G01 Z-2.000 F0.012

; Taper (both axes at once)
G01 X1.750 Z-1.500 F0.010

Feed rate is modal: once set, it remains active until it is changed.


**Quiz:**

- Q1 [multiple-choice]: For this diameter-mode, front-working example that intentionally passes center, which facing block uses controlled feed?
  - G00 X-0.100 F0.010
  - G01 X-0.062 F0.008
  - G01 Z0.100 F0.008
  - G00 Z-0.100
  - Correct answer: 1
  - Explanation: Under the stated example assumptions, G01 feeds across center. The required endpoint and sign depend on tool orientation, diameter/radius convention, and the verified setup.
- Q2 [multiple-choice]: At a constant 800 RPM in feed-per-revolution mode, what actual feed rate does F0.012 produce?
  - 0.012 IPM
  - 9.6 IPM
  - 12 IPM
  - 800 IPM
  - Correct answer: 1
  - Explanation: At constant 800 RPM, IPM = IPR × RPM: 0.012 × 800 = 9.6 inches per minute. Under CSS, RPM and instantaneous IPM can change with diameter.
- Q3 [fill-blank]: Write a turning cut to Z-2.250 at F0.010:
G01 Z___ F0.010
  - Correct answer: -2.250
  - Hint: In the illustrated conventional setup, negative Z is toward the chuck
  - Explanation: Z-2.250 means 2.250" from part zero toward the chuck. The negative sign is required.

---

## 6. G02 & G03 — Arc Moves

**Why:** Arc direction changes the actual toolpath. Understanding the shape first makes the code letters easier to remember and easier to troubleshoot.


**Theory:**

Arcs are programmed with G02 (clockwise) and G03 (counterclockwise).

There are two ways to define an arc:

Method 1: Radius (R)

G02 X1.500 Z-0.500 R0.250 F0.008

The tool moves to X1.500 Z-0.500 along a clockwise arc with a 0.250" radius.

Method 2: Center Offsets (I and K)

G02 X1.500 Z-0.500 I0.0 K-0.250 F0.008

`I` = X-direction center offset under the selected controller's lathe convention

`K` = Z-direction center offset under the selected controller's lathe convention

The R method is simpler in most cases. Use I/K when you need a full circle 
 or when R gives an ambiguous result (two possible arcs).

G02/G03 specify direction in the active plane and documented viewing convention. Concave versus convex depends on the contour, quadrant, and tool side—not the G-code number alone.


**Quiz:**

- Q1 [multiple-choice]: Which code cuts a clockwise arc?
  - G01
  - G02
  - G03
  - G04
  - Correct answer: 1
  - Explanation: G02 is clockwise and G03 is counterclockwise when viewed using the active plane's documented convention. Confirm G18 and the controller view before judging a lathe arc.
- Q2 [multiple-choice]: You want a 0.125" radius corner blend. Which R value do you use?
  - R0.250
  - R0.125
  - R0.0625
  - R1.000
  - Correct answer: 1
  - Explanation: R specifies the actual radius of the arc. For a 0.125" radius blend, R0.125 is correct.
- Q3 [fill-blank]: Complete the CCW arc to X2.000 Z-0.500 with R0.250:
G___ X2.000 Z-0.500 R0.250 F0.008
  - Correct answer: G03
  - Hint: CCW means counterclockwise.
  - Explanation: G03 is counterclockwise arc motion. G02 would be clockwise.

---

## 7. Spindle Speed: G96 & G97

**Why:** The same cutting speed can require very different RPM at large and small diameters. Choosing the right spindle mode—and a verified RPM limit—helps protect the tool, workholding, and finish.


**Theory:**

The lathe spindle can be controlled in two ways:

G96 — Constant Surface Speed (CSS)

G96 S400 M03

The control automatically adjusts RPM so the cutting speed stays at 400 SFM 
 regardless of diameter. As the tool moves to a smaller diameter, RPM increases.

CSS is often useful when cutting diameter changes, but the choice must follow tooling data, workholding limits, machine capability, and the approved process.

On the Haas/Fanuc-style lathe dialect used in this example, set a maximum RPM clamp with `G50 S____`. G50 has different meanings on other controls:

G50 S3000 ; Clamp max at 3000 RPM
G96 S400 M03 ; CSS at 400 SFM

G97 — Constant RPM

G97 S1200 M03

The spindle runs at a fixed 1200 RPM regardless of diameter.

Constant RPM is commonly used where the controller or process requires stable spindle speed, including many threading procedures. Do not choose the spindle mode based on the operation name alone.


**Quiz:**

- Q1 [multiple-choice]: On this Haas/Fanuc-style lathe example, why is G50 S3000 paired with G96?
  - To set a minimum spindle speed
  - To clamp the maximum RPM so the spindle does not turn dangerously fast at small diameters
  - To switch to metric mode
  - To cancel CSS mode
  - Correct answer: 1
  - Explanation: As diameter decreases, G96 increases RPM to maintain surface speed. Without a G50 clamp, RPM can reach unsafe levels near the centerline.
- Q2 [multiple-choice]: For the threading procedure taught in this controller-specific example, which spindle mode should you use?
  - G96 (CSS)
  - G97 (Constant RPM)
  - Correct answer: 1
  - Explanation: This procedure uses G97 constant RPM for stable, synchronized threading. Follow the exact controller and tooling procedure rather than assuming spindle mode is portable.
- Q3 [fill-blank]: Write the line for a constant surface speed of 350 SFM with clockwise spindle rotation:
G96 S___ M03
  - Correct answer: 350
  - Hint: S value = surface feet per minute in G96 mode
  - Explanation: In G96 mode, the S word is surface feet per minute (or m/min in metric). S350 = 350 SFM.

---

## 8. G71 — Rough Turning Cycle

**Why:** A long profile may need many roughing passes. A roughing cycle can repeat a verified profile consistently while leaving controlled stock for the finishing pass.


**Theory:**

This lesson shows a **Fanuc-style two-block G71 example**. G71 formats, allowances, retracts, and profile restrictions vary by controller; verify the exact manual revision before use.

G71 U0.100 R0.050
G71 P100 Q200 U0.020 W0.005 F0.015

**First line — depth and retract:**

`U0.100` — depth of cut per pass, measured on the radius in this example

`R0.050` — retract amount between passes

**Second line — profile and stock:**

`P100` — block number where profile starts

`Q200` — block number where profile ends

`U0.020` — finish stock to leave on the diameter (0.020" total)

`W0.005` — finish stock to leave on the face (Z direction)

`F0.015` — roughing feed rate

After G71, run a `G70 P100 Q200` finish pass with your finishing feed rate 
 to machine the final profile.


**Quiz:**

- Q1 [multiple-choice]: In G71 U0.100 R0.050, what does U0.100 specify?
  - The finish stock on the diameter
  - The depth of cut per roughing pass
  - The retract distance
  - The feed rate
  - Correct answer: 1
  - Explanation: In the first G71 block, U = depth of cut per pass (on the radius). A larger U means fewer, heavier passes.
- Q2 [multiple-choice]: What code runs the finishing pass after a G71 rough cycle?
  - G72
  - G70
  - G73
  - G76
  - Correct answer: 1
  - Explanation: G70 is the finishing cycle. It follows the same P–Q profile blocks as G71 but uses the finishing feed rate and cuts to the final dimensions.
- Q3 [multiple-choice]: What do U0.020 and W0.005 mean in the second G71 block?
  - Feed at 0.020 IPR with 0.005" retract
  - Leave 0.020" stock on diameter, 0.005" on face
  - Take 0.020" depth, retract 0.005"
  - Rough at 0.020", finish at 0.005"
  - Correct answer: 1
  - Explanation: In the second G71 block, U = finish allowance on the diameter (X direction), W = finish allowance on the face (Z direction). These are left for the G70 finish pass.

---

## 9. Tool Calls & Offsets

**Why:** The T-word links a physical tool to its measured geometry. Correctly pairing the tool and offset—and keeping their numbers matched—helps prevent the control from using the wrong geometry or wear values, which could cause a collision or scrap a part.


**Theory:**

This lesson uses a common Haas/Fanuc-style four-digit T-word convention:

T0101 ; Tool 1, Offset 1
T0202 ; Tool 2, Offset 2
T0100 ; Cancel offset (tool 1, no offset)

In this convention, the T-word is `T` + two-digit tool number + two-digit offset number. Other machines format tool and offset calls differently.

On the referenced Haas lathe, tool geometry and tool wear are separate fields with different jobs:

**X/Z geometry** stores the measured distance from machine zero to the tool tip.

**Radius geometry and tip direction** support tool-nose compensation.

**X/Z and radius wear** are intended for minute adjustments as the tool wears.

On many Fanuc-style lathes, the `T0101` call itself indexes the turret.
 `M06` is common on mills, but is not the normal beginner pattern for this lathe track.

💡 Keeping the tool and offset numbers matched (T0101, T0202, and so on) helps prevent confusion when troubleshooting offsets.


**Quiz:**

- Q1 [multiple-choice]: In the four-digit T-word convention taught here, what does T0304 mean?
  - Tool 3, Offset 4
  - Tool 4, Offset 3
  - Tool 03, no offset
  - Tool 34, Offset 0
  - Correct answer: 0
  - Explanation: T-word format: T + 2-digit tool number + 2-digit offset number. T0304 selects tool station 3 and offset register 4.
- Q2 [multiple-choice]: How do you cancel the active tool offset without changing tools?
  - T0000
  - T0100 in this controller-specific example
  - G49
  - M06
  - Correct answer: 1
  - Explanation: In this example convention, offset 00 cancels the active offset while retaining the tool selection. Verify tool-call and cancellation behavior on the actual control.
- Q3 [fill-blank]: Write the T-word for Tool 2 using Offset 2:
T____
  - Correct answer: 0202
  - Hint: Use four digits: the tool number followed by the offset number.
  - Explanation: In this four-digit example, T0202 selects tool station 2 with offset register 2. Matching tool and offset numbers is a shop convention, not a universal requirement.

---

## 10. Work Offsets & G54

**Why:** Programmed positions are measured from part zero, and the work offset tells the control where that zero is located. Selecting the wrong offset—or trusting one that was never verified—can make every move end at the wrong position, so the offset must be chosen and proven before any motion that relies on it.


**Theory:**

Work offsets define a program's part-zero reference relative to machine coordinates. This Haas lathe example uses G54 through G59 work-offset selections.

G54 ; Select work offset 1 in this Haas example
G55 ; Work offset 2
G56 ; Work offset 3

On a common two-axis lathe setup, part Z0 is often established at the faced end of the part. The exact X/Z values and setup method depend on the machine, tooling, probe options, and shop procedure.

**Conceptual verification workflow:**

Select the intended work-offset register.

Establish part zero with the controller-approved manual or probing method.

Verify the stored axis values and active offset independently.

Prove the resulting coordinates using the machine's approved setup process.

Make the required work-coordinate selection explicit before motion that depends on it. Power-up and retained modal behavior are controller-specific.


**Quiz:**

- Q1 [multiple-choice]: If you set Z0 at the finished face of the part, what does a cut to Z-1.000 mean?
  - 1.000" above the face
  - 1.000" into the part from the face
  - 1.000" from machine home
  - 1.000" from the chuck face
  - Correct answer: 1
  - Explanation: Z-1.000 is 1.000" into the part from the finished face.
- Q2 [multiple-choice]: Which code selects the first work-offset register in this Haas lathe example?
  - G52
  - G53
  - G54
  - G92
  - Correct answer: 2
  - Explanation: G54 selects the first work-offset register in this Haas example. Other controls and approved programs may use a different work-coordinate strategy.

---

## 11. Measure, Compare, Adjust

**Why:** A first part is only correct after measurement. Compare the measured size to the print. Then correct with the wear offset, not the program, if the path is already correct. Confirm the sign and field first.


**Theory:**

After the first part, the job is not done. Measure the part, compare it with the print, and then adjust the program or wear offset as appropriate.

Target OD: 1.0000
Measured OD: 1.0020
Correction: remove 0.0020 from diameter

In the Haas/Fanuc coordinate example used here, X wear is entered as a diameter change. For conventional O.D. turning in that documented setup, a -0.0020 X wear entry moves the cut toward a diameter that is 0.0020 smaller. Confirm the active tool, offset field, sign, orientation, and control behavior before changing an offset on the machine.

Make one small correction, rerun, and measure again.


**Quiz:**

- Q1 [multiple-choice]: The target OD is 1.0000, and the measured OD is 1.0020. How does the measured OD compare with the target?
  - 0.0020 oversized
  - 0.0020 undersized
  - Perfect size
  - Missing Z offset
  - Correct answer: 0
  - Explanation: The measured diameter is 0.0020 larger than the target.
- Q2 [multiple-choice]: In this documented Haas/Fanuc O.D.-turning example, an OD is 0.0020 too large. After verifying the active offset and sign convention, which X wear entry targets a diameter 0.0020 smaller?
  - X +0.0020
  - X -0.0020
  - Z -0.0020
  - F +0.0020
  - Correct answer: 1
  - Explanation: For this stated Haas/Fanuc setup, negative X wear moves the cut toward a smaller O.D. Do not assume that the same sign applies to another tool orientation or control.
- Q3 [fill-blank]: Measured OD is 2.0050, target is 2.0000. How far oversized is it?
___
  - Correct answer: 0.0050
  - Hint: Measured minus target
  - Explanation: 2.0050 - 2.0000 = 0.0050 oversized.
- Q4 [multiple-choice]: Which offset is normally used for small size corrections after touch-off?
  - Wear offset
  - Program number
  - Spindle override
  - Coolant switch
  - Correct answer: 0
  - Explanation: Wear offsets are meant for small tool-position corrections.
- Q5 [multiple-choice]: Why should you make one correction at a time?
  - It helps identify which correction changed the result
  - It resets wear offsets after each block
  - It allows M03 to run only once
  - It prevents G54 from being used
  - Correct answer: 0
  - Explanation: One change at a time makes troubleshooting clear.
- Q6 [fill-blank]: Type the common offset type used for small corrections:
____ offset
  - Correct answer: wear
  - Hint: Small adjustment page
  - Explanation: Wear offsets are commonly used for small corrections after measuring parts.
- Q7 [multiple-choice]: A Z dimension is 0.010 too long. Which axis should be corrected?
  - Z position
  - Spindle RPM
  - Program number
  - Coolant
  - Correct answer: 0
  - Explanation: Length errors are corrected in the Z direction or Z wear offset.
- Q8 [multiple-choice]: What is the safest habit before changing offsets?
  - Confirm the measured error and sign
  - Guess and rerun
  - Change every tool
  - Skip inspection
  - Correct answer: 0
  - Explanation: Wrong-sign and wrong-offset entries are serious risks. Confirm the measurement, tool, field, sign convention, and intended result first.
- Q9 [multiple-choice]: In a verified conventional boring setup, what geometric change makes a small bore larger?
  - Move the boring cut farther from the spindle centerline
  - Lower spindle speed only
  - Cancel M30
  - Change the program number
  - Correct answer: 0
  - Explanation: A larger bore requires the cutting edge to machine farther from the spindle centerline. The commanded sign depends on the tool orientation and control.
- Q10 [multiple-choice]: What should you do after making a wear offset change?
  - Measure the next part
  - Delete the program
  - Change every offset
  - Ignore the print
  - Correct answer: 0
  - Explanation: Always verify the correction by cutting and measuring again.

---

## 12. Wear Offsets vs Program Edits

**Why:** Small size errors and incorrect geometry require different fixes. A wear offset makes a small adjustment to a correct path; a program edit changes the path itself. Knowing which one to use—and remembering that both change machine motion—helps you avoid editing the program when an offset would be appropriate, or vice versa.


**Theory:**

When the approved process uses wear offsets, they are intended for minute tool-position corrections. Change the program when the commanded geometry or sequence itself is wrong.

Wear offset: part is 0.0015 oversize
Program edit: groove is in the wrong Z location

A wear entry leaves the saved program geometry unchanged but affects subsequent motion for the active offset. A saved program edit changes the commanded path for future runs. Both require authorization, documentation, and verification.


**Quiz:**

- Q1 [multiple-choice]: A turned diameter is 0.001 inch oversized, the toolpath is verified, and the approved process permits a minute offset correction. What is the best first correction?
  - Wear offset
  - Rewrite the whole program
  - Change M30
  - Delete G54
  - Correct answer: 0
  - Explanation: Under the stated conditions, the wear field is intended for a minute tool-position correction.
- Q2 [multiple-choice]: A groove is programmed at the wrong Z location. What is the best correction?
  - Program edit
  - Spindle override
  - Coolant off
  - Tool wear offset only
  - Correct answer: 0
  - Explanation: If the geometry or path is wrong, edit the program.
- Q3 [fill-blank]: If the correction is a small tool-position change, use a ____ offset.
  - Correct answer: wear
  - Hint: Small correction offset
  - Explanation: Wear offsets are used for small tool-position corrections.
- Q4 [multiple-choice]: Which type of change affects every future run of the saved program?
  - Program edit
  - Temporary single-block mode
  - Measuring the part
  - Changing rapid override
  - Correct answer: 0
  - Explanation: A saved program edit changes future runs.
- Q5 [multiple-choice]: A chamfer is missing entirely. What kind of fix is needed?
  - Program or toolpath edit
  - An X wear adjustment
  - A spindle-override change
  - A coolant-state change
  - Correct answer: 0
  - Explanation: Missing geometry requires a toolpath or program edit.
- Q6 [multiple-choice]: Which offset-editing habit makes troubleshooting harder?
  - Changing offsets without recording the reason
  - Measuring after a correction
  - Making one change at a time
  - Checking the tool number
  - Correct answer: 0
  - Explanation: Unrecorded changes make troubleshooting hard.
- Q7 [fill-blank]: Program edits change the tool ____.
  - Correct answer: path
  - Hint: Where the tool moves
  - Explanation: Program edits change the path the tool follows.
- Q8 [multiple-choice]: Before editing a proven program, what should you confirm?
  - The measured problem is real
  - The active tool number only
  - The program number only
  - The previous part count only
  - Correct answer: 0
  - Explanation: Confirm the issue before changing a program that may already be correct.
- Q9 [multiple-choice]: Which correction is most likely an offset change?
  - The OD is 0.0015 oversized
  - Tool is cutting wrong feature
  - Program ends too early
  - Wrong tool called
  - Correct answer: 0
  - Explanation: A small size error on a correct path is typically a wear correction.
- Q10 [multiple-choice]: Why can an approved wear-offset change be useful for a small size correction?
  - It preserves the saved program geometry while applying a documented offset adjustment
  - It erases the program
  - It disables G00
  - It sets metric mode
  - Correct answer: 0
  - Explanation: A wear entry can correct a minute tool-position error without rewriting the saved path, but it still changes machine motion and must be verified.

---

## 13. Single Block and Dry Run

**Why:** A new or edited program is unproven until you watch it run. Single Block lets you inspect one program block at a time, while Dry Run uses selected dry-run motion rates. Both modes still move the machine. Prove-out requires careful observation and verification; it does not guarantee that the path is safe.


**Theory:**

Before trusting a new or edited program, prove it with the exact machine's approved process. On the referenced Haas control, Single Block executes one program block each time the operator presses Cycle Start. Dry Run still moves the machine and can execute programmed tool changes, while replacing programmed rapid and feed rates with selected dry-run rates.

Single Block ON
Feed Hold ready
Rapid override reduced

These controls can support prove-out, but they do not make a path safe. Graphics or simulation may avoid axis motion, though not every function or motion is necessarily modeled. Follow the machine and shop procedure.


**Quiz:**

- Q1 [multiple-choice]: What does single block do?
  - Runs one block at a time
  - Changes the feed mode
  - Turns coolant on
  - Changes G54
  - Correct answer: 0
  - Explanation: Single block pauses after each block so you can verify the next move.
- Q2 [multiple-choice]: Why should you reduce rapid override during prove-out?
  - To give time to react
  - To improve surface finish
  - To change units
  - To end the program
  - Correct answer: 0
  - Explanation: Reduced rapid speed gives the operator more time to stop a bad move.
- Q3 [multiple-choice]: On the referenced Haas control, what does Feed Hold do during a run?
  - Stops axis motion while the spindle can continue turning
  - Turns off all stored offsets
  - Rewinds the program
  - Changes the active units
  - Correct answer: 0
  - Explanation: Haas documents Feed Hold as stopping axis motion while the spindle continues to turn. It is not the same as an emergency stop or a complete energy-isolation procedure.
- Q4 [fill-blank]: Running one block at a time is called ____ block.
  - Correct answer: single
  - Hint: One at a time
  - Explanation: Single block mode runs one program block at a time.
- Q5 [multiple-choice]: When should you be most cautious?
  - After a program edit
  - After reviewing an unchanged comment
  - After recording offsets without changing them
  - After completing a routine inspection
  - Correct answer: 0
  - Explanation: Edited lines need careful prove-out.
- Q6 [multiple-choice]: Which two conditions should you monitor during the first move?
  - Clearance and direction
  - Final surface finish
  - Program-end position
  - Part-count display
  - Correct answer: 0
  - Explanation: Verify that the tool moves in the expected direction with safe clearance.
- Q7 [multiple-choice]: What does Dry Run do on the referenced Haas control?
  - Moves the machine using selected dry-run rates to help check a program
  - Measures final part size
  - Replaces all offsets
  - Guarantees that every move is safe
  - Correct answer: 0
  - Explanation: Dry Run changes how rapid and feed motion rates are executed, but it still moves axes and may perform tool changes. It is a check mode, not a guarantee of safety.
- Q8 [fill-blank]: Type the control mode: ____ Block ON
  - Correct answer: Single
  - Hint: Runs one line at a time
  - Explanation: Single Block ON is used for careful prove-out.
- Q9 [multiple-choice]: Which move deserves extra attention?
  - The first rapid move after a tool change
  - A repeated feed move already proven
  - A program-end block
  - A non-executable comment
  - Correct answer: 0
  - Explanation: After a tool change, the active tool, offset, orientation, and full clearance path must all be verified before rapid motion.
- Q10 [multiple-choice]: What is a safe prove-out mindset?
  - Assume nothing; verify each move
  - Assume the program is always safe
  - Ignore offsets
  - Run at 100% rapid immediately
  - Correct answer: 0
  - Explanation: Good operators verify before trusting the program.

---

## 14. Units: G20 and G21

**Why:** Units determine how every number in the program is read. The wrong unit mode can turn a safe move into a crash, so setting it explicitly is a basic safety habit.


**Theory:**

On Haas and Fanuc controls, `G20` selects inch units and `G21` selects metric units. Unit mode changes how the control reads coordinates and feed values.

G20 ; inch mode
G00 X2.000 Z0.100

G21 ; metric mode
G00 X50.8 Z2.5

A program should clearly set units near the top. Never assume the control is already in the right mode.


**Quiz:**

- Q1 [multiple-choice]: What does G20 select?
  - Inch units
  - Metric units
  - Rapid motion
  - Spindle stop
  - Correct answer: 0
  - Explanation: G20 puts the control in inch mode.
- Q2 [multiple-choice]: What does G21 select?
  - Metric units
  - Inch units
  - Tool offset
  - Program end
  - Correct answer: 0
  - Explanation: G21 puts the control in metric mode.
- Q3 [multiple-choice]: Why should a program set G20 or G21 near the beginning?
  - To ensure that every number is read in the intended units
  - To turn coolant on
  - To home the machine
  - To select a tool
  - Correct answer: 0
  - Explanation: Unit mode affects coordinate and feed values, so it must be known before motion.
- Q4 [fill-blank]: Complete inch mode:
___ ; inch units
  - Correct answer: G20
  - Hint: Inch unit code
  - Explanation: G20 selects inch units.
- Q5 [fill-blank]: Complete metric mode:
___ ; metric units
  - Correct answer: G21
  - Hint: Metric unit code
  - Explanation: G21 selects metric units.
- Q6 [multiple-choice]: What will likely happen if a program written in inches runs in metric mode?
  - The machine will move the wrong distances
  - The control will convert it perfectly
  - Only the feed mode will change
  - M03 will be disabled
  - Correct answer: 0
  - Explanation: The control reads numbers in the active unit mode; the wrong units can produce dangerously incorrect moves.
- Q7 [multiple-choice]: Which safety line clearly sets inch mode?
  - G20 G40 G54
  - G21 G40 G54
  - M05 M30
  - T0101
  - Correct answer: 0
  - Explanation: G20 is the inch-mode word in that safety line.
- Q8 [multiple-choice]: Which value changes meaning between G20 and G21?
  - X2.000
  - M30
  - M03
  - T0101
  - Correct answer: 0
  - Explanation: Coordinate values are interpreted in the active unit mode.
- Q9 [multiple-choice]: Which setting determines how coordinate values are interpreted in an unfamiliar program?
  - Unit mode
  - Optional-stop setting
  - Spindle direction
  - Coolant state
  - Correct answer: 0
  - Explanation: Unit mode is a basic safety check before trusting coordinates.
- Q10 [multiple-choice]: Which pair is correct?
  - G20 inch, G21 metric
  - G20 metric, G21 inch
  - G20 rapid, G21 feed
  - G20 spindle, G21 coolant
  - Correct answer: 0
  - Explanation: G20 is inch mode; G21 is metric mode.

---

## 15. Feed Modes: G98 and G99

**Why:** Feed mode determines what the F value means. The same F can be per-revolution or per-minute, so knowing the active mode prevents a feed that is wildly too fast or too slow.


**Theory:**

Feed rate mode controls what the `F` value means. On Haas and Fanuc **lathes**, `G99` is feed per revolution and `G98` is feed per minute. On a **mill**, the same ideas use `G94` (per minute) and `G95` (per revolution). The codes depend on the machine type, not the brand.

G98 F5.0 ; lathe feed per minute
G99 F0.012 ; lathe feed per revolution
G94 F5.0 ; mill feed per minute
G95 F0.012 ; mill feed per revolution

This tutorial's turning examples are lathe-based, so they use `G99` for feed per revolution. Turning programs often use feed per revolution so chip load stays tied to spindle rotation. Always verify the active feed mode before cutting.


**Quiz:**

- Q1 [multiple-choice]: What does feed mode determine?
  - The meaning of the F value
  - The tool number
  - The work-offset selection
  - The spindle direction
  - Correct answer: 0
  - Explanation: Feed mode changes how the control interprets feed rate.
- Q2 [multiple-choice]: What does G99 mean on Haas and Fanuc lathes?
  - Feed per revolution
  - Feed per minute
  - Metric units
  - Rapid motion
  - Correct answer: 0
  - Explanation: G99 is feed per revolution on Haas/Fanuc lathes.
- Q3 [multiple-choice]: What does G98 mean on Haas and Fanuc lathes?
  - Feed per minute
  - Feed per revolution
  - Spindle stop
  - Work offset
  - Correct answer: 0
  - Explanation: G98 is feed per minute on lathes.
- Q4 [fill-blank]: Complete lathe feed per revolution:
___ F0.012
  - Correct answer: G99
  - Hint: Per spindle revolution on a lathe
  - Explanation: G99 selects feed per revolution on Haas/Fanuc lathes.
- Q5 [fill-blank]: Complete lathe feed per minute:
___ F5.0
  - Correct answer: G98
  - Hint: Per minute on a lathe
  - Explanation: G98 selects feed per minute on lathes.
- Q6 [multiple-choice]: Why is feed per revolution common in turning?
  - Chip load follows spindle rotation
  - It turns coolant on
  - It homes X
  - It cancels G54
  - Correct answer: 0
  - Explanation: Feed per revolution keeps chip load related to spindle speed.
- Q7 [multiple-choice]: What may happen if the wrong feed mode is active?
  - The machine may feed too fast or too slow
  - The control may ignore all coordinates
  - The control may delete the program
  - The tool numbers may change
  - Correct answer: 0
  - Explanation: The same F number can mean very different speeds in different feed modes.
- Q8 [multiple-choice]: Which line clearly sets lathe feed per revolution?
  - G99 F0.010
  - M30
  - G54
  - T0101
  - Correct answer: 0
  - Explanation: G99 sets feed per revolution on a lathe; the F word gives the amount.
- Q9 [multiple-choice]: On a mill, which code is feed per revolution?
  - G95
  - G98
  - G99
  - M03
  - Correct answer: 0
  - Explanation: Mills use G94 (per minute) and G95 (per revolution); lathes use G98/G99 for the same ideas.
- Q10 [multiple-choice]: Which word is affected by feed mode?
  - F
  - M30
  - O number
  - T word
  - Correct answer: 0
  - Explanation: Feed mode changes how the F word is interpreted.

---

## 16. Modal State Checklist

**Why:** Modal codes stay active until something changes them. A program that states its modes up front is safer to read, prove out, and recover from than one that relies on hidden state.


**Theory:**

Modal state is the machine's memory. Motion mode, units, feed mode, offsets, and spindle mode can stay active until changed.

G20 G40 G54 G99 ; Haas/Fanuc lathe feed-per-revolution example
G97 S800 M03
G00 X2.000 Z0.100

A safe program does not rely on an unknown state. It declares the modes it needs before motion.


**Quiz:**

- Q1 [multiple-choice]: What does modal state mean?
  - A code that remains active until changed
  - A code that applies to one block only
  - The current tool geometry value
  - The sequence-number order
  - Correct answer: 0
  - Explanation: Modal codes remain active until another code changes or cancels them.
- Q2 [multiple-choice]: Which option describes a modal setting?
  - G20 or G21 units
  - An N-word sequence number
  - An O-number identifier
  - A tool-description label
  - Correct answer: 0
  - Explanation: Unit mode is modal.
- Q3 [multiple-choice]: Why should a program include a setup block?
  - To declare needed modes before motion
  - To make the file longer
  - To hide feed rate
  - To skip offsets
  - Correct answer: 0
  - Explanation: Setup blocks reduce surprise by setting important modes.
- Q4 [multiple-choice]: For the Haas/Fanuc lathe example in this lesson, which block is a better modal checklist?
  - G20 G40 G54 G99
  - (START)
  - M30
  - X2.0 Z0.1
  - Correct answer: 0
  - Explanation: That block declares units, compensation cancel, work offset, and feed-per-revolution mode (G99 on a Haas/Fanuc lathe). Mills use G94/G95 for the same ideas.
- Q5 [fill-blank]: Complete the idea: modal codes stay active until ____.
  - Correct answer: changed
  - Hint: Another code replaces them
  - Explanation: Modal codes stay active until changed or canceled.
- Q6 [multiple-choice]: Before rapid motion, what should be known?
  - Units, offset, and motion state
  - Spindle speed alone
  - Coolant state alone
  - Program number alone
  - Correct answer: 0
  - Explanation: Motion is only safe when the active modes and offsets are known.
- Q7 [multiple-choice]: Which code often cancels cutter compensation?
  - G40
  - G21
  - M03
  - M30
  - Correct answer: 0
  - Explanation: G40 cancels cutter compensation on many controls.
- Q8 [multiple-choice]: What makes hidden modal state dangerous?
  - The machine may interpret the next block differently than expected
  - It changes only the position display
  - It removes all tools
  - It resets every offset
  - Correct answer: 0
  - Explanation: An unknown modal state can make a correct-looking block behave incorrectly.
- Q9 [multiple-choice]: Which habit improves safety?
  - Read the active modes before starting the cycle
  - Ignore the position display
  - Run first, check later
  - Delete setup blocks
  - Correct answer: 0
  - Explanation: Checking the active modes helps identify an incorrect setup before motion.
- Q10 [multiple-choice]: What makes a good setup line?
  - Clear and intentional mode selections
  - Random mode selections
  - Dependence on retained modes
  - A single M30 command
  - Correct answer: 0
  - Explanation: Setup lines should make the program's assumptions clear.

---

## 17. Coolant, Stops, and Operator Control

**Why:** Auxiliary functions keep the cut safe and observable. Coolant protects the tool and finish; planned stops let the operator inspect. Knowing what each M-code does prevents a surprise stop or a dry, overheating cut.


**Theory:**

On Haas and Fanuc controls, M-codes control coolant, program stops, and spindle actions around the cut. They do not usually define the toolpath. Verify each code in the control manual before running production.

M08 ; coolant on
M09 ; coolant off
M01 ; optional stop if enabled
M00 ; mandatory stop

M-code assignments can vary by machine builder and options, so always verify shop-specific M-codes in your control's manual before running production.


**Quiz:**

- Q1 [multiple-choice]: What does M08 usually do?
  - Turns coolant on
  - Ends the program
  - Selects metric units
  - Calls tool 8
  - Correct answer: 0
  - Explanation: M08 commonly turns flood coolant on.
- Q2 [multiple-choice]: What does M09 usually do?
  - Turns coolant off
  - Turns spindle clockwise
  - Homes the axes
  - Starts a subprogram
  - Correct answer: 0
  - Explanation: M09 commonly turns coolant off.
- Q3 [multiple-choice]: Which code is an optional stop?
  - M01
  - M00
  - M30
  - G01
  - Correct answer: 0
  - Explanation: M01 stops only when optional stop is enabled on the control.
- Q4 [multiple-choice]: Which code forces a stop regardless of optional stop setting?
  - M00
  - M01
  - M08
  - G20
  - Correct answer: 0
  - Explanation: M00 is a mandatory program stop.
- Q5 [fill-blank]: Complete coolant on:
___ ; coolant on
  - Correct answer: M08
  - Hint: Flood coolant on
  - Explanation: M08 commonly turns the coolant on.
- Q6 [fill-blank]: Complete coolant off:
___ ; coolant off
  - Correct answer: M09
  - Hint: Coolant off
  - Explanation: M09 commonly turns the coolant off.
- Q7 [multiple-choice]: Why might a program use M01 after a roughing pass?
  - To let the operator inspect before continuing
  - To change inch to metric
  - To cancel the active work offset
  - To cancel all tools
  - Correct answer: 0
  - Explanation: Optional stops are useful inspection checkpoints.
- Q8 [multiple-choice]: Which line turns coolant on before cutting?
M08
G01 Z-1.000 F0.012
  - M08
  - G01 Z-1.000 F0.012
  - F0.012
  - Z-1.000
  - Correct answer: 0
  - Explanation: M08 is the machine-function line that starts coolant.
- Q9 [multiple-choice]: Why should you verify shop-specific M-codes?
  - Some machines customize auxiliary functions
  - All controls ignore M-codes
  - Every machine assigns identical auxiliary functions
  - M08 always means spindle off
  - Correct answer: 0
  - Explanation: Auxiliary functions can vary by machine builder and options.
- Q10 [multiple-choice]: Which code should appear near the end of a program if coolant was used?
  - M09
  - G91
  - G76
  - G21
  - Correct answer: 0
  - Explanation: Coolant should be turned off before the program ends or the tool is parked.

---

## 18. M98, M99, and Repeated Motion

**Why:** Repetitive motion belongs in one place. A subprogram lets one tested routine run many times, but a single edit affects every repeat. The call, repeat count, and return must therefore be unambiguous.


**Theory:**

This shows a **Haas/Fanuc-style subprogram example**. Call and return words, P/L word meanings, and where a subprogram may live vary by control; verify the exact manual before use.

Subprograms keep repeated motion in one place. The main program calls the subprogram; the subprogram runs and returns.

M98 P2000 L3 ; call O2000 three times
...
O2000
G01 Z-0.100 F0.006
M99 ; return

**Local vs. external subprograms:**

`M98 P____` calls a subprogram by number. On many Haas/Fanuc-style controls, it points to another program (an external O-number) held in the control or to a local routine.

`M97 P____` is the *local* subprogram call: it jumps to a line or routine *inside the same program* and returns to the line after the M97. Use M97 when the repeat lives in the current program.

`M99` returns from a subprogram. In an external subprogram it returns to the caller; in a local routine called by M97 it returns to the block right after the M97.

`L` gives the repeat count. Document repeats clearly so the next person understands what repeats and why—and remembers that one edit changes every repeat.


**Quiz:**

- Q1 [multiple-choice]: What does M98 commonly do?
  - Calls a subprogram
  - Turns coolant off
  - Selects inch mode
  - Cancels compensation
  - Correct answer: 0
  - Explanation: M98 is commonly used to call a subprogram.
- Q2 [multiple-choice]: What does M99 commonly do inside a subprogram?
  - Returns to the caller
  - Turns spindle off
  - Sets feed per revolution
  - Starts coolant
  - Correct answer: 0
  - Explanation: M99 returns from the subprogram on many controls.
- Q3 [multiple-choice]: On a Haas/Fanuc-style control, what is M97 used for?
  - A LOCAL subprogram call inside the same program
  - An external program call
  - Coolant on
  - Spindle stop
  - Correct answer: 0
  - Explanation: M97 is the local subprogram call; it jumps to a routine within the current program and returns to the line after the M97.
- Q4 [multiple-choice]: How does a local call (M97) differ from an external call (M98)?
  - M97 jumps within the same program; M98 calls another program by O-number
  - They are identical in every control
  - M97 cancels the cycle
  - M98 only repeats three times
  - Correct answer: 0
  - Explanation: M97 is local (same program); M98 typically calls an external subprogram held in the control.
- Q5 [multiple-choice]: In M98 P2000 L3, what does L3 usually mean?
  - Repeat three times
  - Use tool 3
  - Set line 3
  - Move 3 inches
  - Correct answer: 0
  - Explanation: L often gives the repeat count for a subprogram call.
- Q6 [multiple-choice]: In M98 P2000 L3, what does P2000 point to?
  - Subprogram O2000
  - Feed rate 2000
  - Tool 2000
  - Coolant pressure
  - Correct answer: 0
  - Explanation: P commonly identifies the subprogram number to call.
- Q7 [fill-blank]: Complete the subprogram call:
___ P2000 L2
  - Correct answer: M98
  - Hint: Subprogram call
  - Explanation: M98 calls a subprogram on many controls.
- Q8 [fill-blank]: Complete the return line at the end of a subprogram:
___
  - Correct answer: M99
  - Hint: Return from subprogram
  - Explanation: M99 returns from a subprogram on many controls.
- Q9 [multiple-choice]: Why should you use a subprogram?
  - To avoid rewriting repeated motion
  - To hide unsafe code
  - To replace all offsets
  - To make G00 slower
  - Correct answer: 0
  - Explanation: Subprograms reduce repeated code when motion patterns repeat.
- Q10 [multiple-choice]: What is a risk with subprograms?
  - They can be hard to follow without clear documentation
  - They remove all modal state
  - They prevent tool changes
  - They cannot repeat
  - Correct answer: 0
  - Explanation: Subprograms need clear comments and careful review.
- Q11 [multiple-choice]: Which line marks a subprogram return?
  - M99
  - M08
  - G54
  - T0101
  - Correct answer: 0
  - Explanation: M99 is the return code in many subprogram patterns.
- Q12 [multiple-choice]: What should you remember before editing a repeated subprogram?
  - One edit can affect every repeat
  - The edit affects the first repeat
  - The edit affects the final repeat
  - M98 cancels all offsets
  - Correct answer: 0
  - Explanation: Subprogram edits can affect every call and every repeat.

---

## 19. G81, G83, R Plane, and Return

**Why:** Drilling cycles repeat a programmed plunge automatically, but the retract level and peck depth determine whether chips clear and whether the tool returns to the right height. Getting R and the return mode wrong can crash the tool or leave a poor hole.


**Theory:**

This is a **3-axis mill drilling example**. Live-tool lathe syntax, active planes, axes, and supported cycle words differ by machine and controller; do not transfer this block directly to a lathe.

G81 X1.000 Y0.500 Z-0.750 R0.100 F5.0 ; drill
G83 X2.000 Y0.500 Z-1.500 R0.100 Q0.200 F4.0 ; peck drill
G80 ; cancel cycle

The `R` plane is the clearance height the tool rapid-feeds to before each plunge. `G80` cancels the canned cycle before normal motion resumes.

**Retract (return) mode — set once per cycle group:**

`G98` — return to the *initial* level (the position before the cycle started).

`G99` — return to the `R` plane after each hole. On a mill this is the usual choice so the tool stays just above the part between holes.

**Peck behavior in G83:** the `Q` word is the *incremental* peck depth. In this controller-specific example, the tool feeds down by Q, retracts to the R plane to clear chips, and then plunges again. This sequence repeats until the tool reaches Z. Use pecking for deeper holes where a single plunge could pack chips or overheat the tool.


**Quiz:**

- Q1 [multiple-choice]: What is G81 commonly used for?
  - Simple drilling cycle
  - Coolant off
  - Subprogram return
  - Metric mode
  - Correct answer: 0
  - Explanation: G81 is a common simple drilling canned cycle.
- Q2 [multiple-choice]: What is G83 commonly used for?
  - Peck drilling
  - Spindle stop
  - Tool length cancel
  - Optional stop
  - Correct answer: 0
  - Explanation: G83 is commonly a peck drilling cycle for deeper holes.
- Q3 [multiple-choice]: In a drilling cycle, what does R usually define?
  - Clearance plane
  - Spindle RPM
  - Tool radius
  - Program number
  - Correct answer: 0
  - Explanation: The R plane is the retract or clearance height for the cycle.
- Q4 [multiple-choice]: What does G80 do after canned cycles?
  - Cancels the cycle
  - Turns coolant on
  - Calls O80
  - Sets inch units
  - Correct answer: 0
  - Explanation: G80 cancels canned cycles on many controls.
- Q5 [fill-blank]: Complete the peck-drilling block:
___ X2.000 Z-1.500 R0.100 Q0.200
  - Correct answer: G83
  - Hint: Peck drilling cycle
  - Explanation: G83 is commonly peck drilling.
- Q6 [fill-blank]: Complete the command that cancels a drilling cycle:
___
  - Correct answer: G80
  - Hint: Cancel canned cycle
  - Explanation: G80 cancels canned cycles.
- Q7 [multiple-choice]: In G83, what does the Q word usually set?
  - Incremental peck depth
  - Hole diameter
  - Spindle RPM
  - Coolant pressure
  - Correct answer: 0
  - Explanation: Q is the incremental peck depth; the tool retracts to R and repeats until reaching Z.
- Q8 [multiple-choice]: Why should you use peck drilling?
  - To break chips and clear the hole
  - To turn coolant off
  - To change the active work offset
  - To home all axes
  - Correct answer: 0
  - Explanation: Pecking helps chip evacuation and reduces drilling load.
- Q9 [multiple-choice]: On a mill, where does G99 return the tool after each hole?
  - The R plane
  - The initial start level
  - Machine home
  - The tool changer
  - Correct answer: 0
  - Explanation: G99 returns to the R plane between holes; G98 returns to the initial level.
- Q10 [multiple-choice]: Which value is the hole depth here?
G81 X1.0 Y0.5 Z-0.750 R0.100 F5.0
  - Z-0.750
  - R0.100
  - F5.0
  - X1.0
  - Correct answer: 0
  - Explanation: Z is the drilling depth target in this example.
- Q11 [multiple-choice]: Which value is the clearance plane here?
G81 X1.0 Y0.5 Z-0.750 R0.100 F5.0
  - R0.100
  - Z-0.750
  - F5.0
  - G81
  - Correct answer: 0
  - Explanation: R0.100 is the retract/clearance plane.
- Q12 [multiple-choice]: Why should you cancel the drilling cycle with G80 before commanding unrelated motion?
  - So the control leaves drilling-cycle mode
  - So the spindle stops
  - So M08 turns off
  - So G20 becomes metric
  - Correct answer: 0
  - Explanation: Leaving a canned cycle active can make later motion behave unexpectedly.

---

## 20. Feed Hold, Restart, and Alarm Thinking

**Why:** Recovery motion can be hazardous when the machine state or return path is misunderstood. Verifying tools, offsets, modes, spindle state, position, and clearance before resuming helps protect the operator, machine, tool, and part.


**Theory:**

This lesson uses documented Haas NGC concepts. Feed Hold stops axis motion, but the spindle can continue turning. Use the exact machine and shop stop procedure for the situation.

Stop condition identified
Tool, offsets, modes, and position verified
Return path checked for clearance
Controller-approved restart procedure followed

Haas Run-Stop-Jog-Continue stores the interrupted position. Its return move does not retrace the path used to jog away, and the previous offsets are used for the return position. Haas therefore warns against changing tools or offsets during the interruption.

With Haas Setting 36 enabled, the control scans earlier program blocks for tools, offsets, G/M codes, and axis positions before a mid-program restart. With it disabled, that scan does not occur. A scan is not a substitute for an approved recovery procedure or a clear motion path.


**Quiz:**

- Q1 [multiple-choice]: What should you do first if motion looks wrong?
  - Use the machine/shop stop procedure
  - Increase rapid override
  - Ignore it
  - Edit random offsets
  - Correct answer: 0
  - Explanation: Use the stop action defined for the situation by the machine manual and shop procedure, then diagnose before resuming.
- Q2 [multiple-choice]: Why is a mid-program restart risky?
  - The expected tools, offsets, modes, or positions may not be restored
  - The program always restarts from the beginning
  - The screen turns off
  - G-code cannot restart
  - Correct answer: 0
  - Explanation: A restart can omit or reinterpret earlier setup state. Haas Setting 36 can scan earlier blocks, but its behavior and limitations must be understood.
- Q3 [multiple-choice]: Before any recovery return motion, what must be confirmed?
  - The return path is unobstructed and the machine state is understood
  - The tool is touching the part
  - Rapid override is 100%
  - The current position is ignored
  - Correct answer: 0
  - Explanation: The documented Haas return does not retrace the jog-away path, so clearance and machine state must be verified.
- Q4 [multiple-choice]: What should be checked before starting the cycle after an alarm?
  - Tool, offset, mode, spindle, and position
  - The alarm number by itself
  - The spindle command by itself
  - The current line number by itself
  - Correct answer: 0
  - Explanation: Recovery requires checking every machine state that affects motion.
- Q5 [fill-blank]: A safe restart begins from a known ____.
  - Correct answer: state
  - Hint: Known condition
  - Explanation: A known state means that the modes, offsets, tool, and position are understood.
- Q6 [multiple-choice]: Why should you avoid guessing after an alarm?
  - Wrong assumptions can cause a crash
  - Guessing improves accuracy
  - Alarms erase all danger
  - Offsets stop mattering
  - Correct answer: 0
  - Explanation: A wrong recovery move can be more dangerous than the original alarm.
- Q7 [multiple-choice]: Which verification habit is safer during alarm recovery?
  - Check the active state and the approved restart procedure
  - Restart from any line
  - Turn rapid to 100 immediately
  - Skip tool verification
  - Correct answer: 0
  - Explanation: Displayed state and the controller-approved procedure both help verify what the machine is prepared to do.
- Q8 [multiple-choice]: What should be done if you are unsure how to recover?
  - Ask an experienced person for help or follow the shop recovery procedure
  - Press Cycle Start anyway
  - Delete G54
  - Change units randomly
  - Correct answer: 0
  - Explanation: A written procedure or help from an experienced person is safer than guessing.
- Q9 [multiple-choice]: What determines whether a restart block is acceptable?
  - The controller behavior, verified machine state, clear path, and shop procedure
  - The shortest-looking line
  - The nearest sequence number
  - The highest rapid setting
  - Correct answer: 0
  - Explanation: No block is safe by label alone. The control's restart behavior, current state, path, and approved procedure must agree.
- Q10 [multiple-choice]: What characterizes a safe approach to recovery?
  - Slow, verified, and deliberate actions
  - Fast actions based on guesses
  - A restart based only on the alarmed block
  - A restart at full rapid
  - Correct answer: 0
  - Explanation: Careful recovery protects the machine, tool, part, and operator.

---

## 21. G76 — Haas Multiple-Pass Threading

**Why:** Threads must stay synchronized with spindle rotation. Understanding lead, depth, and the controller's exact cycle format helps prevent a small code error from ruining the thread or tool.


**Theory:**

This lesson uses the **one-block Haas lathe G76 format**. Other controls use different G76 formats and address meanings; do not transfer this block to another controller.

G00 G18 G20 G40 G80 G99
G50 S1000
G97 S500 M03
G00 G54 X1.2 Z0.3

G76 X0.913 Z-0.85 K0.042 D0.0115 F0.0714

**Documented Haas address meanings:**

`X0.913` — absolute X position at full thread depth

`Z-0.85` — absolute Z endpoint

`K0.042` — thread height, measured radially

`D0.0115` — first-pass cutting depth

`F0.0714` — thread lead

Haas recommends programming `G99` feed per revolution before G76. The official example also uses `G97` for fixed RPM. Thread dimensions and cutting values must come from the approved print, tooling data, and machine procedure.


**Quiz:**

- Q1 [multiple-choice]: Why does the documented Haas G76 example specify G97?
  - CSS uses too much power
  - The documented example turns CSS off and commands a fixed spindle speed
  - G96 doesn't work with G76
  - Constant RPM gives better surface finish
  - Correct answer: 1
  - Explanation: Haas labels G97 as CSS off and uses a fixed 500 RPM in this example. Follow the spindle mode required by the exact controller and approved process.
- Q2 [multiple-choice]: In this Haas G76 format, what does the F word represent?
  - The feed rate in IPR
  - The thread lead (pitch)
  - The finish feed rate
  - The number of passes
  - Correct answer: 1
  - Explanation: Haas defines F as the thread lead. For a single-start thread, lead equals pitch.
- Q3 [fill-blank]: For a single-start 20 TPI thread, what lead value results from F = 1 ÷ TPI?
F___
  - Correct answer: 0.050
  - Hint: 1 ÷ 20 = ?
  - Explanation: For this single-start example, lead = 1 ÷ 20 = 0.050". Verify the exact thread specification and controller format before programming.

---

## 22. What 3D Printer G-Code Does

**Why:** Reading G-code helps you understand what the printer is doing so you can inspect a file and troubleshoot problems more confidently.


**Theory:**

3D printer G-code controls motion, temperature, filament movement, fans, and machine setup.
 A slicer is software that converts a 3D model into layer-by-layer printer instructions. It writes most G-code, but learning to read these lines helps you inspect a file and find problems.

G1 X82.4 Y104.2 E0.036 F1800

Breaking that down:

`G1` - controlled move

`X82.4 Y104.2` - nozzle position on the bed

`E0.036` - extruder position or movement, depending on the active extrusion mode

`F1800` - movement speed in millimeters per minute

Printer G-code is usually metric. Most slicers use millimeters for X, Y, Z, and E values.


**Quiz:**

- Q1 [multiple-choice]: In 3D printer G-code, what does the E value usually control?
  - Bed temperature
  - Extruder movement
  - Fan speed
  - Home position
  - Correct answer: 1
  - Explanation: The E value controls extruder position or movement. Its exact effect depends on whether extrusion is in absolute or relative mode.
- Q2 [multiple-choice]: Which axis usually controls nozzle height above the print bed?
  - X
  - Y
  - Z
  - F
  - Correct answer: 2
  - Explanation: Z is the vertical axis. Layer changes and first-layer height are controlled through Z movement.
- Q3 [fill-blank]: Complete the controlled move command:
___ X50 Y50 E1.2 F1200
  - Correct answer: G1
  - Hint: G1 is the normal printing move
  - Explanation: G1 is the controlled move used for most print paths. It may move with or without extrusion.
- Q4 [matching]: Match each printer G-code word to what it controls.
  - Explanation: Printer moves commonly use G1 for controlled motion, E for extruder movement, and F for movement speed.
  - Pairs: G1→Controlled move, E→Extruder movement, F→Feed rate
- Q5 [true-false]: In most 3D printer G-code, E controls extruder movement.
  - Correct answer: true
  - Explanation: True. E controls the extruder, while the active absolute or relative extrusion mode determines how each value is interpreted.

---

## 23. Homing and Bed Leveling

**Why:** The printer needs a reliable position and a known bed surface before it can place the first layer correctly.


**Theory:**

Before printing, the machine needs to know where its axes are. An endstop is a switch or sensor that marks a known reference point. Homing moves each axis to its endstop or sensor so the printer can establish machine zero.

G28 ; home all axes

A bed mesh is a map of small height differences across the print surface. A configured printer can use this map to adjust nozzle height during a print.

Many printers can probe the bed to create a mesh:

G29 ; Marlin configured leveling
BED_MESH_CALIBRATE ; Klipper command provided by a configured [bed_mesh] section

On Marlin, G29 runs the configured leveling system. In Klipper, BED_MESH_CALIBRATE is available only when [bed_mesh] is configured; G29 is not native Klipper unless a user-defined macro maps it. Always check the active firmware
 and printer configuration. Not every print needs a fresh mesh; follow the printer's recommended probing interval.


**Quiz:**

- Q1 [multiple-choice]: What does G28 usually do on a 3D printer?
  - Heat the nozzle
  - Home the axes
  - Turn on the fan
  - Start extrusion
  - Correct answer: 1
  - Explanation: G28 homes the axes. It tells the printer to find known machine positions using endstops or sensors.
- Q2 [multiple-choice]: When the configured workflow requires mesh compensation, what must happen before printing?
  - Create or load a valid bed mesh
  - Increase nozzle temperature
  - Pause the printer
  - Change filament diameter
  - Correct answer: 0
  - Explanation: The configured workflow must create or load a valid mesh before using mesh compensation. A new probing routine is not required before every print.

---

## 24. Hotend and Bed Temperature

**Why:** Correct temperature commands help the printer heat safely and begin each step at the intended temperature.


**Theory:**

The hotend is the heated assembly that melts filament. The heated bed warms the surface that supports the print.

Temperature commands use M-codes. Some set a target and continue immediately; others wait.

M104 S210 ; set nozzle to 210 C and continue
M109 S210 ; wait while heating to at least 210 C
M140 S60 ; set bed to 60 C and continue
M190 S60 ; wait while heating bed to at least 60 C

In Marlin, the S form waits while heating but does not wait for cooling if already above target; use R when the command must wait for heating or cooling.


**Quiz:**

- Q1 [multiple-choice]: In Marlin, which command sets nozzle temperature and waits while heating?
  - M104
  - M109
  - M140
  - M190
  - Correct answer: 1
  - Explanation: M109 S waits while heating to the target. M109 R waits for either heating or cooling to the target.
- Q2 [multiple-choice]: In Marlin, which command controls the heated bed and waits while heating?
  - M104
  - M109
  - M140
  - M190
  - Correct answer: 3
  - Explanation: M190 S waits while heating the bed. M190 R waits for either heating or cooling to the target.
- Q3 [fill-blank]: Set the nozzle to 215 C without waiting:
M___ S215
  - Correct answer: 104
  - Hint: M104 sets hotend temperature and continues
  - Explanation: M104 sets the hotend target temperature but does not wait for it to finish heating.
- Q4 [matching]: Match each temperature command to its behavior.
  - Explanation: M104 sets the hotend without waiting. In Marlin, M109 S and M190 S wait while heating; their R forms also wait while cooling.
  - Pairs: M104→Set nozzle, keep going, M109→Set nozzle and wait, M190→Set bed and wait
- Q5 [true-false]: In Marlin, M109 S sets nozzle temperature and waits while heating.
  - Correct answer: true
  - Explanation: True. The S form waits while heating; use M109 R if cooling to the target must also block progress.

---

## 25. Extrusion and the E Axis

**Why:** Understanding extrusion helps you tell when the nozzle is depositing filament and when it is only changing position.


**Theory:**

Extrusion means pushing filament through the nozzle. The `E` value controls extruder position or movement. In most slicer output, printing moves use
 `G1` with X/Y position plus an E value.

G1 X82.4 Y104.2 E0.036 F1800

A travel move changes the nozzle's position without intentionally depositing filament. A printing move combines nozzle movement with extruder movement.

Extrusion mode tells the printer how to interpret E values. In absolute mode, E is a position. In relative mode, E is a change from the current position.
 Identify the active mode before editing E values by hand.


**Quiz:**

- Q1 [multiple-choice]: In this line, what does E0.036 control?
G1 X82.4 Y104.2 E0.036 F1800
  - Extruder position or movement
  - Bed temperature
  - Fan speed
  - Home position
  - Correct answer: 0
  - Explanation: E controls extruder position or movement. The active extrusion mode determines how E0.036 is interpreted.
- Q2 [multiple-choice]: Which line is most likely printing plastic?
  - G1 X20 Y20 E0.45 F1800
  - G1 X20 Y20 F9000
  - G28
  - M104 S210
  - Correct answer: 0
  - Explanation: A G1 move with E increasing usually extrudes filament.
- Q3 [multiple-choice]: What does a move with X and Y but no E usually represent?
  - A travel move
  - A bed heat command
  - A fan command
  - A program end
  - Correct answer: 0
  - Explanation: Travel moves reposition the nozzle without extruding.
- Q4 [fill-blank]: Type the letter that controls extruder movement:
  - Correct answer: E
  - Hint: Extruder word
  - Explanation: E represents extruder position or movement in printer G-code.
- Q5 [multiple-choice]: What happens if too much filament is extruded?
  - Over-extrusion
  - Bed leveling
  - Homing
  - Fan off only
  - Correct answer: 0
  - Explanation: Too much extrusion can cause blobs, rough walls, and dimensional errors.
- Q6 [multiple-choice]: What happens if too little filament is extruded?
  - Under-extrusion
  - Automatic leveling
  - Hotend waits
  - Program rewind
  - Correct answer: 0
  - Explanation: Too little extrusion can leave gaps, weak walls, and poor layer bonding.
- Q7 [multiple-choice]: Which command is the normal controlled move used for extrusion?
  - G1
  - G28
  - M190
  - M107
  - Correct answer: 0
  - Explanation: G1 is the normal controlled move command in printer G-code.
- Q8 [fill-blank]: Complete the printing move:
G1 X50 Y50 ___1.2 F1200
  - Correct answer: E
  - Hint: Extrusion word
  - Explanation: E1.2 tells the extruder how much filament movement to command.
- Q9 [multiple-choice]: Why should beginners be careful editing E values?
  - Extrusion mode may be absolute or relative
  - E always homes the printer
  - E only controls the display
  - E turns on the fan
  - Correct answer: 0
  - Explanation: Different slicers and firmware can use absolute or relative extrusion.
- Q10 [multiple-choice]: Which value is not a motion coordinate in this line?
G1 X82 Y104 E0.036 F1800
  - F1800
  - X82
  - Y104
  - E0.036
  - Correct answer: 0
  - Explanation: F sets feed rate/speed. X, Y, and E are axis/extrusion values.

---

## 26. Feed Rate and Travel Moves

**Why:** Movement speed affects print quality, travel time, and how accurately the printer can place filament.


**Theory:**

The `F` word sets feed rate. In most printer G-code, feed rate is in millimeters per minute.

G1 X40 Y40 F9000 ; fast travel
G1 X40 Y40 E0.4 F1800 ; slower print move

Travel moves are usually faster because they do not push filament. Print moves are slower so the
 nozzle can place a controlled line of melted filament.


**Quiz:**

- Q1 [multiple-choice]: In most printer G-code, what does F1800 mean?
  - 1800 mm/min feed rate
  - 1800 degrees
  - 1800 grams
  - Fan speed 1800
  - Correct answer: 0
  - Explanation: Printer feed rate is commonly expressed in millimeters per minute.
- Q2 [multiple-choice]: Which line is likely a fast travel move?
  - G1 X80 Y80 F9000
  - G1 X80 Y80 E0.6 F1500
  - M190 S60
  - G28
  - Correct answer: 0
  - Explanation: A high-F move without E is usually travel.
- Q3 [multiple-choice]: Which value sets speed in this line?
G1 X10 Y10 E0.2 F1200
  - F1200
  - X10
  - Y10
  - E0.2
  - Correct answer: 0
  - Explanation: F sets feed rate.
- Q4 [fill-blank]: Type the feed rate letter used in printer G-code:
  - Correct answer: F
  - Hint: Speed/feed word
  - Explanation: F is used for feed rate.
- Q5 [multiple-choice]: Why are print moves often slower than travel moves?
  - Plastic needs time to lay down cleanly
  - G1 cannot move fast
  - Fans turn off motion
  - Homing is required
  - Correct answer: 0
  - Explanation: Printing too fast can hurt extrusion consistency and layer quality.
- Q6 [multiple-choice]: What does a line with no E value usually mean?
  - No extrusion on that move
  - Bed heat only
  - Fan full speed
  - End print
  - Correct answer: 0
  - Explanation: Without E movement, the nozzle is usually changing position without extruding.
- Q7 [multiple-choice]: What is missing from this speed command?
G1 X20 Y20 ___3000
  - F
  - M
  - S
  - T
  - Correct answer: 0
  - Explanation: F3000 sets the feed rate.
- Q8 [fill-blank]: Complete the fast travel feed rate:
G1 X100 Y100 F____
  - Correct answer: 9000
  - Hint: Common fast travel example from lesson
  - Explanation: F9000 is the fast travel example used in this lesson.
- Q9 [multiple-choice]: If a travel move is too slow, what may increase?
  - Print time
  - Bed size
  - Nozzle diameter
  - Firmware version
  - Correct answer: 0
  - Explanation: Slow travel moves can add unnecessary print time.
- Q10 [multiple-choice]: If print moves are too fast, what can happen?
  - Poor extrusion quality
  - Automatic homing
  - The bed mesh may be skipped
  - The bed turns off
  - Correct answer: 0
  - Explanation: Too-fast print moves can cause under-extrusion, weak walls, or rough surfaces.

---

## 27. Fans and Cooling

**Why:** Cooling changes how quickly plastic solidifies, which affects bridges, overhangs, and layer bonding.


**Theory:**

Part cooling fans are usually controlled with `M106` and `M107`.

M106 S255 ; full selected/default fan under common 0-255 scaling
M106 S128 ; fan about half speed
M107 ; fan off

A bridge spans an open gap. An overhang extends outward with limited support underneath. Cooling helps these features and small layers solidify, but too much cooling can weaken layer bonding on
 some materials.


**Quiz:**

- Q1 [multiple-choice]: Which command turns the part cooling fan on?
  - M106
  - M107
  - G28
  - M190
  - Correct answer: 0
  - Explanation: M106 controls the fan and can set its speed.
- Q2 [multiple-choice]: What does M107 usually do?
  - Fan off
  - Fan full speed
  - Home axes
  - Heat bed
  - Correct answer: 0
  - Explanation: M107 turns the part cooling fan off.
- Q3 [multiple-choice]: In this Marlin-style M106 S255 example, what does S255 mean?
  - Full selected/default fan speed
  - Nozzle 255 C
  - X position
  - Layer number
  - Correct answer: 0
  - Explanation: M106 commonly scales S from 0 to 255 for the selected/default compatible fan. Named or generic fans may use firmware-specific commands.
- Q4 [fill-blank]: Type the command that turns the fan off:
  - Correct answer: M107
  - Hint: Fan off command
  - Explanation: M107 turns off the fan.
- Q5 [multiple-choice]: Which command is about half fan speed?
  - M106 S128
  - M106 S255
  - M107
  - G28
  - Correct answer: 0
  - Explanation: S128 is roughly half of 255.
- Q6 [multiple-choice]: When is part cooling especially useful?
  - Bridges and overhangs
  - First-layer adhesion for every material
  - Homing accuracy
  - Bed probing
  - Correct answer: 0
  - Explanation: Cooling helps plastic solidify for bridges, overhangs, and small details.
- Q7 [multiple-choice]: What can too much part cooling cause?
  - Poor layer bonding
  - The nozzle target to increase
  - Bed leveling to run
  - The extrusion mode to change
  - Correct answer: 0
  - Explanation: Some materials need heat to bond layers well.
- Q8 [fill-blank]: Complete full fan speed:
M106 S___
  - Correct answer: 255
  - Hint: Maximum 8-bit fan value
  - Explanation: S255 is commonly full fan speed.
- Q9 [multiple-choice]: Which command changes fan speed without moving the nozzle?
  - M106 S200
  - G1 X10 Y10
  - G28
  - M190 S60
  - Correct answer: 0
  - Explanation: M106 controls the fan; it does not move the axes.
- Q10 [multiple-choice]: What is missing from this fan command?
M106 ___255
  - S
  - X
  - E
  - G
  - Correct answer: 0
  - Explanation: S is the parameter used for fan speed.

---

## 28. Start G-Code Sequence

**Why:** A clear start sequence prepares the printer in a safe, predictable order before the first layer begins.


**Theory:**

Start G-code is the group of commands that runs before the first layer. The slicer—the
 software that turns a 3D model into printer commands—usually adds it to the print file.

Homing means moving the axes to their reference sensors so the printer knows their positions.
 Probing means measuring the bed at one or more points. Priming means pushing a small amount of
 filament through the nozzle so it is ready to print. A start sequence may home, heat, probe when
 the configured workflow requires it, and prime in an order chosen for that printer.

G28 ; home all axes
M190 S60 ; set bed target to 60 C and wait while heating
M109 S210 ; set nozzle target to 210 C and wait while heating
G92 E0 ; set the current extruder coordinate to zero

This is a simplified Marlin-style example. A target temperature is the temperature the printer
 is trying to reach and hold. The example does not include a probing or priming move because those
 commands and safe locations depend on the printer, firmware configuration, and slicer profile.


**Quiz:**

- Q1 [multiple-choice]: What is the main purpose of start G-code?
  - Prepare the printer before printing
  - Pause the print
  - Disable the motors
  - Park after the print
  - Correct answer: 0
  - Explanation: Start G-code prepares the printer before the first layer. Its exact homing, heating, probing, and priming steps depend on the printer and profile.
- Q2 [multiple-choice]: Which command usually belongs early in start G-code?
  - G28
  - M84
  - M107 only
  - M30
  - Correct answer: 0
  - Explanation: G28 homes the printer so it knows its axis positions.
- Q3 [multiple-choice]: Why should the printer reach its target temperatures before printing begins?
  - Plastic needs correct melt and bed conditions
  - The extruder coordinate must reset
  - The fan must reach full speed
  - The printer must enter relative mode
  - Correct answer: 0
  - Explanation: A target temperature is the set temperature the printer tries to reach and hold. The nozzle and bed should reach their required targets before first-layer printing.
- Q4 [fill-blank]: Type the command that homes all axes:
  - Correct answer: G28
  - Hint: Home command
  - Explanation: G28 homes the axes.
- Q5 [multiple-choice]: What does G92 E0 do in this Marlin-style start sequence?
  - Set the current extruder coordinate to zero
  - Home Z
  - Heat the bed
  - Turn the fan off
  - Correct answer: 0
  - Explanation: G92 E0 labels the current extruder coordinate as zero; it does not move or prime the extruder.
- Q6 [multiple-choice]: Which Marlin command waits while the nozzle heats?
  - M109
  - M104
  - M140
  - M107
  - Correct answer: 0
  - Explanation: M109 S waits while heating; M109 R also waits while cooling.
- Q7 [multiple-choice]: Which Marlin command waits while the bed heats?
  - M190
  - M140
  - M104
  - G1
  - Correct answer: 0
  - Explanation: M190 S waits while heating; M190 R also waits while cooling.
- Q8 [fill-blank]: Set the current extruder coordinate to zero:
G92 ___0
  - Correct answer: E
  - Hint: Extruder axis
  - Explanation: In Marlin, G92 E0 sets the current extruder coordinate to zero without moving the extruder.
- Q9 [multiple-choice]: What should a start sequence avoid?
  - Moving into the bed before homing
  - Waiting for heat
  - Homing axes
  - Setting temperatures
  - Correct answer: 0
  - Explanation: Motion before known positions can crash into the bed or frame.
- Q10 [multiple-choice]: What can vary between printers?
  - Start G-code order and probing commands
  - The meaning of X and Y always
  - Whether G-code uses numbered values
  - Whether coordinates describe positions
  - Correct answer: 0
  - Explanation: Printer firmware, probes, and slicer profiles affect the exact start sequence.

---

## 29. End G-Code and Safe Shutdown

**Why:** A safe end sequence leaves the printer in a controlled state after the final move.


**Theory:**

End G-code is the group of commands that runs after the final print move. It commonly turns
 off heaters and the part-cooling fan, moves the nozzle away from the part, and releases the motors
 when it is safe to do so. Moving the nozzle to a chosen resting location is called parking.

M104 S0 ; set hotend target to 0 C
M140 S0 ; set bed target to 0 C
M107 ; turn off the default fan
M84 ; disable all stepper motors

This is a Marlin-style shutdown example. Stepper motors move and hold the printer's axes.
 After `M84` disables them, an axis can move by hand and the printer can lose its known
 position.

A parking move is machine-specific. Coordinate mode tells the printer whether movement values
 are positions or distances. Axis limits are the machine's allowed travel boundaries, and clearance
 is open space that lets the nozzle move without hitting the print or printer. Verify all three before
 adding a parking move. Re-home before later coordinate motion if an axis may have moved.


**Quiz:**

- Q1 [multiple-choice]: What is the purpose of end G-code?
  - Shut down and park safely
  - Heat the printer for first layer
  - Probe the bed
  - Start extrusion
  - Correct answer: 0
  - Explanation: End G-code safely parks and turns things off after printing.
- Q2 [multiple-choice]: Which command turns the hotend target to zero?
  - M104 S0
  - M109 S210
  - G28
  - M106 S255
  - Correct answer: 0
  - Explanation: M104 S0 sets hotend target temperature to zero.
- Q3 [multiple-choice]: Which command turns the bed target to zero?
  - M140 S0
  - M190 S60
  - G92 E0
  - M107
  - Correct answer: 0
  - Explanation: M140 S0 turns off the heated bed target.
- Q4 [fill-blank]: Type the fan off command:
  - Correct answer: M107
  - Hint: Part cooling fan off
  - Explanation: M107 turns the fan off.
- Q5 [multiple-choice]: Why should you park the nozzle away from the part?
  - To avoid heat damage or oozing on the print
  - To home the printer
  - To turn fan on
  - To reset E
  - Correct answer: 0
  - Explanation: A hot nozzle sitting on the part can mark or melt it.
- Q6 [multiple-choice]: In Marlin, what does M84 with no axis letters do?
  - Disable all stepper motors
  - Heat the nozzle
  - Probe the bed
  - Set the fan speed
  - Correct answer: 0
  - Explanation: Stepper motors move and hold the axes. M84 with no axis letters disables all of them, so the printer can lose its known position if an axis moves afterward.
- Q7 [multiple-choice]: Before reusing a parking move from another printer, what must you verify?
  - Coordinate mode, axis limits, and clearance
  - Only nozzle and bed temperatures
  - Only the active tool and fan speed
  - Only extrusion mode and flow factor
  - Correct answer: 0
  - Explanation: Parking coordinates are machine-specific and can be unsafe when the coordinate mode, travel limits, or clearance differ.
- Q8 [fill-blank]: Turn the bed off:
M140 S___
  - Correct answer: 0
  - Hint: Zero target temperature
  - Explanation: S0 sets the bed target to zero/off.
- Q9 [multiple-choice]: What should be turned off to prevent continued heating after a print?
  - Heaters
  - The positioning mode
  - The stored bed mesh
  - The extrusion coordinate mode
  - Correct answer: 0
  - Explanation: Heaters should be turned off at the end of a print.
- Q10 [multiple-choice]: Which command is fan off, not heater off?
  - M107
  - M104 S0
  - M140 S0
  - M190 S60
  - Correct answer: 0
  - Explanation: M107 turns off the fan.

---

## 30. Reading Slicer Comments

**Why:** Slicer comments help you locate layers and print features without changing how the printer runs the file.


**Theory:**

A slicer is software that turns a 3D model into printer commands. A toolpath is the route the
 slicer plans for the nozzle. Slicers often add comments—notes for people reading the file—to label
 layers and toolpath features. In common Marlin-style files, a semicolon starts a comment.

;TYPE:WALL-OUTER
G1 X30 Y40 E0.22 F1500
;LAYER:12

Marlin does not execute the text after the semicolon. Labels such as `;TYPE:WALL-OUTER`
 and `;LAYER:12` help people inspect the file, but their exact wording varies by slicer.


**Quiz:**

- Q1 [multiple-choice]: In printer G-code, what does a semicolon usually start?
  - A comment
  - A heater command
  - A fan command
  - A home move
  - Correct answer: 0
  - Explanation: A semicolon starts a comment in many printer G-code files.
- Q2 [multiple-choice]: Which line is only a slicer comment?
  - ;TYPE:WALL-OUTER
  - G1 X30 Y40 E0.22
  - M104 S210
  - G28
  - Correct answer: 0
  - Explanation: The semicolon means the line is a comment for humans.
- Q3 [multiple-choice]: What does ;LAYER:12 help identify?
  - The current layer
  - Nozzle temperature
  - Bed size
  - Fan speed only
  - Correct answer: 0
  - Explanation: Layer comments help locate sections of the print file.
- Q4 [fill-blank]: Type the symbol that starts many printer comments:
  - Correct answer: ;
  - Hint: Comment character
  - Explanation: A semicolon starts many printer G-code comments.
- Q5 [multiple-choice]: In a Marlin-style file, does Marlin execute the text after a semicolon?
  - No, it treats the text as a comment
  - Yes, on every line
  - Yes, after the nozzle heats
  - Yes, on the first layer
  - Correct answer: 0
  - Explanation: A comment is a note for people reading the file. Marlin does not execute the text after the semicolon.
- Q6 [multiple-choice]: Why are slicer comments useful?
  - They help humans understand toolpaths
  - They heat the bed
  - They change E values
  - They home the axes
  - Correct answer: 0
  - Explanation: Comments make the file easier to inspect and debug.
- Q7 [multiple-choice]: Which line is most likely an outer-wall label?
  - ;TYPE:WALL-OUTER
  - M190 S60
  - G28
  - M107
  - Correct answer: 0
  - Explanation: Slicers often label feature types with comments.
- Q8 [fill-blank]: Complete the layer comment:
;_____:12
  - Correct answer: LAYER
  - Hint: Layer label
  - Explanation: ;LAYER:12 labels the layer section.
- Q9 [multiple-choice]: What should you edit carefully?
  - Motion and temperature lines
  - Blank lines
  - Slicer comments
  - File header labels
  - Correct answer: 0
  - Explanation: Changing motion or temperature lines affects the print. Comments do not execute.
- Q10 [multiple-choice]: Which line is an executable coordinated-motion command?
  - G1 X30 Y40 E0.22 F1500
  - ;TYPE:WALL-OUTER
  - ;LAYER:12
  - ; generated by slicer
  - Correct answer: 0
  - Explanation: G1 requests coordinated motion. Whether its E value deposits filament depends on the active extrusion mode and current E position.

---

## 31. First Layer Diagnostics

**Why:** First-layer clues help you catch setup and adhesion problems before they affect the rest of the print.


**Theory:**

Bed adhesion means how well the first layer sticks to the print surface. Check adhesion,
 line shape, and nozzle-to-bed distance before changing settings.

The Z offset is the configured difference between the printer's Z reference and the nozzle's
 working height. Bed leveling compensates for tilt or small height differences across the bed.

G90 ; absolute XYZ positioning
M83 ; relative extrusion mode
G28 ; home all axes
G1 Z0.20 F600
G1 X60 Y60 E0.8 F1200

This modeled sequence declares both positioning modes. `Z0.20` requests a Z-axis
 position; the real nozzle-to-bed gap also depends on homing, Z offset, leveling, and machine setup.
 A good first-layer line is slightly flattened, continuous, and firmly attached. A high nozzle can
 leave round, loose lines. A low nozzle can smear plastic or restrict flow.


**Quiz:**

- Q1 [multiple-choice]: Modeled first-layer move:
G90
G1 Z0.20 F600

What does Z0.20 request?
  - Z-axis position 0.20
  - Nozzle temperature 0.20
  - Fan speed 0.20
  - Bed temperature 0.20
  - Correct answer: 0
  - Explanation: With G90 active, Z0.20 requests absolute Z position 0.20. The actual nozzle-to-bed gap also depends on homing, Z offset, leveling, and setup.
- Q2 [multiple-choice]: If first-layer lines are round and barely stick, what is the most likely problem?
  - The nozzle is too high
  - The nozzle is too low
  - The nozzle is at the correct height
  - The fan speed is the only problem
  - Correct answer: 0
  - Explanation: A high nozzle lays plastic on top of the bed instead of pressing it down.
- Q3 [multiple-choice]: If the nozzle scrapes and plastic barely comes out, what is the most likely problem?
  - The nozzle is too low
  - The nozzle is too high
  - The nozzle temperature is the only problem
  - The nozzle is too far from the bed
  - Correct answer: 0
  - Explanation: A low nozzle can block flow by pressing too close to the bed.
- Q4 [multiple-choice]: Which line homes the printer before first-layer checks?
G28
G1 Z0.20 F600
  - G28
  - G1 Z0.20 F600
  - F600
  - Z0.20
  - Correct answer: 0
  - Explanation: G28 homes the printer so it starts from known positions.
- Q5 [fill-blank]: Complete this modeled Z-position move:
G1 ___0.20 F600
  - Correct answer: Z
  - Hint: Vertical axis
  - Explanation: Z controls the vertical axis. Verify the printer setup before using a specific first-layer position.
- Q6 [multiple-choice]: How should a good first-layer line look?
  - Slightly flattened and continuous
  - Round and loose
  - Transparent and scraped away
  - Separated by wide gaps
  - Correct answer: 0
  - Explanation: A slightly flattened line usually means the nozzle is close enough to bond.
- Q7 [multiple-choice]: Which setup areas directly affect first-layer height?
  - Z offset and bed leveling
  - Flow percentage only
  - Retraction distance
  - Travel speed
  - Correct answer: 0
  - Explanation: Z offset sets the nozzle reference height, while bed leveling compensates for height differences across the bed. Follow the printer-specific setup procedure before adjusting either.
- Q8 [multiple-choice]: With M83 active, which value requests 0.8 of forward extruder movement?
G1 X60 Y60 E0.8 F1200
  - E0.8
  - X60
  - Y60
  - F1200
  - Correct answer: 0
  - Explanation: M83 makes E values relative, so E0.8 requests 0.8 of forward extruder movement in the active units.
- Q9 [fill-blank]: Type the common command that homes all axes before checking the first layer:
  - Correct answer: G28
  - Hint: Home command
  - Explanation: G28 homes the printer axes.
- Q10 [multiple-choice]: Why should you correct first-layer problems before tuning print speed?
  - Poor adhesion can ruin the whole print early
  - Retraction controls bed flatness
  - Fan speed sets nozzle height
  - End G-code corrects the first layer
  - Correct answer: 0
  - Explanation: If the first layer fails, later layers do not matter.

---

## 32. Retraction and Stringing

**Why:** Retraction settings help control unwanted filament during travel moves without disrupting normal extrusion.


**Theory:**

Stringing happens when melted plastic leaks during travel moves. Retraction pulls filament
 back before travel, then primes it again before printing resumes.

M83 ; relative extrusion mode
G1 E-0.8 F1800 ; retract
G0 X90 Y90 F9000 ; travel
G1 E0.8 F1800 ; prime

This example explicitly uses M83 relative extrusion. Without known extrusion mode, E-0.8 and E0.8 are destinations rather than guaranteed retract/prime amounts. Retraction values depend on printer type, hotend, material, temperature, and slicer settings.
 The pattern is the important part: retract, travel, prime.


**Quiz:**

- Q1 [multiple-choice]: Relative-extrusion pattern:
M83
G1 E-0.8 F1800
G0 X90 Y90 F9000
G1 E0.8 F1800

Which line retracts filament?
  - G1 E-0.8 F1800
  - G0 X90 Y90 F9000
  - G1 E0.8 F1800
  - M83
  - Correct answer: 0
  - Explanation: With M83 relative extrusion active, a negative E delta retracts filament.
- Q2 [multiple-choice]: What problem does retraction mainly fight?
  - Stringing during travel
  - Layer shifts
  - Elephant foot
  - Warping
  - Correct answer: 0
  - Explanation: Retraction reduces oozing while the nozzle travels between printed areas.
- Q3 [multiple-choice]: Which line is the travel move in this relative-extrusion pattern?
M83
G1 E-0.8 F1800
G0 X90 Y90 F9000
G1 E0.8 F1800
  - G0 X90 Y90 F9000
  - G1 E-0.8 F1800
  - G1 E0.8 F1800
  - M83
  - Correct answer: 0
  - Explanation: G0 with X/Y moves the nozzle without E movement in this example.
- Q4 [multiple-choice]: With M83 relative extrusion active, which line primes after travel?
  - G1 E0.8 F1800
  - G1 E-0.8 F1800
  - G0 X90 Y90
  - G28
  - Correct answer: 0
  - Explanation: In relative extrusion mode, a positive E delta pushes filament forward.
- Q5 [fill-blank]: With M83 active, complete a retract move:
G1 E___0.8 F1800
  - Correct answer: -
  - Hint: Relative pullback uses a negative E delta
  - Explanation: With M83 relative extrusion active, the minus sign commands E backward by 0.8.
- Q6 [multiple-choice]: What may happen if retraction is too low?
  - Thin strings may form between parts
  - Gaps may appear after travel
  - The nozzle may scrape the bed
  - Layers may shift
  - Correct answer: 0
  - Explanation: Not enough retraction can leave plastic oozing during travel.
- Q7 [multiple-choice]: What can happen if retraction is too aggressive?
  - Gaps or under-extrusion may appear after travel
  - Stringing may increase from too little pullback
  - First-layer squish may increase
  - The bed may warp
  - Correct answer: 0
  - Explanation: Too much retraction can delay or reduce flow when printing resumes.
- Q8 [multiple-choice]: What else can increase stringing besides low retraction?
  - Nozzle temperature too high
  - Bed temperature too low
  - Z offset too close
  - Part-cooling speed too high
  - Correct answer: 0
  - Explanation: Hotter plastic flows more easily and can ooze during travel.
- Q9 [fill-blank]: Type the axis letter used for extrusion and retraction amount:
  - Correct answer: E
  - Hint: Extruder axis
  - Explanation: E is the extruder axis in common printer G-code.
- Q10 [multiple-choice]: What is the correct sequence?
  - Retract, travel, prime
  - Prime, travel, retract
  - Travel, prime, retract
  - Retract, prime, travel
  - Correct answer: 0
  - Explanation: Retraction pulls back before travel and primes before printing resumes.

---

## 33. Flow and Extrusion Clues

**Why:** Flow clues help you recognize when the printer is depositing too much or too little material.


**Theory:**

Flow describes how much filament the printer pushes compared with the requested amount.
 Under-extrusion means too little material is deposited; over-extrusion means too much. These
 problems can appear as gaps, thin walls, blobs, heavy seams, or rough top surfaces.

M83 ; relative extrusion mode
G1 X100 E0.5 F1200 ; move X while pushing 0.5 of filament
M221 S95 ; set extrusion factor to 95 percent

An extrusion-factor override scales commanded E movement. Marlin and Klipper both document
 `M221 S&lt;percent&gt;`; other firmware may differ. Before changing it, check nozzle size,
 filament diameter, temperature, and whether the extruder is slipping. Make small, measured changes.


**Quiz:**

- Q1 [multiple-choice]: With M83 active, which value requests forward extruder movement?
G1 X100 E0.5 F1200
  - E0.5
  - X100
  - F1200
  - G1
  - Correct answer: 0
  - Explanation: M83 makes E relative, so E0.5 requests 0.5 of forward extruder movement in the active units.
- Q2 [multiple-choice]: What can under-extrusion look like?
  - Gaps and thin lines
  - Blobs and heavy seams
  - Warped corners
  - Layer shifts
  - Correct answer: 0
  - Explanation: Under-extrusion often leaves gaps, weak walls, or missing top-surface material.
- Q3 [multiple-choice]: What can over-extrusion look like?
  - Blobs, heavy seams, rough top surfaces
  - Gaps and thin walls
  - Layer shifts without excess material
  - No extrusion after travel
  - Correct answer: 0
  - Explanation: Too much plastic can build up as blobs or rough, crowded lines.
- Q4 [multiple-choice]: In Marlin, what does M221 S95 adjust?
  - Flow percentage to 95 percent
  - Bed temperature to 95 C always
  - Fan off
  - Home all axes
  - Correct answer: 0
  - Explanation: Marlin and Klipper support M221 S95 as a 95 percent extrusion-factor override.
- Q5 [fill-blank]: Complete this Marlin flow command:
M221 S___
  - Correct answer: 95
  - Hint: 95 percent flow
  - Explanation: M221 S95 sets Marlin flow to 95 percent. Other firmware may use a different command.
- Q6 [multiple-choice]: Before changing flow, what should you check?
  - Nozzle size and filament diameter
  - Retraction distance only
  - Bed mesh only
  - Travel acceleration only
  - Correct answer: 0
  - Explanation: Wrong hardware or filament settings can look like a flow problem.
- Q7 [multiple-choice]: With M83 active, which line moves X while pushing filament forward?
  - G1 X100 E0.5 F1200
  - M221 S95
  - ; set flow
  - G28
  - Correct answer: 0
  - Explanation: With M83 active, the positive E0.5 value requests forward extruder movement while X moves.
- Q8 [fill-blank]: Type the command word in this move:
___ X100 E0.5 F1200
  - Correct answer: G1
  - Hint: Controlled move
  - Explanation: G1 is the controlled movement command used for many print paths.
- Q9 [multiple-choice]: Why should flow adjustments remain small?
  - Large changes can create new print defects
  - Flow changes only travel speed
  - Flow resets the home position
  - Flow affects only the first layer
  - Correct answer: 0
  - Explanation: Flow affects every extrusion path, so big changes can create new problems.
- Q10 [multiple-choice]: What should you do if the extruder clicks or slips?
  - Check mechanical feed and nozzle restrictions
  - Increase flow without testing
  - Raise travel speed
  - Disable retraction without diagnosing the cause
  - Correct answer: 0
  - Explanation: Skipping or slipping can come from a clog, pressure, temperature, or extruder tension issue.

---

## 34. PLA, PETG, ABS, and Profile Clues

**Why:** Different materials need different conditions, so reading the active profile helps you avoid preventable print problems.


**Theory:**

A material profile is a saved group of slicer settings for a filament and printer setup.
 The active profile is the group currently selected. Its temperature, speed, and fan choices
 appear in the generated G-code.

Part cooling is airflow aimed at newly deposited plastic. An enclosure is a cabinet or cover
 around the printer that helps keep the air near the print stable.

M104 S215 ; set nozzle target without waiting
M140 S70 ; set bed target without waiting
M106 S180 ; set the print-cooling fan speed

This Marlin-style example uses the common 0–255 fan scale. PLA, PETG, and ABS require
 material-specific nozzle, bed, and fan settings; use the filament maker's profile as a starting
 point. ABS commonly benefits from an enclosure and limited drafts. It can release potentially
 harmful fumes, so use a well-ventilated room while preventing drafts around the print, and
 follow the printer, enclosure, and filament makers' safety instructions.


**Quiz:**

- Q1 [multiple-choice]: What does a material profile mainly control?
  - Temperature, speed, cooling, and related settings
  - The tool-change script
  - Bed dimensions
  - The file format
  - Correct answer: 0
  - Explanation: Material profiles group settings that match the filament.
- Q2 [multiple-choice]: Which command sets a nozzle target without waiting?
  - M104 S215
  - M140 S70
  - G28
  - M107
  - Correct answer: 0
  - Explanation: M104 sets hotend target and continues.
- Q3 [multiple-choice]: Which command sets a bed target without waiting?
  - M140 S70
  - M104 S215
  - G1 E1
  - M84
  - Correct answer: 0
  - Explanation: M140 sets the bed target and continues.
- Q4 [multiple-choice]: In this Marlin-style example, which command changes the print-cooling fan speed?
  - M106 S180
  - M104 S215
  - G28
  - G92 E0
  - Correct answer: 0
  - Explanation: M106 sets the selected fan speed in Marlin. This example uses the common 0–255 scale.
- Q5 [fill-blank]: Complete nozzle target 215 C:
M104 S___
  - Correct answer: 215
  - Hint: Temperature target
  - Explanation: S215 is the target temperature value.
- Q6 [multiple-choice]: Compared with ABS, what does PLA often use more of?
  - Part cooling
  - Nozzle shutdowns
  - Moves without extrusion
  - G28 commands
  - Correct answer: 0
  - Explanation: PLA usually benefits from part cooling, though exact settings vary.
- Q7 [multiple-choice]: Which settings should you verify separately for PETG and PLA?
  - Nozzle, bed, and fan settings
  - Only nozzle temperature
  - Only bed temperature
  - Only fan speed
  - Correct answer: 0
  - Explanation: PETG and PLA profiles can use different nozzle, bed, and fan settings. Follow the filament maker's guidance and verify the actual setup.
- Q8 [multiple-choice]: What commonly helps ABS print successfully?
  - An enclosure and limited drafts
  - Maximum fan speed at all times
  - A cold bed
  - A disabled nozzle heater
  - Correct answer: 0
  - Explanation: An enclosure helps keep the air near the ABS print stable, but ventilation and manufacturer safety guidance still apply.
- Q9 [fill-blank]: Complete bed target 70 C:
M140 S___
  - Correct answer: 70
  - Hint: Bed target
  - Explanation: S70 sets the bed target to 70 C.
- Q10 [multiple-choice]: Why should you verify material settings instead of copying them without review?
  - Printer, filament, and environment vary
  - All G-code is identical
  - One profile fits every nozzle size
  - Material brand never affects settings
  - Correct answer: 0
  - Explanation: Profiles are starting points and need verification on the actual machine.

---

## 35. Supports, Bridges, and Cooling Decisions

**Why:** Understanding supports, bridges, and cooling helps you decide how the printer should handle difficult features.


**Theory:**

An overhang extends outward with limited material beneath it. Support is temporary printed
 material placed under features that need help. A bridge is a strand printed across an open gap.

Support distance is the planned gap between support and the part. Slicers may label these
 toolpaths with comments, but label wording varies.

M83 ; relative extrusion mode
;TYPE:SUPPORT
G1 X40 Y80 E0.24 F1400
;TYPE:BRIDGE
M106 S255
G1 X70 Y80 E0.18 F900

This modeled Marlin-style example declares relative extrusion and uses the common 0–255 fan
 scale. Bridge speed and cooling are profile choices that depend on material, geometry, and printer.


**Quiz:**

- Q1 [multiple-choice]: What does ;TYPE:SUPPORT label?
  - Support toolpath
  - Nozzle heat command
  - Bed probing
  - Home command
  - Correct answer: 0
  - Explanation: Slicers often label support paths with comments.
- Q2 [multiple-choice]: What does a bridge do?
  - Spans a gap between supported areas
  - Supports every vertical wall
  - Homes all axes
  - Retracts filament
  - Correct answer: 0
  - Explanation: A bridge prints across open space between supports or walls.
- Q3 [multiple-choice]: Why might a profile use a slower bridge speed?
  - To help strands stay controlled across a gap
  - To increase bed temperature
  - To disable extrusion
  - To run bed leveling
  - Correct answer: 0
  - Explanation: Bridge speed affects sag and strand placement, but the best value depends on material, geometry, and printer.
- Q4 [multiple-choice]: Which command sets the selected/default fan to full speed in this 0-255 example?
  - M106 S255
  - G1 X70
  - G28
  - M140 S60
  - Correct answer: 0
  - Explanation: M106 S255 is commonly full speed for the selected/default compatible fan. Named fans may use firmware-specific commands.
- Q5 [fill-blank]: Complete a support comment:
;TYPE:____
  - Correct answer: SUPPORT
  - Hint: Support label
  - Explanation: Slicers may use ;TYPE:SUPPORT to label support paths.
- Q6 [multiple-choice]: What are supports mainly used for?
  - Features that need temporary material underneath
  - Ordinary vertical walls
  - Solid infill inside every part
  - Travel moves
  - Correct answer: 0
  - Explanation: Supports provide temporary material beneath features that exceed the setup's unsupported-printing capability.
- Q7 [multiple-choice]: What can too much support material cause?
  - Difficult removal and rough surfaces
  - Stronger layer bonding
  - Faster printing
  - Lower material use
  - Correct answer: 0
  - Explanation: Support settings affect cleanup and surface quality.
- Q8 [multiple-choice]: Which line is still only a comment?
  - ;TYPE:BRIDGE
  - G1 X70 Y80 E0.18
  - M106 S255
  - G28
  - Correct answer: 0
  - Explanation: The semicolon makes it a comment for humans.
- Q9 [fill-blank]: Complete full fan speed:
M106 S___
  - Correct answer: 255
  - Hint: Maximum common fan value
  - Explanation: S255 is commonly full speed for 8-bit fan control.
- Q10 [multiple-choice]: What should you inspect when supports fail?
  - Overhang angle, cooling, speed, and support distance
  - Nozzle temperature only
  - Retraction only
  - Bed size only
  - Correct answer: 0
  - Explanation: Overhang angle describes how far a feature leans outward, and support distance is the planned gap between support and part. Geometry, material, and slicer settings all matter.

---

## 36. Marlin, Klipper, and Flavor Differences

**Why:** Firmware can interpret commands differently, so identifying the firmware helps you avoid using the wrong command or syntax.


**Theory:**

Printer G-code is not perfectly universal. Marlin, Klipper, RepRapFirmware, and vendor
 firmware may handle commands, macros, and comments differently.

G29 ; bed leveling on many Marlin setups
BED_MESH_CALIBRATE ; Klipper command provided by a configured [bed_mesh] section
M486 S2 ; object cancel support on some setups

When a command seems right but fails, check the firmware flavor, enabled configuration sections, and printer documentation.


**Quiz:**

- Q1 [multiple-choice]: Why can the same command behave differently on two printers?
  - Firmware flavor can differ
  - Every printer uses an identical configuration
  - The slicer overrides all firmware behavior
  - Filament color changes command meaning
  - Correct answer: 0
  - Explanation: Firmware implementations and enabled features vary.
- Q2 [multiple-choice]: Which Klipper bed-mesh command is shown in the configured example?
  - BED_MESH_CALIBRATE
  - G29
  - M104 S210
  - G1 X10
  - Correct answer: 0
  - Explanation: BED_MESH_CALIBRATE is provided when Klipper's [bed_mesh] section is configured.
- Q3 [multiple-choice]: What does G29 often mean on many Marlin setups?
  - Bed leveling/probing
  - Fan off
  - Disable motors
  - Extrude 29 mm
  - Correct answer: 0
  - Explanation: G29 is often used for probing or leveling in Marlin-style workflows.
- Q4 [multiple-choice]: Which source defines the commands supported by the printer?
  - Printer firmware documentation
  - Filament profile
  - Bed-mesh result
  - Print-preview colors
  - Correct answer: 0
  - Explanation: Firmware documentation tells you which commands and macros are supported.
- Q5 [fill-blank]: Complete the common Marlin probing command:
___
  - Correct answer: G29
  - Hint: Bed leveling/probing
  - Explanation: G29 is commonly bed probing on many Marlin setups.
- Q6 [multiple-choice]: Which setting must match so the slicer emits compatible command syntax?
  - The printer's firmware flavor
  - Layer height
  - Infill density
  - Print orientation
  - Correct answer: 0
  - Explanation: The slicer needs to emit commands the printer understands.
- Q7 [multiple-choice]: Which command is a normal motion command across many flavors?
  - G1 X10 Y10
  - BED_MESH_CALIBRATE
  - Vendor macro only
  - Unknown macro
  - Correct answer: 0
  - Explanation: G1 movement is widely supported.
- Q8 [multiple-choice]: Which assumption is safest when using advanced commands?
  - The firmware must support the command before you use it
  - The command works on every firmware
  - The command is universal across firmware flavors
  - A rejected command can be ignored safely
  - Correct answer: 0
  - Explanation: Advanced commands may depend on firmware options.
- Q9 [fill-blank]: Complete the idea: firmware flavor affects command ____.
  - Correct answer: support
  - Hint: What commands are available
  - Explanation: Firmware flavor affects command support and behavior.
- Q10 [multiple-choice]: Why should learners verify commands against the printer's firmware documentation?
  - You learn the pattern and then verify machine-specific details
  - You can ignore printer documentation
  - Every printer is identical
  - All slicers emit identical commands
  - Correct answer: 0
  - Explanation: The concept transfers, but the exact command set must be verified.

---

## 37. T Commands, Filament Changes, and Purging

**Why:** Tool and filament changes must control selection, movement, and purging so the print can continue cleanly.


**Theory:**

Multi-material printing adds tool changes, filament changes, purge moves, and sometimes
 wipe towers. The G-code must manage which extruder or filament is active.

This isolated Marlin example assumes that the surrounding file uses absolute extrusion mode:

T0 ; select tool 0
M83 ; temporarily use relative extrusion
G1 E12 F300 ; example purge amount
M82 ; restore the surrounding file's absolute extrusion mode
T1 ; select tool 1
M600 ; Marlin filament change with Advanced Pause enabled

Tool-change behavior is printer-specific. Some printers use multiple nozzles, some use one
 nozzle with filament switching, and some use slicer-managed purge systems.


**Quiz:**

- Q1 [multiple-choice]: What does T0 commonly select?
  - Tool or extruder 0
  - Temperature zero
  - Travel speed
  - Layer zero
  - Correct answer: 0
  - Explanation: T commands commonly select tools or extruders.
- Q2 [multiple-choice]: What does T1 commonly select?
  - Tool or extruder 1
  - Fan speed 1
  - Bed heater 1
  - Layer 1
  - Correct answer: 0
  - Explanation: T1 commonly selects the second tool/extruder.
- Q3 [multiple-choice]: What is purging used for after a tool or filament change?
  - Push old material/color out
  - Home the axes
  - Turn off the bed
  - Reset the bed mesh
  - Correct answer: 0
  - Explanation: Purging clears old material and primes the nozzle.
- Q4 [multiple-choice]: On Marlin with Advanced Pause enabled, what procedure does M600 start?
  - Filament change
  - Fan full speed
  - Disable motors
  - Metric mode
  - Correct answer: 0
  - Explanation: M600 starts Marlin's configured filament-change procedure when Advanced Pause is enabled.
- Q5 [fill-blank]: Select tool 1:
___
  - Correct answer: T1
  - Hint: Tool command
  - Explanation: T1 selects tool/extruder 1 on many setups.
- Q6 [multiple-choice]: Why can tool-change G-code vary a lot?
  - Printer hardware and firmware differ
  - All systems use the same tool count
  - Filament color selects the syntax
  - T commands are ignored
  - Correct answer: 0
  - Explanation: Multi-material systems use different hardware and firmware logic.
- Q7 [multiple-choice]: In the lesson's declared M83 example, which line commands the purge?
  - G1 E12 F300
  - T0
  - M600
  - ; select tool
  - Correct answer: 0
  - Explanation: With M83 active, positive E12 commands 12 units of relative extruder movement for this example. M82 then restores the surrounding file's absolute extrusion mode.
- Q8 [multiple-choice]: What is a purge tower used for?
  - Cleaning and priming during color changes away from the part
  - Leveling the bed
  - Cooling the hotend
  - Setting X zero
  - Correct answer: 0
  - Explanation: A purge tower handles material/color transitions.
- Q9 [fill-blank]: Complete the Marlin filament-change command used when Advanced Pause is enabled:
M___
  - Correct answer: 600
  - Hint: Filament change
  - Explanation: M600 starts the configured Marlin filament-change procedure when Advanced Pause is enabled.
- Q10 [multiple-choice]: What should you verify before using M600?
  - The firmware and required feature support it
  - The slicer uses relative extrusion
  - The printer has a probe
  - X is always zero
  - Correct answer: 0
  - Explanation: M600 requires firmware support and, on Marlin, the configured Advanced Pause feature.

---

## 38. Pauses, Runout, and Safe Resume

**Why:** A safe pause and resume process protects the print from unexpected movement, extrusion, or temperature changes.


**Theory:**

Print recovery is about pausing safely, keeping heat controlled, and resuming without
 crashing into the part or leaving blobs.

M0 ; Marlin unconditional stop
M25 ; Marlin pause an SD-card print

Pause behavior is firmware-specific. Use the printer's documented pause and resume flow. Do not assume that a bare Z move creates a relative lift or that a bare E move creates a relative prime; both depend on the active modes and current positions.


**Quiz:**

- Q1 [multiple-choice]: What is the purpose of a print pause?
  - Stop temporarily for service or inspection
  - Finish and shut down the print
  - Home all axes
  - Reset the firmware
  - Correct answer: 0
  - Explanation: Pauses let you inspect, change filament, or handle an issue.
- Q2 [multiple-choice]: In Marlin, what does M0 request?
  - An unconditional stop
  - The fan to turn off
  - The X-axis to home
  - The bed temperature to change
  - Correct answer: 0
  - Explanation: In Marlin, M0 requests an unconditional stop. How the user continues depends on the configured interface.
- Q3 [multiple-choice]: In Marlin, what does M25 do during an SD-card print?
  - Pauses the SD-card print
  - Heats the nozzle
  - Runs the fan at full speed
  - Selects a tool
  - Correct answer: 0
  - Explanation: In Marlin, M25 pauses an SD-card print.
- Q4 [multiple-choice]: Why must a pause routine verify its Z-clearance move?
  - Its result depends on positioning mode, current position, and machine limits
  - Every Z move is a 10 mm lift
  - Z moves always re-home the printer
  - Pause commands disable Z motion
  - Correct answer: 0
  - Explanation: Under absolute positioning, Z10 requests position Z10; under relative positioning, it requests a 10-unit move. A documented routine must account for the active state and limits.
- Q5 [multiple-choice]: Why can G1 Z10 not be assumed to mean a 10 mm lift?
  - Its meaning depends on G90 or G91 and the current Z position
  - Z values always control temperature
  - G1 always homes Z first
  - Z10 disables the motors
  - Correct answer: 0
  - Explanation: G90 makes Z10 an absolute destination, while G91 makes it a relative move. The active mode must be known.
- Q6 [multiple-choice]: What should you check before resuming a paused print?
  - Position, heat, prime, and clearance
  - Remaining print time only
  - File size only
  - Layer number only
  - Correct answer: 0
  - Explanation: Safe resume needs the printer ready to continue without a blob or crash.
- Q7 [multiple-choice]: Why should you prime the nozzle before resuming a paused print?
  - To restore filament flow
  - To home the bed
  - To turn off motors
  - To delete strings
  - Correct answer: 0
  - Explanation: Pauses can leave the nozzle under-primed.
- Q8 [multiple-choice]: Why can G1 E3 not be assumed to command a 3 mm prime?
  - Its result depends on M82 or M83 and the current E position
  - E values always set fan speed
  - G1 disables extrusion
  - M25 changes E to relative mode
  - Correct answer: 0
  - Explanation: With M83, E3 is a relative extruder move. With M82, it is an absolute E destination, so the current state must be known.
- Q9 [fill-blank]: Type Marlin's unconditional-stop command:
  - Correct answer: M0
  - Hint: Unconditional stop
  - Explanation: In Marlin, M0 requests an unconditional stop.
- Q10 [multiple-choice]: Why should you verify the firmware's pause behavior?
  - Pause commands are not identical everywhere
  - All pauses preserve the same machine state
  - All pauses home the axes
  - M0 and M25 are universal
  - Correct answer: 0
  - Explanation: Different printer firmware handles pause and resume differently.

---

## 39. One-Change-at-a-Time Tuning

**Why:** Changing one setting at a time makes it easier to connect each adjustment to the result you observe.


**Theory:**

Good tuning is controlled. Change one setting, print a known test, read the result, and
 record what changed.

Temp tower: tune temperature
Retraction tower: tune strings
Flow cube: tune wall thickness
Speed test: tune motion quality

If you change temperature, speed, fan, flow, and retraction all at once, you will not know
 which setting fixed or caused the result.


**Quiz:**

- Q1 [multiple-choice]: What is the best tuning habit?
  - Change one variable at a time
  - Change every variable at once
  - Change settings without recording them
  - Use one profile for every material
  - Correct answer: 0
  - Explanation: One change at a time lets you connect cause and effect.
- Q2 [multiple-choice]: What does a temperature tower help tune?
  - Nozzle temperature
  - Bed leveling
  - Retraction distance
  - Flow percentage only
  - Correct answer: 0
  - Explanation: A temperature tower compares print quality at different temperatures.
- Q3 [multiple-choice]: What does a retraction tower help tune?
  - Stringing and travel cleanup
  - Bed size
  - Z homing only
  - Program end
  - Correct answer: 0
  - Explanation: Retraction tests reveal stringing and restart quality.
- Q4 [multiple-choice]: What does a flow cube often help check?
  - Wall thickness and extrusion flow
  - Nozzle temperature
  - Retraction distance
  - Fan speed
  - Correct answer: 0
  - Explanation: Flow tests help evaluate extrusion amount.
- Q5 [fill-blank]: Complete the habit: change one ____ at a time.
  - Correct answer: variable
  - Hint: One setting
  - Explanation: One variable at a time keeps tuning readable.
- Q6 [multiple-choice]: Why should you record tuning changes?
  - To repeat or undo the changes
  - To increase print speed automatically
  - To reset the firmware
  - To change the filament profile
  - Correct answer: 0
  - Explanation: Records make tuning decisions traceable.
- Q7 [multiple-choice]: If stringing improves after changing temperature and retraction together, what is the problem?
  - You do not know which change helped
  - The print cannot be used
  - G-code stopped working
  - The bed changed size
  - Correct answer: 0
  - Explanation: Multiple simultaneous changes hide the cause.
- Q8 [multiple-choice]: Which test best targets ringing or motion quality?
  - Speed/acceleration test
  - Temperature tower
  - Flow cube
  - Retraction tower
  - Correct answer: 0
  - Explanation: Motion quality is affected by speed and acceleration.
- Q9 [fill-blank]: A retraction tower mainly checks for ____.
  - Correct answer: stringing
  - Hint: Thin plastic hairs
  - Explanation: Retraction tuning targets stringing and restart artifacts.
- Q10 [multiple-choice]: What is the goal of slicer tuning?
  - Predictable print quality through measured changes
  - Maximum speed regardless of quality
  - Several simultaneous variable changes
  - One profile for every material
  - Correct answer: 0
  - Explanation: Good tuning makes results more predictable.

---
