// ============================================================
//  Project G-Code Tutorial — Lesson Data
//  All lesson content, exercises, and quiz questions live here.
//  Adding a new lesson = adding one object to the LESSONS array.
// ============================================================

const LESSONS = [

  // ─── UNIT 1: FOUNDATIONS ────────────────────────────────────
  {
    id: "u1-l1",
    unit: 1,
    unitName: "Foundations",
    lesson: 1,
    title: "What Is G-Code?",
    why: "G-code is the link between an idea and machine motion. Understanding that every block tells the machine what to do prevents guessing when a program moves wrong.",
    icon: "📋",
    xp: 10,
    theory: `
      <p>G-code is the language CNC machines speak. Every move your lathe or mill makes — 
      rapid to position, feed to depth, spindle on/off — is triggered by a line of G-code.</p>
      <p>Each line is called a <strong>block</strong>. Blocks run top to bottom, one at a time. 
      A typical block looks like:</p>
      <pre>N010 G01 X1.500 Z-0.750 F0.012</pre>
      <p>Breaking that down:</p>
      <ul>
        <li><code>N010</code> — line number (optional but helpful)</li>
        <li><code>G01</code> — G-word: <em>what to do</em> (linear feed move)</li>
        <li><code>X1.500 Z-0.750</code> — coordinates: <em>where to go</em></li>
        <li><code>F0.012</code> — feedrate: <em>how fast</em> (inches per rev)</li>
      </ul>
      <p>G-code is <strong>modal</strong> — most codes stay active until cancelled. 
      You only have to write <code>G01</code> once; it stays in effect for every following 
      block until you change it.</p>
    `,
    visual: "block-anatomy",
    quiz: [
      {
        id: "u1-l1-q1",
        type: "multiple-choice",
        question: "What does 'modal' mean in G-code?",
        options: [
          "The code controls a popup window",
          "A code stays active until changed or cancelled",
          "The code only runs once",
          "The code controls spindle speed"
        ],
        answer: 1,
        explanation: "Modal codes stay active after they are called. G01, for example, keeps the machine in linear feed mode until you call G00 or another motion code."
      },
      {
        id: "u1-l1-q2",
        type: "multiple-choice",
        question: "Which part of this block tells the machine WHERE to move?\nN020 G00 X2.000 Z0.100 S800 M03",
        options: ["N020", "G00", "X2.000 Z0.100", "S800 M03"],
        answer: 2,
        explanation: "X and Z are coordinate words. They define the destination position for the move."
      },
      {
        id: "u1-l1-q3",
        type: "fill-blank",
        question: "Model rapid move:\nG00 X2.000 Z0.100\n\nYour turn: complete the rapid block:\nN010 ___ X0 Z0.1",
        answer: "G00",
        hint: "G00 = rapid positioning",
        explanation: "G00 is the rapid traverse code. G0 is also accepted on many systems; both mean rapid positioning, but G00 is easier for beginners to scan."
      }
    ]
  },

  {
    id: "u1-l2",
    unit: 1,
    unitName: "Foundations",
    lesson: 2,
    title: "The Coordinate System",
    why: "Coordinates decide where the tool actually goes. If X, Z, zero, or diameter mode are misunderstood, even correct-looking code can cut the wrong place.",
    icon: "📐",
    xp: 10,
    theory: `
      <p>On a CNC lathe, position is described with two axes:</p>
      <ul>
        <li><strong>Z-axis</strong> — runs along the spindle centerline. 
        Negative Z moves the tool toward the chuck. Positive Z moves it away.</li>
        <li><strong>X-axis</strong> — controls diameter. 
        X values are <em>diameter values</em> on most lathes (diameter mode = G07 off / default).</li>
      </ul>
      <p>Work zero (the program origin) is almost always set at:</p>
      <ul>
        <li>Z0 = the <strong>face of the finished part</strong></li>
        <li>X0 = the <strong>spindle centerline</strong></li>
      </ul>
      <p><strong>Absolute vs. Incremental:</strong></p>
      <ul>
        <li><code>G90</code> — Absolute mode. All positions measured from program zero.</li>
        <li><code>G91</code> — Incremental mode. Each move measured from <em>current position</em>.</li>
      </ul>
      <p>Almost all lathe programs run in G90. You'll rarely use G91 except for specific sub-routines.</p>
    `,
    visual: "lathe-axes",
    quiz: [
      {
        id: "u1-l2-q1",
        type: "multiple-choice",
        question: "On a CNC lathe, moving Z in the negative direction means:",
        options: [
          "Increasing the cut diameter",
          "Moving the tool away from the chuck",
          "Moving the tool toward the chuck",
          "Lowering the tool height"
        ],
        answer: 2,
        explanation: "Negative Z moves the tool toward the chuck (into the part). Positive Z retracts away."
      },
      {
        id: "u1-l2-q2",
        type: "multiple-choice",
        question: "You program X1.500 on a lathe in diameter mode. What is the actual radius of cut?",
        options: ["1.500\"", "3.000\"", "0.750\"", "0.375\""],
        answer: 2,
        explanation: "X values in diameter mode represent the full diameter. X1.500 = 1.500\" diameter = 0.750\" radius."
      },
      {
        id: "u1-l2-q3",
        type: "multiple-choice",
        question: "Which code puts the machine in absolute positioning mode?",
        options: ["G91", "G90", "G92", "G28"],
        answer: 1,
        explanation: "G90 = absolute mode. All X and Z values reference the program zero point."
      }
    ]
  },

  {
    id: "u1-l3",
    unit: 1,
    unitName: "Foundations",
    lesson: 3,
    title: "Program Structure",
    why: "Program structure makes code predictable. Knowing the setup, safety, cutting, and ending sections helps you find problems before the machine runs.",
    icon: "🗂️",
    xp: 15,
    theory: `
      <p>Every G-code program follows a predictable skeleton. Learn this structure 
      and you can read — and write — any program.</p>
      <pre>%                          ; Tape start / rewind stop
O1001                      ; Program number
(PART: SHAFT 001)          ; Comment / description
(TOOL: T0101 - OD ROUGH)   ; Tool description comment

N10 G20 G40 G49            ; Safety block — inch mode, cancel comp
N20 G28 U0. W0.            ; Machine home
N30 T0101 M06              ; Tool call + tool change
N40 G96 S400 M03 F0.012    ; CSS on, spindle on CW, feedrate
N50 G00 X2.200 Z0.100      ; Rapid to start position

( --- CUT --- )
N60 G01 Z-1.500            ; Feed move
N70 X2.400                 ; Pull off diameter
N80 G00 Z0.100             ; Rapid back

N90 M05                    ; Spindle off
N100 G28 U0. W0.           ; Home
N110 M30                   ; End program, rewind
%</pre>
      <p>The <strong>safety block</strong> (N10) is critical — it cancels leftover modal codes 
      from a previous program. Always include it.</p>
      <p><strong>M-codes</strong> are machine functions: M03 = spindle CW, M05 = spindle off, 
      M30 = end program.</p>
    `,
    visual: "program-structure",
    quiz: [
      {
        id: "u1-l3-q1",
        type: "multiple-choice",
        question: "What is the purpose of M30?",
        options: [
          "Turn the spindle on",
          "Call a subroutine",
          "End the program and rewind to the start",
          "Set the feedrate"
        ],
        answer: 2,
        explanation: "M30 ends the program and rewinds it so it's ready to run again. Always end programs with M30."
      },
      {
        id: "u1-l3-q2",
        type: "multiple-choice",
        question: "Why is a 'safety block' (e.g., G20 G40 G49) placed at the start of a program?",
        options: [
          "It sets the spindle speed",
          "It cancels leftover modal codes from a previous program",
          "It homes the machine",
          "It defines the work offset"
        ],
        answer: 1,
        explanation: "Modal codes persist between programs on many controls. A safety block explicitly cancels cutter comp (G40), tool length offset (G49), and sets inch/metric mode — preventing crashes from leftover states."
      },
      {
        id: "u1-l3-q3",
        type: "fill-blank",
        question: "Write the M-code that turns the spindle ON clockwise:",
        answer: "M03",
        hint: "Clockwise = conventional for most turning ops",
        explanation: "M03 = spindle on clockwise. M04 = counterclockwise. M05 = spindle off."
      }
    ]
  },

  // ─── UNIT 2: MOTION CODES ───────────────────────────────────
  {
    id: "u2-l1",
    unit: 2,
    unitName: "Motion Codes",
    lesson: 1,
    title: "G00 — Rapid Positioning",
    why: "Rapid moves are useful because they save time, but dangerous because they leave little time to react. The reason for G00 is positioning, not cutting.",
    icon: "⚡",
    xp: 15,
    theory: `
      <p><code>G00</code> moves the tool at the machine's maximum traverse speed — 
      no cutting, just positioning.</p>
      <pre>G00 X2.200 Z0.100</pre>
      <p><strong>Rules of G00:</strong></p>
      <ul>
        <li>Never rapid into material — always leave a small clearance (0.050"–0.100")</li>
        <li>Feed override does NOT apply — the machine goes full speed</li>
        <li>On most lathes, X and Z move simultaneously (diagonal path)</li>
        <li>It's modal — stays active until another G-motion code is called</li>
      </ul>
      <p><strong>Typical uses:</strong> approaching the part, pulling clear after a cut, 
      moving between features.</p>
      <p class="callout warning">⚠️ Crashing a rapid move into the part is the #1 cause 
      of broken tools and damaged workholding. Always visualize your clearances.</p>
    `,
    visual: "rapid-path",
    quiz: [
      {
        type: "multiple-choice",
        question: "Which clearance is safe before starting a G00 rapid toward the part face?",
        options: ["0.001\"", "Touching the face", "0.050\" to 0.100\"", "It doesn't matter for G00"],
        answer: 2,
        explanation: "Always leave 0.050\"–0.100\" clearance before the part face on a rapid. This prevents crashes if your Z offset is slightly off."
      },
      {
        type: "multiple-choice",
        question: "Does the feed override knob slow down a G00 rapid move?",
        options: [
          "Yes, always",
          "No, G00 runs at machine max speed regardless",
          "Only if you program it",
          "Yes, but only under 50%"
        ],
        answer: 1,
        explanation: "G00 ignores feedrate override on most controls. It always runs at maximum traverse speed. Use G01 if you need a controlled approach."
      },
      {
        type: "fill-blank",
        question: "Complete: Move rapidly to X2.500, Z clearance of 0.100\"\nG00 X___ Z0.100",
        answer: "2.500",
        hint: "Diameter value = 2.500",
        explanation: "X2.500 puts the tool at a 2.500\" diameter position. Paired with Z0.100 this is a safe rapid approach position."
      }
    ]
  },

  {
    id: "u2-l2",
    unit: 2,
    unitName: "Motion Codes",
    lesson: 2,
    title: "G01 — Linear Feed",
    why: "Feed moves are controlled cutting moves. Understanding why G01 uses feedrate explains when the tool is meant to cut instead of just travel.",
    icon: "➡️",
    xp: 15,
    theory: `
      <p><code>G01</code> is your workhorse — straight-line cutting moves at a controlled feedrate.</p>
      <pre>G01 X1.500 Z-1.000 F0.010</pre>
      <p>The <code>F</code> word sets the feedrate:</p>
      <ul>
        <li><strong>IPR</strong> (inches per revolution) — most common for turning. 
        Typical range: F0.005 to F0.020</li>
        <li><strong>IPM</strong> (inches per minute) — used in milling, some controls</li>
      </ul>
      <p>G01 can move in X only, Z only, or both simultaneously (taper cuts).</p>
      <pre>; Facing cut (X only)
G01 X-0.062 F0.008

; Turning cut (Z only)  
G01 Z-2.000 F0.012

; Taper (both axes at once)
G01 X1.750 Z-1.500 F0.010</pre>
      <p>Feedrate is <strong>modal</strong> — set it once and it carries forward until changed.</p>
    `,
    visual: "linear-feed",
    quiz: [
      {
        type: "multiple-choice",
        question: "You need to face the part to length. Which block is correct?",
        options: [
          "G00 X-0.100 F0.010",
          "G01 X-0.062 F0.008",
          "G01 Z0.100 F0.008",
          "G00 Z-0.100"
        ],
        answer: 1,
        explanation: "Facing moves in X (reducing diameter to zero or past centerline). G01 with a negative X value and a feedrate is correct. G00 should never be used to cut."
      },
      {
        type: "multiple-choice",
        question: "F0.012 in IPR mode at 800 RPM gives an actual feedrate of:",
        options: ["0.012 IPM", "9.6 IPM", "12 IPM", "800 IPM"],
        answer: 1,
        explanation: "IPM = IPR × RPM. 0.012 × 800 = 9.6 inches per minute."
      },
      {
        type: "fill-blank",
        question: "Write a turning cut to Z-2.250 at F0.010:\nG01 Z___ F0.010",
        answer: "-2.250",
        hint: "Negative Z = toward the chuck",
        explanation: "Z-2.250 means 2.250\" from part zero toward the chuck. The negative sign is required."
      }
    ]
  },

  {
    id: "u2-l3",
    unit: 2,
    unitName: "Motion Codes",
    lesson: 3,
    title: "G02 & G03 — Arc Moves",
    why: "Arc direction changes the actual toolpath. Understanding the shape first makes the code letters easier to remember and easier to troubleshoot.",
    icon: "🔄",
    xp: 20,
    theory: `
      <p>Arcs are programmed with G02 (clockwise) and G03 (counterclockwise).</p>
      <p>There are two ways to define an arc:</p>
      <h4>Method 1: Radius (R)</h4>
      <pre>G02 X1.500 Z-0.500 R0.250 F0.008</pre>
      <p>Moves to X1.500 Z-0.500 along a 0.250" radius arc, clockwise.</p>
      <h4>Method 2: Center Offsets (I and K)</h4>
      <pre>G02 X1.500 Z-0.500 I0.0 K-0.250 F0.008</pre>
      <ul>
        <li><code>I</code> = distance from start point to arc center in <strong>X</strong></li>
        <li><code>K</code> = distance from start point to arc center in <strong>Z</strong></li>
      </ul>
      <p>The R method is simpler for most cases. Use I/K when you need a full circle 
      or when R gives an ambiguous result (two possible arcs).</p>
      <p class="callout tip">💡 Tip: On a lathe, G02 cuts a concave radius (like a fillet 
      at a shoulder) and G03 cuts a convex radius (like the nose of a ball).</p>
    `,
    visual: "arc-moves",
    quiz: [
      {
        type: "multiple-choice",
        question: "Which code cuts a clockwise arc?",
        options: ["G01", "G02", "G03", "G04"],
        answer: 1,
        explanation: "G02 = clockwise arc. G03 = counterclockwise. Think: G02 = 'clockwise' (both start with C in their meaning)."
      },
      {
        type: "multiple-choice",
        question: "You want a 0.125\" radius corner blend. Which R value do you use?",
        options: ["R0.250", "R0.125", "R0.0625", "R1.000"],
        answer: 1,
        explanation: "R specifies the actual radius of the arc. For a 0.125\" radius blend, R0.125 is correct."
      },
      {
        type: "fill-blank",
        question: "Complete the CCW arc to X2.000 Z-0.500 with R0.250:\nG___ X2.000 Z-0.500 R0.250 F0.008",
        answer: "G03",
        hint: "CCW = counterclockwise",
        explanation: "G03 is counterclockwise arc motion. G02 would be clockwise."
      }
    ]
  },

  // ─── UNIT 3: TURNING OPERATIONS ─────────────────────────────
  {
    id: "u3-l1",
    unit: 3,
    unitName: "Turning Ops",
    lesson: 1,
    title: "Spindle Speed: G96 & G97",
    icon: "🔩",
    xp: 20,
    theory: `
      <p>The lathe spindle can be controlled in two ways:</p>
      <h4>G96 — Constant Surface Speed (CSS)</h4>
      <pre>G96 S400 M03</pre>
      <p>The control automatically adjusts RPM so the cutting speed stays at 400 SFM 
      regardless of diameter. As the tool moves to a smaller diameter, RPM increases.</p>
      <p><strong>Use CSS for:</strong> turning, facing, and profiling — any op where diameter changes.</p>
      <p>Set a max RPM clamp with <code>G50 S____</code> to prevent runaway speed at small diameters:</p>
      <pre>G50 S3000    ; Clamp max at 3000 RPM
G96 S400 M03 ; CSS at 400 SFM</pre>
      <h4>G97 — Constant RPM</h4>
      <pre>G97 S1200 M03</pre>
      <p>Spindle runs at a fixed 1200 RPM regardless of diameter.</p>
      <p><strong>Use constant RPM for:</strong> threading (G32/G76), drilling, boring bars, 
      and grooving on small diameters.</p>
    `,
    visual: "spindle-speed",
    quiz: [
      {
        type: "multiple-choice",
        question: "Why is G50 S3000 paired with G96?",
        options: [
          "To set a minimum spindle speed",
          "To clamp the maximum RPM so it doesn't spin dangerously fast at small diameters",
          "To switch to metric mode",
          "To cancel CSS mode"
        ],
        answer: 1,
        explanation: "As diameter decreases, G96 increases RPM to maintain surface speed. Without a G50 clamp, RPM can reach unsafe levels near the centerline."
      },
      {
        type: "multiple-choice",
        question: "You're programming a threading cycle. Which spindle mode should you use?",
        options: ["G96 (CSS)", "G97 (Constant RPM)"],
        answer: 1,
        explanation: "Threading requires constant RPM. The control tracks spindle encoder pulses to synchronize the feed. CSS would change RPM mid-thread and ruin the pitch."
      },
      {
        type: "fill-blank",
        question: "Write the line to run constant surface speed at 350 SFM, spindle CW:\nG96 S___ M03",
        answer: "350",
        hint: "S value = surface feet per minute in G96 mode",
        explanation: "In G96 mode, the S word is surface feet per minute (or m/min in metric). S350 = 350 SFM."
      }
    ]
  },

  {
    id: "u3-l2",
    unit: 3,
    unitName: "Turning Ops",
    lesson: 2,
    title: "G71 — Rough Turning Cycle",
    icon: "🔧",
    xp: 25,
    theory: `
      <p>G71 is a canned rough turning cycle — it automatically takes multiple passes to 
      rough out a profile, leaving stock for finishing.</p>
      <pre>G71 U0.100 R0.050
G71 P100 Q200 U0.020 W0.005 F0.015</pre>
      <p><strong>First line — depth and retract:</strong></p>
      <ul>
        <li><code>U0.100</code> — depth of cut per pass (0.100" on the radius)</li>
        <li><code>R0.050</code> — retract amount between passes</li>
      </ul>
      <p><strong>Second line — profile and stock:</strong></p>
      <ul>
        <li><code>P100</code> — block number where profile starts</li>
        <li><code>Q200</code> — block number where profile ends</li>
        <li><code>U0.020</code> — finish stock to leave on the diameter (0.020" total)</li>
        <li><code>W0.005</code> — finish stock to leave on the face (Z direction)</li>
        <li><code>F0.015</code> — roughing feedrate</li>
      </ul>
      <p>After G71, run a <code>G70 P100 Q200</code> finish pass with your finishing feedrate 
      to clean up to the final profile.</p>
    `,
    visual: "g71-cycle",
    quiz: [
      {
        type: "multiple-choice",
        question: "In G71 U0.100 R0.050, what does U0.100 specify?",
        options: [
          "The finish stock on the diameter",
          "The depth of cut per roughing pass",
          "The retract distance",
          "The feedrate"
        ],
        answer: 1,
        explanation: "In the first G71 block, U = depth of cut per pass (on the radius). A larger U means fewer, heavier passes."
      },
      {
        type: "multiple-choice",
        question: "What code runs the finishing pass after a G71 rough cycle?",
        options: ["G72", "G70", "G73", "G76"],
        answer: 1,
        explanation: "G70 is the finish turning cycle. It follows the same P-Q profile blocks as the G71 rough, but at finishing feedrate and to the final dimension."
      },
      {
        type: "multiple-choice",
        question: "U0.020 W0.005 in the G71 second block means:",
        options: [
          "Feed at 0.020 IPR with 0.005\" retract",
          "Leave 0.020\" stock on diameter, 0.005\" on face",
          "Take 0.020\" depth, retract 0.005\"",
          "Rough at 0.020\", finish at 0.005\""
        ],
        answer: 1,
        explanation: "In the second G71 block, U = finish allowance on the diameter (X direction), W = finish allowance on the face (Z direction). These are left for the G70 finish pass."
      }
    ]
  },

  {
    id: "u3-l3",
    unit: 3,
    unitName: "Turning Ops",
    lesson: 3,
    title: "G76 — Threading Cycle",
    icon: "🔩",
    xp: 30,
    theory: `
      <p>G76 is the canned threading cycle — it handles all infeed passes automatically.</p>
      <pre>G97 S700 M03         ; Constant RPM for threading
G00 X1.100 Z0.200    ; Approach

G76 P010060 Q0050 R0.003
G76 X0.8647 Z-1.500 P0677 Q0200 F0.0625</pre>
      <p><strong>First line — thread form:</strong></p>
      <ul>
        <li><code>P010060</code> — 01 = number of spring passes, 00 = thread chamfer, 60 = thread angle (60° for UN threads)</li>
        <li><code>Q0050</code> — minimum depth of cut (0.0050")</li>
        <li><code>R0.003</code> — finish allowance</li>
      </ul>
      <p><strong>Second line — thread dimensions:</strong></p>
      <ul>
        <li><code>X0.8647</code> — minor diameter (thread root)</li>
        <li><code>Z-1.500</code> — thread length</li>
        <li><code>P0677</code> — thread depth (0.0677")</li>
        <li><code>Q0200</code> — first pass depth (0.0200")</li>
        <li><code>F0.0625</code> — lead (1/16 = 16 TPI)</li>
      </ul>
      <p class="callout tip">💡 For 1"-8 UN thread: minor Ø ≈ 0.8647", thread depth ≈ 0.0677", F = 0.125 (1/8" lead)</p>
    `,
    visual: "threading",
    quiz: [
      {
        type: "multiple-choice",
        question: "Why must G97 (constant RPM) be active during a threading cycle?",
        options: [
          "CSS uses too much power",
          "Threading requires synchronized RPM and feed — CSS changes RPM and destroys the thread pitch",
          "G96 doesn't work with G76",
          "Constant RPM gives better surface finish"
        ],
        answer: 1,
        explanation: "The control uses spindle encoder feedback to time the feed. If RPM changes (as it would with CSS), the lead (pitch) becomes inconsistent and the thread is ruined."
      },
      {
        type: "multiple-choice",
        question: "In G76, the F word represents:",
        options: [
          "The feedrate in IPR",
          "The thread lead (pitch)",
          "The finish feedrate",
          "The number of passes"
        ],
        answer: 1,
        explanation: "In a threading cycle, F = lead (distance the tool travels per spindle revolution = pitch for single-start threads). For 16 TPI: F = 1/16 = 0.0625\"."
      },
      {
        type: "fill-blank",
        question: "What F value programs a 20 TPI thread? (F = 1/TPI)\nF___",
        answer: "0.050",
        hint: "1 ÷ 20 = ?",
        explanation: "Lead = 1 ÷ TPI. 1 ÷ 20 = 0.050\". So F0.050 programs a 20 TPI thread."
      }
    ]
  },

  // ─── UNIT 4: TOOLING & OFFSETS ──────────────────────────────
  {
    id: "u4-l1",
    unit: 4,
    unitName: "Tooling & Offsets",
    lesson: 1,
    title: "Tool Calls & Offsets",
    icon: "🎯",
    xp: 20,
    theory: `
      <p>Tool calls on a lathe turret use the T-word:</p>
      <pre>T0101   ; Tool 1, Offset 1
T0202   ; Tool 2, Offset 2
T0100   ; Cancel offset (tool 1, no offset)</pre>
      <p>The T-word has four digits: <code>T</code> + <em>tool number</em> (2 digits) + <em>offset number</em> (2 digits).</p>
      <p>The <strong>tool offset</strong> (stored in the control's wear offset page) compensates for:</p>
      <ul>
        <li>Exact tool tip position after touch-off</li>
        <li>Tool wear (small adjustments to hit size)</li>
        <li>Nose radius compensation geometry</li>
      </ul>
      <p>On most Fanuc-style controls, tool change also requires <code>M06</code> 
      (or the turret indexes automatically on T-call, depending on the machine).</p>
      <p class="callout tip">💡 Keeping tool number = offset number (T0101, T0202...) 
      prevents confusion when troubleshooting offsets.</p>
    `,
    visual: "tool-offsets",
    quiz: [
      {
        type: "multiple-choice",
        question: "What does T0304 mean?",
        options: [
          "Tool 3, Offset 4",
          "Tool 4, Offset 3",
          "Tool 03, no offset",
          "Tool 34, Offset 0"
        ],
        answer: 0,
        explanation: "T-word format: T + 2-digit tool number + 2-digit offset number. T0304 = Tool station 3, using offset register 4."
      },
      {
        type: "multiple-choice",
        question: "How do you cancel the active tool offset without changing tools?",
        options: [
          "T0000",
          "T0100 (tool 1, offset 00)",
          "G49",
          "M06"
        ],
        answer: 1,
        explanation: "Using offset 00 cancels the offset. T0100 keeps tool 1 in position but cancels its offset. T0000 would address tool 0 which doesn't exist."
      },
      {
        type: "fill-blank",
        question: "Write the T-word for Tool 2 using Offset 2:\nT____",
        answer: "0202",
        hint: "4 digits: tool number then offset number",
        explanation: "T0202 = Tool station 2, Offset register 2. This is the standard convention — offset number matches tool number."
      }
    ]
  },

  {
    id: "u4-l2",
    unit: 4,
    unitName: "Tooling & Offsets",
    lesson: 2,
    title: "Work Offsets & G54",
    icon: "📍",
    xp: 20,
    theory: `
      <p>Work offsets define where your program zero is relative to machine home. 
      G54 through G59 are the standard work offset registers.</p>
      <pre>G54   ; Use work offset 1 (most common)
G55   ; Work offset 2
G56   ; Work offset 3</pre>
      <p>On a lathe, the work offset stores the Z distance from machine home to the 
      face of your part (after facing). The X offset is typically set at the spindle centerline.</p>
      <p><strong>Setting a work offset (touch-off procedure):</strong></p>
      <ol>
        <li>Face the part to clean up the end face</li>
        <li>Without moving Z, measure the part length or touch the face</li>
        <li>Enter the Z value into the G54 offset register</li>
        <li>The control now knows where Z0 is on your part</li>
      </ol>
      <p>Always call your work offset at the top of the program, before any motion — 
      usually in the same block as the safety line or immediately after.</p>
    `,
    visual: "work-offsets",
    quiz: [
      {
        type: "multiple-choice",
        question: "If you set Z0 at the finished face of the part, a cut to Z-1.000 means:",
        options: [
          "1.000\" above the face",
          "1.000\" into the part from the face",
          "1.000\" from machine home",
          "1.000\" from the chuck face"
        ],
        answer: 1,
        explanation: "With Z0 at the part face, Z-1.000 is 1.000\" into the part from that face — 1.000\" depth from the finished end."
      },
      {
        type: "multiple-choice",
        question: "Which G-code is the most commonly used work offset on a lathe?",
        options: ["G52", "G53", "G54", "G92"],
        answer: 2,
        explanation: "G54 is the first — and most commonly used — work coordinate offset register. It's the default starting point for most lathe programs."
      }
    ]
  },

  // ─── UNIT 5: INSPECTION & ADJUSTMENT ───────────────────────
  {
    id: "u5-l1",
    unit: 5,
    unitName: "Inspection & Adjustment",
    lesson: 1,
    title: "Measure, Compare, Adjust",
    icon: "CHK",
    xp: 20,
    theory: `
      <p>After the first part, the job is not done. You measure the part, compare it to print,
      then adjust the program or wear offset.</p>
      <pre>Target OD: 1.0000
Measured OD: 1.0020
Correction: remove 0.0020 from diameter</pre>
      <p>On a lathe in diameter mode, X wear adjustments are usually entered as diameter changes.
      If the OD is too big by 0.0020, adjust X wear by -0.0020.</p>
      <p class="callout tip">Make one small correction, rerun, and measure again.</p>
    `,
    visual: "tool-offsets",
    quiz: [
      { type: "multiple-choice", question: "Target OD is 1.0000 and measured OD is 1.0020. What is the part?", options: ["0.0020 oversized", "0.0020 undersized", "Perfect size", "Missing Z offset"], answer: 0, explanation: "The measured diameter is larger than target by 0.0020." },
      { type: "multiple-choice", question: "In diameter mode, if an OD is too big by 0.0020, the usual X wear correction is:", options: ["X +0.0020", "X -0.0020", "Z -0.0020", "F +0.0020"], answer: 1, explanation: "A negative X wear correction makes the tool cut a smaller diameter." },
      { type: "fill-blank", question: "Measured OD is 2.0050, target is 2.0000. How far oversized is it?\n___", answer: "0.0050", hint: "Measured minus target", explanation: "2.0050 - 2.0000 = 0.0050 oversized." },
      { type: "multiple-choice", question: "Which offset is normally used for small size corrections after touch-off?", options: ["Wear offset", "Program number", "Spindle override", "Coolant switch"], answer: 0, explanation: "Wear offsets are meant for small tool-position corrections." },
      { type: "multiple-choice", question: "Why make one correction at a time?", options: ["So you know what changed the result", "Because G-code cannot have comments", "Because M03 only works once", "To avoid using G54"], answer: 0, explanation: "One change at a time makes troubleshooting clear." },
      { type: "fill-blank", question: "Type the common offset type used for small corrections:\n____ offset", answer: "wear", hint: "Small adjustment page", explanation: "Wear offsets are commonly used for small corrections after measuring parts." },
      { type: "multiple-choice", question: "A Z length is 0.010 too long. Which direction is the correction about?", options: ["Z position", "Spindle RPM", "Program number", "Coolant"], answer: 0, explanation: "Length errors are corrected in the Z direction or Z wear offset." },
      { type: "multiple-choice", question: "What is the safest habit before changing offsets?", options: ["Confirm the measured error and sign", "Guess and rerun", "Change every tool", "Skip inspection"], answer: 0, explanation: "Most offset mistakes come from using the wrong sign or wrong tool offset." },
      { type: "multiple-choice", question: "If a bore is too small, what usually needs to happen?", options: ["Move the boring tool to cut larger", "Lower spindle speed only", "Cancel M30", "Remove all comments"], answer: 0, explanation: "A boring tool must cut farther out to make the inside diameter larger." },
      { type: "multiple-choice", question: "What should you do after making a wear offset change?", options: ["Measure the next part", "Delete the program", "Change every offset", "Ignore the print"], answer: 0, explanation: "Always verify the correction by cutting and measuring again." }
    ]
  },

  {
    id: "u5-l2",
    unit: 5,
    unitName: "Inspection & Adjustment",
    lesson: 2,
    title: "Wear Offsets vs Program Edits",
    icon: "ADJ",
    xp: 20,
    theory: `
      <p>Use wear offsets for small tool corrections. Use program edits when the toolpath itself is wrong.</p>
      <pre>Wear offset: part is 0.0015 oversize
Program edit: groove is in the wrong Z location</pre>
      <p>Offsets are fast and reversible. Program edits change the path for every future part.</p>
    `,
    visual: "work-offsets",
    quiz: [
      { type: "multiple-choice", question: "A turned diameter is 0.001 high but the path is correct. Best first fix?", options: ["Wear offset", "Rewrite the whole program", "Change M30", "Delete G54"], answer: 0, explanation: "Small size corrections are a wear offset job." },
      { type: "multiple-choice", question: "A groove is programmed at the wrong Z location. Best fix?", options: ["Program edit", "Spindle override", "Coolant off", "Comment only"], answer: 0, explanation: "If the geometry or path is wrong, edit the program." },
      { type: "fill-blank", question: "If the correction is a tiny tool-position change, use a ____ offset.", answer: "wear", hint: "Small correction offset", explanation: "Wear offsets are used for small tool-position corrections." },
      { type: "multiple-choice", question: "Which change affects every future run of that program?", options: ["Program edit", "Temporary single-block mode", "Measuring the part", "Reading a comment"], answer: 0, explanation: "A saved program edit changes future runs." },
      { type: "multiple-choice", question: "A chamfer is missing entirely. What kind of fix is needed?", options: ["Program/toolpath edit", "Only X wear", "Only spindle override", "Only coolant"], answer: 0, explanation: "Missing geometry requires a toolpath or program edit." },
      { type: "multiple-choice", question: "Which is a bad habit?", options: ["Changing offsets without recording the reason", "Measuring after a correction", "Making one change at a time", "Checking the tool number"], answer: 0, explanation: "Unrecorded changes make troubleshooting hard." },
      { type: "fill-blank", question: "Program edits change the tool____.", answer: "path", hint: "Where the tool moves", explanation: "Program edits change the path the tool follows." },
      { type: "multiple-choice", question: "Before editing a proven program, what should you confirm?", options: ["The measured problem is real", "The app theme", "The icon size", "The operator name only"], answer: 0, explanation: "Confirm the issue before changing a program that may already be correct." },
      { type: "multiple-choice", question: "Which correction is most likely an offset change?", options: ["OD is 0.0015 big", "Tool is cutting wrong feature", "Program ends too early", "Wrong tool called"], answer: 0, explanation: "A small size error on a correct path is typically a wear correction." },
      { type: "multiple-choice", question: "Why are wear offsets safer for small size changes?", options: ["They are small and reversible", "They erase the program", "They disable G00", "They set metric mode"], answer: 0, explanation: "Wear offsets let you correct size without changing the toolpath." }
    ]
  },

  {
    id: "u5-l3",
    unit: 5,
    unitName: "Inspection & Adjustment",
    lesson: 3,
    title: "Single Block and Dry Run",
    icon: "RUN",
    xp: 20,
    theory: `
      <p>Before trusting a new or edited program, prove it carefully. Single block runs one block
      at a time. Dry run tests motion without cutting at normal conditions.</p>
      <pre>Single Block ON
Feed Hold ready
Rapid override reduced</pre>
      <p>Use these controls when checking clearances, tool changes, first moves, and any edited line.</p>
    `,
    visual: "rapid-path",
    quiz: [
      { type: "multiple-choice", question: "What does single block do?", options: ["Runs one block at a time", "Deletes comments", "Turns coolant on", "Changes G54"], answer: 0, explanation: "Single block pauses after each block so you can verify the next move." },
      { type: "multiple-choice", question: "Why reduce rapid override during prove-out?", options: ["To give time to react", "To improve surface finish", "To change units", "To end the program"], answer: 0, explanation: "Reduced rapid speed gives the operator more time to stop a bad move." },
      { type: "multiple-choice", question: "Which button should you be ready to use during first run?", options: ["Feed Hold", "Caps Lock", "Print Screen", "Wi-Fi"], answer: 0, explanation: "Feed Hold pauses controlled motion and is a key prove-out habit." },
      { type: "fill-blank", question: "Running one block at a time is called ____ block.", answer: "single", hint: "One at a time", explanation: "Single block mode runs one program block at a time." },
      { type: "multiple-choice", question: "When should you be most cautious?", options: ["After a program edit", "After reading a comment", "After opening settings", "After changing app theme"], answer: 0, explanation: "Edited lines need careful prove-out." },
      { type: "multiple-choice", question: "What should you watch on first motion?", options: ["Clearance and direction", "Only the clock", "Only the part color", "Only the logo"], answer: 0, explanation: "Verify the tool moves the expected direction with safe clearance." },
      { type: "multiple-choice", question: "What is dry run mainly for?", options: ["Checking motion safely", "Measuring final size", "Replacing offsets", "Turning comments into code"], answer: 0, explanation: "Dry run helps verify motion before normal cutting." },
      { type: "fill-blank", question: "Type the control mode: ____ Block ON", answer: "Single", hint: "Runs one line at a time", explanation: "Single Block ON is used for careful prove-out." },
      { type: "multiple-choice", question: "Which move deserves extra attention?", options: ["First rapid after tool change", "A blank comment", "The app build number", "A finished review"], answer: 0, explanation: "The first rapid after a tool change is a common crash point." },
      { type: "multiple-choice", question: "A safe prove-out mindset is:", options: ["Assume nothing, verify each move", "Assume the program is always safe", "Ignore offsets", "Run at 100% rapid immediately"], answer: 0, explanation: "Good operators verify before trusting the program." }
    ]
  },

  // UNIT 6: MODES & CONTROLLER HABITS
  {
    id: "u6-l1",
    unit: 6,
    unitName: "Modes & Controller Habits",
    lesson: 1,
    title: "Units: G20 and G21",
    icon: "UNIT",
    xp: 20,
    theory: `
      <p><code>G20</code> selects inch units. <code>G21</code> selects metric units. Unit mode changes how the control reads X, Z, F, and many other numeric values.</p>
      <pre>G20 ; inch mode
G00 X2.000 Z0.100

G21 ; metric mode
G00 X50.8 Z2.5</pre>
      <p>A program should clearly set units near the top. Never assume the control is already in the right mode.</p>
    `,
    visual: "block-anatomy",
    quiz: [
      { type: "multiple-choice", question: "What does G20 select?", options: ["Inch units", "Metric units", "Rapid motion", "Spindle stop"], answer: 0, explanation: "G20 puts the control in inch mode." },
      { type: "multiple-choice", question: "What does G21 select?", options: ["Metric units", "Inch units", "Tool offset", "Program end"], answer: 0, explanation: "G21 puts the control in metric mode." },
      { type: "multiple-choice", question: "Why set G20 or G21 near the top?", options: ["So every number is read in the intended units", "To turn coolant on", "To home the machine", "To select a tool"], answer: 0, explanation: "Unit mode affects coordinate and feed values, so it must be known before motion." },
      { type: "fill-blank", question: "Complete inch mode:\n___ ; inch units", answer: "G20", hint: "Inch unit code", explanation: "G20 selects inch units." },
      { type: "fill-blank", question: "Complete metric mode:\n___ ; metric units", answer: "G21", hint: "Metric unit code", explanation: "G21 selects metric units." },
      { type: "multiple-choice", question: "A program written in inches but run in metric mode will likely:", options: ["Move the wrong distances", "Automatically convert perfectly", "Only change comments", "Disable M03"], answer: 0, explanation: "The control reads numbers in the active unit mode; wrong units can make moves wildly wrong." },
      { type: "multiple-choice", question: "Which safety line clearly sets inch mode?", options: ["G20 G40 G54", "G21 G40 G54", "M05 M30", "T0101"], answer: 0, explanation: "G20 is the inch-mode word in that safety line." },
      { type: "multiple-choice", question: "Which value changes meaning between G20 and G21?", options: ["X2.000", "M30", "Program comments", "Tool name text"], answer: 0, explanation: "Coordinate values are interpreted in the active unit mode." },
      { type: "multiple-choice", question: "Before running an unfamiliar program, what should you check?", options: ["Unit mode", "Phone brightness", "App theme", "File color"], answer: 0, explanation: "Unit mode is a basic safety check before trusting coordinates." },
      { type: "multiple-choice", question: "Which pair is correct?", options: ["G20 inch, G21 metric", "G20 metric, G21 inch", "G20 rapid, G21 feed", "G20 spindle, G21 coolant"], answer: 0, explanation: "G20 is inch mode; G21 is metric mode." }
    ]
  },

  {
    id: "u6-l2",
    unit: 6,
    unitName: "Modes & Controller Habits",
    lesson: 2,
    title: "Feed Modes: G94 and G95",
    icon: "FMD",
    xp: 20,
    theory: `
      <p>Feedrate mode controls what the <code>F</code> value means. On many Fanuc-style lathes, <code>G94</code> is feed per minute and <code>G95</code> is feed per revolution.</p>
      <pre>G94 F5.0    ; feed per minute
G95 F0.012  ; feed per spindle revolution</pre>
      <p>Turning programs often use feed per revolution so chip load stays tied to spindle rotation. Always verify the active feed mode before cutting.</p>
    `,
    visual: "program-structure",
    quiz: [
      { type: "multiple-choice", question: "What does feed mode control?", options: ["What the F value means", "Tool number only", "Comment style", "Program name"], answer: 0, explanation: "Feed mode changes how the control interprets feedrate." },
      { type: "multiple-choice", question: "On many Fanuc-style lathes, G95 means:", options: ["Feed per revolution", "Feed per minute", "Metric units", "Rapid motion"], answer: 0, explanation: "G95 is commonly feed per revolution on Fanuc-style lathes." },
      { type: "multiple-choice", question: "On many Fanuc-style lathes, G94 means:", options: ["Feed per minute", "Feed per revolution", "Spindle stop", "Work offset"], answer: 0, explanation: "G94 is commonly feed per minute." },
      { type: "fill-blank", question: "Complete feed per revolution:\n___ F0.012", answer: "G95", hint: "Per spindle rev", explanation: "G95 selects feed per revolution on many Fanuc-style lathes." },
      { type: "fill-blank", question: "Complete feed per minute:\n___ F5.0", answer: "G94", hint: "Per minute", explanation: "G94 selects feed per minute on many controls." },
      { type: "multiple-choice", question: "Why is feed per revolution common in turning?", options: ["Chip load follows spindle rotation", "It turns coolant on", "It homes X", "It cancels G54"], answer: 0, explanation: "Feed per rev keeps chip load related to spindle speed." },
      { type: "multiple-choice", question: "If the wrong feed mode is active, the machine may:", options: ["Feed too fast or too slow", "Ignore all coordinates", "Delete the program", "Change tool numbers"], answer: 0, explanation: "The same F number can mean very different speeds in different feed modes." },
      { type: "multiple-choice", question: "Which line clearly sets feed per rev?", options: ["G95 F0.010", "M30", "G54", "T0101"], answer: 0, explanation: "G95 sets the feed mode and F0.010 gives the feed amount." },
      { type: "multiple-choice", question: "What should a good setup block do?", options: ["Declare important modes", "Hide units", "Skip offsets", "Avoid feed mode"], answer: 0, explanation: "Setup blocks should make modal assumptions explicit." },
      { type: "multiple-choice", question: "Which word is affected by feed mode?", options: ["F", "M30", "O number", "Comment text"], answer: 0, explanation: "Feed mode changes how the F word is interpreted." }
    ]
  },

  {
    id: "u6-l3",
    unit: 6,
    unitName: "Modes & Controller Habits",
    lesson: 3,
    title: "Modal State Checklist",
    icon: "MODE",
    xp: 20,
    theory: `
      <p>Modal state is the machine's memory. Motion mode, units, feed mode, offsets, and spindle mode can stay active until changed.</p>
      <pre>G20 G40 G54 G95
G97 S800 M03
G00 X2.000 Z0.100</pre>
      <p>A safe program does not rely on mystery state. It declares the modes it needs before motion.</p>
    `,
    visual: "program-structure",
    quiz: [
      { type: "multiple-choice", question: "What is modal state?", options: ["Codes that stay active until changed", "Only comments", "Only the current tool name", "The app progress screen"], answer: 0, explanation: "Modal codes remain active until another code changes or cancels them." },
      { type: "multiple-choice", question: "Which is a modal setting?", options: ["G20 or G21 units", "A comment only", "Program title text", "Operator name"], answer: 0, explanation: "Unit mode is modal." },
      { type: "multiple-choice", question: "Why use a setup block?", options: ["To declare needed modes before motion", "To make the file longer", "To hide feedrate", "To skip offsets"], answer: 0, explanation: "Setup blocks reduce surprise by setting important modes." },
      { type: "multiple-choice", question: "Which block is a better modal checklist?", options: ["G20 G40 G54 G95", "(START)", "M30", "X2.0 Z0.1"], answer: 0, explanation: "That block declares units, comp cancel, work offset, and feed mode." },
      { type: "fill-blank", question: "Complete the idea: modal codes stay active until ____.", answer: "changed", hint: "Another code replaces them", explanation: "Modal codes stay active until changed or canceled." },
      { type: "multiple-choice", question: "Before rapid motion, what should be known?", options: ["Units, offset, and motion state", "Only phone battery", "Only app theme", "Only the comment"], answer: 0, explanation: "Motion is only safe when the active modes and offsets are known." },
      { type: "multiple-choice", question: "Which code often cancels cutter compensation?", options: ["G40", "G21", "M03", "M30"], answer: 0, explanation: "G40 cancels cutter compensation on many controls." },
      { type: "multiple-choice", question: "What makes hidden modal state dangerous?", options: ["The machine may interpret the next block differently than expected", "It changes the screen color", "It removes all tools", "It deletes comments"], answer: 0, explanation: "Unknown modal state can make a correct-looking block behave wrong." },
      { type: "multiple-choice", question: "Which habit improves safety?", options: ["Read the active modes before cycle start", "Ignore the position display", "Run first, check later", "Delete setup blocks"], answer: 0, explanation: "Checking active modes helps catch wrong setup before motion." },
      { type: "multiple-choice", question: "A good setup line should be:", options: ["Clear and intentional", "Random", "Hidden in comments", "Only M30"], answer: 0, explanation: "Setup lines should make the program's assumptions clear." }
    ]
  },

  // UNIT 7: COOLANT & AUXILIARY M-CODES
  {
    id: "u7-l1",
    unit: 7,
    unitName: "Coolant & Auxiliary M-Codes",
    lesson: 1,
    title: "Coolant, Stops, and Operator Control",
    icon: "AUX",
    xp: 20,
    theory: `
      <p>M-codes handle machine functions around the cut. They do not usually define the toolpath,
      but they can decide whether the cut is safe, cool, paused, or finished.</p>
      <pre>M08 ; coolant on
M09 ; coolant off
M01 ; optional stop if enabled
M00 ; mandatory stop</pre>
      <p>Controls and machines vary, so always verify shop-specific M-codes before running production.</p>
    `,
    visual: "program-structure",
    quiz: [
      { type: "multiple-choice", question: "What does M08 usually do?", options: ["Turns coolant on", "Ends the program", "Selects metric units", "Calls tool 8"], answer: 0, explanation: "M08 commonly turns flood coolant on." },
      { type: "multiple-choice", question: "What does M09 usually do?", options: ["Turns coolant off", "Turns spindle clockwise", "Homes the axes", "Starts a subprogram"], answer: 0, explanation: "M09 commonly turns coolant off." },
      { type: "multiple-choice", question: "Which code is an optional stop?", options: ["M01", "M00", "M30", "G01"], answer: 0, explanation: "M01 stops only when optional stop is enabled on the control." },
      { type: "multiple-choice", question: "Which code forces a stop regardless of optional stop setting?", options: ["M00", "M01", "M08", "G20"], answer: 0, explanation: "M00 is a mandatory program stop." },
      { type: "fill-blank", question: "Complete coolant on:\n___ ; coolant on", answer: "M08", hint: "Flood coolant on", explanation: "M08 is commonly coolant on." },
      { type: "fill-blank", question: "Complete coolant off:\n___ ; coolant off", answer: "M09", hint: "Coolant off", explanation: "M09 is commonly coolant off." },
      { type: "multiple-choice", question: "Why might a program use M01 after a roughing pass?", options: ["To let the operator inspect before continuing", "To change inch to metric", "To make comments execute", "To cancel all tools"], answer: 0, explanation: "Optional stops are useful inspection checkpoints." },
      { type: "multiple-choice", question: "Which line turns coolant on before cutting?\nM08\nG01 Z-1.000 F0.012", options: ["M08", "G01 Z-1.000 F0.012", "F0.012", "Z-1.000"], answer: 0, explanation: "M08 is the machine-function line that starts coolant." },
      { type: "multiple-choice", question: "Why verify shop-specific M-codes?", options: ["Some machines customize auxiliary functions", "All controls ignore M-codes", "M-codes only work in apps", "M08 always means spindle off"], answer: 0, explanation: "Auxiliary functions can vary by machine builder and options." },
      { type: "multiple-choice", question: "Which code should be near the end if coolant was used?", options: ["M09", "G91", "G76", "G21"], answer: 0, explanation: "Coolant should be turned off before the program ends or tool parks." }
    ]
  },

  // UNIT 8: SUBPROGRAMS & REPEATS
  {
    id: "u8-l1",
    unit: 8,
    unitName: "Subprograms & Repeats",
    lesson: 1,
    title: "M98, M99, and Repeated Motion",
    icon: "SUB",
    xp: 25,
    theory: `
      <p>Subprograms keep repeated motion in one place. The main program calls the subprogram,
      the subprogram runs, then returns.</p>
      <pre>M98 P2000 L3 ; call O2000 three times
...
O2000
G01 Z-0.100 F0.006
M99 ; return</pre>
      <p>This is powerful, but it must be readable. Repeats should be documented so the next person
      understands what repeats and why.</p>
    `,
    visual: "program-structure",
    quiz: [
      { type: "multiple-choice", question: "What does M98 commonly do?", options: ["Calls a subprogram", "Turns coolant off", "Selects inch mode", "Cancels comp"], answer: 0, explanation: "M98 is commonly used to call a subprogram." },
      { type: "multiple-choice", question: "What does M99 commonly do inside a subprogram?", options: ["Returns to the caller", "Turns spindle off", "Sets feed per rev", "Starts coolant"], answer: 0, explanation: "M99 returns from the subprogram on many controls." },
      { type: "multiple-choice", question: "In M98 P2000 L3, what does L3 usually mean?", options: ["Repeat three times", "Use tool 3", "Set line 3", "Move 3 inches"], answer: 0, explanation: "L often gives the repeat count for a subprogram call." },
      { type: "multiple-choice", question: "In M98 P2000 L3, what does P2000 point to?", options: ["Subprogram O2000", "Feedrate 2000", "Tool 2000", "Coolant pressure"], answer: 0, explanation: "P commonly identifies the subprogram number to call." },
      { type: "fill-blank", question: "Complete the subprogram call:\n___ P2000 L2", answer: "M98", hint: "Subprogram call", explanation: "M98 calls a subprogram on many controls." },
      { type: "fill-blank", question: "Complete the return line at the end of a subprogram:\n___", answer: "M99", hint: "Return from subprogram", explanation: "M99 returns from a subprogram on many controls." },
      { type: "multiple-choice", question: "Why use a subprogram?", options: ["To avoid rewriting repeated motion", "To hide unsafe code", "To replace all offsets", "To make G00 slower"], answer: 0, explanation: "Subprograms reduce repeated code when motion patterns repeat." },
      { type: "multiple-choice", question: "What is a risk with subprograms?", options: ["They can be hard to follow if undocumented", "They remove all modal state", "They prevent tool changes", "They cannot repeat"], answer: 0, explanation: "Subprograms need clear comments and careful review." },
      { type: "multiple-choice", question: "Which line marks a subprogram return?", options: ["M99", "M08", "G54", "T0101"], answer: 0, explanation: "M99 is the return code in many subprogram patterns." },
      { type: "multiple-choice", question: "Before editing a repeated subprogram, remember:", options: ["One edit can affect every repeat", "Only the first repeat changes", "Comments become motion", "M98 cancels all offsets"], answer: 0, explanation: "Subprogram edits can affect every call and every repeat." }
    ]
  },

  // UNIT 9: DRILLING CYCLES
  {
    id: "u9-l1",
    unit: 9,
    unitName: "Drilling Cycles",
    lesson: 1,
    title: "G81, G83, R Plane, and Return",
    icon: "DRL",
    xp: 25,
    theory: `
      <p>Drilling canned cycles package several motions into one block. They are common on mills
      and live-tool lathes.</p>
      <pre>G81 X1.000 Y0.500 Z-0.750 R0.100 F5.0 ; drill
G83 X2.000 Y0.500 Z-1.500 R0.100 Q0.200 F4.0 ; peck drill
G80 ; cancel cycle</pre>
      <p>The R plane is the clearance height. G80 cancels the canned cycle before normal motion resumes.</p>
    `,
    visual: "block-anatomy",
    quiz: [
      { type: "multiple-choice", question: "What is G81 commonly used for?", options: ["Simple drilling cycle", "Coolant off", "Subprogram return", "Metric mode"], answer: 0, explanation: "G81 is a common simple drilling canned cycle." },
      { type: "multiple-choice", question: "What is G83 commonly used for?", options: ["Peck drilling", "Spindle stop", "Tool length cancel", "Optional stop"], answer: 0, explanation: "G83 is commonly a peck drilling cycle for deeper holes." },
      { type: "multiple-choice", question: "In a drilling cycle, what does R usually define?", options: ["Clearance plane", "Spindle RPM", "Tool radius", "Program number"], answer: 0, explanation: "The R plane is the retract or clearance height for the cycle." },
      { type: "multiple-choice", question: "What does G80 do after canned cycles?", options: ["Cancels the cycle", "Turns coolant on", "Calls O80", "Sets inch units"], answer: 0, explanation: "G80 cancels canned cycles on many controls." },
      { type: "fill-blank", question: "Complete peck drilling:\n___ X2.000 Z-1.500 R0.100 Q0.200", answer: "G83", hint: "Peck drilling cycle", explanation: "G83 is commonly peck drilling." },
      { type: "fill-blank", question: "Cancel a drilling cycle:\n___", answer: "G80", hint: "Cancel canned cycle", explanation: "G80 cancels canned cycles." },
      { type: "multiple-choice", question: "Why use peck drilling?", options: ["To break chips and clear the hole", "To turn coolant off", "To change app language", "To home all axes"], answer: 0, explanation: "Pecking helps chip evacuation and reduces drilling load." },
      { type: "multiple-choice", question: "Which value is the hole depth here?\nG81 X1.0 Y0.5 Z-0.750 R0.100 F5.0", options: ["Z-0.750", "R0.100", "F5.0", "X1.0"], answer: 0, explanation: "Z is the drilling depth target in this example." },
      { type: "multiple-choice", question: "Which value is the clearance plane here?\nG81 X1.0 Y0.5 Z-0.750 R0.100 F5.0", options: ["R0.100", "Z-0.750", "F5.0", "G81"], answer: 0, explanation: "R0.100 is the retract/clearance plane." },
      { type: "multiple-choice", question: "Why cancel with G80 before unrelated motion?", options: ["So the control leaves drilling-cycle mode", "So comments run", "So M08 turns off", "So G20 becomes metric"], answer: 0, explanation: "Leaving a canned cycle active can make later motion behave unexpectedly." }
    ]
  },

  // UNIT 10: SAFE RECOVERY
  {
    id: "u10-l1",
    unit: 10,
    unitName: "Safe Recovery",
    lesson: 1,
    title: "Feed Hold, Restart, and Alarm Thinking",
    icon: "REC",
    xp: 25,
    theory: `
      <p>Good recovery is calm and methodical. When something looks wrong, stop motion, understand
      the current modal state, and restart only from a safe known point.</p>
      <pre>Feed Hold
Spindle/Coolant state checked
Tool clear of part
Restart from a proven block</pre>
      <p>Never restart in the middle of a modal sequence unless you know which modes, offsets,
      spindle commands, and tool calls are already active.</p>
    `,
    visual: "rapid-path",
    quiz: [
      { type: "multiple-choice", question: "What should you do first if motion looks wrong?", options: ["Stop or feed hold safely", "Increase rapid override", "Ignore it", "Edit random offsets"], answer: 0, explanation: "Stop motion first, then diagnose." },
      { type: "multiple-choice", question: "Why is mid-program restart risky?", options: ["Modal states may not be active as expected", "Comments become active", "The screen turns off", "G-code cannot restart"], answer: 0, explanation: "Restarting can miss setup lines that selected modes, offsets, tools, spindle, or coolant." },
      { type: "multiple-choice", question: "Before restart, the tool should be:", options: ["Clear of the part", "Buried in the cut", "Unknown", "At any random X"], answer: 0, explanation: "Restart should begin with safe clearance." },
      { type: "multiple-choice", question: "What should be checked before cycle start after an alarm?", options: ["Tool, offset, mode, spindle, and position", "Only the app icon", "Only the comment spelling", "Only screen brightness"], answer: 0, explanation: "Recovery requires checking all state that affects motion." },
      { type: "fill-blank", question: "A safe restart begins from a known ____.", answer: "state", hint: "Known condition", explanation: "Known state means modes, offsets, tool, and position are understood." },
      { type: "multiple-choice", question: "Why avoid guessing after an alarm?", options: ["Wrong assumptions can cause a crash", "Guessing improves accuracy", "Alarms erase all danger", "Offsets stop mattering"], answer: 0, explanation: "A wrong recovery move can be more dangerous than the original alarm." },
      { type: "multiple-choice", question: "Which is a safe habit?", options: ["Read the active modal screen before restart", "Restart from any line", "Turn rapid to 100 immediately", "Skip tool verification"], answer: 0, explanation: "The active modal screen helps verify what the control will do." },
      { type: "multiple-choice", question: "What should be done if you are unsure how to recover?", options: ["Ask or follow shop recovery procedure", "Press cycle start anyway", "Delete G54", "Change units randomly"], answer: 0, explanation: "A written procedure or experienced help is safer than guessing." },
      { type: "multiple-choice", question: "Which block is safer to restart from?", options: ["A setup or approach block you understand", "Inside an unknown canned cycle", "Mid-threading pass", "Halfway through a subprogram"], answer: 0, explanation: "Restart from a clear, known point rather than inside complex motion." },
      { type: "multiple-choice", question: "Recovery thinking should be:", options: ["Slow, verified, and deliberate", "Fast and guessed", "Based on luck", "Only about XP"], answer: 0, explanation: "Careful recovery protects the machine, tool, part, and operator." }
    ]
  }
];

