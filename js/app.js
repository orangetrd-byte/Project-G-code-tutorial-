/* ============================================================
   Project G-Code Tutorial — App Logic
   State management, lesson engine, quiz engine, navigation.
   ============================================================ */

'use strict';

const APP_BUILD = 'MGP | Version v2.58.0 | Build 2026.07.26.01';

// ─── ACCESS GATE ────────────────────────────────────────────
const AccessGate = {
  key() {
    try { return localStorage.getItem('pgct_license_key_hash'); } catch { return null; }
  },
  unlocked() { return !!this.key(); }
};

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
  completedReviews: [], // array of unit review ids
  lessonScores: {},     // { lessonId: { correct, total } }
  weakQuestions: [],     // questions missed and due for focused review
  dailyCompletions: [],
  todaysLineCompletions: [],
  confidenceRatings: {},

  // Runtime only
  currentLesson: null,
  currentReviewUnit: null,
  currentMode: 'lesson',
  currentStep: 0,       // 0 = theory, 1..n = quiz questions
  currentQuizAnswered: false,
  retryCurrentLesson: false,
  lessonFinished: false,
  missedQuestions: [],
  practiceQuestions: null,
  nextActionLessonId: null,
  sessionCorrect: 0,
  sessionTotal: 0,

  defaultProfile() {
    return {
      xp: 0,
      streak: 0,
      lastStudyDate: null,
      completedLessons: [],
      completedReviews: [],
      lessonScores: {},
      weakQuestions: [],
      dailyCompletions: [],
      todaysLineCompletions: [],
      confidenceRatings: {},
      learnedCodeCodes: [],
      roadmap: {},           // { milestoneId: true } — Mike's personal path checklist
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
    this.completedReviews = profile.completedReviews || [];
    this.lessonScores = profile.lessonScores || {};
    this.weakQuestions = profile.weakQuestions || [];
    this.dailyCompletions = profile.dailyCompletions || [];
    this.todaysLineCompletions = profile.todaysLineCompletions || [];
    this.confidenceRatings = profile.confidenceRatings || {};
    this.learnedCodeCodes = Array.isArray(profile.learnedCodeCodes)
      ? profile.learnedCodeCodes
      : [];
    this.roadmap = profile.roadmap && typeof profile.roadmap === 'object' ? profile.roadmap : {};
  },

  syncProfile() {
    this.profiles[this.trackId] = {
      xp: this.xp,
      streak: this.streak,
      lastStudyDate: this.lastStudyDate,
      completedLessons: this.completedLessons,
      completedReviews: this.completedReviews,
      lessonScores: this.lessonScores,
      weakQuestions: this.weakQuestions,
      dailyCompletions: this.dailyCompletions,
      todaysLineCompletions: this.todaysLineCompletions,
      confidenceRatings: this.confidenceRatings,
      learnedCodeCodes: this.learnedCodeCodes,
      roadmap: this.roadmap,
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
      this.trackId = typeof d.trackId === 'string' && TRACKS[d.trackId] ? d.trackId : 'cnc';
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
        weakQuestions: [],
        dailyCompletions: [],
        todaysLineCompletions: [],
        confidenceRatings: {},
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
    if (typeof trackId !== 'string' || !TRACKS[trackId] || trackId === this.trackId) return;
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

  toggleRoadmapMilestone(id, done) {
    if (!this.roadmap) this.roadmap = {};
    if (done) this.roadmap[id] = true;
    else delete this.roadmap[id];
    this.save();
  },

  completeSetup() {
    this.setupComplete = true;
    this.save();
  },

  resetAllData() {
    try {
      localStorage.removeItem('pgct_state_v2');
      localStorage.removeItem('pgct_state');
    } catch(e) {}

    this.trackId = 'cnc';
    this.language = 'en';
    this.theme = 'dark';
    this.setupComplete = false;
    this.profiles = {};
    this.applyProfile(this.activeProfile());

    this.currentLesson = null;
    this.currentReviewUnit = null;
    this.currentMode = 'lesson';
    this.currentStep = 0;
    this.currentQuizAnswered = false;
    this.retryCurrentLesson = false;
    this.lessonFinished = false;
    this.missedQuestions = [];
    this.practiceQuestions = null;
    this.nextActionLessonId = null;
    this.sessionCorrect = 0;
    this.sessionTotal = 0;
  },

  isLessonDone(id) { return this.completedLessons.includes(id); },

  reviewId(unitId) { return `${this.trackId}-unit-${unitId}-review`; },

  isUnitReviewDone(unitId) { return this.completedReviews.includes(this.reviewId(unitId)); },

  questionKey(q) {
    if (q?.weakKey) return q.weakKey;
    return `${this.trackId}|${String(q.question || '').trim()}|${String(q.answer || '').trim()}`;
  },

  trackWeakQuestion(q, lesson = this.currentLesson) {
    const key = this.questionKey(q);
    const existing = this.weakQuestions.find(item => item.key === key);
    const snapshot = {
      ...q,
      id: q.id || q.originalQuestionId || key,
      concept: getQuestionConcept(q),
      originalQuestionId: q.originalQuestionId || q.id || key,
      attemptedIds: [...new Set([
        ...(q.attemptedIds || []),
        q.originalQuestionId,
        q.id
      ].filter(Boolean))],
      sourceLessonId: q.sourceLessonId || lesson?.id || null,
      sourceUnit: q.sourceUnit || lesson?.unit || null,
      sourceTitle: q.sourceTitle || lesson?.title || 'Practice'
    };
    if (existing) {
      existing.misses += 1;
      existing.lastMissed = Date.now();
      existing.question = snapshot;
    } else {
      this.weakQuestions.push({
        key,
        misses: 1,
        lastMissed: Date.now(),
        question: snapshot
      });
    }
    this.weakQuestions = this.weakQuestions
      .sort((a, b) => (b.misses - a.misses) || (b.lastMissed - a.lastMissed))
      .slice(0, 30);
    this.save();
  },

  clearWeakQuestion(q) {
    const key = q?.weakKey || this.questionKey(q);
    const before = this.weakQuestions.length;
    this.weakQuestions = this.weakQuestions.filter(item => item.key !== key);
    if (this.weakQuestions.length !== before) this.save();
  },

  completeWeakReview(correct, total) {
    const bonus = Math.max(5, Math.round((correct / Math.max(total, 1)) * 15));
    this.xp += bonus;
    this.updateStreak();
    this.save();
    return bonus;
  },

  completeTrackReview(correct, total) {
    const bonus = Math.max(8, Math.round((correct / Math.max(total, 1)) * 20));
    this.xp += bonus;
    this.updateStreak();
    this.save();
    return bonus;
  },

  completeDailyReview(correct, total) {
    const today = getTodayKey();
    const firstCompletionToday = !this.dailyCompletions.includes(today);
    if (firstCompletionToday) this.dailyCompletions.push(today);
    this.dailyCompletions = this.dailyCompletions.slice(-30);
    const bonus = firstCompletionToday ? Math.max(6, Math.round((correct / Math.max(total, 1)) * 12)) : 0;
    if (bonus > 0) this.xp += bonus;
    if (firstCompletionToday) this.updateStreak();
    this.save();
    return bonus;
  },

  completeTodaysLine() {
    const today = getTodayKey();
    const firstCompletionToday = !this.todaysLineCompletions.includes(today);
    if (firstCompletionToday) this.todaysLineCompletions.push(today);
    this.todaysLineCompletions = this.todaysLineCompletions.slice(-30);
    this.save();
    return firstCompletionToday;
  },

  setConfidence(lessonId, rating) {
    if (!lessonId || !['easy', 'ok', 'hard'].includes(rating)) return;
    this.confidenceRatings[lessonId] = {
      rating,
      updatedAt: Date.now()
    };
    this.save();
  },

  updateStreak() {
    const today = new Date().toDateString();
    if (this.lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      this.streak = (this.lastStudyDate === yesterday) ? this.streak + 1 : 1;
      this.lastStudyDate = today;
    }
  },

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
    this.updateStreak();
    this.save();
    return bonus;
  },

  completeUnitReview(unitId, correct, total) {
    const id = this.reviewId(unitId);
    if (!this.completedReviews.includes(id)) this.completedReviews.push(id);
    const bonus = Math.round((correct / Math.max(total, 1)) * 25);
    this.xp += bonus;
    this.updateStreak();
    this.save();
    return bonus;
  },

  getUnitProgress(unitId) {
    const unitLessons = getLessons().filter(l => l.unit === unitId);
    const done = unitLessons.filter(l => this.isLessonDone(l.id)).length;
    return { done, total: unitLessons.length };
  },

  getTotalProgress() {
    const lessonIds = new Set(getLessons().map(lesson => lesson.id));
    const done = this.completedLessons.filter(id => lessonIds.has(id)).length;
    return { done, total: lessonIds.size };
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
      'program-structure': `
        <div class="visual-aid">
          <svg viewBox="0 0 360 110" xmlns="http://www.w3.org/2000/svg">
            <style>.lbl{font-family:'JetBrains Mono',monospace;font-size:10px;}</style>
            <!-- Comment / header block -->
            <rect x="10" y="8" width="340" height="22" rx="4" fill="#1E2D3D" stroke="#2A3D52" stroke-width="1.5"/>
            <text x="20" y="23" class="lbl" fill="#F5A623">%</text>
            <text x="140" y="23" class="lbl" fill="#9BAFC4">Program header block</text>
            <!-- Comment / description block -->
            <rect x="10" y="34" width="340" height="22" rx="4" fill="#1E2D3D" stroke="#2A3D52" stroke-width="1.2"/>
            <text x="20" y="49" class="lbl" fill="#F5A623">;(</text>
            <text x="40" y="49" class="lbl" fill="#9BAFC4">Part: clamp, face, turn, chamfer</text>
            <!-- Cutting blocks -->
            <rect x="10" y="63" width="150" height="22" rx="4" fill="#172130" stroke="#1A6B5C" stroke-width="1.5"/>
            <text x="20" y="78" class="lbl" fill="#7FDBCA">T0101</text>
            <text x="65" y="78" class="lbl" fill="#9BAFC4">Facing</text>
            <rect x="169" y="63" width="181" height="22" rx="4" fill="#172130" stroke="#1A6B5C" stroke-width="1.5"/>
            <text x="182" y="78" class="lbl" fill="#7FDBCA">T0202</text>
            <text x="230" y="78" class="lbl" fill="#9BAFC4">Turning</text>
            <!-- Safety block -->
            <rect x="10" y="92" width="340" height="14" rx="4" fill="#101820" stroke="#2A3D52" stroke-width="1.2"/>
            <text x="20" y="103" class="lbl" fill="#7FDBCA">G99 G97 S1200 M41</text>
          </svg>
        </div>`,
      'linear-feed': `
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
      'spindle-speed': `
        <div class="visual-aid">
          <svg viewBox="0 0 360 110" xmlns="http://www.w3.org/2000/svg">
            <style>.lbl{font-family:'JetBrains Mono',monospace;font-size:10px;}</style>
            <!-- Spindle icon -->
            <rect x="60" y="20" width="100" height="70" rx="12" fill="#172130" stroke="#2A3D52" stroke-width="1.5"/>
            <rect x="85" y="36" width="50" height="50" rx="8" fill="#1E2D3D" stroke="#1A6B5C" stroke-width="1.5"/>
            <text x="93" y="67" class="lbl" fill="#7FDBCA">T</text>
            <!-- Center cone -->
            <polygon points="140,44 168,54 140,64" fill="#F5A623" opacity="0.9"/>
            <!-- Labels -->
            <text x="25" y="58" class="lbl" fill="#9BAFC4">S</text>
            <text x="175" y="42" class="lbl" fill="#F5A623">M03</text>
            <line x1="57" y1="55" x2="78" y2="55" stroke="#9BAFC4" stroke-width="1.2" marker-end="url(#a)"/>
            <text x="185" y="73" class="lbl" fill="#9BAFC4">Rotation = normal</text>
            <text x="185" y="88" class="lbl" fill="#5F7A92">G97 units: rev/min</text>
            <defs>
              <marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#9BAFC4"/></marker>
            </defs>
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
      { code: "G00", name: "Rapid Positioning", body: `<p>Rapidly positions one or more axes for a non-cutting move. Axes can move independently, so the path may not be straight. Verify clearance first.</p><pre>G00 X2.200 Z0.100</pre>` },
      { code: "G01", name: "Linear Feed", body: `<p>Moves in a straight line to the endpoint at the active feed rate. Feed meaning depends on the active feed mode and units.</p><pre>G01 Z-1.500 F0.012</pre>` },
      { code: "G02", name: "Circular CW", body: `<p>Moves clockwise along an arc in the active plane. Use the control-approved I/K center offsets or R format.</p><pre>G02 X1.500 Z-0.500 R0.250 F0.008</pre>` },
      { code: "G03", name: "Circular CCW", body: `<p>Moves counterclockwise along an arc in the active plane. Arc format and full-circle rules vary by control.</p><pre>G03 X2.000 Z-0.500 R0.125 F0.008</pre>` },
      { code: "G04", name: "Dwell", body: `<p>Pauses for a programmed duration. Address format and time units vary by controller; verify the exact manual.</p><pre>G04 P500 ; controller-specific dwell example</pre>` },
    ]
  },
  {
    category: "Modes",
    codes: [
      { code: "G20", name: "Inch Units", body: `<p>Selects or verifies inch programming units. On Haas controls it checks Setting 9; it does not convert stored coordinates.</p>` },
      { code: "G21", name: "Metric Units", body: `<p>Selects or verifies metric programming units. Do not assume the control converts an existing program.</p>` },
      { code: "G28", name: "Machine-Zero Return", body: `<p>Returns selected axes to machine zero, optionally through an intermediate point. Verify the axis selection and clearance.</p>` },
      { code: "G40", name: "Cancel Tool-Nose Comp", body: `<p>Cancels G41/G42 tool-nose compensation. Use a deliberate lead-out clear of the part.</p>` },
      { code: "G54", name: "Work Coordinate System 1", body: `<p>Selects the stored G54 work offset as part zero. It does not measure or set part zero.</p>` },
    ]
  },
  {
    category: "Spindle",
    codes: [
      { code: "G96", name: "Constant Surface Speed", body: `<p>S value = surface feet per minute (SFM). RPM varies with diameter. Pair with G50 to clamp max RPM.</p><pre>G50 S3000\nG96 S400 M03</pre>` },
      { code: "G97", name: "Constant RPM", body: `<p>S commands a fixed spindle RPM in this controller family. Use it when the verified process and machine procedure call for constant RPM.</p><pre>G97 S1200 M03</pre>` },
    ]
  },
  {
    category: "Canned Cycles",
    codes: [
      { code: "G70", name: "Finish Turning Cycle", body: `<p>Finish pass following G71/G72 rough. Uses same P-Q profile blocks.</p><pre>G70 P100 Q200 F0.007</pre>` },
      { code: "G71", name: "Rough Turning Cycle", body: `<p>Automatic rough turning with multiple passes.</p><pre>G71 U0.100 R0.050\nG71 P100 Q200 U0.020 W0.005 F0.015</pre>` },
      { code: "G72", name: "Rough Facing Cycle", body: `<p>Same as G71 but removes material in the Z direction (facing operations).</p>` },
      { code: "G76", name: "Threading Cycle", body: `<p>Controller-specific multi-pass threading cycle. Format and required spindle mode vary; follow the exact machine manual.</p><pre>G76 P010060 Q0050 R0.003\nG76 X0.8647 Z-1.500 P0677 Q0200 F0.0625</pre>` },
    ]
  },
  {
    category: "M-Codes",
    codes: [
      { code: "M03", name: "Spindle CW", body: `<p>Commands clockwise spindle rotation as defined from the machine's documented viewing direction. Tooling and spindle orientation determine the correct direction.</p>` },
      { code: "M04", name: "Spindle CCW", body: `<p>Commands counterclockwise spindle rotation as defined by the machine manual. Do not choose direction from operation name alone.</p>` },
      { code: "M05", name: "Spindle Off", body: `<p>Stops the spindle. Use it wherever the machine's approved program and tool-change procedure require a spindle stop.</p>` },
      { code: "M08", name: "Coolant On", body: `<p>Turns flood coolant on. M09 = coolant off.</p>` },
      { code: "M30", name: "End Program / Reset", body: `<p>Ends the program, stops the spindle, turns off coolant, and returns to the beginning. Other reset behavior depends on the control and settings.</p>` },
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
      { code: "M109", name: "Set Hotend Temp and Wait", body: `<p>In Marlin, S waits while heating but does not wait for cooling; R waits for heating or cooling. Firmware behavior must be verified.</p><pre>M109 S210</pre>` },
      { code: "M140", name: "Set Bed Temp", body: `<p>Sets heated bed temperature and continues immediately.</p><pre>M140 S60</pre>` },
      { code: "M190", name: "Set Bed Temp and Wait", body: `<p>In Marlin, S waits while heating but does not wait for cooling; R waits for heating or cooling. Firmware behavior must be verified.</p><pre>M190 S60</pre>` },
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

function escapeHtmlAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeLearnedCodeKey(code, trackId) {
  return `${trackId || State.trackId}::${String(code || '').trim().toUpperCase()}`;
}

function toggleLearnedCode(code, trackId = State.trackId) {
  const key = escapeLearnedCodeKey(code, trackId);
  const idx = State.learnedCodeCodes.indexOf(key);
  if (idx === -1) State.learnedCodeCodes.push(key);
  else State.learnedCodeCodes.splice(idx, 1);
  State.save();
}

function escapeLearnedCodeKey(code, trackId) {
  return `${trackId || State.trackId}::${String(code || '').trim().toUpperCase()}`;
}

const CODE_TOKEN_RE = /\b(G|M)\d{1,3}\b/gi;
function extractCodeTokens(text) {
  if (!text) return [];
  const m = String(text).match(CODE_TOKEN_RE);
  return m ? m.map(c => c.toUpperCase()) : [];
}

function queueCodesFromQuestion(question = {}) {
  const meta = question?.meta || {};
  const explicitCodes = Array.isArray(meta.codes) ? meta.codes : [];
  const codes = [...explicitCodes];
  // Multiple-choice: the correct option may embed one or more codes
  // (e.g. "G00 X2.500", "G97 (CSS)", "M106 S128"), so extract every code token.
  if (question.type === 'multiple-choice' && Array.isArray(question.options)) {
    const chosen = question.options[question.answer];
    if (chosen) codes.push(...extractCodeTokens(chosen));
  }
  // Bare-string answer (fill-blank) such as "G54" or "G97".
  if (typeof question.answer === 'string') {
    codes.push(...extractCodeTokens(question.answer));
  }
  return [...new Set(codes.map(c => String(c).trim().toUpperCase()).filter(Boolean))];
}

function applyLearnedCodeProgress(question = {}, correct) {
  if (!correct) return;
  const codes = queueCodesFromQuestion(question);
  let changed = false;
  codes.forEach(code => {
    const key = escapeLearnedCodeKey(code, State.trackId);
    if (!State.learnedCodeCodes.includes(key)) {
      State.learnedCodeCodes.push(key);
      changed = true;
    }
  });
  if (changed) State.save();
}

function applyLearnedCodeMiss() {}

function getLearnedCodeCount(trackId = State.trackId) {
  const prefix = `${trackId}::`;
  return State.learnedCodeCodes.filter(key => key.startsWith(prefix)).length;
}

function getTrack(trackId = State.trackId) {
  return (typeof TRACKS !== 'undefined' && TRACKS[trackId]) ? TRACKS[trackId] : TRACKS.cnc;
}

function getLessons() {
  return getTrack().lessons;
}

function getUnits() {
  return getTrack().units;
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shuffleCopy(items) {
  const copy = (items || []).slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickQuestions(questions, count) {
  return shuffleCopy(questions).slice(0, Math.min(count, questions.length));
}

function pickLessonQuestions(lesson, count) {
  if (lesson?.id !== 'u1-l1' || !lesson.quiz?.length) return pickQuestions(lesson?.quiz || [], count);
  const [first, ...rest] = lesson.quiz;
  return [first, ...shuffleCopy(rest)].slice(0, Math.min(count, lesson.quiz.length));
}


const ConceptPools = {
  byConcept: {},
  byId: {},
  ready: false
};

function initConceptPools() {
  ConceptPools.byConcept = {};
  ConceptPools.byId = {};
  Object.values(TRACKS || {}).forEach(track => {
    (track.lessons || []).forEach(lesson => {
      (lesson.quiz || []).forEach((q, index) => {
        const id = q.id || `${track.id}-${lesson.id}-q${index + 1}`;
        const concept = q.concept || `${track.id}-${lesson.id}`;
        q.id = id;
        q.concept = concept;
        q.pool = q.pool || lesson.id;
        q.sourceLessonId = q.sourceLessonId || lesson.id;
        q.sourceUnit = q.sourceUnit || lesson.unit;
        q.sourceTitle = q.sourceTitle || lesson.title;
        ConceptPools.byId[id] = q;
        if (!ConceptPools.byConcept[concept]) ConceptPools.byConcept[concept] = [];
        ConceptPools.byConcept[concept].push(q);
      });
    });
  });
  ConceptPools.ready = true;
}

function ensureConceptPools() {
  if (!ConceptPools.ready) initConceptPools();
}

function getQuestionConcept(q) {
  if (q?.concept || q?.sourceConcept) return q.concept || q.sourceConcept;
  if (q?.sourceLessonId) {
    const direct = `${State.trackId}-${q.sourceLessonId}`;
    if (ConceptPools.byConcept[direct]) return direct;
    const match = Object.keys(ConceptPools.byConcept).find(key => key.endsWith(`-${q.sourceLessonId}`));
    if (match) return match;
    return direct;
  }
  return 'general';
}

function normalizeQuestionText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function inferQuestionId(question, pool) {
  if (!question) return '';
  if (question.originalQuestionId) return question.originalQuestionId;
  if (question.id && pool.some(item => item.id === question.id)) return question.id;
  const qText = normalizeQuestionText(question.question);
  const qAnswer = normalizeQuestionText(question.answer);
  if (!qAnswer || isPlainNumericAnswer(qAnswer)) return question.id || '';
  const match = pool.find(item =>
    normalizeQuestionText(item.question) === qText &&
    normalizeQuestionText(item.answer) === qAnswer
  );
  return match?.id || question.id || '';
}

function resolveRetryAnchorId(question) {
  ensureConceptPools();
  const concept = getQuestionConcept(question);
  const pool = ConceptPools.byConcept[concept] || [];
  return question?.originalQuestionId || inferQuestionId(question, pool) || question?.id || '';
}

function cloneQuestion(question) {
  return {
    ...question,
    options: Array.isArray(question?.options) ? [...question.options] : question?.options
  };
}

function isPlainNumericAnswer(value) {
  return /^-?\d+(\.\d+)?$/.test(String(value || '').trim());
}

function countDecimals(value) {
  const match = String(value).match(/\.(\d+)/);
  return match ? match[1].length : 0;
}

function formatRetryNumber(value, decimals) {
  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
}

function makeRetryNumber(original) {
  const raw = String(original);
  const decimals = countDecimals(raw);
  const current = Number(raw);
  if (!Number.isFinite(current)) return raw;

  const unit = decimals > 0 ? Math.pow(10, -decimals) : 1;
  const multiplier = decimals >= 3 ? 5 + Math.floor(Math.random() * 16) : decimals === 2 ? 2 + Math.floor(Math.random() * 7) : decimals === 1 ? 1 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 9);
  const offset = unit * multiplier;
  const direction = Math.random() < 0.5 ? -1 : 1;
  let next = current + direction * offset;
  if (current > 0 && next <= 0) next = current + offset;
  if (current === 0 && next < 0) next = Math.abs(next);

  const formatted = formatRetryNumber(next, decimals);
  if (formatted === raw) {
    const nextOffset = unit * multiplier * 2;
    const nextDir = Math.random() < 0.5 ? -1 : 1;
    const next2 = current + nextDir * nextOffset;
    return formatRetryNumber(next2, decimals);
  }
  return formatted;
}

function replaceRetryNumbers(text, replacements, originalAnswer = '', retryAnswer = '') {
  if (typeof text !== 'string' || !text) return text;
  return text.replace(/(?<![A-Z0-9.])([XYZRFSEQUWP])(-?\d+(?:\.\d+)?)(?![A-Z0-9.])/g, (full, prefix, number) => {
    if (!replacements.has(full)) {
      const nextNumber = retryAnswer && number === originalAnswer ? retryAnswer : makeRetryNumber(number);
      replacements.set(full, `${prefix}${nextNumber}`);
    }
    return replacements.get(full);
  });
}

function replaceStandaloneMappedNumbers(text, replacements) {
  if (typeof text !== 'string' || !text) return text;
  let result = text;
  replacements.forEach((nextToken, originalToken) => {
    const originalNumber = originalToken.slice(1);
    const nextNumber = nextToken.slice(1);
    const escaped = originalNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`(?<![A-Z0-9.])${escaped}(?![A-Z0-9.])`, 'g'), nextNumber);
  });
  return result;
}
function replaceStandaloneAnswer(text, originalAnswer, retryAnswer) {
  if (typeof text !== 'string' || !originalAnswer || !retryAnswer) return text;
  const escaped = originalAnswer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(?<![A-Z0-9.])${escaped}(?![A-Z0-9.])`, 'g'), retryAnswer);
}

function createRetryNumberVariant(template, originalQuestion = {}) {
  const variant = cloneQuestion(template);
  const shouldVaryNumbers = variant.type === 'fill-blank' || String(variant.question || '').includes('___');
  if (!shouldVaryNumbers) return variant;

  const replacements = new Map();
  const originalAnswer = String(variant.answer || '').trim();
  if (isPlainNumericAnswer(originalAnswer)) {
    const escapedAnswer = originalAnswer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const answerAppearsInPrompt = new RegExp(`(?<![0-9.])${escapedAnswer}(?![0-9.])`)
      .test(variant.question || '');
    if (!answerAppearsInPrompt) return variant;
  }

  const retryAnswer = isPlainNumericAnswer(originalAnswer) ? makeRetryNumber(originalAnswer) : '';

  if (retryAnswer) variant.answer = retryAnswer;
  variant.question = replaceRetryNumbers(variant.question, replacements, originalAnswer, retryAnswer);
  variant.hint = replaceRetryNumbers(variant.hint, replacements, originalAnswer, retryAnswer);
  variant.explanation = replaceRetryNumbers(variant.explanation, replacements, originalAnswer, retryAnswer);

  variant.question = replaceStandaloneMappedNumbers(variant.question, replacements);
  variant.hint = replaceStandaloneMappedNumbers(variant.hint, replacements);
  variant.explanation = replaceStandaloneMappedNumbers(variant.explanation, replacements);

  if (retryAnswer) {
    variant.question = replaceStandaloneAnswer(variant.question, originalAnswer, retryAnswer);
    variant.hint = replaceStandaloneAnswer(variant.hint, originalAnswer, retryAnswer);
    variant.explanation = replaceStandaloneAnswer(variant.explanation, originalAnswer, retryAnswer);
  }

  variant.retryVariantOf = originalQuestion?.id || template?.id || '';
  return variant;
}

function getRetakeQuestion(originalQuestion) {
  const anchorId = resolveRetryAnchorId(originalQuestion);
  const template = ConceptPools.byId[anchorId] || originalQuestion;
  const variant = createRetryNumberVariant(template, originalQuestion);
  const attemptedIds = new Set([
    ...(originalQuestion?.attemptedIds || []),
    anchorId,
    originalQuestion?.id
  ].filter(Boolean));

  return {
    ...variant,
    id: anchorId || variant?.id || originalQuestion?.id || '',
    concept: template?.concept || originalQuestion?.concept,
    pool: template?.pool || originalQuestion?.pool,
    sourceConcept: template?.concept || originalQuestion?.sourceConcept,
    originalQuestionId: anchorId || originalQuestion?.originalQuestionId || originalQuestion?.id || '',
    attemptedIds: [...attemptedIds],
    weakKey: originalQuestion?.weakKey,
    sourceLessonId: originalQuestion?.sourceLessonId || template?.sourceLessonId,
    sourceUnit: originalQuestion?.sourceUnit || template?.sourceUnit,
    sourceTitle: originalQuestion?.sourceTitle || template?.sourceTitle,
    retakeNotice: ''
  };
}

function getRetakeQuestions(questions) {
  return (questions || []).map(q => getRetakeQuestion(q));
}

const UI_TEXT = {
  en: {
    learn: 'Learn',
    reference: 'Reference',
    practice: 'Practice',
    progress: 'Progress',
    settings: 'Settings',
    settingsSubtitle: 'App preferences',
    setupSubtitle: 'Choose language and theme before you start.',
    setupAppName: 'Project G-Code Tutorial',
    setupTitle: 'Choose Settings To Begin Learning',
    setupBody: 'Pick your language and theme, then press Start Learning.',
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
    resetData: 'Reset App Data',
    resetDataHelp: 'Clear progress, XP, streaks, reviews, weak spots, language, and theme on this device.',
    resetDataButton: 'Reset',
    resetConfirm: 'Reset all app data? This clears progress, XP, streaks, reviews, weak spots, language, and theme on this device.',
    resetDone: 'App data cleared. Fresh start ready.',
    path: 'Your learning path',
    curriculum: 'Curriculum',
    unitProgress: 'Unit Progress',
    totalXp: 'Total XP Earned',
    dayStreak: 'Day Streak',
  },
  es: {
    learn: 'Aprender',
    reference: 'Referencia',
    practice: 'Practica',
    progress: 'Progreso',
    settings: 'Ajustes',
    settingsSubtitle: 'Preferencias de la app',
    setupSubtitle: 'Elige idioma y tema antes de empezar.',
    setupAppName: 'Project G-Code Tutorial',
    setupTitle: 'Elige ajustes para empezar',
    setupBody: 'Elige idioma y tema, luego presiona Empezar.',
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
    resetData: 'Restablecer datos',
    resetDataHelp: 'Borra progreso, XP, racha, repasos, puntos debiles, idioma y tema en este dispositivo.',
    resetDataButton: 'Restablecer',
    resetConfirm: 'Restablecer todos los datos? Esto borra progreso, XP, racha, repasos, puntos debiles, idioma y tema en este dispositivo.',
    resetDone: 'Datos borrados. Inicio limpio listo.',
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

let PACKAGED_REF_DATA = null;

function getRefData() {
  if (PACKAGED_REF_DATA) {
    return State.trackId === 'printing' ? PACKAGED_REF_DATA.printing : PACKAGED_REF_DATA.cnc;
  }
  return State.trackId === 'printing' ? PRINTING_REF_DATA : REF_DATA;
}

function escapeRefText(value) {
  return escapeHtmlAttr(String(value ?? ''));
}

function safeReferenceUrl(value) {
  const url = String(value || '').trim();
  return /^https:\/\//i.test(url) ? escapeHtmlAttr(url) : '';
}

function referenceCategoryTitle(entry) {
  const labels = {
    cnc_milling: 'CNC Milling',
    cnc_turning: 'CNC Turning (Haas)',
    cnc_turning_fanuc: 'CNC Turning (Fanuc)',
    cnc_turning_notes: 'Fanuc vs Haas Notes',
    '3d_printing_marlin': 'Marlin 3D Printing',
    symbols: 'Symbols'
  };
  const typeLabels = {
    g_codes: 'G-Codes',
    m_codes: 'M-Codes',
    fanuc_g_codes: 'Fanuc G-Codes',
    fanuc_m_codes: 'Fanuc M-Codes',
    fanuc_vs_haas_notes: 'Fanuc vs Haas Notes',
    programming_symbols: 'Programming Symbols',
    blueprint_symbols: 'Blueprint / GD&T Symbols',
    operation_sheet_symbols: 'Operation Sheet Symbols'
  };
  return [labels[entry.category] || entry.category, typeLabels[entry.type] || entry.type]
    .filter(Boolean)
    .join(' - ');
}

function referenceItemBody(item) {
  const lines = [];
  const description = item.description || item.meaning || item.name || '';
  if (description) lines.push(`<p>${escapeRefText(description)}</p>`);
  const meta = [];
  if (item.group) meta.push(`Group: ${escapeRefText(item.group)}`);
  if (item.params) meta.push(`Parameters: ${escapeRefText(item.params)}`);
  if (item.usage) meta.push(`Usage: ${escapeRefText(item.usage)}`);
  if (meta.length) lines.push(`<p>${meta.join(' | ')}</p>`);
  if (item.notes) lines.push(`<p>${escapeRefText(item.notes)}</p>`);
  const sourceUrl = safeReferenceUrl(item.source_url);
  if (sourceUrl) {
    lines.push(`<p>Source: <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">${escapeRefText(item.source || 'Official documentation')}</a></p>`);
  }
  return lines.join('') || '<p>Reference definition pending.</p>';
}

function adaptReferenceFile(entry, data) {
  const title = referenceCategoryTitle(entry);
  return {
    category: title,
    codes: (data.items || []).map(item => {
      const code = item.code || item.symbol || item.abbrev || '';
      return {
        code,
        name: item.description || item.meaning || item.name || entry.type || 'Reference',
        body: referenceItemBody(item)
      };
    }).filter(item => item.code)
  };
}

async function loadReferencePackage() {
  try {
    const base = './data/reference/';
    const index = await fetch(base + 'index.json', { cache: 'no-cache' }).then(response => {
      if (!response.ok) throw new Error(`Reference index ${response.status}`);
      return response.json();
    });
    const files = await Promise.all(index.files
      .filter(entry => entry.file && entry.file.endsWith('.json') && entry.file !== 'metadata.json')
      .map(async entry => ({
        entry,
        data: await fetch(base + entry.file, { cache: 'no-cache' }).then(response => {
          if (!response.ok) throw new Error(`${entry.file} ${response.status}`);
          return response.json();
        })
      })));
    const packaged = { cnc: [], printing: [] };
    files.forEach(({ entry, data }) => {
      const category = adaptReferenceFile(entry, data);
      if (!category.codes.length) return;
      if (entry.category === '3d_printing_marlin') packaged.printing.push(category);
      else if (entry.category === 'symbols') {
        packaged.cnc.push(category);
        packaged.printing.push(category);
      } else {
        packaged.cnc.push(category);
      }
    });
    if (packaged.cnc.length || packaged.printing.length) PACKAGED_REF_DATA = packaged;
  } catch (error) {
    PACKAGED_REF_DATA = null;
    console.warn('Using built-in reference fallback:', error);
  }
}
function getCodeLibrarySize() {
  return (getRefData() || []).reduce((sum, cat) => sum + (cat.codes || []).length, 0);
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
  stopSpeaking();
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
  if (nav[2]) nav[2].innerHTML = `<span class="icon">⚡</span>${t('practice')}`;
  if (nav[3]) nav[3].innerHTML = `<span class="icon">📊</span>${t('progress')}`;
  if (nav[4]) nav[4].innerHTML = `<span class="icon">⚙</span>${t('settings')}`;

  const settingsTitle = $('#screen-settings .settings-title');
  const settingsSubtitle = $('#screen-settings .settings-subtitle');
  if (settingsTitle) settingsTitle.textContent = t('settings');
  if (settingsSubtitle) settingsSubtitle.textContent = State.setupComplete ? t('settingsSubtitle') : t('setupSubtitle');
  const setupNote = $('#setup-note');
  if (setupNote) {
    setupNote.querySelector('.setup-note__eyebrow').textContent = t('setupAppName');
    setupNote.querySelector('.setup-note__title').textContent = t('setupTitle');
    setupNote.querySelector('.setup-note__body').textContent = t('setupBody');
  }

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
  const resetRow = $('#reset-data-row');
  if (resetRow) {
    resetRow.querySelector('.settings-label').textContent = t('resetData');
    resetRow.querySelector('.settings-help').textContent = t('resetDataHelp');
  }
  const resetButton = $('#reset-data-btn');
  if (resetButton) resetButton.textContent = t('resetDataButton');
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

  $('#setup-complete-btn')?.addEventListener('click', event => {
    event.preventDefault();
    State.completeSetup();
    document.body.classList.remove('setup-required');
    renderSettings();
    renderHome();
    renderPractice();
    renderProgress();
    showScreen('screen-home');
    showToast(t('startLearning'), 'success');
  });

  $('#reset-data-btn')?.addEventListener('click', () => {
    if (!window.confirm(t('resetConfirm'))) return;
    State.resetAllData();
    renderSettings();
    renderHome();
    renderProgress();
    showScreen('screen-settings');
    showToast(t('resetDone'), 'success');
  });
}

function showBootFallback(error) {
  const splash = $('#loading-splash');
  if (!splash) return;
  const message = document.createElement('div');
  message.setAttribute('role', 'alert');
  message.style.cssText = 'position:absolute;left:1rem;right:1rem;bottom:1rem;z-index:5;padding:0.85rem 1rem;border:1px solid rgba(255,122,122,0.55);border-radius:14px;background:rgba(80,18,26,0.92);color:#FFE8E8;font:700 0.82rem JetBrains Mono,monospace;box-shadow:0 16px 40px rgba(0,0,0,0.35);';
  message.textContent = 'Startup recovered. If the app looks wrong, refresh once.';
  splash.appendChild(message);
  console.error('Project G-Code startup recovered after init error:', error);
}

function finishLoading(options = {}) {
  const splash = $('#loading-splash');
  playStartupTypingSound();
  window.setTimeout(() => {
    splash?.classList.add('done');
    window.setTimeout(() => splash?.remove(), 300);
    const gated = window.ACCESS_GATE && typeof window.ACCESS_GATE.isUnlockedSync === 'function' && !window.ACCESS_GATE.isUnlockedSync();
    if (!gated && !State.setupComplete) showScreen('screen-settings');
  }, options.hasError ? 4200 : 1800);
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

  lessonComplete() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.tone(523.25, now, 0.12, 0.055);
    this.tone(659.25, now + 0.1, 0.12, 0.055);
    this.tone(783.99, now + 0.2, 0.18, 0.06);
  },

  unitComplete() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.tone(523.25, now, 0.11, 0.06);
    this.tone(659.25, now + 0.09, 0.11, 0.06);
    this.tone(783.99, now + 0.18, 0.11, 0.06);
    this.tone(1046.5, now + 0.3, 0.24, 0.07);
    this.tone(1318.5, now + 0.43, 0.22, 0.045, 'triangle');
  },

  play(isCorrect) {
    if (isCorrect) this.correct();
    else this.wrong();
  }
};

