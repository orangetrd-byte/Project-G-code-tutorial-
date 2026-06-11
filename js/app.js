/* ============================================================
   Project G-Code Tutorial — App Logic
   State management, lesson engine, quiz engine, navigation.
   ============================================================ */

'use strict';

const APP_BUILD = '2026.06.11.3';

// ─── STATE ────────────────────────────────────────────────────
const State = {
  // Loaded from localStorage
  trackId: 'cnc',
  language: 'en',
  theme: 'dark',
  setupComplete: false,
  profiles: {},
  xp: 0,
  streak: 0,
  lastStudyDate: null,
  completedLessons: [], // array of lesson ids
  lessonScores: {},     // { lessonId: { correct, total } }

  // Runtime only
  currentLesson: null,
  currentStep: 0,       // 0 = theory, 1..n = quiz questions
  currentQuizAnswered: false,
  sessionCorrect: 0,
  sessionTotal: 0,

  defaultProfile() {
    return {
      xp: 0,
      streak: 0,
      lastStudyDate: null,
      completedLessons: [],
      lessonScores: {},
    };
  },

  activeProfile() {
    if (!this.profiles[this.trackId]) this.profiles[this.trackId] = this.defaultProfile();
    return this.profiles[this.trackId];
  },

  applyProfile(profile) {
    this.xp = profile.xp || 0;
    this.streak = profile.streak || 0;
    this.lastStudyDate = profile.lastStudyDate || null;
    this.completedLessons = profile.completedLessons || [];
    this.lessonScores = profile.lessonScores || {};
  },

  syncProfile() {
    this.profiles[this.trackId] = {
      xp: this.xp,
      streak: this.streak,
      lastStudyDate: this.lastStudyDate,
      completedLessons: this.completedLessons,
      lessonScores: this.lessonScores,
    };
  },

  save() {
    this.syncProfile();
    const persist = {
      trackId: this.trackId,
      language: this.language,
      theme: this.theme,
      setupComplete: this.setupComplete,
      profiles: this.profiles,
    };
    try { localStorage.setItem('pgct_state_v2', JSON.stringify(persist)); } catch(e) {}
  },

  load() {
    try {
      const raw = localStorage.getItem('pgct_state_v2');
      if (!raw) {
        this.migrateLegacyState();
        return;
      }
      const d = JSON.parse(raw);
      this.trackId = getTrack(d.trackId) ? d.trackId : 'cnc';
      this.language = d.language === 'es' ? 'es' : 'en';
      this.theme = d.theme === 'light' ? 'light' : 'dark';
      this.setupComplete = d.setupComplete === true;
      this.profiles = d.profiles || {};
      this.applyProfile(this.activeProfile());
    } catch(e) {}
  },

  migrateLegacyState() {
    try {
      const raw = localStorage.getItem('pgct_state');
      if (!raw) {
        this.applyProfile(this.activeProfile());
        return;
      }
      const d = JSON.parse(raw);
      this.profiles.cnc = {
        xp: d.xp || 0,
        streak: d.streak || 0,
        lastStudyDate: d.lastStudyDate || null,
        completedLessons: d.completedLessons || [],
        lessonScores: d.lessonScores || {},
      };
      this.trackId = 'cnc';
      this.setupComplete = false;
      this.applyProfile(this.activeProfile());
      this.save();
    } catch(e) {
      this.applyProfile(this.activeProfile());
    }
  },

  switchTrack(trackId) {
    if (!getTrack(trackId) || trackId === this.trackId) return;
    this.save();
    this.trackId = trackId;
    this.currentLesson = null;
    this.currentStep = 0;
    this.currentQuizAnswered = false;
    this.applyProfile(this.activeProfile());
    this.save();
  },

  setPreference(key, value) {
    if (key === 'language') this.language = value === 'es' ? 'es' : 'en';
    if (key === 'theme') this.theme = value === 'light' ? 'light' : 'dark';
    this.save();
  },

  completeSetup() {
    this.setupComplete = true;
    this.save();
  },

  isLessonDone(id) { return this.completedLessons.includes(id); },

  isLessonUnlocked(lesson) {
    // Unit 1, lesson 1 always unlocked
    if (lesson.unit === 1 && lesson.lesson === 1) return true;
    // Within a unit: previous lesson must be done
    const prev = getLessons().find(l => l.unit === lesson.unit && l.lesson === lesson.lesson - 1);
    if (prev && !this.isLessonDone(prev.id)) return false;
    // First lesson of a new unit: last lesson of previous unit must be done
    if (lesson.lesson === 1 && lesson.unit > 1) {
      const prevUnit = getUnits().find(u => u.id === lesson.unit - 1);
      if (prevUnit) {
        const lastOfPrev = getLessons().filter(l => l.unit === prevUnit.id)
          .sort((a,b) => b.lesson - a.lesson)[0];
        return lastOfPrev ? this.isLessonDone(lastOfPrev.id) : false;
      }
    }
    return true;
  },

  completeLesson(lessonId, correct, total) {
    if (!this.completedLessons.includes(lessonId)) {
      this.completedLessons.push(lessonId);
    }
    this.lessonScores[lessonId] = { correct, total };
    // Award XP
    const lesson = getLessons().find(l => l.id === lessonId);
    const bonus = Math.round((correct / Math.max(total,1)) * (lesson?.xp || 10));
    this.xp += bonus;
    // Streak
    const today = new Date().toDateString();
    if (this.lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      this.streak = (this.lastStudyDate === yesterday) ? this.streak + 1 : 1;
      this.lastStudyDate = today;
    }
    this.save();
    return bonus;
  },

  getUnitProgress(unitId) {
    const unitLessons = getLessons().filter(l => l.unit === unitId);
    const done = unitLessons.filter(l => this.isLessonDone(l.id)).length;
    return { done, total: unitLessons.length };
  },

  getTotalProgress() {
    return { done: this.completedLessons.length, total: getLessons().length };
  }
};