// ─── UNIT/LESSON METADATA ────────────────────────────────────
const UNITS = [
  { id: 1, name: "Foundations",    icon: "📋", color: "#1A6B5C", lessons: 3 },
  { id: 2, name: "Motion Codes",   icon: "⚡", color: "#2D5986", lessons: 3 },
  { id: 3, name: "Turning Ops",    icon: "🔩", color: "#7B4F12", lessons: 3 },
  { id: 4, name: "Tooling & Offsets", icon: "🎯", color: "#5C2D6B", lessons: 2 },
  { id: 5, name: "Inspection & Adjustment", icon: "CHK", color: "#286B4D", lessons: 3 },
  { id: 6, name: "Modes & Controller Habits", icon: "MODE", color: "#355C7D", lessons: 3 },
  { id: 7, name: "Coolant & Auxiliary M-Codes", icon: "AUX", color: "#0B6E7A", lessons: 1 },
  { id: 8, name: "Subprograms & Repeats", icon: "SUB", color: "#6B4A8F", lessons: 1 },
  { id: 9, name: "Drilling Cycles", icon: "DRL", color: "#806027", lessons: 1 },
  { id: 10, name: "Safe Recovery", icon: "REC", color: "#7A2E2E", lessons: 1 }
];

const PRINTING_LESSONS = [
  {
    id: "p-u1-l1",
    unit: 1,
    unitName: "Printer Foundations",
    lesson: 1,
    title: "What 3D Printer G-Code Does",
    icon: "3D",
    xp: 10,
    theory: `
      <p>3D printer G-code controls motion, temperature, extrusion, fans, and machine setup.
      A slicer writes most of it, but knowing the blocks helps you tune, debug, and inspect prints.</p>
      <pre>G1 X82.4 Y104.2 E0.036 F1800</pre>
      <p>Breaking that down:</p>
      <ul>
        <li><code>G1</code> - controlled move</li>
        <li><code>X82.4 Y104.2</code> - nozzle position on the bed</li>
        <li><code>E0.036</code> - amount of filament to extrude</li>
        <li><code>F1800</code> - feedrate in mm/min</li>
      </ul>
      <p>Printer G-code is usually metric. Most slicers use millimeters for X, Y, Z, and E values.</p>
    `,
    visual: "block-anatomy",
    quiz: [
      {
        type: "multiple-choice",
        question: "In 3D printer G-code, what does the E value usually control?",
        options: ["Bed temperature", "Extrusion amount", "Fan speed", "Home position"],
        answer: 1,
        explanation: "The E axis controls extruder movement. More E value means more filament is pushed through the nozzle."
      },
      {
        type: "multiple-choice",
        question: "Which axis usually controls nozzle height above the print bed?",
        options: ["X", "Y", "Z", "F"],
        answer: 2,
        explanation: "Z is the vertical axis. Layer changes and first-layer height are controlled through Z movement."
      },
      {
        type: "fill-blank",
        question: "Complete the controlled move command:\n___ X50 Y50 E1.2 F1200",
        answer: "G1",
        hint: "G1 is the normal printing move",
        explanation: "G1 is the controlled move used for most print paths. It may move with or without extrusion."
      }
    ]
  },
  {
    id: "p-u1-l2",
    unit: 1,
    unitName: "Printer Foundations",
    lesson: 2,
    title: "Homing and Bed Leveling",
    icon: "XY",
    xp: 10,
    theory: `
      <p>Before printing, the machine needs to know where its axes are. Homing moves each axis
      to its endstop or sensor so the printer can establish machine zero.</p>
      <pre>G28 ; home all axes</pre>
      <p>Many printers also probe the bed before printing:</p>
      <pre>G29 ; run bed leveling probe</pre>
      <p>Not every printer uses <code>G29</code> the same way. Bed leveling behavior depends on firmware
      such as Marlin, Klipper, or RepRapFirmware.</p>
    `,
    visual: "",
    quiz: [
      {
        type: "multiple-choice",
        question: "What does G28 usually do on a 3D printer?",
        options: ["Heat the nozzle", "Home the axes", "Turn on the fan", "Start extrusion"],
        answer: 1,
        explanation: "G28 homes the axes. It tells the printer to find known machine positions using endstops or sensors."
      },
      {
        type: "multiple-choice",
        question: "Why run a bed leveling command before printing?",
        options: [
          "To measure bed shape and compensate for tilt or unevenness",
          "To increase nozzle temperature",
          "To pause the printer",
          "To change filament diameter"
        ],
        answer: 0,
        explanation: "A probing routine measures the bed so the printer can compensate during the first layers."
      }
    ]
  },
  {
    id: "p-u1-l3",
    unit: 1,
    unitName: "Printer Foundations",
    lesson: 3,
    title: "Hotend and Bed Temperature",
    icon: "TEMP",
    xp: 15,
    theory: `
      <p>Temperature commands use M-codes. Some set a target and continue immediately; others wait.</p>
      <pre>M104 S210 ; set nozzle to 210 C and continue
M109 S210 ; set nozzle to 210 C and wait
M140 S60  ; set bed to 60 C and continue
M190 S60  ; set bed to 60 C and wait</pre>
      <p>Slicers usually heat the bed first, then the nozzle, then start motion after both are ready.</p>
    `,
    visual: "",
    quiz: [
      {
        type: "multiple-choice",
        question: "Which command sets nozzle temperature and waits until it is reached?",
        options: ["M104", "M109", "M140", "M190"],
        answer: 1,
        explanation: "M109 sets the hotend target temperature and waits before continuing."
      },
      {
        type: "multiple-choice",
        question: "Which command controls the heated bed and waits?",
        options: ["M104", "M109", "M140", "M190"],
        answer: 3,
        explanation: "M190 sets the bed target temperature and waits until the bed reaches that target."
      },
      {
        type: "fill-blank",
        question: "Set the nozzle to 215 C without waiting:\nM___ S215",
        answer: "104",
        hint: "M104 sets hotend temperature and continues",
        explanation: "M104 sets the hotend target temperature but does not wait for it to finish heating."
      }
    ]
  },

  {
    id: "p-u2-l1",
    unit: 2,
    unitName: "Extrusion & Motion",
    lesson: 1,
    title: "Extrusion and the E Axis",
    icon: "E",
    xp: 15,
    theory: `
      <p>The <code>E</code> value controls extruder movement. In most slicer output, extrusion moves use
      <code>G1</code> with X/Y position plus an E amount.</p>
      <pre>G1 X82.4 Y104.2 E0.036 F1800</pre>
      <p>If the nozzle moves without E, it is usually a travel move. If E increases while X/Y moves,
      filament is being pushed through the nozzle.</p>
      <p class="callout tip">Extrusion can be absolute or relative depending on firmware and slicer settings.
      Learn to read the pattern before editing E values by hand.</p>
    `,
    visual: "block-anatomy",
    quiz: [
      { type: "multiple-choice", question: "In this line, what does E0.036 control?\nG1 X82.4 Y104.2 E0.036 F1800", options: ["Extrusion amount", "Bed temperature", "Fan speed", "Home position"], answer: 0, explanation: "E controls extruder movement. Here it tells the printer to push filament while moving." },
      { type: "multiple-choice", question: "Which line is most likely printing plastic?", options: ["G1 X20 Y20 E0.45 F1800", "G1 X20 Y20 F9000", "G28", "M104 S210"], answer: 0, explanation: "A G1 move with E increasing usually extrudes filament." },
      { type: "multiple-choice", question: "A move with X and Y but no E is usually:", options: ["A travel move", "A bed heat command", "A fan command", "A program end"], answer: 0, explanation: "Travel moves reposition the nozzle without extruding." },
      { type: "fill-blank", question: "Type the letter that usually controls extrusion amount:", answer: "E", hint: "Extruder axis", explanation: "E is the extruder axis value." },
      { type: "multiple-choice", question: "What happens if too much filament is extruded?", options: ["Over-extrusion", "Bed leveling", "Homing", "Fan off only"], answer: 0, explanation: "Too much extrusion can cause blobs, rough walls, and dimensional errors." },
      { type: "multiple-choice", question: "What happens if too little filament is extruded?", options: ["Under-extrusion", "Automatic leveling", "Hotend waits", "Program rewind"], answer: 0, explanation: "Too little extrusion can leave gaps, weak walls, and poor layer bonding." },
      { type: "multiple-choice", question: "Which command is the normal controlled move used for extrusion?", options: ["G1", "G28", "M190", "M107"], answer: 0, explanation: "G1 is the normal controlled move command in printer G-code." },
      { type: "fill-blank", question: "Complete the printing move:\nG1 X50 Y50 ___1.2 F1200", answer: "E", hint: "Extrusion word", explanation: "E1.2 tells the extruder how much filament movement to command." },
      { type: "multiple-choice", question: "Why should beginners be careful editing E values?", options: ["Extrusion mode may be absolute or relative", "E always homes the printer", "E only controls the display", "E turns on the fan"], answer: 0, explanation: "Different slicers and firmware can use absolute or relative extrusion." },
      { type: "multiple-choice", question: "Which value is not a motion coordinate in this line?\nG1 X82 Y104 E0.036 F1800", options: ["F1800", "X82", "Y104", "E0.036"], answer: 0, explanation: "F sets feedrate/speed. X, Y, and E are axis/extrusion values." }
    ]
  },

  {
    id: "p-u2-l2",
    unit: 2,
    unitName: "Extrusion & Motion",
    lesson: 2,
    title: "Feedrate and Travel Moves",
    icon: "F",
    xp: 15,
    theory: `
      <p>The <code>F</code> word sets feedrate. In most printer G-code, feedrate is in millimeters per minute.</p>
      <pre>G1 X40 Y40 F9000  ; fast travel
G1 X40 Y40 E0.4 F1800 ; slower print move</pre>
      <p>Travel moves are usually faster because they do not push filament. Print moves are slower so the
      nozzle can lay down a controlled bead.</p>
    `,
    visual: "rapid-path",
    quiz: [
      { type: "multiple-choice", question: "In most printer G-code, F1800 means:", options: ["1800 mm/min feedrate", "1800 degrees", "1800 grams", "Fan speed 1800"], answer: 0, explanation: "Printer feedrate is commonly expressed in millimeters per minute." },
      { type: "multiple-choice", question: "Which line is likely a fast travel move?", options: ["G1 X80 Y80 F9000", "G1 X80 Y80 E0.6 F1500", "M190 S60", "G28"], answer: 0, explanation: "A high-F move without E is usually travel." },
      { type: "multiple-choice", question: "Which value sets speed in this line?\nG1 X10 Y10 E0.2 F1200", options: ["F1200", "X10", "Y10", "E0.2"], answer: 0, explanation: "F sets feedrate." },
      { type: "fill-blank", question: "Type the feedrate letter used in printer G-code:", answer: "F", hint: "Speed/feed word", explanation: "F is used for feedrate." },
      { type: "multiple-choice", question: "Why are print moves often slower than travel moves?", options: ["Plastic needs time to lay down cleanly", "G1 cannot move fast", "Fans turn off motion", "Homing is required"], answer: 0, explanation: "Printing too fast can hurt extrusion consistency and layer quality." },
      { type: "multiple-choice", question: "A line with no E value usually means:", options: ["No extrusion on that move", "Bed heat only", "Fan full speed", "End print"], answer: 0, explanation: "Without E movement, the nozzle is usually just moving position." },
      { type: "multiple-choice", question: "What is missing from this speed command?\nG1 X20 Y20 ___3000", options: ["F", "M", "S", "T"], answer: 0, explanation: "F3000 sets the feedrate." },
      { type: "fill-blank", question: "Complete the fast travel feedrate:\nG1 X100 Y100 F____", answer: "9000", hint: "Common fast travel example from lesson", explanation: "F9000 is the fast travel example used in this lesson." },
      { type: "multiple-choice", question: "If a travel move is too slow, what may increase?", options: ["Print time", "Bed size", "Nozzle diameter", "Firmware version"], answer: 0, explanation: "Slow travel moves can add unnecessary print time." },
      { type: "multiple-choice", question: "If print moves are too fast, what can happen?", options: ["Poor extrusion quality", "Automatic homing", "Comments disappear", "The bed turns off"], answer: 0, explanation: "Too-fast print moves can cause under-extrusion, weak walls, or rough surfaces." }
    ]
  },

  {
    id: "p-u2-l3",
    unit: 2,
    unitName: "Extrusion & Motion",
    lesson: 3,
    title: "Fans and Cooling",
    icon: "FAN",
    xp: 15,
    theory: `
      <p>Part cooling fans are usually controlled with <code>M106</code> and <code>M107</code>.</p>
      <pre>M106 S255 ; fan full speed
M106 S128 ; fan about half speed
M107      ; fan off</pre>
      <p>Cooling helps bridges, overhangs, and small layers. Too much cooling can hurt layer bonding on
      some materials.</p>
    `,
    visual: "",
    quiz: [
      { type: "multiple-choice", question: "Which command turns the part cooling fan on?", options: ["M106", "M107", "G28", "M190"], answer: 0, explanation: "M106 controls the fan and can set its speed." },
      { type: "multiple-choice", question: "What does M107 usually do?", options: ["Fan off", "Fan full speed", "Home axes", "Heat bed"], answer: 0, explanation: "M107 turns the part cooling fan off." },
      { type: "multiple-choice", question: "In M106 S255, what does S255 mean?", options: ["Fan full speed", "Nozzle 255 C", "X position", "Layer number"], answer: 0, explanation: "For M106, S usually sets fan speed from 0 to 255." },
      { type: "fill-blank", question: "Type the command that turns the fan off:", answer: "M107", hint: "Fan off command", explanation: "M107 turns off the fan." },
      { type: "multiple-choice", question: "Which command is about half fan speed?", options: ["M106 S128", "M106 S255", "M107", "G28"], answer: 0, explanation: "S128 is roughly half of 255." },
      { type: "multiple-choice", question: "Cooling is especially useful for:", options: ["Bridges and overhangs", "Changing Wi-Fi", "Homing X", "Ending the print"], answer: 0, explanation: "Cooling helps plastic solidify for bridges, overhangs, and small details." },
      { type: "multiple-choice", question: "Too much cooling can sometimes cause:", options: ["Poor layer bonding", "Automatic bed leveling", "Nozzle homing", "Program comments"], answer: 0, explanation: "Some materials need heat to bond layers well." },
      { type: "fill-blank", question: "Complete full fan speed:\nM106 S___", answer: "255", hint: "Maximum 8-bit fan value", explanation: "S255 is commonly full fan speed." },
      { type: "multiple-choice", question: "Which command changes fan speed without moving the nozzle?", options: ["M106 S200", "G1 X10 Y10", "G28", "M190 S60"], answer: 0, explanation: "M106 controls the fan; it does not move the axes." },
      { type: "multiple-choice", question: "What is missing from this fan command?\nM106 ___255", options: ["S", "X", "E", "G"], answer: 0, explanation: "S is the parameter used for fan speed." }
    ]
  },

  {
    id: "p-u3-l1",
    unit: 3,
    unitName: "Start & End G-Code",
    lesson: 1,
    title: "Start G-Code Sequence",
    icon: "ST",
    xp: 20,
    theory: `
      <p>Start G-code prepares the printer before the first layer. A common sequence homes axes,
      heats the machine, optionally probes the bed, then primes the nozzle.</p>
      <pre>G28       ; home
M190 S60  ; wait for bed
M109 S210 ; wait for nozzle
G92 E0    ; reset extruder position</pre>
      <p>The exact order depends on printer and slicer, but the goal is always the same: start from a
      known, safe state.</p>
    `,
    visual: "program-structure",
    quiz: [
      { type: "multiple-choice", question: "What is the main purpose of start G-code?", options: ["Prepare the printer before printing", "End the program", "Turn off all heaters", "Delete comments"], answer: 0, explanation: "Start G-code sets up homing, temperatures, probing, and priming before printing." },
      { type: "multiple-choice", question: "Which command usually belongs early in start G-code?", options: ["G28", "M84", "M107 only", "M30"], answer: 0, explanation: "G28 homes the printer so it knows its axis positions." },
      { type: "multiple-choice", question: "Why wait for temperatures before printing?", options: ["Plastic needs correct melt and bed conditions", "Comments require heat", "G1 only works hot", "Fans need bed heat"], answer: 0, explanation: "The nozzle and bed should reach target temperatures before first-layer motion." },
      { type: "fill-blank", question: "Type the command that homes all axes:", answer: "G28", hint: "Home command", explanation: "G28 homes the axes." },
      { type: "multiple-choice", question: "What does G92 E0 often do in start G-code?", options: ["Reset extruder position", "Home Z", "Heat bed", "Turn fan off"], answer: 0, explanation: "G92 E0 sets the current extruder position to zero." },
      { type: "multiple-choice", question: "Which command waits for nozzle temperature?", options: ["M109", "M104", "M140", "M107"], answer: 0, explanation: "M109 waits for the hotend target temperature." },
      { type: "multiple-choice", question: "Which command waits for bed temperature?", options: ["M190", "M140", "M104", "G1"], answer: 0, explanation: "M190 waits for the bed temperature target." },
      { type: "fill-blank", question: "Reset extruder position:\nG92 ___0", answer: "E", hint: "Extruder axis", explanation: "G92 E0 resets the extruder position to zero." },
      { type: "multiple-choice", question: "A start sequence should avoid:", options: ["Moving into the bed before homing", "Waiting for heat", "Homing axes", "Setting temperatures"], answer: 0, explanation: "Motion before known positions can crash into the bed or frame." },
      { type: "multiple-choice", question: "What can vary between printers?", options: ["Start G-code order and probing commands", "The meaning of X and Y always", "Whether G-code has lines", "Whether comments exist"], answer: 0, explanation: "Printer firmware, probes, and slicer profiles affect the exact start sequence." }
    ]
  },

  {
    id: "p-u3-l2",
    unit: 3,
    unitName: "Start & End G-Code",
    lesson: 2,
    title: "End G-Code and Safe Shutdown",
    icon: "END",
    xp: 20,
    theory: `
      <p>End G-code parks the nozzle, turns off heaters and fans, and disables motors when safe.</p>
      <pre>M104 S0 ; hotend off
M140 S0 ; bed off
M107    ; fan off
G1 X0 Y220 F3000 ; park
M84     ; disable motors</pre>
      <p>Good end G-code keeps the hot nozzle away from the finished part and leaves the printer safe.</p>
    `,
    visual: "program-structure",
    quiz: [
      { type: "multiple-choice", question: "What is the purpose of end G-code?", options: ["Shut down and park safely", "Heat the printer for first layer", "Probe the bed", "Start extrusion"], answer: 0, explanation: "End G-code safely parks and turns things off after printing." },
      { type: "multiple-choice", question: "Which command turns the hotend target to zero?", options: ["M104 S0", "M109 S210", "G28", "M106 S255"], answer: 0, explanation: "M104 S0 sets hotend target temperature to zero." },
      { type: "multiple-choice", question: "Which command turns the bed target to zero?", options: ["M140 S0", "M190 S60", "G92 E0", "M107"], answer: 0, explanation: "M140 S0 turns off the heated bed target." },
      { type: "fill-blank", question: "Type the fan off command:", answer: "M107", hint: "Part cooling fan off", explanation: "M107 turns the fan off." },
      { type: "multiple-choice", question: "Why park the nozzle away from the part?", options: ["To avoid heat damage or oozing on the print", "To home the printer", "To turn fan on", "To reset E"], answer: 0, explanation: "A hot nozzle sitting on the part can mark or melt it." },
      { type: "multiple-choice", question: "What does M84 usually do?", options: ["Disable motors", "Heat nozzle", "Probe bed", "Set fan speed"], answer: 0, explanation: "M84 disables stepper motors on many printers." },
      { type: "multiple-choice", question: "Which line is a parking move?", options: ["G1 X0 Y220 F3000", "M104 S0", "M107", "M84"], answer: 0, explanation: "G1 with X/Y coordinates moves the nozzle to a park position." },
      { type: "fill-blank", question: "Turn the bed off:\nM140 S___", answer: "0", hint: "Zero target temperature", explanation: "S0 sets the bed target to zero/off." },
      { type: "multiple-choice", question: "A safe end sequence should turn off:", options: ["Heaters", "The app theme", "Comments", "The slicer name"], answer: 0, explanation: "Heaters should be turned off at the end of a print." },
      { type: "multiple-choice", question: "Which command is fan off, not heater off?", options: ["M107", "M104 S0", "M140 S0", "M190 S60"], answer: 0, explanation: "M107 turns off the fan." }
    ]
  },

  {
    id: "p-u3-l3",
    unit: 3,
    unitName: "Start & End G-Code",
    lesson: 3,
    title: "Reading Slicer Comments",
    icon: ";",
    xp: 20,
    theory: `
      <p>Slicers add comments to organize the file. Comments often start with a semicolon.</p>
      <pre>;TYPE:WALL-OUTER
G1 X30 Y40 E0.22 F1500
;LAYER:12</pre>
      <p>The printer ignores comments, but they help humans understand features, layers, and toolpath types.</p>
    `,
    visual: "",
    quiz: [
      { type: "multiple-choice", question: "In printer G-code, what does a semicolon usually start?", options: ["A comment", "A heater command", "A fan command", "A home move"], answer: 0, explanation: "A semicolon starts a comment in many printer G-code files." },
      { type: "multiple-choice", question: "Which line is only a slicer comment?", options: [";TYPE:WALL-OUTER", "G1 X30 Y40 E0.22", "M104 S210", "G28"], answer: 0, explanation: "The semicolon means the line is a comment for humans." },
      { type: "multiple-choice", question: "What does ;LAYER:12 help identify?", options: ["The current layer", "Nozzle temperature", "Bed size", "Fan speed only"], answer: 0, explanation: "Layer comments help locate sections of the print file." },
      { type: "fill-blank", question: "Type the symbol that starts many printer comments:", answer: ";", hint: "Comment character", explanation: "A semicolon starts many printer G-code comments." },
      { type: "multiple-choice", question: "Does the printer execute the words after a semicolon?", options: ["No, they are ignored as comments", "Yes, always", "Only if heated", "Only on layer 1"], answer: 0, explanation: "Comments are ignored by the firmware." },
      { type: "multiple-choice", question: "Why are slicer comments useful?", options: ["They help humans understand toolpaths", "They heat the bed", "They change E values", "They home the axes"], answer: 0, explanation: "Comments make the file easier to inspect and debug." },
      { type: "multiple-choice", question: "Which is most likely an outer wall label?", options: [";TYPE:WALL-OUTER", "M190 S60", "G28", "M107"], answer: 0, explanation: "Slicers often label feature types with comments." },
      { type: "fill-blank", question: "Complete the layer comment:\n;_____:12", answer: "LAYER", hint: "Layer label", explanation: ";LAYER:12 labels the layer section." },
      { type: "multiple-choice", question: "What should you edit carefully?", options: ["Motion lines, not just comments", "Only blank lines", "Only app settings", "Only the title"], answer: 0, explanation: "Changing motion or temperature lines affects the print. Comments do not execute." },
      { type: "multiple-choice", question: "Which line will move and extrude?", options: ["G1 X30 Y40 E0.22 F1500", ";TYPE:WALL-OUTER", ";LAYER:12", "; generated by slicer"], answer: 0, explanation: "G1 with X/Y/E/F is an executable motion/extrusion line." }
    ]
  },

  {
    id: "p-u4-l1",
    unit: 4,
    unitName: "Print Troubleshooting",
    lesson: 1,
    title: "First Layer Diagnostics",
    icon: "Z",
    xp: 20,
    theory: `
      <p>The first layer decides whether the print has a fair chance. Read the nozzle height,
      line shape, and bed adhesion before changing random settings.</p>
      <pre>G28
G1 Z0.20 F600
G1 X60 Y60 E0.8 F1200</pre>
      <p>A good first layer is slightly squished, continuous, and stuck to the bed. If the nozzle
      is too high, lines look round and may not stick. If it is too low, plastic can smear, click,
      or stop flowing.</p>
    `,
    visual: "lathe-axes",
    quiz: [
      { type: "multiple-choice", question: "Model first-layer move:\nG1 Z0.20 F600\nG1 X60 Y60 E0.8 F1200\n\nWhat does Z0.20 set here?", options: ["Nozzle height above the bed", "Nozzle temperature", "Fan speed", "File name"], answer: 0, explanation: "Z controls height. A first layer often starts near 0.20 mm depending on setup." },
      { type: "multiple-choice", question: "If first-layer lines are round and barely stick, the nozzle is likely:", options: ["Too high", "Too low", "At perfect height", "Printing too much fan only"], answer: 0, explanation: "A high nozzle lays plastic on top of the bed instead of pressing it down." },
      { type: "multiple-choice", question: "If the nozzle scrapes and plastic barely comes out, the nozzle is likely:", options: ["Too low", "Too high", "Too cold only", "Using comments"], answer: 0, explanation: "A low nozzle can block flow by pressing too close to the bed." },
      { type: "multiple-choice", question: "Which line homes the printer before first-layer checks?\nG28\nG1 Z0.20 F600", options: ["G28", "G1 Z0.20 F600", "F600", "Z0.20"], answer: 0, explanation: "G28 homes the printer so it starts from known positions." },
      { type: "fill-blank", question: "Complete a safe first-layer height move:\nG1 ___0.20 F600", answer: "Z", hint: "Vertical axis", explanation: "Z controls vertical nozzle height." },
      { type: "multiple-choice", question: "A good first-layer line should look:", options: ["Slightly flattened and continuous", "Round and loose", "Transparent and scraped away", "Like only a comment"], answer: 0, explanation: "A slightly flattened line usually means the nozzle is close enough to bond." },
      { type: "multiple-choice", question: "What should you adjust first for a bad first layer height?", options: ["Z offset or bed leveling", "App theme", "Comment spelling", "End G-code only"], answer: 0, explanation: "Z offset and bed leveling directly affect first-layer height." },
      { type: "multiple-choice", question: "Which value is extrusion amount in this line?\nG1 X60 Y60 E0.8 F1200", options: ["E0.8", "X60", "Y60", "F1200"], answer: 0, explanation: "E is the extruder amount in most printer G-code." },
      { type: "fill-blank", question: "Type the common command that homes all axes before checking the first layer:", answer: "G28", hint: "Home command", explanation: "G28 homes the printer axes." },
      { type: "multiple-choice", question: "Why fix first-layer problems before tuning speed?", options: ["Poor adhesion can ruin the whole print early", "Speed deletes comments", "Fan speed controls all homing", "M30 fixes bed level"], answer: 0, explanation: "If the first layer fails, later layers do not matter." }
    ]
  },

  {
    id: "p-u4-l2",
    unit: 4,
    unitName: "Print Troubleshooting",
    lesson: 2,
    title: "Retraction and Stringing",
    icon: "RET",
    xp: 20,
    theory: `
      <p>Stringing happens when melted plastic leaks during travel moves. Retraction pulls filament
      back before travel, then primes it again before printing resumes.</p>
      <pre>G1 E-0.8 F1800 ; retract
G0 X90 Y90 F9000 ; travel
G1 E0.8 F1800 ; prime</pre>
      <p>Retraction values depend on printer type, hotend, material, temperature, and slicer settings.
      The pattern is the important part: retract, travel, prime.</p>
    `,
    visual: "rapid-path",
    quiz: [
      { type: "multiple-choice", question: "Model retraction pattern:\nG1 E-0.8 F1800\nG0 X90 Y90 F9000\nG1 E0.8 F1800\n\nWhich line retracts filament?", options: ["G1 E-0.8 F1800", "G0 X90 Y90 F9000", "G1 E0.8 F1800", "; travel"], answer: 0, explanation: "A negative E move pulls filament back on many slicer setups." },
      { type: "multiple-choice", question: "What problem does retraction mainly fight?", options: ["Stringing during travel", "Wrong app language", "Missing home icon", "Program ending"], answer: 0, explanation: "Retraction reduces oozing while the nozzle travels between printed areas." },
      { type: "multiple-choice", question: "Which line is the travel move in this pattern?\nG1 E-0.8 F1800\nG0 X90 Y90 F9000\nG1 E0.8 F1800", options: ["G0 X90 Y90 F9000", "G1 E-0.8 F1800", "G1 E0.8 F1800", "F1800"], answer: 0, explanation: "G0 with X/Y moves the nozzle to a new position without extrusion in this example." },
      { type: "multiple-choice", question: "Which line primes after travel?", options: ["G1 E0.8 F1800", "G1 E-0.8 F1800", "G0 X90 Y90", "G28"], answer: 0, explanation: "A positive E move pushes filament forward again." },
      { type: "fill-blank", question: "Complete a retract move:\nG1 E___0.8 F1800", answer: "-", hint: "Pull back uses negative E in this example", explanation: "The minus sign makes E move backward in this common pattern." },
      { type: "multiple-choice", question: "If retraction is too low, you may see:", options: ["Thin strings between parts", "Perfectly disabled motors", "Only better bed leveling", "No file comments"], answer: 0, explanation: "Not enough retraction can leave plastic oozing during travel." },
      { type: "multiple-choice", question: "If retraction is too aggressive, it can cause:", options: ["Gaps or under-extrusion after travel", "Automatic perfect prints", "Comments to execute", "Bed temperature to vanish"], answer: 0, explanation: "Too much retraction can delay or reduce flow when printing resumes." },
      { type: "multiple-choice", question: "What else can increase stringing besides low retraction?", options: ["Nozzle temperature too high", "App settings tab", "More comments", "M30 only"], answer: 0, explanation: "Hotter plastic flows more easily and can ooze during travel." },
      { type: "fill-blank", question: "Type the axis letter used for extrusion and retraction amount:", answer: "E", hint: "Extruder axis", explanation: "E is the extruder axis in common printer G-code." },
      { type: "multiple-choice", question: "What is the correct sequence?", options: ["Retract, travel, prime", "Prime, home, end", "Fan, comment, M30", "Bed off, print, heat"], answer: 0, explanation: "Retraction pulls back before travel and primes before printing resumes." }
    ]
  },

  {
    id: "p-u4-l3",
    unit: 4,
    unitName: "Print Troubleshooting",
    lesson: 3,
    title: "Flow and Extrusion Clues",
    icon: "FLOW",
    xp: 20,
    theory: `
      <p>Flow problems show up as gaps, thin walls, blobs, heavy seams, or rough top surfaces.
      G-code movement helps you read what the slicer asked the printer to do.</p>
      <pre>G1 X100 E5.0 F1200 ; extrude while moving
M221 S95           ; set flow to 95 percent on many printers</pre>
      <p>Before changing flow, check basics: nozzle size, filament diameter, temperature, and whether
      the extruder is slipping. Flow changes should be small and intentional.</p>
    `,
    visual: "block-anatomy",
    quiz: [
      { type: "multiple-choice", question: "Model extrusion move:\nG1 X100 E5.0 F1200\n\nWhich value asks for extrusion?", options: ["E5.0", "X100", "F1200", "G1"], answer: 0, explanation: "E5.0 is the extrusion amount in this move." },
      { type: "multiple-choice", question: "What can under-extrusion look like?", options: ["Gaps and thin lines", "Only darker theme", "Extra app tabs", "Comments turning into motion"], answer: 0, explanation: "Under-extrusion often leaves gaps, weak walls, or missing top-surface material." },
      { type: "multiple-choice", question: "What can over-extrusion look like?", options: ["Blobs, heavy seams, rough top surfaces", "Perfectly missing filament", "Nozzle homing", "Only a lower streak"], answer: 0, explanation: "Too much plastic can build up as blobs or rough, crowded lines." },
      { type: "multiple-choice", question: "On many printers, what does M221 S95 adjust?", options: ["Flow percentage to 95 percent", "Bed temperature to 95 C always", "Fan off", "Home all axes"], answer: 0, explanation: "M221 is commonly used as a flow multiplier command, but firmware can vary." },
      { type: "fill-blank", question: "Complete a flow command used on many printers:\nM221 S___", answer: "95", hint: "95 percent flow", explanation: "M221 S95 sets flow to 95 percent on many printer firmwares." },
      { type: "multiple-choice", question: "Before changing flow, what should you check?", options: ["Nozzle size and filament diameter", "Only app build number", "Only bottom nav icons", "Only comments"], answer: 0, explanation: "Wrong hardware or filament settings can look like a flow problem." },
      { type: "multiple-choice", question: "Which line both moves and extrudes?", options: ["G1 X100 E5.0 F1200", "M221 S95", "; set flow", "G28"], answer: 0, explanation: "G1 with X and E moves while extruding." },
      { type: "fill-blank", question: "Type the command word in this move:\n___ X100 E5.0 F1200", answer: "G1", hint: "Controlled move", explanation: "G1 is the controlled movement command used for many print paths." },
      { type: "multiple-choice", question: "Why make flow changes small?", options: ["Large changes can create new print defects", "Large changes make comments execute", "They delete G28", "They turn off all axes"], answer: 0, explanation: "Flow affects every extrusion path, so big changes can create new problems." },
      { type: "multiple-choice", question: "What should you do if the extruder clicks or slips?", options: ["Check mechanical feed and nozzle restrictions", "Only increase app XP", "Ignore it and change theme", "Delete comments"], answer: 0, explanation: "Skipping or slipping can come from a clog, pressure, temperature, or extruder tension issue." }
    ]
  },

  {
    id: "p-u5-l1",
    unit: 5,
    unitName: "Material Profiles",
    lesson: 1,
    title: "PLA, PETG, ABS, and Profile Clues",
    icon: "MAT",
    xp: 20,
    theory: `
      <p>Material profiles tell the slicer how hot, fast, and cool a print should run. The G-code
      shows those choices through temperature, fan, and speed commands.</p>
      <pre>M104 S215 ; nozzle target
M140 S70  ; bed target
M106 S180 ; part cooling fan</pre>
      <p>PLA often likes more cooling. PETG often needs less cooling and more bed heat. ABS often
      needs an enclosure and controlled cooling. Always follow the filament maker and printer limits.</p>
    `,
    visual: "program-structure",
    quiz: [
      { type: "multiple-choice", question: "What does a material profile mainly control?", options: ["Temperature, speed, cooling, and related settings", "Only app language", "Only comments", "Only file name"], answer: 0, explanation: "Material profiles group settings that match the filament." },
      { type: "multiple-choice", question: "Which command sets a nozzle target without waiting?", options: ["M104 S215", "M140 S70", "G28", "M107"], answer: 0, explanation: "M104 sets hotend target and continues." },
      { type: "multiple-choice", question: "Which command sets a bed target without waiting?", options: ["M140 S70", "M104 S215", "G1 E1", "M84"], answer: 0, explanation: "M140 sets the bed target and continues." },
      { type: "multiple-choice", question: "Which command changes part cooling fan speed?", options: ["M106 S180", "M104 S215", "G28", "G92 E0"], answer: 0, explanation: "M106 controls fan speed on many printers." },
      { type: "fill-blank", question: "Complete nozzle target 215 C:\nM104 S___", answer: "215", hint: "Temperature target", explanation: "S215 is the target temperature value." },
      { type: "multiple-choice", question: "PLA often prints best with:", options: ["More part cooling than ABS", "Nozzle always off", "No extrusion", "Only G28"], answer: 0, explanation: "PLA usually benefits from part cooling, though exact settings vary." },
      { type: "multiple-choice", question: "PETG often needs caution with:", options: ["Too much fan and poor bed adhesion", "M30 only", "No bed heat ever", "Tool offsets"], answer: 0, explanation: "PETG commonly needs controlled cooling and good bed adhesion." },
      { type: "multiple-choice", question: "ABS commonly benefits from:", options: ["Enclosure and controlled cooling", "Maximum fan always", "Cold bed", "Nozzle off"], answer: 0, explanation: "ABS is sensitive to drafts and shrinkage." },
      { type: "fill-blank", question: "Complete bed target 70 C:\nM140 S___", answer: "70", hint: "Bed target", explanation: "S70 sets the bed target to 70 C." },
      { type: "multiple-choice", question: "Why avoid copying material settings blindly?", options: ["Printer, filament, and environment vary", "All G-code is identical", "Comments set temperature", "G28 changes plastic type"], answer: 0, explanation: "Profiles are starting points and need verification on the actual machine." }
    ]
  },

  {
    id: "p-u6-l1",
    unit: 6,
    unitName: "Supports & Overhangs",
    lesson: 1,
    title: "Supports, Bridges, and Cooling Decisions",
    icon: "SUP",
    xp: 20,
    theory: `
      <p>Supports and bridges are slicer decisions that show up as different toolpath comments,
      fan behavior, and slower motion.</p>
      <pre>;TYPE:SUPPORT
G1 X40 Y80 E0.24 F1400
;TYPE:BRIDGE
M106 S255
G1 X70 Y80 E0.18 F900</pre>
      <p>Supports hold steep overhangs. Bridges span gaps. Cooling and speed matter because plastic
      needs time to hold its shape.</p>
    `,
    visual: "rapid-path",
    quiz: [
      { type: "multiple-choice", question: "What does ;TYPE:SUPPORT label?", options: ["Support toolpath", "Nozzle heat command", "Bed probing", "Home command"], answer: 0, explanation: "Slicers often label support paths with comments." },
      { type: "multiple-choice", question: "What does a bridge do?", options: ["Spans a gap between supported areas", "Changes app settings", "Homes all axes", "Turns motors off"], answer: 0, explanation: "A bridge prints across open space between supports or walls." },
      { type: "multiple-choice", question: "Why slow bridge speed?", options: ["To help strands stay controlled across a gap", "To erase comments", "To heat the bed faster", "To disable extrusion"], answer: 0, explanation: "Bridge speed affects sag and strand placement." },
      { type: "multiple-choice", question: "Which command sets fan full speed in the example?", options: ["M106 S255", "G1 X70", "G28", "M140 S60"], answer: 0, explanation: "M106 S255 is commonly full fan speed." },
      { type: "fill-blank", question: "Complete a support comment:\n;TYPE:____", answer: "SUPPORT", hint: "Support label", explanation: "Slicers may use ;TYPE:SUPPORT to label support paths." },
      { type: "multiple-choice", question: "Supports are mainly used for:", options: ["Steep overhangs that cannot print in air", "Changing filament brand", "Ending the print", "Setting the clock"], answer: 0, explanation: "Supports provide temporary material under overhangs." },
      { type: "multiple-choice", question: "Too much support can cause:", options: ["Hard removal and rough surfaces", "Automatic calibration", "No need for bed heat", "Comments to execute"], answer: 0, explanation: "Support settings affect cleanup and surface quality." },
      { type: "multiple-choice", question: "Which line is still only a comment?", options: [";TYPE:BRIDGE", "G1 X70 Y80 E0.18", "M106 S255", "G28"], answer: 0, explanation: "The semicolon makes it a comment for humans." },
      { type: "fill-blank", question: "Complete full fan speed:\nM106 S___", answer: "255", hint: "Maximum common fan value", explanation: "S255 is commonly full speed for 8-bit fan control." },
      { type: "multiple-choice", question: "What should you inspect when supports fail?", options: ["Overhang angle, cooling, speed, and support distance", "Only app theme", "Only XP", "Only program name"], answer: 0, explanation: "Support success depends on geometry and slicer settings." }
    ]
  },

  {
    id: "p-u7-l1",
    unit: 7,
    unitName: "Firmware Flavors",
    lesson: 1,
    title: "Marlin, Klipper, and Flavor Differences",
    icon: "FW",
    xp: 25,
    theory: `
      <p>Printer G-code is not perfectly universal. Marlin, Klipper, RepRapFirmware, and vendor
      firmware may handle commands, macros, and comments differently.</p>
      <pre>G29       ; bed leveling on many Marlin setups
BED_MESH_CALIBRATE ; Klipper macro-style command
M486 S2   ; object cancel support on some setups</pre>
      <p>When a command seems right but fails, check the firmware flavor and printer documentation.</p>
    `,
    visual: "program-structure",
    quiz: [
      { type: "multiple-choice", question: "Why can the same command behave differently on two printers?", options: ["Firmware flavor can differ", "G-code never has standards", "Comments control firmware", "The screen color changes it"], answer: 0, explanation: "Firmware implementations and enabled features vary." },
      { type: "multiple-choice", question: "Which is a Klipper-style macro command in the example?", options: ["BED_MESH_CALIBRATE", "G29", "M104 S210", "G1 X10"], answer: 0, explanation: "Klipper commonly uses readable macro commands like BED_MESH_CALIBRATE." },
      { type: "multiple-choice", question: "What does G29 often mean on many Marlin setups?", options: ["Bed leveling/probing", "Fan off", "Disable motors", "Extrude 29 mm"], answer: 0, explanation: "G29 is often used for probing or leveling in Marlin-style workflows." },
      { type: "multiple-choice", question: "What should you check when a command is rejected?", options: ["Printer firmware docs", "App background", "Only slicer logo", "Only XP total"], answer: 0, explanation: "Firmware documentation tells you which commands and macros are supported." },
      { type: "fill-blank", question: "Complete the common Marlin probing command:\n___", answer: "G29", hint: "Bed leveling/probing", explanation: "G29 is commonly bed probing on many Marlin setups." },
      { type: "multiple-choice", question: "A slicer profile should match:", options: ["The printer firmware flavor", "Only the phone browser", "Only comment color", "Only unit number"], answer: 0, explanation: "The slicer needs to emit commands the printer understands." },
      { type: "multiple-choice", question: "Which command is a normal motion command across many flavors?", options: ["G1 X10 Y10", "BED_MESH_CALIBRATE", "Vendor macro only", "Unknown macro"], answer: 0, explanation: "G1 movement is widely supported." },
      { type: "multiple-choice", question: "What is the safe assumption about advanced commands?", options: ["Verify support before using them", "They always work everywhere", "They are only comments", "They never affect motion"], answer: 0, explanation: "Advanced commands may depend on firmware options." },
      { type: "fill-blank", question: "Complete the idea: firmware flavor affects command ____.", answer: "support", hint: "What commands are available", explanation: "Firmware flavor affects command support and behavior." },
      { type: "multiple-choice", question: "Why does this matter for learning?", options: ["You learn the pattern and then verify machine-specific details", "You can ignore printer docs", "Every printer is identical", "Slicer comments cut plastic"], answer: 0, explanation: "The concept transfers, but the exact command set must be verified." }
    ]
  },

  {
    id: "p-u8-l1",
    unit: 8,
    unitName: "Multi-Material & Tool Changes",
    lesson: 1,
    title: "T Commands, Filament Changes, and Purging",
    icon: "T0",
    xp: 25,
    theory: `
      <p>Multi-material printing adds tool changes, filament changes, purge moves, and sometimes
      wipe towers. The G-code must manage which extruder or filament is active.</p>
      <pre>T0 ; select tool 0
G1 E12 F300 ; purge
T1 ; select tool 1
M600 ; filament change on many printers</pre>
      <p>Tool-change behavior is printer-specific. Some printers use multiple nozzles, some use one
      nozzle with filament switching, and some use slicer-managed purge systems.</p>
    `,
    visual: "block-anatomy",
    quiz: [
      { type: "multiple-choice", question: "What does T0 commonly select?", options: ["Tool or extruder 0", "Temperature zero", "Travel speed", "Layer zero"], answer: 0, explanation: "T commands commonly select tools or extruders." },
      { type: "multiple-choice", question: "What does T1 commonly select?", options: ["Tool or extruder 1", "Fan speed 1", "Bed 1", "Comment 1"], answer: 0, explanation: "T1 commonly selects the second tool/extruder." },
      { type: "multiple-choice", question: "What is purging used for after a tool or filament change?", options: ["Push old material/color out", "Home the axes", "Turn off the bed", "Delete supports"], answer: 0, explanation: "Purging clears old material and primes the nozzle." },
      { type: "multiple-choice", question: "What does M600 commonly mean on many printers?", options: ["Filament change", "Fan full speed", "Disable motors", "Metric mode"], answer: 0, explanation: "M600 is commonly used for filament change, but firmware support varies." },
      { type: "fill-blank", question: "Select tool 1:\n___", answer: "T1", hint: "Tool command", explanation: "T1 selects tool/extruder 1 on many setups." },
      { type: "multiple-choice", question: "Why can tool-change G-code vary a lot?", options: ["Printer hardware and firmware differ", "T commands are comments", "Only app theme matters", "Filament has no effect"], answer: 0, explanation: "Multi-material systems use different hardware and firmware logic." },
      { type: "multiple-choice", question: "Which line is a purge move?", options: ["G1 E12 F300", "T0", "M600", "; select tool"], answer: 0, explanation: "A positive E move extrudes/purges material." },
      { type: "multiple-choice", question: "What is a purge tower for?", options: ["Cleaning/priming color changes away from the part", "Bed leveling only", "Cooling the hotend off", "Setting X zero"], answer: 0, explanation: "A purge tower handles material/color transitions." },
      { type: "fill-blank", question: "Complete a common filament change command:\nM___", answer: "600", hint: "Filament change", explanation: "M600 is commonly used for filament change where supported." },
      { type: "multiple-choice", question: "Before using M600, verify:", options: ["Firmware supports it", "The app is light mode", "The file has no comments", "X is always zero"], answer: 0, explanation: "Unsupported filament-change commands can fail or be ignored." }
    ]
  },

  {
    id: "p-u9-l1",
    unit: 9,
    unitName: "Print Recovery & Pauses",
    lesson: 1,
    title: "Pauses, Runout, and Safe Resume",
    icon: "PAU",
    xp: 25,
    theory: `
      <p>Print recovery is about pausing safely, keeping heat controlled, and resuming without
      crashing into the part or leaving blobs.</p>
      <pre>M0 ; pause on some printers
M25 ; pause SD print on some printers
G1 Z10 F600 ; lift before service
G1 E3 F300 ; prime before resume</pre>
      <p>Pause behavior is firmware-specific. A safe resume confirms position, nozzle temperature,
      extrusion prime, and clearance.</p>
    `,
    visual: "rapid-path",
    quiz: [
      { type: "multiple-choice", question: "What is the purpose of a print pause?", options: ["Stop temporarily for service or inspection", "End the app", "Delete G-code", "Change units"], answer: 0, explanation: "Pauses let you inspect, change filament, or handle an issue." },
      { type: "multiple-choice", question: "What can M0 mean on some printers?", options: ["Pause", "Fan off", "Home X", "Set bed temp"], answer: 0, explanation: "M0 is a pause/stop command on some systems." },
      { type: "multiple-choice", question: "What can M25 mean for some SD-card prints?", options: ["Pause SD print", "Nozzle heat", "Fan full", "Tool select"], answer: 0, explanation: "M25 is used by some firmware for SD print pause." },
      { type: "multiple-choice", question: "Why lift Z before servicing a paused print?", options: ["To create clearance from the part", "To cool the bed", "To change app theme", "To cancel comments"], answer: 0, explanation: "Lifting helps avoid dragging or melting the part." },
      { type: "fill-blank", question: "Complete a 10 mm lift:\nG1 ___10 F600", answer: "Z", hint: "Vertical axis", explanation: "Z lifts the nozzle away from the print." },
      { type: "multiple-choice", question: "Before resume, what should be checked?", options: ["Position, heat, prime, and clearance", "Only file name", "Only phone battery", "Only app version"], answer: 0, explanation: "Safe resume needs the printer ready to continue without a blob or crash." },
      { type: "multiple-choice", question: "Why prime before resume?", options: ["To restore filament flow", "To home the bed", "To turn off motors", "To delete strings"], answer: 0, explanation: "Pauses can leave the nozzle under-primed." },
      { type: "multiple-choice", question: "Which line primes filament?", options: ["G1 E3 F300", "M25", "G1 Z10", "M0"], answer: 0, explanation: "Positive E extrusion primes the nozzle." },
      { type: "fill-blank", question: "Type one common pause command:", answer: "M0", hint: "Pause/stop on some printers", explanation: "M0 is a common pause command, but support varies." },
      { type: "multiple-choice", question: "Why verify firmware pause behavior?", options: ["Pause commands are not identical everywhere", "Pauses always fail", "Comments control all pauses", "G1 cannot move"], answer: 0, explanation: "Different printer firmware handles pause and resume differently." }
    ]
  },

  {
    id: "p-u10-l1",
    unit: 10,
    unitName: "Slicer Tuning Workflow",
    lesson: 1,
    title: "One-Change-at-a-Time Tuning",
    icon: "TUNE",
    xp: 25,
    theory: `
      <p>Good tuning is controlled. Change one setting, print a known test, read the result, and
      record what changed.</p>
      <pre>Temp tower: tune temperature
Retraction tower: tune strings
Flow cube: tune wall thickness
Speed test: tune motion quality</pre>
      <p>If you change temperature, speed, fan, flow, and retraction all at once, you will not know
      which setting fixed or caused the result.</p>
    `,
    visual: "program-structure",
    quiz: [
      { type: "multiple-choice", question: "What is the best tuning habit?", options: ["Change one variable at a time", "Change everything at once", "Never record settings", "Only change color"], answer: 0, explanation: "One change at a time lets you connect cause and effect." },
      { type: "multiple-choice", question: "What does a temperature tower help tune?", options: ["Nozzle temperature", "App language", "Tool number", "Comment style"], answer: 0, explanation: "A temperature tower compares print quality at different temperatures." },
      { type: "multiple-choice", question: "What does a retraction tower help tune?", options: ["Stringing and travel cleanup", "Bed size", "Z homing only", "Program end"], answer: 0, explanation: "Retraction tests reveal stringing and restart quality." },
      { type: "multiple-choice", question: "What does a flow cube often help check?", options: ["Wall thickness and extrusion flow", "Wi-Fi signal", "Only supports", "Firmware name"], answer: 0, explanation: "Flow tests help evaluate extrusion amount." },
      { type: "fill-blank", question: "Complete the habit: change one ____ at a time.", answer: "variable", hint: "One setting", explanation: "One variable at a time keeps tuning readable." },
      { type: "multiple-choice", question: "Why record tuning changes?", options: ["So you can repeat or undo them", "So comments execute", "So G28 heats faster", "So XP doubles"], answer: 0, explanation: "Records make tuning decisions traceable." },
      { type: "multiple-choice", question: "If stringing improves after changing temperature and retraction together, what is the problem?", options: ["You do not know which change helped", "The print cannot be used", "G-code stopped working", "The bed changed size"], answer: 0, explanation: "Multiple simultaneous changes hide the cause." },
      { type: "multiple-choice", question: "Which test best targets ringing or motion quality?", options: ["Speed/acceleration test", "Filament color test", "Comment test", "M30 test"], answer: 0, explanation: "Motion quality is affected by speed and acceleration." },
      { type: "fill-blank", question: "A retraction tower mainly checks for ____.", answer: "stringing", hint: "Thin plastic hairs", explanation: "Retraction tuning targets stringing and restart artifacts." },
      { type: "multiple-choice", question: "The goal of slicer tuning is:", options: ["Predictable print quality through measured changes", "Random trial and error forever", "More tabs", "Ignoring material profiles"], answer: 0, explanation: "Good tuning makes results more predictable." }
    ]
  }
];