function playStartupTypingSound() {
  const ctx = AudioFeedback.getContext();
  if (!ctx) return;
  const start = ctx.currentTime + 0.06;
  const clicks = [
    0, 0.11, 0.19, 0.3, 0.39, 0.51, 0.62, 0.73,
    1.02, 1.12, 1.23, 1.34, 1.48, 1.59,
    2.02, 2.12, 2.25, 2.36, 2.46, 2.58, 2.7,
    3.06, 3.18, 3.29, 3.43, 3.55, 3.68, 3.82
  ];
  clicks.forEach((offset, i) => {
    const freq = i % 5 === 0 ? 720 : 980 + ((i % 3) * 90);
    AudioFeedback.tone(freq, start + offset, 0.024, 0.018, 'square');
  });
}

let activeSpeechButton = null;

function setSpeechButtonState(button, isSpeaking) {
  if (!button) return;
  button.classList.toggle('speaking', isSpeaking);
  button.setAttribute('aria-label', isSpeaking ? 'Stop reading' : 'Read aloud');
  button.setAttribute('title', isSpeaking ? 'Stop reading' : 'Read aloud');
  const icon = button.querySelector('[aria-hidden="true"]');
  if (icon) icon.textContent = isSpeaking ? '■' : '🔊';
}

function speak(text, button = null) {
  if (!('speechSynthesis' in window) || !text) return;
  stopSpeaking();
  activeSpeechButton = button;
  setSpeechButtonState(activeSpeechButton, true);
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.9;
  utter.lang = State.language === 'es' ? 'es-US' : 'en-US';
  utter.onend = () => {
    setSpeechButtonState(activeSpeechButton, false);
    activeSpeechButton = null;
  };
  utter.onerror = utter.onend;
  window.speechSynthesis.speak(utter);
}