// ─── VISUAL AID RENDERER ─────────────────────────────────────
const Visuals = {
  render(type) {
    const defs = {
      'block-anatomy': `
        <div class="visual-aid">
          <svg viewBox="0 0 360 100" xmlns="http://www.w3.org/2000/svg">
            <style>
              .va-text { fill: #E8EDF2; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
              .va-code { fill: #7FDBCA; font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: bold; }
              .va-label { fill: #9BAFC4; font-size: 10px; font-family: 'Inter', sans-serif; }
              .va-line { stroke: #2A3D52; stroke-width: 1; }
              .va-bracket { stroke: #F5A623; stroke-width: 1.5; fill: none; }
            </style>
            <!-- Code line -->
            <text x="10" y="38" class="va-code">N010</text>
            <text x="60" y="38" class="va-code" fill="#FFB94A"> G01</text>
            <text x="98" y="38" class="va-code" fill="#7FDBCA"> X1.500 Z-0.750</text>
            <text x="248" y="38" class="va-code" fill="#F5A623"> F0.012</text>
            <!-- Labels -->
            <text x="10" y="72" class="va-label">Line No.</text>
            <text x="60" y="72" class="va-label">Motion</text>
            <text x="110" y="72" class="va-label">Coordinates</text>
            <text x="248" y="72" class="va-label">Feedrate</text>
            <!-- tick lines -->
            <line x1="22" y1="44" x2="22" y2="60" class="va-line"/>
            <line x1="75" y1="44" x2="75" y2="60" class="va-line"/>
            <line x1="170" y1="44" x2="170" y2="60" class="va-line"/>
            <line x1="272" y1="44" x2="272" y2="60" class="va-line"/>
          </svg>
        </div>`,

      'lathe-axes': `
        <div class="visual-aid">
          <svg viewBox="0 0 360 130" xmlns="http://www.w3.org/2000/svg">
            <style>
              .ax { fill: none; stroke-width: 2; }
              .lbl { font-family: 'JetBrains Mono', monospace; font-size: 11px; }
            </style>
            <!-- Chuck -->
            <rect x="10" y="30" width="30" height="70" rx="4" fill="#1E2D3D" stroke="#2A3D52" stroke-width="1.5"/>
            <text x="18" y="70" class="lbl" fill="#5F7A92" font-size="9">CHUCK</text>
            <!-- Spindle -->
            <rect x="40" y="55" width="180" height="20" rx="2" fill="#172130" stroke="#2A3D52"/>
            <!-- Part -->
            <rect x="40" y="50" width="100" height="30" rx="2" fill="#1A6B5C" opacity="0.6"/>
            <text x="75" y="69" class="lbl" fill="#fff" font-size="10">PART</text>
            <!-- Tool -->
            <polygon points="230,60 250,58 250,72 230,70" fill="#F5A623" opacity="0.8"/>
            <!-- Z axis arrow -->
            <line x1="250" y1="100" x2="340" y2="100" stroke="#F5A623" stroke-width="2" marker-end="url(#arr)"/>
            <line x1="250" y1="100" x2="160" y2="100" stroke="#DC3545" stroke-width="2" stroke-dasharray="4,3"/>
            <text x="320" y="115" class="lbl" fill="#F5A623">+Z</text>
            <text x="140" y="115" class="lbl" fill="#DC3545">−Z</text>
            <!-- X axis arrow -->
            <line x1="250" y1="100" x2="250" y2="20" stroke="#28A745" stroke-width="2" marker-end="url(#arrg)"/>
            <text x="255" y="18" class="lbl" fill="#28A745">+X (Ø)</text>
            <!-- Z0 marker -->
            <line x1="143" y1="45" x2="143" y2="115" stroke="#9BAFC4" stroke-width="1" stroke-dasharray="3,3"/>
            <text x="125" y="42" class="lbl" fill="#9BAFC4" font-size="9">Z0 (face)</text>
            <defs>
              <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#F5A623"/>
              </marker>
              <marker id="arrg" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#28A745"/>
              </marker>
            </defs>
          </svg>
        </div>`,

      'rapid-path': `
        <div class="visual-aid">
          <svg viewBox="0 0 360 110" xmlns="http://www.w3.org/2000/svg">
            <style>.lbl{font-family:'JetBrains Mono',monospace;font-size:10px;}</style>
            <!-- Part outline -->
            <rect x="20" y="20" width="180" height="70" rx="3" fill="#1E2D3D" stroke="#2A3D52"/>
            <text x="85" y="60" class="lbl" fill="#5F7A92">PART</text>
            <!-- Safe clearance line -->
            <line x1="200" y1="20" x2="200" y2="90" stroke="#F5A623" stroke-width="1" stroke-dasharray="4,3"/>
            <text x="203" y="15" class="lbl" fill="#F5A623">Z0.100</text>
            <!-- Rapid path -->
            <line x1="320" y1="30" x2="210" y2="30" stroke="#28A745" stroke-width="2" stroke-dasharray="5,3" marker-end="url(#ag)"/>
            <text x="240" y="25" class="lbl" fill="#28A745">G00 RAPID</text>
            <!-- Feed path -->
            <line x1="210" y1="30" x2="30" y2="30" stroke="#1A6B5C" stroke-width="2.5" marker-end="url(#at)"/>
            <text x="80" y="44" class="lbl" fill="#7FDBCA">G01 FEED</text>
            <!-- danger zone label -->
            <rect x="20" y="20" width="180" height="12" rx="2" fill="rgba(220,53,69,0.15)"/>
            <text x="50" y="30" class="lbl" fill="#F0A0A8" font-size="9">← DO NOT RAPID HERE</text>
            <defs>
              <marker id="ag" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#28A745"/></marker>
              <marker id="at" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#1A6B5C"/></marker>
            </defs>
          </svg>
        </div>`,

      'arc-moves': `
        <div class="visual-aid">
          <svg viewBox="0 0 360 130" xmlns="http://www.w3.org/2000/svg">
            <style>.lbl{font-family:'JetBrains Mono',monospace;font-size:10px;}</style>
            <!-- G02 CW arc (concave fillet) -->
            <text x="30" y="18" class="lbl" fill="#F5A623">G02 — Clockwise (concave fillet)</text>
            <line x1="40" y1="90" x2="40" y2="50" stroke="#9BAFC4" stroke-width="1.5"/>
            <path d="M40,50 Q80,50 80,90" stroke="#F5A623" stroke-width="2" fill="none"/>
            <line x1="80" y1="90" x2="140" y2="90" stroke="#9BAFC4" stroke-width="1.5"/>
            <text x="50" y="78" class="lbl" fill="#F5A623">R</text>
            <!-- G03 CCW arc (convex radius) -->
            <text x="200" y="18" class="lbl" fill="#7FDBCA">G03 — CCW (convex radius)</text>
            <line x1="210" y1="90" x2="250" y2="90" stroke="#9BAFC4" stroke-width="1.5"/>
            <path d="M250,90 Q250,50 290,50" stroke="#7FDBCA" stroke-width="2" fill="none"/>
            <line x1="290" y1="50" x2="290" y2="90" stroke="#9BAFC4" stroke-width="1.5"/>
            <text x="256" y="70" class="lbl" fill="#7FDBCA">R</text>
          </svg>
        </div>`,

      'g71-cycle': `
        <div class="visual-aid">
          <svg viewBox="0 0 360 140" xmlns="http://www.w3.org/2000/svg">
            <style>.lbl{font-family:'JetBrains Mono',monospace;font-size:9px;}</style>
            <!-- Final profile -->
            <path d="M40,120 L40,60 Q60,60 80,40 L160,40 L160,120 Z" fill="rgba(26,107,92,0.2)" stroke="#1A6B5C" stroke-width="1.5"/>
            <!-- Rough passes -->
            <line x1="40" y1="100" x2="165" y2="100" stroke="#F5A623" stroke-width="1" stroke-dasharray="3,2" opacity="0.6"/>
            <line x1="40" y1="80" x2="165" y2="80" stroke="#F5A623" stroke-width="1" stroke-dasharray="3,2" opacity="0.6"/>
            <line x1="40" y1="60" x2="165" y2="60" stroke="#F5A623" stroke-width="1" stroke-dasharray="3,2" opacity="0.6"/>
            <!-- Stock arrows -->
            <text x="168" y="45" class="lbl" fill="#9BAFC4">← U0.020</text>
            <text x="168" y="45" class="lbl" fill="#9BAFC4" dy="10">(X stock)</text>
            <!-- Labels -->
            <text x="50" y="135" class="lbl" fill="#7FDBCA">G71 rough passes (dashed)</text>
            <text x="50" y="26" class="lbl" fill="#1A6B5C">Final profile (G70 finish)</text>
          </svg>
        </div>`,

      'threading': `
        <div class="visual-aid">
          <svg viewBox="0 0 360 100" xmlns="http://www.w3.org/2000/svg">
            <style>.lbl{font-family:'JetBrains Mono',monospace;font-size:9px;}</style>
            <!-- Thread form -->
            <path d="M30,70 L50,30 L70,70 L90,30 L110,70 L130,30 L150,70 L170,30 L190,70 L210,30 L230,70 L250,30 L270,70" stroke="#F5A623" stroke-width="2" fill="none"/>
            <line x1="30" y1="70" x2="270" y2="70" stroke="#9BAFC4" stroke-width="1" stroke-dasharray="3,2"/>
            <!-- Labels -->
            <text x="30" y="88" class="lbl" fill="#9BAFC4">Major Ø</text>
            <text x="140" y="88" class="lbl" fill="#F5A623">← Lead (F value) →</text>
            <line x1="50" y1="78" x2="50" y2="84" stroke="#F5A623" stroke-width="1"/>
            <line x1="90" y1="78" x2="90" y2="84" stroke="#F5A623" stroke-width="1"/>
            <text x="55" y="96" class="lbl" fill="#9BAFC4">1 rev</text>
            <!-- Angle label -->
            <text x="200" y="20" class="lbl" fill="#7FDBCA">60° UN thread form</text>
          </svg>
        </div>`,
    };
    return defs[type] || '';
  }
};