const PRINTING_UNITS = [
  { id: 1, name: "Printer Foundations", icon: "3D", color: "#2D5986", lessons: 3 },
  { id: 2, name: "Extrusion & Motion", icon: "E", color: "#1A6B5C", lessons: 3 },
  { id: 3, name: "Start & End G-Code", icon: "ST", color: "#7B4F12", lessons: 3 },
  { id: 4, name: "Print Troubleshooting", icon: "FIX", color: "#5C2D6B", lessons: 3 },
  { id: 5, name: "Material Profiles", icon: "MAT", color: "#A65E2E", lessons: 1 },
  { id: 6, name: "Supports & Overhangs", icon: "SUP", color: "#3A6D8C", lessons: 1 },
  { id: 7, name: "Firmware Flavors", icon: "FW", color: "#4B5D2A", lessons: 1 },
  { id: 8, name: "Multi-Material & Tool Changes", icon: "T0", color: "#6B4A8F", lessons: 1 },
  { id: 9, name: "Print Recovery & Pauses", icon: "PAU", color: "#7A2E2E", lessons: 1 },
  { id: 10, name: "Slicer Tuning Workflow", icon: "TUNE", color: "#0B6E7A", lessons: 1 }
];

const TRACKS = {
  cnc: {
    id: "cnc",
    name: "CNC",
    title: "Master CNC G-Code",
    lessons: LESSONS,
    units: UNITS
  },
  printing: {
    id: "printing",
    name: "3D Printing",
    title: "Master 3D Printer G-Code",
    lessons: PRINTING_LESSONS,
    units: PRINTING_UNITS
  }
};