function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  setSpeechButtonState(activeSpeechButton, false);
  activeSpeechButton = null;
}

function renderReadAloudButton() {
  return `
    <button class="btn-audio" type="button" aria-label="Read aloud" title="Read aloud">
      <span aria-hidden="true">🔊</span>
    </button>`;
}

function getReadableCardText(card) {
  if (!card) return '';
  const clone = card.cloneNode(true);
  clone.querySelectorAll('.btn-audio, .option-letter').forEach(el => el.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

// ─── HOME SCREEN ──────────────────────────────────────────────
function renderHome() {
  const track = getTrack();
  const lessons = getLessons();
  const units = getUnits();
  const container = $('#unit-list');
  container.innerHTML = '';
  const { done, total } = State.getTotalProgress();
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const dailyDone = State.dailyCompletions.includes(getTodayKey());
  const dailyQuestions = buildDailyMissionQuestions().length;

  const title = track.title.replace('G-Code', '<span>G-Code</span>');
  $('.hero-title').innerHTML = `${title},<br>one block at a time.`;
  updateStaticText();
  $('#xp-bar-fill').style.width = Math.min(pct, 100) + '%';
  $('#xp-bar-current').textContent = State.xp + ' XP';
  $('#xp-bar-current-2').textContent = State.xp + ' XP';
  $('#xp-bar-next').textContent = done + '/' + total + ' lessons';
  $('#streak-val').textContent = '🔥 ' + State.streak;
  $('#daily-pill')?.classList.toggle('is-done', dailyDone);
  const dailyPillDetail = $('#daily-pill-detail');
  if (dailyPillDetail && !dailyDone && dailyQuestions > 0) {
    const dq = Math.min(dailyQuestions, 5);
    dailyPillDetail.textContent = `${dq} question${dq === 1 ? '' : 's'} waiting`;
  } else if (dailyPillDetail && dailyDone) {
    dailyPillDetail.textContent = 'Wrap it again anytime.';
  } else if (dailyPillDetail && !dailyDone && dailyQuestions === 0) {
    dailyPillDetail.textContent = 'Finish one lesson to unlock.';
  }
  updateTrackSwitcher();
  renderMotivation();

  units.forEach(unit => {
    const unitLessons = lessons.filter(l => l.unit === unit.id);
    const nextLesson = unitLessons.find(l => !State.isLessonDone(l.id) && State.isLessonUnlocked(l));
    const { done: uDone } = State.getUnitProgress(unit.id);
    const locked = !State.isLessonUnlocked(unitLessons[0]);
    const canReview = unitLessons.length > 0 && uDone === unitLessons.length;
    const reviewDone = State.isUnitReviewDone(unit.id);
    const previewWhy = nextLesson?.why?.trim() || '';

    const card = document.createElement('div');
    card.className = `unit-card track-${State.trackId} unit-${unit.id}`;
    card.innerHTML = `
      <div class="unit-card__header">
        <div class="unit-card__icon">${unit.icon}</div>
        <div class="unit-card__meta">
          <div class="unit-card__name">Unit ${unit.id}: ${unit.name}</div>
          <div class="unit-card__progress">${uDone}/${unit.lessons} lessons complete</div>
          ${previewWhy ? `<div class="unit-card__why">${previewWhy}</div>` : ''}
        </div>
        <div class="unit-card__badge ${locked ? 'locked' : ''}">${locked ? '🔒' : uDone === unit.lessons ? '✅' : 'Open'}</div>
      </div>
      <div class="unit-card__lessons">
        ${unitLessons.map(l => {
          const done = State.isLessonDone(l.id);
          const unlocked = State.isLessonUnlocked(l);
          const dotClass = done ? 'done' : unlocked ? 'active' : '';
          const rowWhy = (!done && unlocked && l.why?.trim()) ? `<div class="lesson-row__why">${l.why.trim()}</div>` : '';
          return `
            <div class="lesson-row ${!unlocked ? 'locked' : ''}" data-lesson-id="${l.id}">
              <div class="lesson-dot ${dotClass}">${done ? '✓' : l.lesson}</div>
              <div class="lesson-row__title">${l.icon} ${l.title}</div>
              ${rowWhy}
            </div>`;
        }).join('')}
        <div class="lesson-row review-row ${!canReview ? 'locked' : ''}" data-unit-review="${unit.id}">
          <div class="lesson-dot ${reviewDone ? 'done' : canReview ? 'active' : ''}">${reviewDone ? '✓' : '?'}</div>
          <div class="lesson-row__title">Unit Review</div>
        </div>
      </div>`;
    container.appendChild(card);
  });

  $$('.lesson-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.lessonId;
      if (id) startLesson(id);
    });
  });
  $$('.review-row').forEach(row => {
    row.addEventListener('click', () => {
      const unitId = parseInt(row.dataset.unitReview, 10);
      if (unitId) startUnitReview(unitId);
    });
  });

  renderMilestoneReward();
}

// ─── LESSON ENGINE ────────────────────────────────────────────
function getNextLesson() {
  return getLessons().find(lesson => !State.isLessonDone(lesson.id) && State.isLessonUnlocked(lesson)) || null;
}

