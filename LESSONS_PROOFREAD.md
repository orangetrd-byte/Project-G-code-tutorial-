# Proofread: Project G-Code Lessons

Total lessons: 21

## 1. What Is G-Code?

**Why:** G-code gives the machine clear instructions, one line at a time.


**Theory:**

G-code is a set of instructions that the machine reads. One block can combine compatible motion, coordinates, feed, speed, and auxiliary words; the control decides their execution order.

 
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

- Q1 [multiple-choice]: On a CNC lathe, moving Z in the negative direction means:
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
  - Hint: Clockwise is conventional for most turning operations.
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
  - The F word
  - Dedicated rapid override
  - Spindle override
  - The comment text
  - Correct answer: 1
  - Explanation: The F word does not set G00 speed. Many controls provide a separate rapid override, but its behavior must be verified in the machine manual.
- Q3 [fill-blank]: Worked example: Move to X2.500 at the example coordinate Z0.100. (not a universal safe position). Complete the block:
G00 X___ Z0.100
  - Correct answer: 2.500
  - Hint: Example diameter value = 2.500
  - Explanation: X2.500 completes the example. Z0.100 is only an example coordinate; the actual setup must establish and prove a safe clearance.

---

## 5. G01 — Linear Feed

**Why:** Feed moves are controlled cutting moves. Understanding how G01 uses feed rate helps you recognize when the tool is meant to cut instead of just travel.


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
- Q2 [multiple-choice]: At a constant 800 RPM in feed-per-revolution mode, F0.012 gives an actual feed rate of:
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

**Why:** The T-word links a physical tool to its measured geometry. Correctly pairing the tool and offset—and keeping tool number matched to offset number—prevents the control from cutting with the wrong geometry or wear values, which is a fast way to crash a tool or scrap a part.


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

 

 
On many Fanuc-style lathes, the turret usually indexes from the `T0101` call itself.
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

**Why:** Programmed positions are measured from part zero, and the work offset tells the control where that zero is located. Selecting the wrong offset — or trusting one that was never verified — can make every move end at the wrong position, so the offset must be chosen and proven before any motion that relies on it.


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

- Q1 [multiple-choice]: If you set Z0 at the finished face of the part, a cut to Z-1.000 means:
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

- Q1 [multiple-choice]: Target OD is 1.0000 and measured OD is 1.0020. What is the part?
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
- Q5 [multiple-choice]: Why make one correction at a time?
  - So you know what changed the result
  - Because G-code cannot have comments
  - Because M03 only works once
  - To avoid using G54
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
  - Remove all comments
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
  - Comment only
  - Correct answer: 0
  - Explanation: If the geometry or path is wrong, edit the program.
- Q3 [fill-blank]: If the correction is a small tool-position change, use a ____ offset.
  - Correct answer: wear
  - Hint: Small correction offset
  - Explanation: Wear offsets are used for small tool-position corrections.
- Q4 [multiple-choice]: Which change affects every future run of that program?
  - Program edit
  - Temporary single-block mode
  - Measuring the part
  - Reading a comment
  - Correct answer: 0
  - Explanation: A saved program edit changes future runs.
- Q5 [multiple-choice]: A chamfer is missing entirely. What kind of fix is needed?
  - Program or toolpath edit
  - Only X wear
  - Only spindle override
  - Only coolant
  - Correct answer: 0
  - Explanation: Missing geometry requires a toolpath or program edit.
- Q6 [multiple-choice]: Which is a bad habit?
  - Changing offsets without recording the reason
  - Measuring after a correction
  - Making one change at a time
  - Checking the tool number
  - Correct answer: 0
  - Explanation: Unrecorded changes make troubleshooting hard.
- Q7 [fill-blank]: Program edits change the tool____.
  - Correct answer: path
  - Hint: Where the tool moves
  - Explanation: Program edits change the path the tool follows.
- Q8 [multiple-choice]: Before editing a proven program, what should you confirm?
  - The measured problem is real
  - The app theme
  - The icon size
  - The operator name only
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
  - Deletes comments
  - Turns coolant on
  - Changes G54
  - Correct answer: 0
  - Explanation: Single block pauses after each block so you can verify the next move.