// ─── REFERENCE DATA ───────────────────────────────────────────
const REF_DATA = [
  {
    category: "Motion",
    codes: [
      { code: "G00", name: "Rapid Positioning", body: `<p>Moves the tool at maximum traverse speed. No cutting — positioning only.</p><pre>G00 X2.200 Z0.100</pre>` },
      { code: "G01", name: "Linear Feed", body: `<p>Straight-line cutting move at controlled feedrate (F word required).</p><pre>G01 Z-1.500 F0.012</pre>` },
      { code: "G02", name: "Circular CW", body: `<p>Clockwise arc. Use R for simple arcs or I/K for center-offset method.</p><pre>G02 X1.500 Z-0.500 R0.250 F0.008</pre>` },
      { code: "G03", name: "Circular CCW", body: `<p>Counter-clockwise arc.</p><pre>G03 X2.000 Z-0.500 R0.125 F0.008</pre>` },
      { code: "G04", name: "Dwell", body: `<p>Pause for a set time. P = time in milliseconds (Fanuc).</p><pre>G04 P500 ; Dwell 0.5 sec</pre>` },
    ]
  },
  {
    category: "Modes",
    codes: [
      { code: "G20", name: "Inch Mode", body: `<p>Sets control to inch units. Typically in safety block at program start.</p>` },
      { code: "G21", name: "Metric Mode", body: `<p>Sets control to millimeter units.</p>` },
      { code: "G40", name: "Cancel Cutter Comp", body: `<p>Cancels cutter radius compensation (G41/G42). Always include in safety block.</p>` },
      { code: "G90", name: "Absolute Mode", body: `<p>All coordinates reference program zero. Default for most programs.</p>` },
      { code: "G91", name: "Incremental Mode", body: `<p>Coordinates are distances from current position. Use sparingly.</p>` },
    ]
  },
  {
    category: "Spindle",
    codes: [
      { code: "G96", name: "Constant Surface Speed", body: `<p>S value = surface feet per minute (SFM). RPM varies with diameter. Pair with G50 to clamp max RPM.</p><pre>G50 S3000\nG96 S400 M03</pre>` },
      { code: "G97", name: "Constant RPM", body: `<p>S value = RPM. Required for threading, drilling, boring.</p><pre>G97 S1200 M03</pre>` },
    ]
  },
  {
    category: "Canned Cycles",
    codes: [
      { code: "G70", name: "Finish Turning Cycle", body: `<p>Finish pass following G71/G72 rough. Uses same P-Q profile blocks.</p><pre>G70 P100 Q200 F0.007</pre>` },
      { code: "G71", name: "Rough Turning Cycle", body: `<p>Automatic rough turning with multiple passes.</p><pre>G71 U0.100 R0.050\nG71 P100 Q200 U0.020 W0.005 F0.015</pre>` },
      { code: "G72", name: "Rough Facing Cycle", body: `<p>Same as G71 but removes material in the Z direction (facing operations).</p>` },
      { code: "G76", name: "Threading Cycle", body: `<p>Multi-pass threading cycle. Requires G97 (constant RPM) active.</p><pre>G76 P010060 Q0050 R0.003\nG76 X0.8647 Z-1.500 P0677 Q0200 F0.0625</pre>` },
    ]
  },
  {
    category: "M-Codes",
    codes: [
      { code: "M03", name: "Spindle CW", body: `<p>Turns spindle on, clockwise rotation (standard for OD turning).</p>` },
      { code: "M04", name: "Spindle CCW", body: `<p>Turns spindle on, counter-clockwise (used for left-hand tools, back-turning).</p>` },
      { code: "M05", name: "Spindle Off", body: `<p>Stops the spindle. Always call before tool changes and at program end.</p>` },
      { code: "M08", name: "Coolant On", body: `<p>Turns flood coolant on. M09 = coolant off.</p>` },
      { code: "M30", name: "End Program / Rewind", body: `<p>Ends execution and rewinds to program start. Always the last line.</p>` },
    ]
  }
];