function renderMotivation() {
  const panel = $('#motivation-panel');
  if (!panel) return;
  const { done, total } = State.getTotalProgress();
  const nextLesson = getNextLesson();
  const trackComplete = total > 0 && done === total;
  const weakCount = State.weakQuestions.length;
  const dailyDone = State.dailyCompletions.includes(getTodayKey());
  const hasDailyPractice = buildDailyMissionQuestions().length > 0;
  const phaseNow = total > 0 ? Math.min(done + 1, total) : 0;
  const nextTitle = nextLesson ? nextLesson.title : 'Path mastered';
  const nextMeta = nextLesson
    ? `Unit ${nextLesson.unit} - Lesson ${nextLesson.lesson} - learning phase`
    : 'Run a mixed review to keep the codes fresh.';
  const badges = [
    { icon: 'OK', name: 'First Lesson', unlocked: done >= 1 },
    { icon: '3x', name: '3 Day Streak', unlocked: State.streak >= 3 },
    { icon: 'XP', name: '100 XP', unlocked: State.xp >= 100 }
  ];

  panel.innerHTML = `
    <div class="motivation-row">
      <button class="motivation-card daily-mission-card ${dailyDone ? 'complete' : ''}" type="button" id="daily-mission-btn" ${hasDailyPractice ? '' : 'disabled'}>
        <div class="motivation-kicker">Daily Goal</div>
        <div class="motivation-title">${dailyDone ? 'Daily practice done' : '5-question practice'}</div>
        <div class="motivation-sub">${hasDailyPractice ? (dailyDone ? 'Run it again anytime to stay sharp.' : 'Mistakes and older lessons come back first.') : 'Complete one lesson to unlock this.'}</div>
      </button>
      <div class="motivation-card next-card">
        <div class="motivation-kicker">Phase ${phaseNow}/${total}</div>
        <div class="motivation-title">${nextTitle}</div>
        <div class="motivation-sub">${nextMeta}</div>
      </div>
    </div>
    ${weakCount > 0 ? `
      <button class="weak-review-card" type="button" id="weak-review-btn">
        <span class="weak-review-card__mark">!</span>
        <span>
          <strong>${weakCount} weak spot${weakCount === 1 ? '' : 's'} ready</strong>
          <em>Review the lesson idea, then retry what you missed.</em>
        </span>
      </button>
    ` : ''}
    ${trackComplete ? `
      <button class="track-review-card" type="button" id="track-review-btn">
        <span class="weak-review-card__mark">∞</span>
        <span>
          <strong>Mixed review unlocked</strong>
          <em>Keep practicing across the full ${getTrack().name} path while more units are added.</em>
        </span>
      </button>
    ` : ''}
    <div class="badge-strip">
      ${badges.map(badge => `
        <div class="badge-chip ${badge.unlocked ? 'unlocked' : 'locked'}">
          <span>${badge.icon}</span>${badge.name}</div>
      `).join('')}
    </div>`;
  $('#weak-review-btn')?.addEventListener('click', startWeakReview);
  $('#track-review-btn')?.addEventListener('click', startTrackReview);
  $('#daily-mission-btn')?.addEventListener('click', startDailyMission);
}

function renderMilestoneReward() {
  const reward = $('#milestone-reward');
  if (!reward) return;

  const { done, total } = State.getTotalProgress();
  const milestones = [
    { id: 'first-lesson', xp: 1, badge: 'First Lesson', message: 'You started the path.' },
    { id: 'unit-1', xp: 5, badge: 'Unit 1 Complete', message: 'Foundations are in.' },
    { id: 'three-day-streak', xp: 5, badge: '3 Day Streak', message: 'Retention is momentum.' },
    { id: 'halfway', xp: 10, badge: 'Halfway There', message: 'More than half done.' },
    { id: 'track-complete', xp: 15, badge: 'Path Complete', message: 'Full track unlocked for mixed review.' }
  ];

  const earned = milestones.filter(m => {
    if (m.id === 'first-lesson') return done >= 1;
    if (m.id === 'unit-1') return done >= getLessons().filter(l => l.unit === 1).length;
    if (m.id === 'three-day-streak') return State.streak >= 3;
    if (m.id === 'halfway') return total > 0 && done >= Math.ceil(total / 2);
    if (m.id === 'track-complete') return total > 0 && done === total;
    return false;
  });

  if (!earned.length) { reward.innerHTML = ''; return; }

  reward.innerHTML = `
    <div class="milestone-strip">
      ${earned.map(m => `
        <div class="milestone-chip">
          <div class="milestone-chip__mark">★</div>
          <div>
            <div class="milestone-chip__title">${m.badge}</div>
            <div class="milestone-chip__sub">${m.message}</div>
          </div>
        </div>
      `).join('')}
    </div>`;
}

function startLesson(lessonId) {
  const lesson = getLessons().find(l => l.id === lessonId);
  if (!lesson) return;
  if (!State.isLessonUnlocked(lesson)) { showToast('Complete the previous lesson first!', 'error'); return; }

  State.currentLesson = lesson;
  State.currentReviewUnit = null;
  State.currentMode = 'lesson';
  State.currentStep = 0;
  State.currentQuizAnswered = false;
  State.retryCurrentLesson = false;
  State.lessonFinished = false;
  State.missedQuestions = [];
  State.practiceQuestions = pickLessonQuestions(lesson, 5);
  State.nextActionLessonId = null;
  State.sessionCorrect = 0;
  State.sessionTotal = getActiveQuestions(lesson).length;

  renderLessonStep();
  showScreen('screen-lesson');
}

function startUnitReview(unitId, questions = null) {
  const unit = getUnits().find(item => item.id === unitId);
  if (!unit) return;
  const unitLessons = getLessons().filter(lesson => lesson.unit === unitId);
  const canReview = unitLessons.length > 0 && unitLessons.every(lesson => State.isLessonDone(lesson.id));
  if (!canReview) { showToast('Finish the unit lessons first.', 'error'); return; }

  State.currentLesson = {
    id: `review-${unitId}`,
    unit: unitId,
    lesson: 'Review',
    title: `${unit.name} Review`,
    icon: unit.icon,
    xp: 25,
    theory: '',
    visual: '',
    quiz: questions || buildUnitReviewQuestions(unitId)
  };
  State.currentReviewUnit = unitId;
  State.currentMode = 'review';
  State.currentStep = 1;
  State.currentQuizAnswered = false;
  State.retryCurrentLesson = false;
  State.lessonFinished = false;
  State.missedQuestions = [];
  State.practiceQuestions = null;
  State.nextActionLessonId = null;
  State.sessionCorrect = 0;
  State.sessionTotal = State.currentLesson.quiz.length;

  renderLessonStep();
  showScreen('screen-lesson');
}

function buildUnitReviewQuestions(unitId) {
  const lessonBuckets = getLessons()
    .filter(lesson => lesson.unit === unitId)
    .map(lesson => shuffleCopy(lesson.quiz).map(q => ({
      ...q,
      sourceLessonId: lesson.id,
      sourceTitle: lesson.title,
      sourceUnit: lesson.unit
    })));
  const mixed = [];
  let round = 0;
  while (mixed.length < 10 && lessonBuckets.some(bucket => bucket[round])) {
    lessonBuckets.forEach(bucket => {
      if (bucket[round] && mixed.length < 10) mixed.push({ ...bucket[round] });
    });
    round++;
  }
  return shuffleCopy(mixed);
}

function buildTrackReviewQuestions() {
  const unitBuckets = getUnits().map(unit => getLessons()
    .filter(lesson => lesson.unit === unit.id)
    .flatMap(lesson => shuffleCopy(lesson.quiz).map(q => ({
      ...q,
      sourceLessonId: lesson.id,
      sourceTitle: lesson.title,
      sourceUnit: lesson.unit
    }))));
  const mixed = [];
  let round = 0;
  while (mixed.length < 12 && unitBuckets.some(bucket => bucket[round])) {
    unitBuckets.forEach(bucket => {
      if (bucket[round] && mixed.length < 12) mixed.push({ ...bucket[round] });
    });
    round++;
  }
  return shuffleCopy(mixed);
}