- Q2 [multiple-choice]: Why reduce rapid override during prove-out?
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
  - After reading a comment
  - After opening settings
  - After changing app theme
  - Correct answer: 0
  - Explanation: Edited lines need careful prove-out.
- Q6 [multiple-choice]: What should you watch during the first move?
  - Clearance and direction
  - Only the clock
  - Only the part color
  - Only the logo
  - Correct answer: 0
  - Explanation: Verify that the tool moves in the expected direction with safe clearance.
- Q7 [multiple-choice]: What does Dry Run do on the referenced Haas control?
  - Moves the machine using selected dry-run rates to help check a program
  - Measures final part size
  - Replaces all offsets
  - Turns comments into code
  - Correct answer: 0
  - Explanation: Dry Run changes how rapid and feed motion rates are executed, but it still moves axes and may perform tool changes. It is a check mode, not a guarantee of safety.
- Q8 [fill-blank]: Type the control mode: ____ Block ON
  - Correct answer: Single
  - Hint: Runs one line at a time
  - Explanation: Single Block ON is used for careful prove-out.
- Q9 [multiple-choice]: Which move deserves extra attention?
  - The first rapid move after a tool change
  - A blank comment
  - The app build number
  - A finished review
  - Correct answer: 0
  - Explanation: After a tool change, the active tool, offset, orientation, and full clearance path must all be verified before rapid motion.
- Q10 [multiple-choice]: A safe prove-out mindset is:
  - Assume nothing; verify each move.
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
- Q3 [multiple-choice]: Why set G20 or G21 near the top?
  - So every number is read in the intended units
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
- Q6 [multiple-choice]: A program written in inches but run in metric mode will likely:
  - Move the wrong distances
  - Automatically convert perfectly
  - Only change comments
  - Disable M03
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
  - Program comments
  - Tool name text
  - Correct answer: 0
  - Explanation: Coordinate values are interpreted in the active unit mode.
- Q9 [multiple-choice]: Before running an unfamiliar program, what should you check?
  - Unit mode
  - Phone brightness
  - App theme
  - File color
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

- Q1 [multiple-choice]: What does feed mode control?
  - What the F value means
  - Tool number only
  - Comment style
  - Program name
  - Correct answer: 0
  - Explanation: Feed mode changes how the control interprets feed rate.
- Q2 [multiple-choice]: On Haas and Fanuc lathes, G99 means:
  - Feed per revolution
  - Feed per minute
  - Metric units
  - Rapid motion
  - Correct answer: 0
  - Explanation: G99 is feed per revolution on Haas/Fanuc lathes.
- Q3 [multiple-choice]: On Haas and Fanuc lathes, G98 means:
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
- Q7 [multiple-choice]: If the wrong feed mode is active, the machine may:
  - Feed too fast or too slow
  - Ignore all coordinates
  - Delete the program
  - Change tool numbers
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
  - Comment text
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

- Q1 [multiple-choice]: What is modal state?
  - Codes that stay active until changed
  - Only comments
  - Only the current tool name
  - The app progress screen
  - Correct answer: 0
  - Explanation: Modal codes remain active until another code changes or cancels them.
- Q2 [multiple-choice]: Which is a modal setting?
  - G20 or G21 units
  - A comment only
  - Program title text
  - Operator name
  - Correct answer: 0
  - Explanation: Unit mode is modal.
- Q3 [multiple-choice]: Why use a setup block?
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
  - Only phone battery
  - Only app theme
  - Only the comment
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
  - It changes the screen color
  - It removes all tools
  - It deletes comments
  - Correct answer: 0
  - Explanation: An unknown modal state can make a correct-looking block behave incorrectly.
- Q9 [multiple-choice]: Which habit improves safety?
  - Read the active modes before starting the cycle
  - Ignore the position display
  - Run first, check later
  - Delete setup blocks
  - Correct answer: 0
  - Explanation: Checking the active modes helps identify an incorrect setup before motion.