// ─── UI HELPERS ───────────────────────────────────────────────
const PRINTING_REF_DATA = [
  {
    category: "Motion",
    codes: [
      { code: "G0", name: "Rapid Move", body: `<p>Fast positioning move. Printers often treat G0 like G1 depending on firmware.</p><pre>G0 X100 Y100</pre>` },
      { code: "G1", name: "Controlled Move", body: `<p>Main print move. Coordinates move the nozzle; E controls extrusion; F controls feedrate.</p><pre>G1 X82.4 Y104.2 E0.036 F1800</pre>` },
      { code: "G28", name: "Home Axes", body: `<p>Homes one or more axes to known machine positions.</p><pre>G28 ; home all axes</pre>` },
      { code: "G29", name: "Bed Leveling", body: `<p>Runs bed probing or leveling on many firmware setups. Behavior varies by printer firmware.</p>` },
    ]
  },
  {
    category: "Temperature",
    codes: [
      { code: "M104", name: "Set Hotend Temp", body: `<p>Sets nozzle temperature and continues immediately.</p><pre>M104 S210</pre>` },
      { code: "M109", name: "Set Hotend Temp and Wait", body: `<p>Sets nozzle temperature and waits until the target is reached.</p><pre>M109 S210</pre>` },
      { code: "M140", name: "Set Bed Temp", body: `<p>Sets heated bed temperature and continues immediately.</p><pre>M140 S60</pre>` },
      { code: "M190", name: "Set Bed Temp and Wait", body: `<p>Sets heated bed temperature and waits until the target is reached.</p><pre>M190 S60</pre>` },
    ]
  },
  {
    category: "Extrusion",
    codes: [
      { code: "G92", name: "Set Position", body: `<p>Often used to reset the extruder position before printing or after priming.</p><pre>G92 E0</pre>` },
      { code: "M82", name: "Absolute Extrusion", body: `<p>Sets the extruder to absolute positioning mode.</p>` },
      { code: "M83", name: "Relative Extrusion", body: `<p>Sets the extruder to relative positioning mode.</p>` },
    ]
  },
  {
    category: "Printer Controls",
    codes: [
      { code: "M106", name: "Fan On / Set Speed", body: `<p>Controls part cooling fan speed.</p><pre>M106 S255</pre>` },
      { code: "M107", name: "Fan Off", body: `<p>Turns the part cooling fan off.</p>` },
      { code: "M84", name: "Disable Motors", body: `<p>Disables stepper motors after a print or during shutdown.</p>` },
    ]
  }
];

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return [...document.querySelectorAll(sel)]; }