function buildDailyMissionQuestions() {
  const weakQuestions = State.weakQuestions
    .slice()
    .sort((a, b) => (b.misses - a.misses) || (b.lastMissed - a.lastMissed))
    .map(item => {
      const q = item.question || {};
      return {
        ...getRetakeQuestion(q),
        weakKey: item.key,
        sourceLessonId: q.sourceLessonId,
        sourceUnit: q.sourceUnit,
        sourceTitle: q.sourceTitle
      };
    });
  const completedLessonQuestions = shuffleCopy(getLessons()
    .filter(lesson => State.isLessonDone(lesson.id))
    .flatMap(lesson => (lesson.quiz || []).map(q => ({
      ...q,
      sourceLessonId: lesson.id,
      sourceTitle: lesson.title,
      sourceUnit: lesson.unit
    }))));
  const confidenceReviewQuestions = getLessons()
    .filter(lesson => State.isLessonDone(lesson.id))
    .filter(lesson => ['hard', 'ok'].includes(State.confidenceRatings[lesson.id]?.rating))
    .sort((a, b) => {
      const weight = { hard: 0, ok: 1 };
      return weight[State.confidenceRatings[a.id]?.rating] - weight[State.confidenceRatings[b.id]?.rating];
    })
    .flatMap(lesson => pickQuestions(lesson.quiz || [], 2).map(q => ({
      ...q,
      sourceLessonId: lesson.id,
      sourceTitle: lesson.title,
      sourceUnit: lesson.unit
    })));
  const seen = new Set();
  return [...weakQuestions, ...confidenceReviewQuestions, ...completedLessonQuestions]
    .filter(q => {
      const key = q.weakKey || q.id || State.questionKey(q);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

const TODAYS_LINE_CATALOG = {
  cnc: [
    { lessonId: 'u1-l1', line: 'G00 X2.000 Z0.100', prompt: 'Write the rapid-positioning example that moves to X2.000 and Z0.100.', explanation: 'G00 selects rapid positioning; X and Z specify the taught example destination.' },
    { lessonId: 'u2-l1', line: 'G00 X2.200 Z0.100', prompt: 'Write the taught clearance move to X2.200 and Z0.100.', explanation: 'This is the lesson’s rapid approach example. Real clearance remains setup-specific.' },
    { lessonId: 'u2-l2', line: 'G01 X1.500 Z-1.000 F0.010', prompt: 'Write the taught linear cutting move to X1.500 and Z-1.000 at F0.010.', explanation: 'G01 commands the straight feed move, and F0.010 supplies the lesson’s feed value.' },
    { lessonId: 'u3-l1', line: 'G97 S1200 M03', prompt: 'Write the taught fixed-RPM spindle line for 1200 RPM clockwise.', explanation: 'G97 selects fixed RPM, S1200 sets the speed, and M03 starts the spindle clockwise in this scoped example.' },
    { lessonId: 'u6-l1', line: 'G20', prompt: 'Write the taught code that selects inch input.', explanation: 'G20 selects inch units on the Haas and Fanuc controls covered by the lesson.' },
    { lessonId: 'u7-l1', line: 'M08', prompt: 'Write the taught command for flood coolant on.', explanation: 'M08 commonly turns flood coolant on in the lesson’s Haas/Fanuc scope.' },
    { lessonId: 'u9-l1', line: 'G81 X1.000 Y0.500 Z-0.750 R0.100 F5.0', prompt: 'Write the taught G81 drilling line at X1.000 Y0.500, Z-0.750, R0.100, and F5.0.', explanation: 'G81 calls the simple drilling cycle with the taught hole location, depth, retract plane, and feed.' }
  ],
  printing: [
    { lessonId: 'p-u1-l1', line: 'G1 X82.4 Y104.2 E0.036 F1800', prompt: 'Write the taught printer move to X82.4 Y104.2 with E0.036 and F1800.', explanation: 'G1 commands the controlled move; X/Y locate it, E supplies extrusion, and F sets feedrate.' },
    { lessonId: 'p-u1-l2', line: 'G28', prompt: 'Write the taught command that homes all printer axes.', explanation: 'G28 homes the configured axes so the printer can establish known positions.' },
    { lessonId: 'p-u1-l3', line: 'M104 S210', prompt: 'Write the taught Marlin line that sets the nozzle to 210 C without waiting.', explanation: 'M104 sets the hotend target and continues without waiting for the target temperature.' },
    { lessonId: 'p-u2-l2', line: 'G1 X40 Y40 F9000', prompt: 'Write the taught fast travel move to X40 Y40 at F9000.', explanation: 'This G1 line moves at the taught travel feedrate without an E extrusion word.' },
    { lessonId: 'p-u2-l3', line: 'M107', prompt: 'Write the taught command that turns the part-cooling fan off.', explanation: 'M107 turns off the part-cooling fan in the Marlin scope used by the lesson.' },
    { lessonId: 'p-u3-l1', line: 'G92 E0', prompt: 'Write the taught start-code line that resets the extruder position to zero.', explanation: 'G92 E0 declares the current extruder position as zero.' },
    { lessonId: 'p-u3-l2', line: 'M104 S0', prompt: 'Write the taught end-code line that sets the hotend target to zero.', explanation: 'M104 S0 turns off the hotend target without waiting.' }
  ]
};

function getTodaysLineCandidates() {
  return (TODAYS_LINE_CATALOG[State.trackId] || [])
    .filter(item => State.isLessonDone(item.lessonId))
    .map(item => {
      const lesson = getLessons().find(candidate => candidate.id === item.lessonId);
      return { ...item, lesson };
    })
    .filter(item => item.lesson && item.lesson.theory.includes(item.line));
}

function buildTodaysLineQuestion() {
  const candidates = getTodaysLineCandidates();
  if (!candidates.length) return null;
  const seed = `${getTodayKey()}|${State.trackId}`;
  const index = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0) % candidates.length;
  const selected = candidates[index];
  return {
    id: `todays-line-${State.trackId}-${selected.lessonId}`,
    type: 'fill-blank',
    question: selected.prompt,
    answer: selected.line,
    explanation: selected.explanation,
    sourceLessonId: selected.lessonId,
    sourceTitle: selected.lesson.title,
    sourceUnit: selected.lesson.unit,
    meta: { codes: selected.line.match(/\b[GM]\d{1,3}\b/g) || [] }
  };
}

function startTodaysLine() {
  const question = buildTodaysLineQuestion();
  if (!question) {
    showToast('Complete one lesson to unlock Today’s Line.', 'error');
    return;
  }

  State.currentLesson = {
    id: 'todays-line',
    unit: 'Daily',
    lesson: 'Line',
    title: 'Today’s Line',
    icon: '1L',
    xp: 0,
    theory: '',
    visual: '',
    quiz: [question]
  };
  State.currentReviewUnit = null;
  State.currentMode = 'todays-line';
  State.currentStep = 1;
  State.currentQuizAnswered = false;
  State.retryCurrentLesson = false;
  State.lessonFinished = false;
  State.missedQuestions = [];
  State.practiceQuestions = null;
  State.nextActionLessonId = null;
  State.sessionCorrect = 0;
  State.sessionTotal = 1;

  renderLessonStep();
  showScreen('screen-lesson');
}

function startDailyMission() {
  const questions = buildDailyMissionQuestions();
  if (questions.length === 0) {
    showToast('Complete one lesson to unlock daily practice.', 'error');
    return;
  }

  State.currentLesson = {
    id: 'daily-mission',
    unit: 'Daily',
    lesson: 'Practice',
    title: 'Daily Practice',
    icon: '◆',
    xp: 12,
    theory: '',
    visual: '',
    quiz: questions
  };
  State.currentReviewUnit = null;
  State.currentMode = 'daily-review';
  State.currentStep = 1;
  State.currentQuizAnswered = false;
  State.retryCurrentLesson = false;
  State.lessonFinished = false;
  State.missedQuestions = [];
  State.practiceQuestions = null;
  State.nextActionLessonId = null;
  State.sessionCorrect = 0;
  State.sessionTotal = questions.length;

  renderLessonStep();
  showScreen('screen-lesson');
}

function startTrackReview(questions = null) {
  const { done, total } = State.getTotalProgress();
  if (total === 0 || done < total) {
    showToast('Finish the path to unlock mixed review.', 'error');
    return;
  }
  const reviewQuestions = questions || buildTrackReviewQuestions();
  if (reviewQuestions.length === 0) {
    showToast('No review questions available yet.', 'error');
    return;
  }

  State.currentLesson = {
    id: 'track-review',
    unit: 'Review',
    lesson: 'Mixed',
    title: `${getTrack().name} Mixed Review`,
    icon: '∞',
    xp: 20,
    theory: '',
    visual: '',
    quiz: reviewQuestions
  };
  State.currentReviewUnit = null;
  State.currentMode = 'track-review';
  State.currentStep = 1;
  State.currentQuizAnswered = false;
  State.retryCurrentLesson = false;
  State.lessonFinished = false;
  State.missedQuestions = [];
  State.practiceQuestions = null;
  State.nextActionLessonId = null;
  State.sessionCorrect = 0;
  State.sessionTotal = reviewQuestions.length;

  renderLessonStep();
  showScreen('screen-lesson');
}

function startWeakReview() {
  if (State.weakQuestions.length === 0) {
    showToast('No weak spots yet.', 'success');
    return;
  }
  const prioritized = shuffleCopy(State.weakQuestions)
    .slice()
    .sort((a, b) => (b.misses - a.misses) || (b.lastMissed - a.lastMissed))
    .slice(0, 10);
  const retryQuiz = prioritized.map(item => {
    const q = item.question || {};
    const retaken = getRetakeQuestion(q);
    return {
      ...retaken,
      weakKey: item.key,
      sourceLessonId: q.sourceLessonId || retaken.sourceLessonId,
      sourceUnit: q.sourceUnit || retaken.sourceUnit,
      sourceTitle: q.sourceTitle || retaken.sourceTitle
    };
  });

  State.currentLesson = {
    id: 'weak-review',
    unit: 'Review',
    lesson: 'Weak Spots',
    title: 'Weak Spot Review',
    icon: '!',
    xp: 15,
    theory: '',
    visual: '',
    quiz: retryQuiz
  };
  State.currentReviewUnit = null;
  State.currentMode = 'weak-review';
  State.currentStep = 0;
  State.currentQuizAnswered = false;
  State.retryCurrentLesson = false;
  State.lessonFinished = false;
  State.missedQuestions = [];
  State.practiceQuestions = null;
  State.nextActionLessonId = null;
  State.sessionCorrect = 0;
  State.sessionTotal = retryQuiz.length;

  renderLessonStep();
  showScreen('screen-lesson');
}

function getActiveQuestions(lesson = State.currentLesson) {
  if (!lesson) return [];
  if (State.currentMode === 'lesson') {
    if (!State.practiceQuestions) State.practiceQuestions = pickQuestions(lesson.quiz, 5);
    return State.practiceQuestions;
  }
  return lesson.quiz;
}

function modeHasIntroStep() {
  return State.currentMode === 'lesson' || State.currentMode === 'weak-review';
}

function getCurrentQuestion() {
  const activeQuestions = getActiveQuestions();
  if (State.currentStep < 1) return null;
  return activeQuestions[State.currentStep - 1] || null;
}

function renderLessonStep() {
  const lesson = State.currentLesson;
  const activeQuestions = getActiveQuestions(lesson);
  const hasIntro = modeHasIntroStep();
  const totalSteps = activeQuestions.length + (hasIntro ? 1 : 0);
  const step = State.currentStep;
  const isTheory = hasIntro && step === 0;
  const actionBtn = $('#lesson-action-btn');
  actionBtn.onclick = null;

  const pct = Math.max(0, Math.min(100, Math.round((step / totalSteps) * 100)));
  $('#lesson-progress-fill').style.width = pct + '%';
  $('#lesson-step-count').textContent = `${step}/${totalSteps}`;

  const content = $('#lesson-content');
  content.innerHTML = '';

  if (isTheory) {
    content.innerHTML = State.currentMode === 'weak-review'
      ? renderWeakReviewIntro(activeQuestions)
      : renderTheoryStep(lesson);
    $('#lesson-action-btn').textContent = State.currentMode === 'weak-review' ? 'Retake Weak Spots ->' : 'Start Practice ->';
    $('#lesson-action-btn').disabled = false;
    $('#lesson-action-btn').className = 'btn-primary';
    State.currentQuizAnswered = true;
    return;
  }

  const qIdx = step - 1;
  const q = activeQuestions[qIdx];
  renderQuiz(content, q, qIdx);
  $('#lesson-action-btn').textContent = 'Check Answer';
  $('#lesson-action-btn').disabled = q?.type === 'matching';
  $('#lesson-action-btn').className = 'btn-primary';
  State.currentQuizAnswered = false;
}

function renderLessonFactCheck(lesson) {
  const audit = lesson.factCheck;
  if (!audit || !Array.isArray(audit.sources)) return '';
  return '<div class="fact-check-card fact-check-card--compact" title="' + escapeHtmlAttr(audit.dialect) + '">' +
    '<span class="fact-check-label">&#10003; Fact-checked</span>' +
    '<span class="fact-check-date">Reviewed ' + escapeRefText(audit.reviewed) + '</span>' +
    '</div>';
}

function renderTheoryStep(lesson) {
  const whyBlock = lesson.why ? `
    <div class="why-card">
      <div class="why-label">Why this matters</div>
      <div class="why-text">${lesson.why}</div>
    </div>` : '';
  return `
    <div class="step-card active has-audio">
      ${renderReadAloudButton()}
      <div class="step-label">Phase ${lesson.unit}.${lesson.lesson}</div>
      <div class="step-title">${lesson.title}</div>
      ${whyBlock}
      <div class="theory-body">${lesson.theory}</div>
      ${Visuals.render(lesson.visual)}
      ${renderLessonFactCheck(lesson)}
    </div>`;
}

function renderWeakReviewIntro(questions) {
  const lessonCards = questions.map((q, idx) => {
    const lesson = getLessons().find(item => item.id === q.sourceLessonId);
    const title = lesson?.title || q.sourceTitle || 'Quick recall';
    const label = lesson ? `Focus area ${lesson.unit}.${lesson.lesson}` : `Review item ${idx + 1}`;
    return `
    <div class="weak-relearn-card">
      <div class="weak-relearn-card__label">${label}</div>
      <div class="weak-relearn-card__title">${title}</div>
      <p>Recall the rule before opening the question. The explanation appears after you answer.</p>
    </div>`;
  }).join('');
  return `
    <div class="step-card active weak-relearn has-audio">
      ${renderReadAloudButton()}
      <div class="step-label">Weak Spot Memory Check</div>
      <div class="step-title">Recall first, then answer.</div>
      <div class="theory-body">
        <p>These are topics you missed before. Use the focus area as a cue, then answer from memory.</p>
      </div>
      <div class="weak-relearn-list">
        ${lessonCards || '<div class="weak-relearn-card"><div class="weak-relearn-card__title">Quick recall</div><p>Try the question first. The explanation appears after your answer.</p></div>'}
      </div>
    </div>`;
}
function renderQuestionContext(q) {
  if (!isReviewLikeMode()) return '';
  const lesson = getLessons().find(item => item.id === q.sourceLessonId) || State.currentLesson;
  if (!lesson) return '';
  const title = lesson.title || q.sourceTitle || 'Current topic';
  return `
    <div class="question-context-card recall-cue">
      <div class="question-context-card__label">Focus area</div>
      <div class="question-context-card__why"><strong>${title}</strong>. Answer first; the explanation appears after.</div>
    </div>`;
}
function renderQuiz(container, q, idx) {
  const div = document.createElement('div');
  div.className = 'step-card active has-audio';
  q.awaitingCorrection = false;

  if (q.type === 'multiple-choice') {
    const letters = ['A','B','C','D'];
    const options = shuffleCopy(q.options);
    const correctAnswer = typeof q.answer === 'string' ? q.answer : q.options[q.answer];
    const correctIdx = options.indexOf(correctAnswer);
    div.innerHTML = `
      ${renderReadAloudButton()}
      <div class="step-label">${getQuizModeLabel()} · Question ${idx + 1}</div>
      ${renderQuestionContext(q)}
      ${q.retakeNotice ? `<div class="pool-notice">${q.retakeNotice}</div>` : ''}
      <div class="quiz-question">${q.question}</div>
      <div class="options-list">
        ${options.map((opt, i) => `
          <button class="option-btn" data-idx="${i}" data-selected-answer="${escapeHtmlAttr(opt)}">
            <span class="option-letter">${letters[i]}</span>
            ${opt}
          </button>
        `).join('')}
      </div>
      <div id="explanation-box"></div>`;
    container.appendChild(div);

    $$('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (State.currentQuizAnswered) return;
        const chosen = parseInt(btn.dataset.idx, 10);
        if (q.awaitingCorrection) {
          if (chosen !== correctIdx) return;
          $$('.option-btn').forEach(b => { b.disabled = true; });
          btn.classList.add('correct');
          completeCorrection(q);
          return;
        }
        q.chosenAnswer = btn.dataset.selectedAnswer || '';
        const correct = chosen === correctIdx;
        $$('.option-btn').forEach(b => {
          const i = parseInt(b.dataset.idx);
          if (i === correctIdx) b.classList.add('correct');
          else if (i === chosen && !correct) b.classList.add('wrong');
          b.disabled = correct || i !== correctIdx;
        });
        if (correct) {
          State.sessionCorrect++;
          if (shouldClearWeakOnCorrect()) State.clearWeakQuestion(q);
          applyLearnedCodeProgress(q, true);
        } else {
          State.missedQuestions.push(q);
          State.trackWeakQuestion(q);
          if (State.currentMode === 'weak-review') applyLearnedCodeMiss(q);
          q.awaitingCorrection = true;
        }
        State.currentQuizAnswered = correct;
        AudioFeedback.play(correct);
        showExplanation(q.explanation, q, correct);
        if (correct) setAnsweredAction(true);
        else requireCorrectionAction('Tap the correct answer');
        showToast(correct ? '✅ Correct!' : '❌ Not quite — see explanation', correct ? 'success' : 'error');
      });
    });

  } else if (q.type === 'true-false') {
    div.innerHTML = `
      ${renderReadAloudButton()}
      <div class="step-label">${getQuizModeLabel()} · Question ${idx + 1}</div>
      ${renderQuestionContext(q)}
      ${q.retakeNotice ? `<div class="pool-notice">${q.retakeNotice}</div>` : ''}
      <div class="quiz-question true-false-question">${q.question}</div>
      ${q.visual ? `<div class="question-visual">${Visuals.render(q.visual)}</div>` : ''}
      <div class="true-false-actions">
        <button class="tf-btn" data-value="true" aria-label="True">✓</button>
        <button class="tf-btn" data-value="false" aria-label="False">×</button>
      </div>
      <div id="explanation-box"></div>`;
    container.appendChild(div);

    $$('.tf-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (State.currentQuizAnswered) return;
        const chosen = btn.dataset.value === 'true';
        if (q.awaitingCorrection) {
          if (chosen !== q.answer) return;
          $$('.tf-btn').forEach(b => { b.disabled = true; });
          btn.classList.add('correct');
          completeCorrection(q);
          return;
        }
        q.chosenAnswer = String(chosen);
        const correct = chosen === q.answer;
        $$('.tf-btn').forEach(b => {
          const value = b.dataset.value === 'true';
          if (value === q.answer) b.classList.add('correct');
          else if (value === chosen && !correct) b.classList.add('wrong');
          b.disabled = correct || value !== q.answer;
        });
        if (correct) {
          State.sessionCorrect++;
          if (shouldClearWeakOnCorrect()) State.clearWeakQuestion(q);
          applyLearnedCodeProgress(q, true);
        } else {
          State.missedQuestions.push(q);
          State.trackWeakQuestion(q);
          if (State.currentMode === 'weak-review') applyLearnedCodeMiss(q);
          q.awaitingCorrection = true;
        }
        State.currentQuizAnswered = correct;
        AudioFeedback.play(correct);
        showExplanation(q.explanation, q, correct);
        if (correct) setAnsweredAction(true);
        else requireCorrectionAction('Tap the correct answer');
        showToast(correct ? '✅ Correct!' : '❌ Not quite — see explanation', correct ? 'success' : 'error');
      });
    });
  } else if (q.type === 'fill-blank') {
    div.innerHTML = `
      ${renderReadAloudButton()}
      <div class="step-label">${getQuizModeLabel()} · Question ${idx + 1}</div>
      ${renderQuestionContext(q)}
      ${q.retakeNotice ? `<div class="pool-notice">${q.retakeNotice}</div>` : ''}
      <div class="quiz-question">${q.question}</div>
      <div class="fill-blank-wrap">
        <input type="text" class="fill-blank-input" id="fill-input" 
          placeholder="Type your answer…" autocomplete="off" autocorrect="off" spellcheck="false"
          inputmode="${getAnswerInputMode(q)}" pattern="${getAnswerPattern(q)}">
        ${q.hint && !isReviewLikeMode() ? `<div class="hint-text">Hint: ${q.hint}</div>` : ''}
      </div>
      <div id="explanation-box"></div>`;
    container.appendChild(div);

    const inp = $('#fill-input');
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !State.currentQuizAnswered) checkFillBlank(q, inp);
    });
  } else if (q.type === 'matching') {
    const leftItems = q.pairs.map((pair, i) => ({ text: pair.left, idx: i }));
    const rightItems = shuffleCopy(q.pairs.map((pair, i) => ({ text: pair.right, idx: i })));
    div.innerHTML = `
      ${renderReadAloudButton()}
      <div class="step-label">${getQuizModeLabel()} · Question ${idx + 1}</div>
      ${renderQuestionContext(q)}
      ${q.retakeNotice ? `<div class="pool-notice">${q.retakeNotice}</div>` : ''}
      <div class="matching-game-head">
        <div class="matching-game-title">Tap the matching pairs</div>
        <div class="matching-game-count" data-matching-count>0/${q.pairs.length}</div>
      </div>
      <div class="matching-game-subtitle">${q.question}</div>
      <div class="matching-card-grid" data-matching-board data-had-mismatch="false" data-total-pairs="${q.pairs.length}">
        <div class="matching-column">
          ${leftItems.map(item => `<button class="matching-card matching-card-left" data-match-side="left" data-match-idx="${item.idx}" type="button">${item.text}</button>`).join('')}
        </div>
        <div class="matching-column">
          ${rightItems.map(item => `<button class="matching-card matching-card-right" data-match-side="right" data-match-idx="${item.idx}" type="button">${item.text}</button>`).join('')}
        </div>
      </div>
      <div class="matching-help" data-matching-help>Pick a card from each side.</div>
      <div id="explanation-box"></div>`;
    container.appendChild(div);
    initMatchingCards();
  }
}

function isReviewLikeMode() {
  return State.currentMode === 'review' || State.currentMode === 'weak-review' || State.currentMode === 'track-review' || State.currentMode === 'daily-review' || State.currentMode === 'todays-line';
}

function shouldClearWeakOnCorrect() {
  return State.currentMode === 'weak-review' || State.currentMode === 'daily-review' || State.currentMode === 'todays-line';
}

function getQuizModeLabel() {
  if (State.currentMode === 'lesson') return 'Practice Check';
  if (State.currentMode === 'daily-review') return 'Daily Practice';
  if (State.currentMode === 'todays-line') return 'Today’s Line';
  if (State.currentMode === 'weak-review') return 'Weak Spot Review';
  if (State.currentMode === 'track-review') return 'Mixed Review';
  return 'Unit Review';
}

function getAnswerInputMode(q) {
  const answer = String(q.answer || '').trim();
  if (/^-?\d+(\.\d+)?$/.test(answer)) return answer.includes('.') || answer.startsWith('-') ? 'decimal' : 'numeric';
  return 'text';
}

function getAnswerPattern(q) {
  const answer = String(q.answer || '').trim();
  if (/^\d+$/.test(answer)) return '[0-9]*';
  if (/^-?\d+(\.\d+)?$/.test(answer)) return '-?[0-9]*[.]?[0-9]*';
  return '.*';
}

