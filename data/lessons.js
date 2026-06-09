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
        type: "multiple-choice",
        question: "Which part of this block tells the machine WHERE to move?\nN020 G00 X2.000 Z0.100 S800 M03",
        options: ["N020", "G00", "X2.000 Z0.100", "S800 M03"],
        answer: 2,
        explanation: "X and Z are coordinate words. They define the destination position for the move."
      },
      {
        type: "fill-blank",
        question: "Complete the block: N010 ___ X0 Z0.1 (rapid move to a position)",
        answer: "G00",
        hint: "G00 = rapid positioning",
        explanation: "G00 is the rapid traverse code. It moves the tool as fast as the machine allows — never use it into material."
      }
    ]
  },

  {
    id: "u1-l2",
    unit: 1,
    unitName: "Foundations",
    lesson: 2,
    title: "The Coordinate System",
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
        type: "multiple-choice",
        question: "You program X1.500 on a lathe in diameter mode. What is the actual radius of cut?",
        options: ["1.500\"", "3.000\"", "0.750\"", "0.375\""],
        answer: 2,
        explanation: "X values in diameter mode represent the full diameter. X1.500 = 1.500\" diameter = 0.750\" radius."
      },
      {
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
  }
];

// ─── UNIT/LESSON METADATA ────────────────────────────────────
const UNITS = [
  { id: 1, name: "Foundations",    icon: "📋", color: "#1A6B5C", lessons: 3 },
  { id: 2, name: "Motion Codes",   icon: "⚡", color: "#2D5986", lessons: 3 },
  { id: 3, name: "Turning Ops",    icon: "🔩", color: "#7B4F12", lessons: 3 },
  { id: 4, name: "Tooling & Offsets", icon: "🎯", color: "#5C2D6B", lessons: 2 }
];

// Export for use in app
if (typeof module !== "undefined") {
  module.exports = { LESSONS, UNITS };
}