function getTrack(trackId = State.trackId) {
  return (typeof TRACKS !== 'undefined' && TRACKS[trackId]) ? TRACKS[trackId] : TRACKS.cnc;
}

function getLessons() {
  return getTrack().lessons;
}

function getUnits() {
  return getTrack().units;
}

const UI_TEXT = {
  en: {
    learn: 'Learn',
    reference: 'Reference',
    progress: 'Progress',
    settings: 'Settings',
    settingsSubtitle: 'App preferences',
    setupSubtitle: 'Choose language and theme before you start.',
    startLearning: 'Start Learning',
    language: 'Language',
    languageHelp: 'Choose the app interface language.',
    english: 'English',
    spanish: 'Spanish',
    theme: 'Theme',
    themeHelp: 'Choose light or dark mode.',
    dark: 'Dark',
    light: 'Light',
    build: 'Build',
    path: 'Your learning path',
    curriculum: 'Curriculum',
    unitProgress: 'Unit Progress',
    totalXp: 'Total XP Earned',
    dayStreak: 'Day Streak',
  },
  es: {
    learn: 'Aprender',
    reference: 'Referencia',
    progress: 'Progreso',
    settings: 'Ajustes',
    settingsSubtitle: 'Preferencias de la app',
    setupSubtitle: 'Elige idioma y tema antes de empezar.',
    startLearning: 'Empezar',
    language: 'Idioma',
    languageHelp: 'Elige el idioma de la interfaz.',
    english: 'Ingles',
    spanish: 'Espanol',
    theme: 'Tema',
    themeHelp: 'Elige modo claro u oscuro.',
    dark: 'Oscuro',
    light: 'Claro',
    build: 'Version',
    path: 'Tu ruta de aprendizaje',
    curriculum: 'Curriculo',
    unitProgress: 'Progreso por unidad',
    totalXp: 'XP total ganado',
    dayStreak: 'Racha de dias',
  }
};

function t(key) {
  return (UI_TEXT[State.language] && UI_TEXT[State.language][key]) || UI_TEXT.en[key] || key;
}

function getRefData() {
  return State.trackId === 'printing' ? PRINTING_REF_DATA : REF_DATA;
}

function updateTrackSwitcher() {
  $$('.track-btn').forEach(btn => {
    const active = btn.dataset.track === State.trackId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function initTrackSwitcher() {
  $$('.track-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      State.switchTrack(btn.dataset.track);
      renderHome();
      renderReference();
      renderProgress();
      showScreen('screen-home');
      showToast(`${getTrack().name} track selected`);
    });
  });
}

function showScreen(id) {
  if (!State.setupComplete && id !== 'screen-settings') id = 'screen-settings';
  $$('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) { el.classList.add('active'); el.scrollTop = 0; }
  // Update nav
  $$('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === id);
  });
}

let toastTimer = null;
function showToast(msg, type = '') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function applyTheme() {
  document.body.classList.toggle('theme-light', State.theme === 'light');
  const themeColor = State.theme === 'light' ? '#F4F7FA' : '#0F1923';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
}