function checkFillBlank(q, inp) {
  const userVal = inp.value.trim().replace(/^G|^g/, match => match.toUpperCase());
  const expected = q.answer.trim();
  const normalizedUser = normalizeCodeAnswer(userVal);
  const normalizedExpected = normalizeCodeAnswer(expected);
  const correct = normalizedUser === normalizedExpected;
  const usedShortGCode = correct && /^G[0-9]$/i.test(userVal) && /^G0[0-9]$/i.test(expected);

  if (q.awaitingCorrection) {
    if (!correct) {
      AudioFeedback.play(false);
      showToast('Type the correct answer to continue.', 'error');
      inp.select();
      return;
    }
    inp.classList.remove('wrong');
    inp.classList.add('correct');
    inp.disabled = true;
    completeCorrection(q);
    return;
  }

  q.chosenAnswer = userVal;
  inp.classList.add(correct ? 'correct' : 'wrong');
  if (correct) {
    inp.disabled = true;
    State.sessionCorrect++;
    if (shouldClearWeakOnCorrect()) State.clearWeakQuestion(q);
    applyLearnedCodeProgress(q, true);
  } else {
    State.missedQuestions.push(q);
    State.trackWeakQuestion(q);
    if (State.currentMode === 'weak-review') applyLearnedCodeMiss(q);
    q.awaitingCorrection = true;
  }
  State.currentQuizAnswered = correct;
  AudioFeedback.play(correct);
  showExplanation(q.explanation + (usedShortGCode ? ' G0 and G00 style codes are both used depending on the control or post. The leading zero form is common in teaching material because it is easier to scan.' : ''), q, correct);
  if (correct) setAnsweredAction(true);
  else {
    inp.value = '';
    inp.classList.remove('wrong');
    inp.disabled = false;
    inp.focus();
    requireCorrectionAction('Type the correct answer');
  }
  showToast(correct ? '✅ Correct!' : `❌ Answer: ${q.answer}`, correct ? 'success' : 'error');
}

function initMatchingCards() {
  const board = $('[data-matching-board]');
  if (!board) return;
  let selected = null;
  const actionBtn = $('#lesson-action-btn');
  if (actionBtn) actionBtn.disabled = true;

  const updateMatchingProgress = () => {
    const total = parseInt(board.dataset.totalPairs || '0', 10);
    const matched = $$('.matching-card-left.matched').length;
    const count = $('[data-matching-count]');
    const help = $('[data-matching-help]');
    if (count) count.textContent = `${matched}/${total}`;
    if (help) help.textContent = matched === total ? 'All pairs matched. Check your run.' : 'Pick a card from each side.';
    if (actionBtn) actionBtn.disabled = matched < total;
  };

  $$('.matching-card').forEach(card => {
    card.addEventListener('click', () => {
      if (State.currentQuizAnswered || card.disabled) return;
      if (!selected) {
        selected = card;
        card.classList.add('selected');
        return;
      }
      if (selected === card) {
        selected.classList.remove('selected');
        selected = null;
        return;
      }
      if (selected.dataset.matchSide === card.dataset.matchSide) {
        selected.classList.remove('selected');
        selected = card;
        card.classList.add('selected');
        return;
      }

      const first = selected;
      const second = card;
      const isMatch = first.dataset.matchIdx === second.dataset.matchIdx;
      first.classList.remove('selected');
      selected = null;

      if (isMatch) {
        first.classList.add('matched');
        second.classList.add('matched');
        first.disabled = true;
        second.disabled = true;
        AudioFeedback.play(true);
        updateMatchingProgress();
        return;
      }
      board.dataset.hadMismatch = 'true';
      first.classList.add('wrong');
      second.classList.add('wrong');
      AudioFeedback.play(false);
      window.setTimeout(() => {
        first.classList.remove('wrong');
        second.classList.remove('wrong');
      }, 450);
    });
    card.addEventListener('keydown', e => {
      if (['Enter', ' '].includes(e.key)) {
        e.preventDefault();
        card.click();
      }
    });
  });
  updateMatchingProgress();
}

function checkMatching(q) {
  const cards = $$('.matching-card');
  const board = $('[data-matching-board]');
  if (!cards.length || State.currentQuizAnswered) return;

  const matchedCount = cards.filter(card => card.classList.contains('matched')).length / 2;
  if (matchedCount < q.pairs.length) {
    showToast('Match every pair first.', 'error');
    return;
  }

  const hadMismatch = board?.dataset.hadMismatch === 'true';
  board.dataset.hadMismatch = 'false';
  const correct = !hadMismatch;

  if (q.awaitingCorrection && correct) {
    cards.forEach(card => { card.disabled = true; });
    completeCorrection(q);
    return;
  }

  if (correct) {
    cards.forEach(card => { card.disabled = true; });
    State.sessionCorrect++;
    if (shouldClearWeakOnCorrect()) State.clearWeakQuestion(q);
    applyLearnedCodeProgress(q, true);
  } else {
    if (!q.awaitingCorrection) {
      State.missedQuestions.push(q);
      State.trackWeakQuestion(q);
      if (State.currentMode === 'weak-review') applyLearnedCodeMiss(q);
      showExplanation(q.explanation, q, false);
    }
    q.awaitingCorrection = true;
    State.currentQuizAnswered = false;
    AudioFeedback.play(false);
    resetMatchingForCorrection(cards, board);
    showToast('Rematch every pair without a mismatch.', 'error');
    return;
  }
  State.currentQuizAnswered = true;
  AudioFeedback.play(true);
  showExplanation(q.explanation, q, true);
  setAnsweredAction(true);
  showToast('✅ Correct!', 'success');
}

function resetMatchingForCorrection(cards, board) {
  cards.forEach(card => {
    card.classList.remove('selected', 'matched', 'wrong');
    card.disabled = false;
  });
  board.dataset.hadMismatch = 'false';
  const count = $('[data-matching-count]');
  const help = $('[data-matching-help]');
  if (count) count.textContent = '0/' + (board.dataset.totalPairs || 0);
  if (help) help.textContent = 'Match every pair again without a mismatch.';
  requireCorrectionAction('Match every pair again');
}
function normalizeCodeAnswer(value) {
  return String(value)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/^([GM])0?([0-9])$/, '$10$2');
}

function setAnsweredAction(correct) {
  const btn = $('#lesson-action-btn');
  if (!btn) return;
  btn.disabled = false;
  if (State.currentMode === 'todays-line') {
    btn.textContent = 'Finish Line';
    btn.className = 'btn-primary accent-btn';
    return;
  }
  if (isReviewLikeMode()) {
    btn.textContent = isLastStep() ? 'Finish Review' : 'Next →';
    btn.className = 'btn-primary' + (isLastStep() ? ' accent-btn' : '');
    return;
  }
  btn.textContent = isLastStep() ? 'Finish Lesson 🎉' : 'Next →';
  btn.className = 'btn-primary' + (isLastStep() ? ' accent-btn' : '');
}

function requireCorrectionAction(label = 'Correct the answer to continue') {
  const btn = $('#lesson-action-btn');
  if (!btn) return;
  btn.textContent = label;
  btn.className = 'btn-primary';
  btn.disabled = true;
}

function completeCorrection(q) {
  q.awaitingCorrection = false;
  State.currentQuizAnswered = true;
  AudioFeedback.play(true);
  setAnsweredAction(false);
  showToast('✅ Correction locked in', 'success');
}

function getCorrectAnswerText(q) {
  if (q?.type === 'multiple-choice' && Array.isArray(q.options)) return q.options[q.answer] || String(q.answer);
  if (q?.type === 'matching' && Array.isArray(q.pairs)) return q.pairs.map(pair => `${pair.left} -> ${pair.right}`).join('; ');
  return String(q?.answer || '').trim();
}

function getQuestionOriginPreview(q) {
  const answer = String(q?.answer || '').trim();
  const unit = q?.sourceUnit || q?.unit || '';
  const title = q?.sourceTitle || q?.originalQuestionId || '';
  const parts = [unit ? `Unit ${unit}` : '', title].filter(Boolean);
  return parts.join(' · ');
}

function getWrongPathPreview(q, chosenAnswer) {
  if (!q || chosenAnswer === undefined) return '';
  const correctText = getCorrectAnswerText(q);
  const expectedCode = correctText.trim();
  const chosenText = typeof chosenAnswer === 'string' ? chosenAnswer.trim() : '';
  if (!expectedCode || !chosenText || expectedCode.toLowerCase() === chosenText.toLowerCase()) return '';
  const comparison = buildCodeComparison(expectedCode, chosenText);
  if (!comparison) return '';
  return `
    <div class="wrong-path-preview">
      <div class="wrong-path-preview__label">What changed</div>
      <div class="wrong-path-preview__codes">
        <div class="wrong-path-preview__expected">
          <div class="wrong-path-preview__code">${escapeHtmlAttr(comparison.expected)}</div>
          <div class="wrong-path-preview__hint">${escapeHtmlAttr(comparison.expectedHint)}</div>
        </div>
        <div class="wrong-path-preview__vs" aria-hidden="true">→</div>
        <div class="wrong-path-preview__chosen">
          <div class="wrong-path-preview__code">${escapeHtmlAttr(comparison.chosen)}</div>
          <div class="wrong-path-preview__hint">${escapeHtmlAttr(comparison.chosenHint)}</div>
        </div>
      </div>
      <div class="wrong-path-preview__note">${escapeHtmlAttr(comparison.note)}</div>
    </div>`;
}

function buildCodeComparison(expectedCode, chosenText) {
  const up = expectedCode.toUpperCase();
  const ch = chosenText.toUpperCase();
  if (up.startsWith('G') && ch.startsWith('G')) {
    return {
      expected: up,
      chosen: ch,
      expectedHint: getMotionHint(up),
      chosenHint: getMotionHint(ch),
      note: getMotionDifferenceNote(up, ch)
    };
  }
  if (up.startsWith('M') && ch.startsWith('M')) {
    return {
      expected: up,
      chosen: ch,
      expectedHint: getMCodeHint(up),
      chosenHint: getMCodeHint(ch),
      note: getMCodeDifferenceNote(up, ch)
    };
  }
  return null;
}

function getMotionHint(code) {
  const motionHints = {
    'G00': 'Rapid positioning only.',
    'G0': 'Rapid positioning only.',
    'G01': 'Straight-line cutting move.',
    'G1': 'Straight-line cutting move.',
    'G02': 'Clockwise arc.',
    'G2': 'Clockwise arc.',
    'G03': 'Counter-clockwise arc.',
    'G3': 'Counter-clockwise arc.',
    'G04': 'Dwell / pause.',
    'G28': 'Home axes.',
    'G29': 'Bed leveling move.'
  };
  return motionHints[code] || 'Review the code meaning.';
}

function getMCodeHint(code) {
  const mCodeHints = {
    'M03': 'Spindle on CW.',
    'M04': 'Spindle on CCW.',
    'M05': 'Spindle stop.',
    'M08': 'Coolant on.',
    'M09': 'Coolant off.',
    'M30': 'End program.'
  };
  return mCodeHints[code] || 'Review the code meaning.';
}

function getMotionDifferenceNote(expected, chosen) {
  if ((expected === 'G00' || expected === 'G0') && (chosen === 'G01' || chosen === 'G1')) {
    return 'G00 is fast positioning without cutting. G01 is a controlled feed move.';
  }
  if ((expected === 'G01' || expected === 'G1') && (chosen === 'G00' || chosen === 'G0')) {
    return 'G01 requires feedrate and is for cutting. G00 skips feedrate and is for positioning.';
  }
  if ((expected === 'G02' || expected === 'G2') && (chosen === 'G03' || chosen === 'G3')) {
    return 'G02 is clockwise arc; G03 is counter-clockwise.';
  }
  if ((expected === 'G03' || expected === 'G3') && (chosen === 'G02' || chosen === 'G2')) {
    return 'G03 is counter-clockwise arc; G02 is clockwise.';
  }
  return 'Different motion modes change how the tool moves.';
}

function getMCodeDifferenceNote(expected, chosen) {
  if ((expected === 'M03' && chosen === 'M04') || (expected === 'M04' && chosen === 'M03')) {
    return 'M03 is clockwise spindle; M04 is counter-clockwise.';
  }
  if (expected === 'M05' && chosen !== 'M05') {
    return 'M05 stops the spindle before tool changes or program end.';
  }
  if (expected === 'M08' && chosen === 'M09') {
    return 'M08 turns coolant on; M09 turns it off.';
  }
  if (expected === 'M09' && chosen === 'M08') {
    return 'M09 turns coolant off; M08 turns it on.';
  }
  return 'Different M-codes control different machine actions.';
}

function showExplanation(text, question = null, correct = true) {
  const box = $('#explanation-box');
  if (!box) return;
  const answer = question ? getCorrectAnswerText(question) : '';
  const reviewLink = renderMistakeBankLink(question, !correct);
  const wrongPath = !correct && question ? getWrongPathPreview(question, question.chosenAnswer || question.answer) : '';
  box.innerHTML = `
    <div class="explanation-box feedback-bar ${correct ? 'is-correct' : 'is-wrong'}">
      ${answer ? `<div class="feedback-answer">Correct answer: <strong>${answer}</strong></div>` : ''}
      <div class="expl-label">Explanation</div>
      <div>${text}</div>
      ${wrongPath}
      ${reviewLink}
    </div>`;
  if (!correct) bindMistakeBankLinks();
}

function renderMistakeBankLink(question = null, show = false) {
  if (!show || !question) return '';
  const sourceLessonId = question.sourceLessonId || State.currentLesson?.id;
  if (!sourceLessonId) return '';
  const lesson = getLessons().find(item => item.id === sourceLessonId);
  const label = lesson ? `Review this topic: ${lesson.title}` : 'Review this topic';
  const titleAttr = lesson ? ` title="${lesson.title}"` : '';
  return `<button type="button" class="mistake-bank-link" data-lesson-id="${sourceLessonId}"${titleAttr}>${label} →</button>`;
}

function bindMistakeBankLinks() {
  $$('.mistake-bank-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const lessonId = btn.dataset.lessonId;
      if (!lessonId) return;
      const lesson = getLessons().find(item => item.id === lessonId);
      if (lesson) {
        startLesson(lesson.id);
      } else {
        showToast('Lesson not available from this review.', 'error');
      }
    });
  });
}

function isLastStep() {
  return State.currentStep >= getActiveQuestions().length;
}

function advanceStep() {
  State.currentStep++;
  const totalSteps = getActiveQuestions().length + (modeHasIntroStep() ? 1 : 0);

  if ((modeHasIntroStep() && State.currentStep >= totalSteps) ||
      (!modeHasIntroStep() && State.currentStep > totalSteps)) {
    finishLesson();
  } else {
    State.currentQuizAnswered = false;
    renderLessonStep();
  }
}