const LESSON_QUESTION_EXPANSIONS = {
  "u1-l1": [
    {
      type: "multiple-choice",
      question: "In this block, what does the semicolon start?\nG00 X1.000 Z0.100 ; move clear",
      options: ["A tool change", "A comment", "A feedrate", "A coordinate"],
      answer: 1,
      explanation: "A semicolon starts a comment on many controls. The machine ignores the text after it."
    },
    {
      type: "multiple-choice",
      question: "Model rapid move:\nG00 X3.200 Z0.300\n\nWhat is missing from this rapid move?\n___ X2.000 Z0.100",
      options: ["G00", "M05", "F0.012", "T0101"],
      answer: 0,
      explanation: "G00 is the rapid positioning command. G0 is also used on many controls; X and Z give the destination."
    },
    {
      type: "multiple-choice",
      question: "Which word tells the machine what action or motion mode to use?\nN010 G01 X1.250 Z-0.500 F0.012",
      options: ["N010", "G01", "X1.250", "F0.012"],
      answer: 1,
      explanation: "The G-word is the command. Here, G01 means controlled linear feed."
    },
    {
      type: "multiple-choice",
      question: "Which part is the feedrate in this block?\nG01 X1.250 Z-0.500 F0.012",
      options: ["G01", "X1.250", "Z-0.500", "F0.012"],
      answer: 3,
      explanation: "The F word sets feedrate. On many lathes this may be inches per revolution."
    },
    {
      type: "multiple-choice",
      question: "Which line is only a comment?",
      options: ["G00 X2.000 Z0.100", "(ROUGH TURN OD)", "M03 S800", "G01 Z-1.000 F0.012"],
      answer: 1,
      explanation: "Text inside parentheses is a comment on many controls. It helps the reader but does not cut metal."
    },
    {
      type: "fill-blank",
      question: "Type the letter used for feedrate in this block:\nG01 X1.000 Z-0.250 ___0.010",
      answer: "F",
      hint: "Feedrate word",
      explanation: "F is the feedrate word. It tells the machine how fast to make the controlled move."
    },
    {
      type: "multiple-choice",
      question: "What does one block of G-code usually represent?",
      options: ["One complete part program", "One line of instructions", "Only a tool number", "Only a comment"],
      answer: 1,
      explanation: "A block is one line of G-code. The control reads blocks in order."
    }
  ],
  "u1-l2": [
    {
      type: "multiple-choice",
      question: "What is missing from this absolute-positioning setup line?\n___ G20 G40",
      options: ["G90", "G91", "M30", "T0101"],
      answer: 0,
      explanation: "G90 selects absolute positioning, where positions are measured from program zero."
    },
    {
      type: "multiple-choice",
      question: "If Z0 is the part face, which value moves into the part?",
      options: ["Z0.500", "Z0.100", "Z-0.500", "ZHOME"],
      answer: 2,
      explanation: "Negative Z moves into the part from the face on a typical lathe setup."
    },
    {
      type: "multiple-choice",
      question: "On most lathes in diameter mode, X2.000 means:",
      options: ["2.000 inch diameter", "2.000 inch radius", "2.000 inches in Z", "2.000 RPM"],
      answer: 0,
      explanation: "Lathe X values commonly represent diameter, not radius."
    },
    {
      type: "fill-blank",
      question: "Type the code for incremental positioning:",
      answer: "G91",
      hint: "Incremental mode measures from the current position",
      explanation: "G91 is incremental positioning. Each move is measured from the current location."
    },
    {
      type: "multiple-choice",
      question: "Which axis runs along the spindle centerline on a lathe?",
      options: ["X", "Y", "Z", "E"],
      answer: 2,
      explanation: "Z runs along the spindle centerline. X controls diameter."
    },
    {
      type: "multiple-choice",
      question: "What is missing from this coordinate move?\nG00 X2.000 ___0.100",
      options: ["Z", "S", "M", "T"],
      answer: 0,
      explanation: "Z is the axis word for the position along the spindle centerline."
    },
    {
      type: "multiple-choice",
      question: "In absolute mode, X and Z positions are measured from:",
      options: ["The previous line", "The program zero point", "The tool number", "The feed override knob"],
      answer: 1,
      explanation: "G90 absolute mode measures positions from program zero."
    }
  ],
  "u1-l3": [
    {
      type: "multiple-choice",
      question: "What does the O-number usually identify?\nO1001",
      options: ["Program number", "Spindle speed", "Feedrate", "Tool offset"],
      answer: 0,
      explanation: "The O-number identifies the program."
    },
    {
      type: "multiple-choice",
      question: "What is missing from the end of this simple program?\n...\nM05\n___",
      options: ["M30", "G91", "F0.012", "X0"],
      answer: 0,
      explanation: "M30 ends the program and rewinds it to the beginning."
    },
    {
      type: "multiple-choice",
      question: "Which line turns the spindle off?",
      options: ["M03", "M05", "M30", "G00"],
      answer: 1,
      explanation: "M05 turns the spindle off."
    },
    {
      type: "multiple-choice",
      question: "What does a safety block help prevent?",
      options: ["Wrong leftover modal settings", "Operator login errors", "Network errors", "Low coolant level only"],
      answer: 0,
      explanation: "A safety block resets important modes so old modal states do not carry into the program."
    },
    {
      type: "fill-blank",
      question: "Type the M-code that ends and rewinds a program:",
      answer: "M30",
      hint: "Common program ending code",
      explanation: "M30 ends the program and returns it to the start."
    },
    {
      type: "multiple-choice",
      question: "Which line is a tool description comment?",
      options: ["(TOOL: T0101 OD ROUGH)", "G00 X2.000", "M03 S800", "G01 Z-1.000"],
      answer: 0,
      explanation: "Parentheses are commonly used for comments and descriptions."
    },
    {
      type: "multiple-choice",
      question: "What is missing from this spindle start line?\nS800 ___",
      options: ["M03", "G54", "G00", "F0.012"],
      answer: 0,
      explanation: "M03 starts the spindle clockwise. S800 sets the speed."
    }
  ],
  "u2-l1": [
    {
      type: "multiple-choice",
      question: "What should G00 usually be used for?",
      options: ["Cutting at feedrate", "Positioning in clear space", "Threading", "Turning coolant off"],
      answer: 1,
      explanation: "G00 is rapid positioning. It should be used when the tool is clear of the part."
    },
    {
      type: "multiple-choice",
      question: "Model rapid line:\nG00 X3.200 Z0.300\n\nWhat is missing from this rapid line?\nG00 X2.500 ___0.100",
      options: ["Z", "F", "M", "S"],
      answer: 0,
      explanation: "Z0.100 gives the Z clearance position."
    },
    {
      type: "multiple-choice",
      question: "Why is G00 risky near the part?",
      options: ["It moves at rapid speed", "It always turns off coolant", "It changes tool offsets", "It ends the program"],
      answer: 0,
      explanation: "Rapid speed leaves little time to react. Keep clearance before using G00."
    },
    {
      type: "multiple-choice",
      question: "Which block is safest for approaching before a cut?",
      options: ["G00 X0.500 Z-0.500", "G00 X2.500 Z0.100", "M30", "G91 X-5.000"],
      answer: 1,
      explanation: "X2.500 Z0.100 is a clearance position before feeding into the cut."
    },
    {
      type: "fill-blank",
      question: "Type the rapid positioning code:",
      answer: "G00",
      hint: "Rapid traverse",
      explanation: "G00 is rapid positioning."
    },
    {
      type: "multiple-choice",
      question: "If G00 is modal, what happens on the next line if no new motion code is given?",
      options: ["G00 remains active", "The program ends", "The spindle reverses", "Feedrate doubles"],
      answer: 0,
      explanation: "Modal motion codes remain active until another motion code changes them."
    },
    {
      type: "multiple-choice",
      question: "Which word in G00 X2.500 Z0.100 is the motion command?",
      options: ["G00", "X2.500", "Z0.100", "None"],
      answer: 0,
      explanation: "G00 is the motion command. X and Z are coordinates."
    }
  ],
  "u2-l2": [
    {
      type: "multiple-choice",
      question: "What does G01 mean?",
      options: ["Rapid move", "Linear feed move", "Arc clockwise", "End program"],
      answer: 1,
      explanation: "G01 is a controlled straight-line feed move."
    },
    {
      type: "multiple-choice",
      question: "Model feed move:\nG01 Z-0.500 F0.012\n\nWhat is missing from this feed move?\nG01 Z-1.000 ___0.012",
      options: ["F", "S", "M", "T"],
      answer: 0,
      explanation: "F sets the feedrate for a controlled G01 move."
    },
    {
      type: "multiple-choice",
      question: "Which line is a controlled cutting move?",
      options: ["G00 X2.000 Z0.100", "G01 Z-1.000 F0.012", "M30", "(ROUGH PASS)"],
      answer: 1,
      explanation: "G01 with a feedrate is used for controlled cutting moves."
    },
    {
      type: "multiple-choice",
      question: "Why should a feedrate be present before cutting?",
      options: ["It controls cutting speed of the move", "It names the program", "It homes the machine", "It selects the tool"],
      answer: 0,
      explanation: "Feedrate controls how fast the tool feeds through material."
    },
    {
      type: "fill-blank",
      question: "Type the linear feed code:",
      answer: "G01",
      hint: "Straight controlled move",
      explanation: "G01 is the linear feed command."
    },
    {
      type: "multiple-choice",
      question: "In G01 X1.500 Z-0.750 F0.012, what does Z-0.750 describe?",
      options: ["Spindle speed", "Z destination", "Tool number", "Coolant state"],
      answer: 1,
      explanation: "Z-0.750 is the destination along the Z axis."
    },
    {
      type: "multiple-choice",
      question: "Which code would cancel G01 motion by switching back to rapid?",
      options: ["G00", "M05", "M30", "T0101"],
      answer: 0,
      explanation: "G00 switches the active motion mode to rapid positioning."
    }
  ],
  "u2-l3": [
    {
      type: "multiple-choice",
      question: "What does G02 usually mean?",
      options: ["Counterclockwise arc", "Clockwise arc", "Rapid move", "Program stop"],
      answer: 1,
      explanation: "G02 is clockwise circular interpolation."
    },
    {
      type: "multiple-choice",
      question: "What does G03 usually mean?",
      options: ["Counterclockwise arc", "Clockwise arc", "Tool change", "Spindle off"],
      answer: 0,
      explanation: "G03 is counterclockwise circular interpolation."
    },
    {
      type: "multiple-choice",
      question: "What is missing from this CCW arc line?\n___ X2.000 Z-0.500 R0.250 F0.008",
      options: ["G03", "G00", "M03", "G90"],
      answer: 0,
      explanation: "G03 commands a counterclockwise arc."
    },
    {
      type: "multiple-choice",
      question: "In an arc block, what does R usually describe?",
      options: ["Arc radius", "RPM", "Rapid mode", "Return point"],
      answer: 0,
      explanation: "R specifies the arc radius on controls that support R-format arcs."
    },
    {
      type: "fill-blank",
      question: "Type the clockwise arc code:",
      answer: "G02",
      hint: "Clockwise circular move",
      explanation: "G02 is the clockwise arc command."
    },
    {
      type: "multiple-choice",
      question: "Which line is an arc move?",
      options: ["G02 X1.000 Z-0.250 R0.125 F0.006", "G00 X2.000 Z0.100", "M05", "(ARC PASS)"],
      answer: 0,
      explanation: "G02 with endpoint coordinates and an R value defines an arc move."
    },
    {
      type: "multiple-choice",
      question: "Why should arc direction be checked carefully?",
      options: ["Wrong direction cuts the wrong shape", "It changes the program number", "It always homes the machine", "It disables the tool offset"],
      answer: 0,
      explanation: "G02 and G03 cut opposite directions. Choosing the wrong one changes the path."
    }
  ],
  "u3-l1": [
    {
      type: "multiple-choice",
      question: "What does G96 control?",
      options: ["Constant surface speed", "Rapid position", "End program", "Tool number"],
      answer: 0,
      explanation: "G96 turns on constant surface speed mode."
    },
    {
      type: "multiple-choice",
      question: "What does G97 control?",
      options: ["Fixed RPM mode", "Incremental mode", "Thread pitch", "Coolant"],
      answer: 0,
      explanation: "G97 sets fixed spindle RPM mode."
    },
    {
      type: "multiple-choice",
      question: "What is missing from this spindle line?\nG97 S800 ___",
      options: ["M03", "G00", "F0.012", "X2.0"],
      answer: 0,
      explanation: "M03 starts the spindle clockwise after S sets the speed."
    },
    {
      type: "multiple-choice",
      question: "In G96 S400 M03, what does S400 represent?",
      options: ["Surface speed target", "X position", "Feedrate", "Program number"],
      answer: 0,
      explanation: "With G96, S is the surface speed target."
    },
    {
      type: "fill-blank",
      question: "Type the fixed RPM spindle mode code:",
      answer: "G97",
      hint: "Opposite of constant surface speed",
      explanation: "G97 selects fixed RPM mode."
    },
    {
      type: "multiple-choice",
      question: "Why use a spindle speed limit with G96?",
      options: ["To prevent excessive RPM near center", "To change the tool number", "To cancel comments", "To make G00 slower"],
      answer: 0,
      explanation: "CSS can increase RPM as diameter gets smaller, so a limit protects the machine and setup."
    },
    {
      type: "multiple-choice",
      question: "Which M-code stops the spindle?",
      options: ["M03", "M04", "M05", "M30"],
      answer: 2,
      explanation: "M05 stops the spindle."
    }
  ],
  "u3-l2": [
    {
      type: "multiple-choice",
      question: "What is G71 used for?",
      options: ["Rough turning cycle", "Rapid positioning", "Spindle stop", "Program end"],
      answer: 0,
      explanation: "G71 is a rough turning cycle on many lathe controls."
    },
    {
      type: "multiple-choice",
      question: "Why use a roughing cycle?",
      options: ["To remove bulk material using repeated passes", "To write comments", "To set the date", "To disable feedrate"],
      answer: 0,
      explanation: "Roughing cycles automate repeated material-removal passes."
    },
    {
      type: "multiple-choice",
      question: "What does the profile section of a roughing cycle describe?",
      options: ["The final shape to rough toward", "The operator name", "The coolant tank", "The keyboard shortcut"],
      answer: 0,
      explanation: "The cycle follows a defined profile to rough the part shape."
    },
    {
      type: "multiple-choice",
      question: "What is missing from this roughing call?\n___ U0.050 R0.020",
      options: ["G71", "G00", "M30", "G54"],
      answer: 0,
      explanation: "G71 starts the rough turning cycle."
    },
    {
      type: "fill-blank",
      question: "Type the rough turning cycle code:",
      answer: "G71",
      hint: "Lathe roughing cycle",
      explanation: "G71 is the common OD/ID rough turning cycle."
    },
    {
      type: "multiple-choice",
      question: "Why leave finish stock during roughing?",
      options: ["So a finish pass can clean the final size", "So comments run faster", "So the program ends early", "So the spindle stops"],
      answer: 0,
      explanation: "Roughing removes most material while leaving stock for a cleaner finish pass."
    },
    {
      type: "multiple-choice",
      question: "Which is safer before starting a roughing cycle?",
      options: ["Verify clearances and profile", "Ignore tool offsets", "Start inside the part", "Remove the safety block"],
      answer: 0,
      explanation: "Roughing cycles make repeated moves, so clearances and profile endpoints must be checked."
    }
  ],
  "u3-l3": [
    {
      type: "multiple-choice",
      question: "What is G76 used for?",
      options: ["Threading cycle", "Rapid positioning", "Program rewind", "Bed leveling"],
      answer: 0,
      explanation: "G76 is a threading cycle on many lathe controls."
    },
    {
      type: "multiple-choice",
      question: "What does thread pitch describe?",
      options: ["Distance from one thread to the next", "Spindle direction only", "Tool color", "Program number"],
      answer: 0,
      explanation: "Pitch is the distance between thread crests."
    },
    {
      type: "multiple-choice",
      question: "Why is spindle speed important during threading?",
      options: ["The feed must synchronize with spindle rotation", "It changes comments", "It controls screen brightness", "It selects units"],
      answer: 0,
      explanation: "Threading must synchronize tool feed with spindle rotation to cut the correct pitch."
    },
    {
      type: "multiple-choice",
      question: "What is missing from this threading cycle call?\n___ X0.900 Z-1.000 P... Q... F0.050",
      options: ["G76", "G00", "M30", "G54"],
      answer: 0,
      explanation: "G76 calls the threading cycle."
    },
    {
      type: "fill-blank",
      question: "Type the common lathe threading cycle code:",
      answer: "G76",
      hint: "Threading cycle",
      explanation: "G76 is a common multi-pass threading cycle."
    },
    {
      type: "multiple-choice",
      question: "Which value commonly represents thread lead or pitch in a G76 block?",
      options: ["F value", "O number", "Comment text", "Tool icon"],
      answer: 0,
      explanation: "The F value commonly defines thread lead or pitch."
    },
    {
      type: "multiple-choice",
      question: "What should be checked before running a threading cycle?",
      options: ["Thread pitch, start point, and clearance", "Only the app theme", "Only the program comment", "Only the line number"],
      answer: 0,
      explanation: "Threading has little room for error, so pitch, start point, and clearance matter."
    }
  ],
  "u4-l1": [
    {
      type: "multiple-choice",
      question: "In T0101, what does the first pair usually identify?",
      options: ["Tool station", "Feedrate", "Program number", "Coolant state"],
      answer: 0,
      explanation: "The first pair commonly identifies the turret station or tool number."
    },
    {
      type: "multiple-choice",
      question: "In T0101, what does the second pair usually identify?",
      options: ["Offset number", "Spindle speed", "Z axis", "Comment number"],
      answer: 0,
      explanation: "The second pair commonly identifies the geometry/wear offset number."
    },
    {
      type: "multiple-choice",
      question: "What is missing from this tool call?\n___0101",
      options: ["T", "F", "S", "G"],
      answer: 0,
      explanation: "T is the tool-call word."
    },
    {
      type: "multiple-choice",
      question: "Why are tool offsets important?",
      options: ["They tell the control where the tool tip actually is", "They start the spindle", "They add comments", "They end the program"],
      answer: 0,
      explanation: "Offsets compensate for each tool's measured position."
    },
    {
      type: "fill-blank",
      question: "Type the tool word letter in this call:\n___0202",
      answer: "T",
      hint: "Tool call word",
      explanation: "T calls the tool and offset."
    },
    {
      type: "multiple-choice",
      question: "What can happen if the wrong offset is active?",
      options: ["The tool can cut in the wrong place", "The comment color changes", "The program number changes", "The keyboard stops"],
      answer: 0,
      explanation: "Wrong offsets can move the tool to an unsafe or incorrect location."
    },
    {
      type: "multiple-choice",
      question: "Which is a tool call?",
      options: ["T0303", "G00", "M30", "(TOOL)"],
      answer: 0,
      explanation: "T0303 calls tool 03 with offset 03 on many lathes."
    }
  ],
  "u4-l2": [
    {
      type: "multiple-choice",
      question: "What does G54 usually represent?",
      options: ["Work offset", "Rapid move", "Spindle stop", "Threading cycle"],
      answer: 0,
      explanation: "G54 is a work coordinate offset."
    },
    {
      type: "multiple-choice",
      question: "Why use a work offset?",
      options: ["To tell the control where part zero is", "To turn on the fan", "To pick a font", "To skip all safety checks"],
      answer: 0,
      explanation: "A work offset connects program zero to the actual setup on the machine."
    },
    {
      type: "multiple-choice",
      question: "What is missing from this common offset line?\n___ G20 G40",
      options: ["G54", "M30", "F0.012", "T0101"],
      answer: 0,
      explanation: "G54 selects the first common work offset."
    },
    {
      type: "multiple-choice",
      question: "If G54 is wrong, what can happen?",
      options: ["The whole program can be shifted to the wrong location", "Comments become active motion", "The app language changes", "The machine ignores all M-codes"],
      answer: 0,
      explanation: "An incorrect work offset shifts every programmed position."
    },
    {
      type: "fill-blank",
      question: "Type the most common first work offset code:",
      answer: "G54",
      hint: "First work coordinate offset",
      explanation: "G54 is the first common work coordinate offset."
    },
    {
      type: "multiple-choice",
      question: "Where is Z0 often set for a turned part?",
      options: ["Finished part face", "Keyboard edge", "Coolant tank", "Tool holder label"],
      answer: 0,
      explanation: "Z0 is commonly set at the finished face of the part."
    },
    {
      type: "multiple-choice",
      question: "Which line selects a work offset?",
      options: ["G54", "M05", "T0101", "(OFFSET)"],
      answer: 0,
      explanation: "G54 selects a work coordinate offset."
    },
    {
      type: "multiple-choice",
      question: "What should be verified before pressing cycle start?",
      options: ["Active work offset and tool offset", "Only the comment spelling", "Only the screen brightness", "Only the app build number"],
      answer: 0,
      explanation: "The active work offset and tool offset define where the tool will actually go."
    }
  ],
  "p-u1-l1": [
    {
      type: "multiple-choice",
      question: "In this print move, what does the semicolon start?\nG1 X50 Y50 ; travel to center",
      options: ["Comment", "Temperature", "Extrusion", "Layer height"],
      answer: 0,
      explanation: "A semicolon starts a comment in many 3D printer G-code files."
    },
    {
      type: "multiple-choice",
      question: "What is missing from this print move?\n___ X82.4 Y104.2 E0.036 F1800",
      options: ["G1", "M104", "G28", "M30"],
      answer: 0,
      explanation: "G1 is the controlled move used for most printing paths."
    },
    {
      type: "multiple-choice",
      question: "Which value controls nozzle position left/right on the bed?",
      options: ["X", "E", "F", "M"],
      answer: 0,
      explanation: "X controls one horizontal bed direction."
    },
    {
      type: "multiple-choice",
      question: "Which value controls nozzle position front/back on the bed?",
      options: ["Y", "E", "S", "M"],
      answer: 0,
      explanation: "Y controls the other horizontal bed direction."
    },
    {
      type: "fill-blank",
      question: "Type the letter used for extrusion amount:",
      answer: "E",
      hint: "Extruder axis",
      explanation: "E is the extruder value in most slicer-generated G-code."
    },
    {
      type: "multiple-choice",
      question: "What does F1800 usually mean in printer G-code?",
      options: ["Feedrate in mm/min", "Fan at 1800%", "Nozzle at 1800 C", "File number"],
      answer: 0,
      explanation: "F sets feedrate, usually in millimeters per minute for printer G-code."
    },
    {
      type: "multiple-choice",
      question: "Which line is only a comment?",
      options: [";TYPE:WALL-OUTER", "G1 X20 Y20 E0.5", "M104 S210", "G28"],
      answer: 0,
      explanation: "A line beginning with semicolon is a comment."
    }
  ],
  "p-u1-l2": [
    {
      type: "multiple-choice",
      question: "What is missing from this home command?\n___ ; home all axes",
      options: ["G28", "G1", "M104", "M106"],
      answer: 0,
      explanation: "G28 homes the axes."
    },
    {
      type: "multiple-choice",
      question: "What does G29 often do?",
      options: ["Runs bed leveling or probing", "Sets nozzle temperature", "Starts the fan", "Ends the print"],
      answer: 0,
      explanation: "G29 is commonly used for bed probing/leveling, depending on firmware."
    },
    {
      type: "multiple-choice",
      question: "Why home before printing?",
      options: ["So the printer knows its axis positions", "To change filament color", "To turn off heaters", "To delete comments"],
      answer: 0,
      explanation: "Homing establishes known machine positions."
    },
    {
      type: "multiple-choice",
      question: "Which axis is vertical on most 3D printers?",
      options: ["Z", "X", "Y", "E"],
      answer: 0,
      explanation: "Z controls nozzle height above the bed."
    },
    {
      type: "fill-blank",
      question: "Type the common command for homing all axes:",
      answer: "G28",
      hint: "Home command",
      explanation: "G28 homes the axes."
    },
    {
      type: "multiple-choice",
      question: "What does a bed probe measure?",
      options: ["Bed surface height or tilt", "Filament brand", "Screen size", "Wi-Fi strength"],
      answer: 0,
      explanation: "Probing measures the bed so the printer can compensate."
    },
    {
      type: "multiple-choice",
      question: "Which line is a bed leveling command on many printers?",
      options: ["G29", "M30", "G1 E5", "M05"],
      answer: 0,
      explanation: "G29 is commonly used for bed leveling/probing."
    },
    {
      type: "multiple-choice",
      question: "Why can G29 behavior vary?",
      options: ["Firmware handles probing differently", "Comments change it", "The app theme changes it", "F always cancels it"],
      answer: 0,
      explanation: "Marlin, Klipper, and other firmware may implement probing differently."
    }
  ],
  "p-u1-l3": [
    {
      type: "multiple-choice",
      question: "What does M104 do?",
      options: ["Set nozzle temperature and continue", "Set bed temperature and wait", "Home all axes", "Run bed leveling"],
      answer: 0,
      explanation: "M104 sets the hotend target and continues without waiting."
    },
    {
      type: "multiple-choice",
      question: "What does M109 do?",
      options: ["Set nozzle temperature and wait", "Turn fan off", "Home Z only", "End the print"],
      answer: 0,
      explanation: "M109 waits until the hotend reaches the target temperature."
    },
    {
      type: "multiple-choice",
      question: "What does M140 do?",
      options: ["Set bed temperature and continue", "Set nozzle temperature and wait", "Start extrusion", "Home all axes"],
      answer: 0,
      explanation: "M140 sets the bed temperature target and continues."
    },
    {
      type: "multiple-choice",
      question: "What is missing from this nozzle heat command?\nM104 ___210",
      options: ["S", "X", "E", "F"],
      answer: 0,
      explanation: "S is used for the temperature setpoint in these commands."
    },
    {
      type: "fill-blank",
      question: "Type the bed temperature command that waits:",
      answer: "M190",
      hint: "Bed heat and wait",
      explanation: "M190 sets bed temperature and waits."
    },
    {
      type: "multiple-choice",
      question: "Which command waits for the bed to heat?",
      options: ["M190", "M104", "G28", "G1"],
      answer: 0,
      explanation: "M190 waits for the bed temperature target."
    },
    {
      type: "multiple-choice",
      question: "In M104 S215, what does S215 mean?",
      options: ["Temperature target", "X position", "Extrusion amount", "Fan speed"],
      answer: 0,
      explanation: "S215 sets the target temperature to 215 C."
    }
  ]
};

Object.entries(LESSON_QUESTION_EXPANSIONS).forEach(([lessonId, additions]) => {
  const lesson = [...LESSONS, ...PRINTING_LESSONS].find(item => item.id === lessonId);
  if (!lesson) return;
  lesson.quiz.push(...additions.slice(0, Math.max(0, 10 - lesson.quiz.length)));
});

// Export for use in app
if (typeof module !== "undefined") {
  module.exports = { LESSONS, UNITS, PRINTING_LESSONS, PRINTING_UNITS, TRACKS };
}