function updateStaticText() {
  document.documentElement.lang = State.language === 'es' ? 'es' : 'en';
  const nav = $$('.nav-btn');
  if (nav[0]) nav[0].innerHTML = `<span class="icon">🏠</span>${t('learn')}`;
  if (nav[1]) nav[1].innerHTML = `<span class="icon">📚</span>${t('reference')}`;
  if (nav[2]) nav[2].innerHTML = `<span class="icon">📊</span>${t('progress')}`;
  if (nav[3]) nav[3].innerHTML = `<span class="icon">⚙</span>${t('settings')}`;

  const settingsTitle = $('#screen-settings .settings-title');
  const settingsSubtitle = $('#screen-settings .settings-subtitle');
  if (settingsTitle) settingsTitle.textContent = t('settings');
  if (settingsSubtitle) settingsSubtitle.textContent = State.setupComplete ? t('settingsSubtitle') : t('setupSubtitle');

  const rows = $$('#screen-settings .settings-row');
  if (rows[0]) {
    rows[0].querySelector('.settings-label').textContent = t('language');
    rows[0].querySelector('.settings-help').textContent = t('languageHelp');
    rows[0].querySelector('[data-value="en"]').textContent = t('english');
    rows[0].querySelector('[data-value="es"]').textContent = t('spanish');
  }
  if (rows[1]) {
    rows[1].querySelector('.settings-label').textContent = t('theme');
    rows[1].querySelector('.settings-help').textContent = t('themeHelp');
    rows[1].querySelector('[data-value="dark"]').textContent = t('dark');
    rows[1].querySelector('[data-value="light"]').textContent = t('light');
  }

  const buildLabel = $('#screen-settings .build-row span');
  if (buildLabel) buildLabel.textContent = t('build');
  const buildNumber = $('#build-number');
  if (buildNumber) buildNumber.textContent = APP_BUILD;
  const setupButton = $('#setup-complete-btn');
  if (setupButton) setupButton.textContent = t('startLearning');

  const heroGreeting = $('.hero-greeting');
  if (heroGreeting) heroGreeting.textContent = t('path');
  const homeLabel = $('#screen-home .section-label');
  if (homeLabel) homeLabel.textContent = t('curriculum');
  const progressLabel = $('#screen-progress .section-label');
  if (progressLabel) progressLabel.textContent = t('unitProgress');
  const totalXpLabel = $('.prog-hero__label');
  if (totalXpLabel) totalXpLabel.textContent = t('totalXp');
  const streakLabel = $('.streak-lbl');
  if (streakLabel) streakLabel.textContent = t('dayStreak');
}

function updateSettingsControls() {
  $$('.settings-choice').forEach(btn => {
    const key = btn.dataset.setting;
    const active = State[key] === btn.dataset.value;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function renderSettings() {
  applyTheme();
  document.body.classList.toggle('setup-required', !State.setupComplete);
  updateStaticText();
  updateSettingsControls();
}

function initSettings() {
  $$('.settings-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      State.setPreference(btn.dataset.setting, btn.dataset.value);
      renderSettings();
      renderHome();
      renderProgress();
    });
  });

  $('#setup-complete-btn')?.addEventListener('click', () => {
    State.completeSetup();
    renderSettings();
    renderHome();
    showScreen('screen-home');
  });
}

function finishLoading() {
  const splash = $('#loading-splash');
  window.setTimeout(() => {
    splash?.classList.add('done');
    renderSettings();
    if (State.setupComplete) {
      renderHome();
      showScreen('screen-home');
    } else {
      showScreen('screen-settings');
    }
  }, 2800);
}

// ─── AUDIO FEEDBACK ───────────────────────────────────────────
const AudioFeedback = {
  ctx: null,

  getContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  tone(freq, start, duration, gainValue, type = 'sine') {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  },

  correct() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.tone(660, now, 0.11, 0.055);
    this.tone(880, now + 0.09, 0.14, 0.05);
  },

  wrong() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.tone(220, now, 0.16, 0.06, 'triangle');
    this.tone(165, now + 0.08, 0.2, 0.045, 'triangle');
  },

  play(isCorrect) {
    if (isCorrect) this.correct();
    else this.wrong();
  }
};

// ─── HOME SCREEN ──────────────────────────────────────────────
function renderHome() {
  const track = getTrack();
  const lessons = getLessons();
  const units = getUnits();
  const container = $('#unit-list');
  container.innerHTML = '';
  const { done, total } = State.getTotalProgress();
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const title = track.title.replace('G-Code', '<span>G-Code</span>');
  $('.hero-title').innerHTML = `${title},<br>one block at a time.`;
  updateStaticText();
  $('#xp-bar-fill').style.width = Math.min(pct, 100) + '%';
  $('#xp-bar-current').textContent = State.xp + ' XP';
  $('#xp-bar-current-2').textContent = State.xp + ' XP';
  $('#xp-bar-next').textContent = done + '/' + total + ' lessons';
  $('#streak-val').textContent = '🔥 ' + State.streak;
  updateTrackSwitcher();

  units.forEach(unit => {
    const unitLessons = lessons.filter(l => l.unit === unit.id);
    const { done: uDone } = State.getUnitProgress(unit.id);
    const locked = !State.isLessonUnlocked(unitLessons[0]);

    const card = document.createElement('div');
    card.className = 'unit-card';
    card.innerHTML = `
      <div class="unit-card__header">
        <div class="unit-card__icon">${unit.icon}</div>
        <div class="unit-card__meta">
          <div class="unit-card__name">Unit ${unit.id}: ${unit.name}</div>
          <div class="unit-card__progress">${uDone}/${unit.lessons} lessons complete</div>
        </div>
        <div class="unit-card__badge ${locked ? 'locked' : ''}">${locked ? '🔒' : uDone === unit.lessons ? '✅' : 'Open'}</div>
      </div>
      <div class="unit-card__lessons">
        ${unitLessons.map(l => {
          const done = State.isLessonDone(l.id);
          const unlocked = State.isLessonUnlocked(l);
          const dotClass = done ? 'done' : unlocked ? 'active' : '';
          return `
            <div class="lesson-row ${!unlocked ? 'locked' : ''}" data-lesson-id="${l.id}">
              <div class="lesson-dot ${dotClass}">${done ? '✓' : l.lesson}</div>
              <div class="lesson-row__title">${l.icon} ${l.title}</div>
              <div class="lesson-row__xp">${l.xp} XP</div>
            </div>`;
        }).join('')}
      </div>`;
    container.appendChild(card);
  });

  // Lesson row click
  $$('.lesson-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.lessonId;
      if (id) startLesson(id);
    });
  });
}