function finishLesson() {
  const lesson = State.currentLesson;
  State.lessonFinished = true;
  if (State.currentMode === 'review') {
    finishUnitReview();
    return;
  }
  if (State.currentMode === 'weak-review') {
    finishWeakReview();
    return;
  }
  if (State.currentMode === 'track-review') {
    finishTrackReview();
    return;
  }
  if (State.currentMode === 'daily-review') {
    finishDailyReview();
    return;
  }
  if (State.currentMode === 'todays-line') {
    finishTodaysLine();
    return;
  }
  if (State.missedQuestions.length > 0) {
    showLessonPracticeRetry();
    return;
  }
  const wasLessonDone = State.isLessonDone(lesson.id);
  const beforeUnitProgress = State.getUnitProgress(lesson.unit);
  const xpEarned = State.completeLesson(lesson.id, State.sessionCorrect, State.sessionTotal);
  const afterUnitProgress = State.getUnitProgress(lesson.unit);
  const completedUnitNow = !wasLessonDone && beforeUnitProgress.done < beforeUnitProgress.total && afterUnitProgress.done === afterUnitProgress.total;
  const lessonIndex = getLessons().findIndex(item => item.id === lesson.id);
  const nextLesson = lessonIndex >= 0 ? getLessons()[lessonIndex + 1] : null;
  const unlockedNextLesson = !wasLessonDone && nextLesson && State.isLessonUnlocked(nextLesson) ? nextLesson : null;
  const nextActionLesson = nextLesson && State.isLessonUnlocked(nextLesson) ? nextLesson : null;
  State.nextActionLessonId = nextActionLesson?.id || null;

  if (completedUnitNow) AudioFeedback.unitComplete();
  else AudioFeedback.lessonComplete();

  const content = $('#lesson-content');
  content.innerHTML = `
    <div class="complete-screen lesson-complete-screen">
      <div class="complete-icon">✓</div>
      <div class="complete-title">Nice run. Keep the setup moving.</div>
      <div class="complete-subtitle">${lesson.title} is locked in with a clean ${State.sessionCorrect}/${State.sessionTotal}.</div>
      <div class="completion-score-card">
        <div>
          <span>Earned</span>
          <strong>+${xpEarned} XP</strong>
        </div>
        <div>
          <span>Streak</span>
          <strong>${State.streak} day</strong>
        </div>
      </div>
      ${unlockedNextLesson ? `
        <div class="next-mission-card">
          <span>Next 2-minute drill</span>
          <strong>${unlockedNextLesson.title}</strong>
          <em>New skill unlocked. Start while this one is fresh.</em>
        </div>` : ''}
      ${renderLessonRecap(lesson)}
      ${renderConfidencePrompt(lesson)}
      <div class="stat-row compact-stat-row">
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
  $('#lesson-action-btn').textContent = nextActionLesson ? 'Start Next Lesson' : 'Back to Lessons';
  $('#lesson-action-btn').className = 'btn-primary accent-btn';
}

function getLessonRecapItems(lesson) {
  const answers = (lesson.quiz || [])
    .filter(q => q.type === 'multiple-choice' && Array.isArray(q.options))
    .map(q => q.options[q.answer])
    .filter(Boolean);
  const codeAnswers = (lesson.quiz || [])
    .map(q => typeof q.answer === 'string' ? q.answer : '')
    .filter(answer => /^[GMTFSXYZ]/i.test(answer));
  return [...new Set([
    lesson.title,
    ...codeAnswers.slice(0, 2),
    ...answers.slice(0, 2)
  ])].slice(0, 3);
}

function renderLessonRecap(lesson) {
  const items = getLessonRecapItems(lesson);
  if (!items.length) return '';
  return `
    <div class="lesson-recap">
      <div class="lesson-recap__label">You practiced</div>
      <div class="lesson-recap__items">
        ${items.map(item => `<span>${item}</span>`).join('')}
      </div>
    </div>`;
}

function renderConfidencePrompt(lesson) {
  const saved = State.confidenceRatings[lesson.id]?.rating || '';
  return `
    <div class="confidence-panel" data-confidence-lesson="${lesson.id}">
      <div class="confidence-panel__label">How solid does this feel?</div>
      <div class="confidence-panel__actions">
        <button class="confidence-btn ${saved === 'easy' ? 'selected' : ''}" type="button" data-confidence="easy">Easy</button>
        <button class="confidence-btn ${saved === 'ok' ? 'selected' : ''}" type="button" data-confidence="ok">Okay</button>
        <button class="confidence-btn ${saved === 'hard' ? 'selected' : ''}" type="button" data-confidence="hard">Hard</button>
      </div>
    </div>`;
}

function showLessonPracticeRetry() {
  const missed = State.missedQuestions.length;
  const content = $('#lesson-content');
  content.innerHTML = `
    <div class="complete-screen review-retry-screen">
      <div class="complete-icon">↻</div>
      <div class="complete-title">Practice Needs Another Pass</div>
      <div class="complete-subtitle">${missed} question${missed === 1 ? '' : 's'} must be corrected before the next lesson unlocks.</div>
      <div class="xp-badge">${State.sessionCorrect}/${State.sessionTotal} correct</div>
    </div>`;
  $('#lesson-progress-fill').style.width = '100%';
  $('#lesson-step-count').textContent = 'Retry';
  $('#lesson-action-btn').textContent = 'Retry Missed Questions';
  $('#lesson-action-btn').className = 'btn-primary accent-btn';
  State.lessonFinished = true;
}

function finishDailyReview() {
  const missed = State.missedQuestions.length;
  const content = $('#lesson-content');

  if (missed > 0) {
    content.innerHTML = `
      <div class="complete-screen review-retry-screen">
        <div class="complete-icon">↻</div>
        <div class="complete-title">Repair Today's Misses</div>
        <div class="complete-subtitle">${missed} question${missed === 1 ? '' : 's'} saved for another pass.</div>
        <div class="xp-badge">${State.sessionCorrect}/${State.sessionTotal} correct so far</div>
      </div>`;
    $('#lesson-progress-fill').style.width = '100%';
    $('#lesson-step-count').textContent = 'Daily';
    $('#lesson-action-btn').textContent = 'Retry Missed Questions';
    $('#lesson-action-btn').className = 'btn-primary accent-btn';
    State.lessonFinished = true;
    return;
  }

  const xpEarned = State.completeDailyReview(State.sessionCorrect, State.sessionTotal);
  AudioFeedback.lessonComplete();
  content.innerHTML = `
    <div class="complete-screen">
      <div class="complete-icon">✓</div>
      <div class="complete-title">Daily Practice Complete</div>
      <div class="complete-subtitle">${xpEarned > 0 ? 'Mistakes cleared today. Older material will keep rotating back.' : 'Extra run complete. Daily XP was already claimed today.'}</div>
      <div class="xp-badge">${xpEarned > 0 ? `+${xpEarned} XP earned` : 'Daily XP claimed'}</div>
      <div class="stat-row">
        <div class="stat-chip">
          <div class="stat-chip__val">${State.sessionCorrect}/${State.sessionTotal}</div>
          <div class="stat-chip__lbl">Correct</div>
        </div>
        <div class="stat-chip">
          <div class="stat-chip__val">${State.weakQuestions.length}</div>
          <div class="stat-chip__lbl">Mistakes</div>
        </div>
      </div>
    </div>`;

  $('#lesson-progress-fill').style.width = '100%';
  $('#lesson-step-count').textContent = 'Done!';
  $('#lesson-action-btn').textContent = 'Back to Lessons';
  $('#lesson-action-btn').className = 'btn-primary accent-btn';
  State.lessonFinished = true;
}



function finishTodaysLine() {
  const missed = State.missedQuestions.length;
  const content = $('#lesson-content');

  if (missed > 0) {
    content.innerHTML = `
      <div class="complete-screen review-retry-screen">
        <div class="complete-icon">↻</div>
        <div class="complete-title">Recall It Once More</div>
        <div class="complete-subtitle">Write the same line again from memory to finish today’s recall.</div>
        <div class="xp-badge">One line · no guessing</div>
      </div>`;
    $('#lesson-progress-fill').style.width = '100%';
    $('#lesson-step-count').textContent = 'Line';
    $('#lesson-action-btn').textContent = 'Retry Today’s Line';
    $('#lesson-action-btn').className = 'btn-primary accent-btn';
    State.lessonFinished = true;
    return;
  }

  const firstCompletionToday = State.completeTodaysLine();
  const line = State.currentLesson.quiz[0]?.answer || '';
  AudioFeedback.lessonComplete();
  content.innerHTML = `
    <div class="complete-screen">
      <div class="complete-icon">✓</div>
      <div class="complete-title">Today’s Line Recalled</div>
      <div class="complete-subtitle">${firstCompletionToday ? 'One useful line retrieved from memory.' : 'Extra recall complete for today.'}</div>
      <div class="xp-badge"><code>${escapeRefText(line)}</code></div>
    </div>`;
  $('#lesson-progress-fill').style.width = '100%';
  $('#lesson-step-count').textContent = 'Done!';
  $('#lesson-action-btn').textContent = 'Back to Lessons';
  $('#lesson-action-btn').className = 'btn-primary accent-btn';
  State.lessonFinished = true;
}

function finishWeakReview() {
  const missed = State.missedQuestions.length;
  const content = $('#lesson-content');

  if (missed > 0) {
    content.innerHTML = `
      <div class="complete-screen review-retry-screen">
        <div class="complete-icon">↻</div>
        <div class="complete-title">Keep These Warm</div>
        <div class="complete-subtitle">${missed} weak spot${missed === 1 ? ' needs' : 's need'} another pass.</div>
        <div class="xp-badge">${State.sessionCorrect}/${State.sessionTotal} corrected</div>
      </div>`;
    $('#lesson-progress-fill').style.width = '100%';
    $('#lesson-step-count').textContent = 'Review';
    $('#lesson-action-btn').textContent = 'Retry Weak Spots';
    $('#lesson-action-btn').className = 'btn-primary accent-btn';
    State.lessonFinished = true;
    return;
  }

  const xpEarned = State.completeWeakReview(State.sessionCorrect, State.sessionTotal);
  AudioFeedback.lessonComplete();
  if (xpEarned > 0 && State.missedQuestions.length === 0) {
    (State.currentLesson?.quiz || []).forEach(q => applyLearnedCodeProgress(q, true));
  }
  content.innerHTML = `
    <div class="complete-screen">
      <div class="complete-icon">✓</div>
      <div class="complete-title">Weak Spots Cleared</div>
      <div class="complete-subtitle">Those questions will stay out of review until you miss them again.</div>
      <div class="xp-badge">+${xpEarned} XP earned</div>
      <div class="stat-row">
        <div class="stat-chip">
          <div class="stat-chip__val">${State.sessionCorrect}/${State.sessionTotal}</div>
          <div class="stat-chip__lbl">Correct</div>
        </div>
        <div class="stat-chip">
          <div class="stat-chip__val">${State.weakQuestions.length}</div>
          <div class="stat-chip__lbl">Weak Spots</div>
        </div>
      </div>
    </div>`;

  $('#lesson-progress-fill').style.width = '100%';
  $('#lesson-step-count').textContent = 'Done!';
  $('#lesson-action-btn').textContent = 'Back to Lessons';
  $('#lesson-action-btn').className = 'btn-primary accent-btn';
  State.lessonFinished = true;
}

function finishTrackReview() {
  const missed = State.missedQuestions.length;
  const content = $('#lesson-content');

  if (missed > 0) {
    content.innerHTML = `
      <div class="complete-screen review-retry-screen">
        <div class="complete-icon">↻</div>
        <div class="complete-title">Mixed Review Needs Another Pass</div>
        <div class="complete-subtitle">${missed} question${missed === 1 ? ' needs' : 's need'} another pass.</div>
        <div class="xp-badge">${State.sessionCorrect}/${State.sessionTotal} correct so far</div>
      </div>`;
    $('#lesson-progress-fill').style.width = '100%';
    $('#lesson-step-count').textContent = 'Review';
    $('#lesson-action-btn').textContent = 'Retry Missed Questions';
    $('#lesson-action-btn').className = 'btn-primary accent-btn';
    State.lessonFinished = true;
    return;
  }

  const xpEarned = State.completeTrackReview(State.sessionCorrect, State.sessionTotal);
  AudioFeedback.lessonComplete();
  content.innerHTML = `
    <div class="complete-screen">
      <div class="complete-icon">∞</div>
      <div class="complete-title">Mixed Review Complete</div>
      <div class="complete-subtitle">The path stays open for practice while more units are added.</div>
      <div class="xp-badge">+${xpEarned} XP earned</div>
      <div class="stat-row">
        <div class="stat-chip">
          <div class="stat-chip__val">${State.sessionCorrect}/${State.sessionTotal}</div>
          <div class="stat-chip__lbl">Correct</div>
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
  State.lessonFinished = true;
}

function finishUnitReview() {
  const lesson = State.currentLesson;
  const missed = State.missedQuestions.length;
  const content = $('#lesson-content');

  if (missed > 0) {
    content.innerHTML = `
      <div class="complete-screen review-retry-screen">
        <div class="complete-icon">↻</div>
        <div class="complete-title">Review Missed Questions</div>
        <div class="complete-subtitle">${missed} question${missed === 1 ? ' needs' : 's need'} another pass.</div>
        <div class="xp-badge">${State.sessionCorrect}/${State.sessionTotal} correct so far</div>
      </div>`;
    $('#lesson-progress-fill').style.width = '100%';
    $('#lesson-step-count').textContent = 'Review';
    $('#lesson-action-btn').textContent = 'Retry Missed Questions';
    $('#lesson-action-btn').className = 'btn-primary accent-btn';
    State.lessonFinished = true;
    return;
  }

  const xpEarned = State.completeUnitReview(State.currentReviewUnit, State.sessionCorrect, State.sessionTotal);
  AudioFeedback.unitComplete();
  content.innerHTML = `
    <div class="complete-screen">
      <div class="complete-icon">✓</div>
      <div class="complete-title">Unit Review Complete</div>
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
      </div>
    </div>`;

  $('#lesson-progress-fill').style.width = '100%';
  $('#lesson-step-count').textContent = 'Done!';
  $('#lesson-action-btn').textContent = 'Back to Lessons';
  $('#lesson-action-btn').className = 'btn-primary accent-btn';
}

function handleLessonAction() {
  if (!State.currentLesson) return;
  if (State.lessonFinished) {
    if (State.currentMode === 'todays-line' && State.missedQuestions.length > 0) {
      State.currentLesson.quiz = State.missedQuestions.map(q => ({ ...q, awaitingCorrection: false, chosenAnswer: undefined }));
      State.missedQuestions = [];
      State.currentStep = 1;
      State.currentQuizAnswered = false;
      State.lessonFinished = false;
      State.sessionCorrect = 0;
      State.sessionTotal = 1;
      renderLessonStep();
      return;
    }
    if (State.currentMode === 'daily-review' && State.missedQuestions.length > 0) {
      State.currentLesson.quiz = getRetakeQuestions(State.missedQuestions);
      State.missedQuestions = [];
      State.currentStep = 1;
      State.currentQuizAnswered = false;
      State.lessonFinished = false;
      State.sessionCorrect = 0;
      State.sessionTotal = State.currentLesson.quiz.length;
      renderLessonStep();
      return;
    }
    if (State.currentMode === 'track-review' && State.missedQuestions.length > 0) {
      startTrackReview(getRetakeQuestions(State.missedQuestions));
      return;
    }
    if (State.currentMode === 'weak-review' && State.missedQuestions.length > 0) {
      State.currentLesson.quiz = getRetakeQuestions(State.missedQuestions);
      State.missedQuestions = [];
      State.currentStep = 0;
      State.currentQuizAnswered = false;
      State.lessonFinished = false;
      State.sessionCorrect = 0;
      State.sessionTotal = State.currentLesson.quiz.length;
      renderLessonStep();
      return;
    }
    if (State.currentMode === 'review' && State.missedQuestions.length > 0) {
      startUnitReview(State.currentReviewUnit, getRetakeQuestions(State.missedQuestions));
      return;
    }
    if (State.currentMode === 'lesson' && State.missedQuestions.length > 0) {
      State.practiceQuestions = getRetakeQuestions(State.missedQuestions);
      State.missedQuestions = [];
      State.currentStep = 1;
      State.currentQuizAnswered = false;
      State.lessonFinished = false;
      State.nextActionLessonId = null;
      State.sessionCorrect = 0;
      State.sessionTotal = State.practiceQuestions.length;
      renderLessonStep();
      return;
    }
    if (State.currentMode === 'lesson' && State.nextActionLessonId) {
      const nextLessonId = State.nextActionLessonId;
      State.nextActionLessonId = null;
      State.lessonFinished = false;
      startLesson(nextLessonId);
      return;
    }
    renderHome();
    showScreen('screen-home');
    State.lessonFinished = false;
    State.nextActionLessonId = null;
    return;
  }
  if (State.retryCurrentLesson) {
    const lessonId = State.currentLesson.id;
    State.retryCurrentLesson = false;
    startLesson(lessonId);
    return;
  }
  if (State.currentStep > 0 && !State.currentQuizAnswered) {
    const q = getCurrentQuestion();
    if (q?.type === 'fill-blank') {
      const inp = $('#fill-input');
      if (inp) checkFillBlank(q, inp);
    } else if (q?.type === 'matching') {
      checkMatching(q);
    }
    return;
  }
  if (State.currentStep === 0 || State.currentQuizAnswered) {
    advanceStep();
  }
}