- Q10 [multiple-choice]: A good setup line should be:
  - Clear and intentional
  - Random
  - Hidden in comments
  - Only M30
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
  - To make comments execute
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
- Q9 [multiple-choice]: Why verify shop-specific M-codes?
  - Some machines customize auxiliary functions
  - All controls ignore M-codes
  - M-codes only work in apps
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

**Why:** Repetitive motion belongs in one place. A subprogram lets one tested routine run many times, but a single edit then affects every repeat — so the call, the repeat count, and the return must be unambiguous.


**Theory:**

This shows a **Haas/Fanuc-style subprogram example**. Call and return words, P/L word meanings, and where a subprogram may live vary by control; verify the exact manual before use.

 
Subprograms keep repeated motion in one place. The main program calls the subprogram; the subprogram runs and returns.

 
M98 P2000 L3 ; call O2000 three times
...
O2000
G01 Z-0.100 F0.006
M99 ; return

 
**Local vs. external subprograms:**

 

 
`M98 P____` calls a subprogram by number. On many Haas/Fanuc-style controls, it usually points to another program (external O-number) held in the control, or to a local routine.

 
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
  - Feedrate 2000
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
- Q9 [multiple-choice]: Why use a subprogram?
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
- Q12 [multiple-choice]: Before editing a repeated subprogram, remember:
  - One edit can affect every repeat
  - Only the first repeat changes
  - Comments become motion
  - M98 cancels all offsets
  - Correct answer: 0
  - Explanation: Subprogram edits can affect every call and every repeat.

---

## 19. G81, G83, R Plane, and Return

**Why:** Drilling cycles repeat a safe plunge automatically, but the retract level and peck depth decide whether chips clear and whether the tool returns to the right height. Getting R and the return mode wrong can crash the tool or leave a poor hole.


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
- Q8 [multiple-choice]: Why use peck drilling?
  - To break chips and clear the hole
  - To turn coolant off
  - To change app language
  - To home all axes
  - Correct answer: 0
  - Explanation: Pecking helps chip evacuation and reduces drilling load.
- Q9 [multiple-choice]: On a mill, G99 return mode sends the tool back to:
  - The R plane after each hole
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
- Q12 [multiple-choice]: Why cancel with G80 before unrelated motion?
  - So the control leaves drilling-cycle mode
  - So comments run
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
  - Comments become active
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
  - Only the app icon
  - Only the comment spelling
  - Only screen brightness
  - Correct answer: 0
  - Explanation: Recovery requires checking every machine state that affects motion.
- Q5 [fill-blank]: A safe restart begins from a known ____.
  - Correct answer: state
  - Hint: Known condition
  - Explanation: A known state means that the modes, offsets, tool, and position are understood.
- Q6 [multiple-choice]: Why avoid guessing after an alarm?
  - Wrong assumptions can cause a crash
  - Guessing improves accuracy
  - Alarms erase all danger
  - Offsets stop mattering
  - Correct answer: 0
  - Explanation: A wrong recovery move can be more dangerous than the original alarm.
- Q7 [multiple-choice]: Which is a safer verification habit?
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
  - The nearest comment
  - The highest rapid setting
  - Correct answer: 0
  - Explanation: No block is safe by label alone. The control's restart behavior, current state, path, and approved procedure must agree.
- Q10 [multiple-choice]: A safe approach to recovery should be:
  - Slow, verified, and deliberate
  - Fast and based on guesses
  - Based on luck
  - Focused only on XP
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

 

 
Haas recommends programming `G99` feed per revolution before G76. The official example also uses `G97` fixed RPM. Thread dimensions and cutting values must come from the approved print, tooling data, and machine procedure.


**Quiz:**

- Q1 [multiple-choice]: Why does this documented Haas G76 example specify G97?
  - CSS uses too much power
  - The documented example turns CSS off and commands a fixed spindle speed
  - G96 doesn't work with G76
  - Constant RPM gives better surface finish
  - Correct answer: 1
  - Explanation: Haas labels G97 as CSS off and uses a fixed 500 RPM in this example. Follow the spindle mode required by the exact controller and approved process.
- Q2 [multiple-choice]: In this Haas G76 format, the F word represents:
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