// ─── LESSON ENGINE ────────────────────────────────────────────
function startLesson(lessonId) {
  const lesson = getLessons().find(l => l.id === lessonId);
  if (!lesson) return;
  if (!State.isLessonUnlocked(lesson)) { showToast('Complete the previous lesson first!', 'error'); return; }

  State.currentLesson = lesson;
  State.currentStep = 0;
  State.currentQuizAnswered = false;
  State.sessionCorrect = 0;
  State.sessionTotal = lesson.quiz.length;

  renderLessonStep();
  showScreen('screen-lesson');
}

function renderLessonStep() {
  const lesson = State.currentLesson;
  const totalSteps = 1 + lesson.quiz.length; // theory + quizzes
  const step = State.currentStep;
  const isTheory = step === 0;

  // Progress bar
  const pct = Math.round((step / totalSteps) * 100);
  $('#lesson-progress-fill').style.width = pct + '%';
  $('#lesson-step-count').textContent = `${step}/${totalSteps}`;

  const content = $('#lesson-content');
  content.innerHTML = '';

  if (isTheory) {
    content.innerHTML = `
      <div class="step-card active">
        <div class="step-label">Theory · Lesson ${lesson.lesson}</div>
        <div class="step-title">${lesson.title}</div>
        <div class="theory-body">${lesson.theory}</div>
        ${Visuals.render(lesson.visual)}
      </div>`;
    $('#lesson-action-btn').textContent = 'Start Quiz →';
    $('#lesson-action-btn').disabled = false;
    $('#lesson-action-btn').className = 'btn-primary';
    State.currentQuizAnswered = true; // theory always "answered"
  } else {
    const qIdx = step - 1;
    const q = lesson.quiz[qIdx];
    renderQuiz(content, q, qIdx);
    $('#lesson-action-btn').textContent = 'Check Answer';
    $('#lesson-action-btn').disabled = false;
    $('#lesson-action-btn').className = 'btn-primary';
    State.currentQuizAnswered = false;
  }
}

function renderQuiz(container, q, idx) {
  const div = document.createElement('div');
  div.className = 'step-card active';

  if (q.type === 'multiple-choice') {
    const letters = ['A','B','C','D'];
    div.innerHTML = `
      <div class="step-label">Quiz · Question ${idx + 1}</div>
      <div class="quiz-question">${q.question}</div>
      <div class="options-list">
        ${q.options.map((opt, i) => `
          <button class="option-btn" data-idx="${i}">
            <span class="option-letter">${letters[i]}</span>
            ${opt}
          </button>`).join('')}
      </div>
      <div id="explanation-box"></div>`;
    container.appendChild(div);

    $$('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (State.currentQuizAnswered) return;
        const chosen = parseInt(btn.dataset.idx);
        const correct = chosen === q.answer;
        $$('.option-btn').forEach(b => {
          const i = parseInt(b.dataset.idx);
          if (i === q.answer) b.classList.add('correct');
          else if (i === chosen && !correct) b.classList.add('wrong');
          b.disabled = true;
        });
        if (correct) State.sessionCorrect++;
        State.currentQuizAnswered = true;
        AudioFeedback.play(correct);
        showExplanation(q.explanation);
        $('#lesson-action-btn').textContent = isLastStep() ? 'Finish Lesson 🎉' : 'Next →';
        $('#lesson-action-btn').className = 'btn-primary' + (isLastStep() ? ' accent-btn' : '');
        showToast(correct ? '✅ Correct!' : '❌ Not quite — see explanation', correct ? 'success' : 'error');
      });
    });

  } else if (q.type === 'fill-blank') {
    div.innerHTML = `
      <div class="step-label">Quiz · Question ${idx + 1}</div>
      <div class="quiz-question">${q.question}</div>
      <div class="fill-blank-wrap">
        <input type="text" class="fill-blank-input" id="fill-input" 
          placeholder="Type your answer…" autocomplete="off" autocorrect="off" spellcheck="false">
        <div class="hint-text">Hint: ${q.hint}</div>
      </div>
      <div id="explanation-box"></div>`;
    container.appendChild(div);

    const inp = $('#fill-input');
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !State.currentQuizAnswered) checkFillBlank(q, inp);
    });

    // Override the Check Answer button to trigger fill check
    const btn = $('#lesson-action-btn');
    btn.onclick = (e) => {
      if (!State.currentQuizAnswered) { checkFillBlank(q, inp); return; }
      advanceStep();
    };
    return; // skip default button binding below
  }
}

function checkFillBlank(q, inp) {
  const userVal = inp.value.trim().replace(/^G|^g/, match => match.toUpperCase());
  const expected = q.answer.trim();
  const correct = userVal.toUpperCase() === expected.toUpperCase();
  inp.classList.add(correct ? 'correct' : 'wrong');
  inp.disabled = true;
  if (correct) State.sessionCorrect++;
  State.currentQuizAnswered = true;
  AudioFeedback.play(correct);
  showExplanation(q.explanation);
  $('#lesson-action-btn').textContent = isLastStep() ? 'Finish Lesson 🎉' : 'Next →';
  $('#lesson-action-btn').className = 'btn-primary' + (isLastStep() ? ' accent-btn' : '');
  showToast(correct ? '✅ Correct!' : `❌ Answer: ${q.answer}`, correct ? 'success' : 'error');
}