// ─── REFERENCE SCREEN ────────────────────────────────────────
function renderReference() {
  const container = $('#ref-list');
  container.innerHTML = '';

  const showLearnedOnly = Boolean($('#ref-learned-toggle')?.checked);
  const isCodeLearned = code => State.learnedCodeCodes.includes(escapeLearnedCodeKey(code, State.trackId));

  getRefData().forEach(cat => {
    const visibleCodes = showLearnedOnly
      ? cat.codes.filter(item => isCodeLearned(item.code))
      : cat.codes;
    if (!visibleCodes.length && showLearnedOnly) return;

    const section = document.createElement('div');
    section.className = 'ref-category';
    section.innerHTML = `<div class="ref-category-title">${showLearnedOnly ? 'Learned ' + cat.category : cat.category}</div>`;

    visibleCodes.forEach(item => {
      const learned = isCodeLearned(item.code);
      const card = document.createElement('div');
      card.className = 'ref-card' + (learned ? ' ref-card--learned' : '');
      const summary = (item.body || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const previewText = summary.length > 90 ? summary.slice(0, 87) + '…' : summary;
      card.innerHTML = `
        <button class="ref-card__toggle" type="button" data-ref-code="${escapeHtmlAttr(item.code)}">
          <span class="ref-code">${item.code}</span>
          <span class="ref-name">${item.name}</span>
          ${learned ? '<span class="ref-badge ref-badge--learned">learned</span>' : ''}
          <span class="ref-chevron">▶</span>
        </button>
        <div class="ref-card__preview">${previewText ? escapeHtmlAttr(previewText) : 'No quick preview available.'}</div>
        <div class="ref-card__body">
          ${item.body}
          <div class="ref-card__actions">
            <button class="ref-action ref-action--learned" type="button" data-ref-code="${escapeHtmlAttr(item.code)}" aria-pressed="${learned}">
              ${learned ? 'Marked learned' : 'Mark learned'}
            </button>
          </div>
        </div>`;
      card.querySelector('.ref-card__toggle').addEventListener('click', () => {
        card.classList.toggle('open');
      });
      card.querySelector('.ref-action--learned').addEventListener('click', e => {
        e.stopPropagation();
        toggleLearnedCode(item.code);
        renderReference();
      });
      section.appendChild(card);
    });
    container.appendChild(section);
  });

  if (!container.children.length && showLearnedOnly) {
    container.innerHTML = '<div class="mistake-bank-empty">No learned codes yet. Complete lessons to mark codes learned.</div>';
  }

  const learnedToggle = $('#ref-learned-toggle');
  if (learnedToggle) learnedToggle.onchange = renderReference;

  const searchInput = $('#ref-search');
  searchInput.value = '';
  searchInput.oninput = e => {
    const q = e.target.value.toLowerCase();
    $$('.ref-category').forEach(section => {
      const visible = [...section.querySelectorAll('.ref-card')].some(card => {
        const text = card.textContent.toLowerCase();
        const match = !q || text.includes(q);
        card.style.display = match ? '' : 'none';
        return match;
      });
      section.style.display = visible ? '' : 'none';
    });
  };
}

function renderPractice() {
  updateStaticText();
  const list = $('#practice-list');
  if (!list) return;
  const dailyQuestions = buildDailyMissionQuestions().length;
  const weakCount = State.weakQuestions.length;
  const todaysLine = buildTodaysLineQuestion();
  const todaysLineDone = State.todaysLineCompletions.includes(getTodayKey());
  const { done, total } = State.getTotalProgress();
  const trackComplete = total > 0 && done === total;
  const codeCount = getRefData().reduce((sum, category) => sum + category.codes.length, 0);

  const cards = [
    {
      id: 'todays-line',
      title: 'Today’s Line',
      subtitle: todaysLine ? (todaysLineDone ? 'Recalled today · run it again anytime' : `One line from ${todaysLine.sourceTitle}`) : 'Complete one lesson to unlock',
      icon: '1L',
      badge: todaysLineDone ? 'Done' : 'Recall',
      disabled: !todaysLine
    },
    {
      id: 'daily',
      title: 'Daily Drill',
      subtitle: dailyQuestions ? `${Math.min(dailyQuestions, 5)} recall questions ready` : 'Complete one lesson to unlock',
      icon: '⚡',
      badge: '+12 XP',
      disabled: dailyQuestions === 0
    },
    {
      id: 'mistakes',
      title: 'Mistake Repair',
      subtitle: weakCount ? `${weakCount} saved miss${weakCount === 1 ? '' : 'es'} to clear` : 'Missed questions collect here',
      icon: '↻',
      badge: weakCount ? `${weakCount}` : '',
      disabled: weakCount === 0
    },
    {
      id: 'codes',
      title: 'Code Bank',
      subtitle: `${codeCount} reference cards for ${getTrack().name}`,
      icon: 'Aa',
      badge: getLearnedCodeCount() ? `${getLearnedCodeCount()} learned` : 'Study',
      disabled: false
    },
    {
      id: 'mixed',
      title: 'Mixed Review',
      subtitle: trackComplete ? 'Full-track review unlocked' : `${done}/${total} lessons complete`,
      icon: '∞',
      badge: '+20 XP',
      disabled: !trackComplete
    }
  ];

  list.innerHTML = `
    <div class="practice-section-label">Skills</div>
    ${cards.map(card => `
      <button class="practice-card" type="button" data-practice-action="${card.id}" ${card.disabled ? 'disabled' : ''}>
        <span>
          <strong>${card.title}</strong>
          <em>${card.subtitle}</em>
        </span>
        <span class="practice-card__icon">${card.icon}</span>
        ${card.badge ? `<span class="practice-card__badge">${card.badge}</span>` : ''}
      </button>
    `).join('')}`;

  $$('[data-practice-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.practiceAction;
      if (action === 'daily') startDailyMission();
      if (action === 'mistakes') startWeakReview();
      if (action === 'mixed') startTrackReview();
      if (action === 'todays-line') startTodaysLine();
      if (action === 'codes') {
        renderReference();
        showScreen('screen-reference');
      }
    });
  });
}

// ─── PROGRESS SCREEN ─────────────────────────────────────────
// ─── MIKE'S PERSONAL ROADMAP (My Path panel) ──────────────────
// Static content. Milestone completion state lives in State.activeProfile().roadmap.
const ROADMAP = [
  {
    id: 'p1', name: 'Phase 1 — Close the lathe gap',
    note: 'Your training stopped after the Johnford HT 60CX-2D. Lock the basics underneath it.',
    milestones: [
      { id: 'p1-a', text: 'Explain G00 vs G01 to a coworker without notes' },
      { id: 'p1-b', text: 'Read a turning block and name every code in it' },
      { id: 'p1-c', text: 'Hand-write a simple G01 turning pass on paper' },
      { id: 'p1-d', text: 'Explain what G96 (constant surface speed) protects against' },
    ],
  },
  {
    id: 'p2', name: 'Phase 2 — Offsets & setup',
    note: 'Own this and you stop being the last choice.',
    milestones: [
      { id: 'p2-a', text: 'Set G54 work offset from a known part zero, by hand' },
      { id: 'p2-b', text: 'Fix a 0.002" oversize with wear offsets (no program edit)' },
      { id: 'p2-c', text: 'Run a new program in Single Block + Dry Run, spot the crash first' },
      { id: 'p2-d', text: 'Explain to a rookie why Dry Run still moves the machine' },
    ],
  },
  {
    id: 'p3', name: 'Phase 3 — Fixtures & tooling',
    note: 'Your stated strength. Make it deliberate.',
    milestones: [
      { id: 'p3-a', text: 'Sketch a 3-step fixture plan for a simple block' },
      { id: 'p3-b', text: 'Name the difference between roughing and finishing inserts' },
      { id: 'p3-c', text: 'Pick the insert for: aluminum finish, steel rough, deep groove' },
      { id: 'p3-d', text: 'Explain feed-per-rev (G99) vs feed-per-min (G98)' },
    ],
  },
  {
    id: 'p4', name: 'Phase 4 — Angled cuts & drilling',
    note: 'The literal "code angles" goal.',
    milestones: [
      { id: 'p4-a', text: 'Compute X/Z move for a 30° chamfer from a known start' },
      { id: 'p4-b', text: 'Explain G01 with both axes moving = an angle' },
      { id: 'p4-c', text: 'Write a G83 peck drill cycle for a blind hole' },
      { id: 'p4-d', text: 'Know why G80 cancels a cycle before the next op' },
    ],
  },
  {
    id: 'p5', name: 'Phase 5 — Home benchtop mill',
    note: 'MILESTONE, not the start. Funded by the app or side cash.',
    milestones: [
      { id: 'p5-a', text: 'Research benchtop mills (Tormach 440-class vs import)' },
      { id: 'p5-b', text: 'Set up the mill, indicate the vise, prove G54' },
      { id: 'p5-c', text: 'First paid part: a simple fixture or plate' },
      { id: 'p5-d', text: 'List a small local service (fixtures, plates, prototypes)' },
    ],
  },
];

const ROADMAP_LANES = [
  { id: 'lane-a', title: 'App earns', body: 'CNC tutorial app is public. Affiliate links to tooling, a cheat-sheet PDF, or ad-free paid version funds Phase 5.' },
  { id: 'lane-b', title: 'Teach in public', body: 'Post short "what this G-code does" clips. You are a peer-learner, not a guru — other learners trust that.' },
  { id: 'lane-c', title: 'Local parts', body: 'Once Phase 5 lands, real parts from a home shop.' },
];

function renderRoadmap() {
  const profile = State.activeProfile();
  const done = ROADMAP.reduce((n, ph) => n + ph.milestones.filter(m => profile.roadmap[m.id]).length, 0);
  const total = ROADMAP.reduce((n, ph) => n + ph.milestones.length, 0);
  const pct = total ? Math.round((done / total) * 100) : 0;

  const list = $('#prog-roadmap-list');
  if (!list) return;
  list.innerHTML = `
    <div class="prog-unit-card">
      <div class="prog-unit-header">
        <span class="prog-unit-name">🛤️ My Path</span>
        <span class="prog-pct">${pct}%</span>
      </div>
      <div class="prog-bar"><div class="prog-bar-fill" style="width:${pct}%"></div></div>
      <div class="prog-lessons-done">${done} of ${total} milestones complete</div>
    </div>
    ${ROADMAP.map(ph => {
      const phDone = ph.milestones.filter(m => profile.roadmap[m.id]).length;
      return `
      <div class="roadmap-phase">
        <div class="roadmap-phase__head">
          <span class="roadmap-phase__name">${ph.name}</span>
          <span class="roadmap-phase__count">${phDone}/${ph.milestones.length}</span>
        </div>
        <div class="roadmap-phase__note">${ph.note}</div>
        ${ph.milestones.map(m => `
          <label class="roadmap-item ${profile.roadmap[m.id] ? 'done' : ''}">
            <input type="checkbox" data-roadmap="${m.id}" ${profile.roadmap[m.id] ? 'checked' : ''}>
            <span>${m.text}</span>
          </label>`).join('')}
      </div>`;
    }).join('')}`;

  list.querySelectorAll('input[data-roadmap]').forEach(cb => {
    cb.addEventListener('change', () => {
      State.toggleRoadmapMilestone(cb.dataset.roadmap, cb.checked);
      renderRoadmap();
    });
  });

  const lanes = $('#roadmap-lanes');
  if (lanes) {
    lanes.innerHTML = `
      <div class="roadmap-lanes__head">Side-income lanes</div>
      ${ROADMAP_LANES.map(l => `
        <div class="roadmap-lane">
          <div class="roadmap-lane__title">${l.title}</div>
          <div class="roadmap-lane__body">${l.body}</div>
        </div>`).join('')}`;
  }
}

function renderProgress() {
  const units = getUnits();
  updateStaticText();
  $('#prog-total-xp').textContent = State.xp;
  $('#prog-streak').textContent = State.streak;
  renderMistakeBank();
  renderRoadmap();

  const learnedTotal = getCodeLibrarySize();
  const learned = learnedTotal ? getLearnedCodeCount() : 0;

  const container = $('#prog-unit-list');
  container.innerHTML = learnedTotal ? `
    <div class="prog-unit-card">
      <div class="prog-unit-header">
        <span class="prog-unit-name">🧰 Learned codes</span>
        <span class="prog-pct">${learnedTotal ? Math.round((learned / learnedTotal) * 100) : 0}%</span>
      </div>
      <div class="prog-bar"><div class="prog-bar-fill" style="width:${learnedTotal ? Math.round((learned / learnedTotal) * 100) : 0}%"></div></div>
      <div class="prog-lessons-done">${learned} of ${learnedTotal} codes marked learned</div>
    </div>` : '';

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

function renderMistakeBank() {
  const bank = $('#mistake-bank');
  if (!bank) return;
  const items = State.weakQuestions.slice(0, 5);
  bank.innerHTML = `
    <div class="mistake-bank-card">
      <div class="mistake-bank-card__header">
        <div>
          <div class="mistake-bank-card__kicker">Review Queue</div>
          <div class="mistake-bank-card__title">${State.weakQuestions.length} mistake${State.weakQuestions.length === 1 ? '' : 's'} saved</div>
        </div>
        <button class="mistake-bank-card__btn" type="button" id="mistake-bank-review-btn" ${State.weakQuestions.length ? '' : 'disabled'}>Review</button>
      </div>
      <div class="mistake-bank-list">
        ${items.length ? items.map(item => `
          <div class="mistake-bank-item">
            <strong>${item.question?.sourceTitle || 'Practice'}</strong>
            <span>Missed ${item.misses} time${item.misses === 1 ? '' : 's'}</span>
          </div>`).join('') : '<div class="mistake-bank-empty">Missed questions will collect here for repair practice.</div>'}
      </div>
    </div>`;
  $('#mistake-bank-review-btn')?.addEventListener('click', startWeakReview);
}

// ─── NAV WIRING ───────────────────────────────────────────────
function initNav() {
  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.screen;
      if (target === 'screen-reference') renderReference();
      if (target === 'screen-practice') renderPractice();
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
  $('#lesson-content').addEventListener('click', event => {
    const confidenceButton = event.target.closest('.confidence-btn');
    if (confidenceButton) {
      const panel = confidenceButton.closest('[data-confidence-lesson]');
      State.setConfidence(panel?.dataset.confidenceLesson, confidenceButton.dataset.confidence);
      panel.querySelectorAll('.confidence-btn').forEach(btn => btn.classList.toggle('selected', btn === confidenceButton));
      showToast('Confidence saved', 'success');
      return;
    }
    const button = event.target.closest('.btn-audio');
    if (!button) return;
    if (button === activeSpeechButton) {
      stopSpeaking();
      return;
    }
    const card = button.closest('.step-card');
    speak(getReadableCardText(card), button);
  });
}

// ─── BOOT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  let initError = null;
  try {
    initConceptPools();
    State.load();
    await loadReferencePackage();
    applyTheme();

    initNav();
    initTrackSwitcher();
    initSettings();
    renderSettings();
    renderHome();
    renderPractice();
    showScreen(State.setupComplete ? 'screen-home' : 'screen-settings');
  } catch (error) {
    initError = error;
    showBootFallback(error);
    try { showScreen('screen-settings'); } catch(e) {}
  } finally {
    finishLoading({ hasError: Boolean(initError) });
  }
});