function showExplanation(text) {
  const box = $('#explanation-box');
  if (!box) return;
  box.innerHTML = `<div class="explanation-box"><div class="expl-label">Explanation</div>${text}</div>`;
}

function isLastStep() {
  return State.currentStep >= State.currentLesson.quiz.length;
}

function advanceStep() {
  State.currentStep++;
  const totalSteps = 1 + State.currentLesson.quiz.length;

  if (State.currentStep >= totalSteps) {
    finishLesson();
  } else {
    State.currentQuizAnswered = false;
    renderLessonStep();
  }
}

function finishLesson() {
  const lesson = State.currentLesson;
  const xpEarned = State.completeLesson(lesson.id, State.sessionCorrect, State.sessionTotal);

  const content = $('#lesson-content');
  content.innerHTML = `
    <div class="complete-screen">
      <div class="complete-icon">🎉</div>
      <div class="complete-title">Lesson Complete!</div>
      <div class="complete-subtitle">${lesson.title}</div>
      <div class="xp-badge">+${xpEarned} XP earned</div>
      <div class="stat-row">
        <div class="stat-chip">
          <div class="stat-chip__val">${State.sessionCorrect}/${State.sessionTotal}</div>
          <div class="stat-chip__lbl">Correct</div>
        </div>
        <div class="stat-chip">
          <div class="stat-chip__val">${State.streak}</div>
          <div class="stat-chip__lbl">Day Streak</div>
        </div>
        <div class="stat-chip">
          <div class="stat-chip__val">${State.xp}</div>
          <div class="stat-chip__lbl">Total XP</div>
        </div>
      </div>
    </div>`;

  $('#lesson-progress-fill').style.width = '100%';
  $('#lesson-step-count').textContent = 'Done!';
  $('#lesson-action-btn').textContent = 'Back to Lessons';
  $('#lesson-action-btn').className = 'btn-primary accent-btn';
  $('#lesson-action-btn').onclick = () => {
    renderHome();
    showScreen('screen-home');
    resetLessonActionBtn();
  };
}

function resetLessonActionBtn() {
  const btn = $('#lesson-action-btn');
  btn.onclick = handleLessonAction;
}

function handleLessonAction() {
  if (!State.currentLesson) return;
  if (State.currentStep === 0 || State.currentQuizAnswered) {
    advanceStep();
  }
}

// ─── REFERENCE SCREEN ────────────────────────────────────────
function renderReference() {
  const container = $('#ref-list');
  container.innerHTML = '';

  getRefData().forEach(cat => {
    const section = document.createElement('div');
    section.className = 'ref-category';
    section.innerHTML = `<div class="ref-category-title">${cat.category}</div>`;

    cat.codes.forEach(item => {
      const card = document.createElement('div');
      card.className = 'ref-card';
      card.innerHTML = `
        <button class="ref-card__toggle">
          <span class="ref-code">${item.code}</span>
          <span class="ref-name">${item.name}</span>
          <span class="ref-chevron">▶</span>
        </button>
        <div class="ref-card__body">${item.body}</div>`;
      card.querySelector('.ref-card__toggle').addEventListener('click', () => {
        card.classList.toggle('open');
      });
      section.appendChild(card);
    });
    container.appendChild(section);
  });

  // Search
  $('#ref-search').value = '';
  $('#ref-search').oninput = e => {
    const q = e.target.value.toLowerCase();
    $$('.ref-card').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? '' : 'none';
    });
    $$('.ref-category-title').forEach(title => {
      const parent = title.parentElement;
      const visible = [...parent.querySelectorAll('.ref-card')].some(c => c.style.display !== 'none');
      parent.style.display = visible ? '' : 'none';
    });
  };
}

// ─── PROGRESS SCREEN ─────────────────────────────────────────
function renderProgress() {
  const units = getUnits();
  updateStaticText();
  $('#prog-total-xp').textContent = State.xp;
  $('#prog-streak').textContent = State.streak;

  const container = $('#prog-unit-list');
  container.innerHTML = '';

  units.forEach(unit => {
    const { done, total } = State.getUnitProgress(unit.id);
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const el = document.createElement('div');
    el.className = 'prog-unit-card';
    el.innerHTML = `
      <div class="prog-unit-header">
        <span class="prog-unit-name">${unit.icon} Unit ${unit.id}: ${unit.name}</span>
        <span class="prog-pct">${pct}%</span>
      </div>
      <div class="prog-bar"><div class="prog-bar-fill" style="width:${pct}%"></div></div>
      <div class="prog-lessons-done">${done} of ${total} lessons complete</div>`;
    container.appendChild(el);
  });
}

// ─── NAV WIRING ───────────────────────────────────────────────
function initNav() {
  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.screen;
      if (target === 'screen-reference') renderReference();
      if (target === 'screen-progress') renderProgress();
      if (target === 'screen-settings') renderSettings();
      if (target === 'screen-home') renderHome();
      showScreen(target);
    });
  });

  $('#back-btn').addEventListener('click', () => {
    renderHome();
    showScreen('screen-home');
  });

  $('#lesson-action-btn').addEventListener('click', handleLessonAction);
}

// ─── BOOT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  State.load();
  applyTheme();
  initNav();
  initTrackSwitcher();
  initSettings();
  renderSettings();
  renderHome();
  finishLoading();
  console.log('%c[Project G-Code Tutorial] Ready.', 'color:#7FDBCA;font-family:monospace');
});
