/* ============================================================
   Project G-Code Tutorial — App Logic
   State management, lesson engine, quiz engine, navigation.
   ============================================================ */

'use strict';

const APP_BUILD = 'MGP | Version v2.57.0 | Build 2026.07.11.02';

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
      confidenceRatings: {},
      learnedCodeCodes: [],
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
    this.confidenceRatings = profile.confidenceRatings || {};
    this.learnedCodeCodes = Array.isArray(profile.learnedCodeCodes)
      ? profile.learnedCodeCodes
      : [];
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
      confidenceRatings: this.confidenceRatings,
      learnedCodeCodes: this.learnedCodeCodes,
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
        weakQuestions: [],
        dailyCompletions: [],
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

function queueCodesFromQuestion(question = {}) {
  const meta = question?.meta || {};
  const explicitCodes = Array.isArray(meta.codes) ? meta.codes : [];
  const answerCode = typeof question.answer === 'string' && /^(G|M)\d+$/i.test(question.answer.trim())
    ? [question.answer.trim()]
    : [];
  return [...new Set([...explicitCodes, ...answerCode].map(code => String(code).trim().toUpperCase()).filter(Boolean))];
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

function referenceCategoryTitle(entry) {
  const labels = {
    cnc_milling: 'CNC Milling',
    cnc_turning: 'CNC Turning',
    '3d_printing_marlin': 'Marlin 3D Printing',
    symbols: 'Symbols'
  };
  const typeLabels = {
    g_codes: 'G-Codes',
    m_codes: 'M-Codes',
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
    if (!State.setupComplete) showScreen('screen-settings');
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
        const chosen = btn.dataset.idx;
        q.chosenAnswer = btn.dataset.selectedAnswer || '';
        const correct = parseInt(chosen, 10) === correctIdx;
        $$('.option-btn').forEach(b => {
          const i = parseInt(b.dataset.idx);
          if (i === correctIdx) b.classList.add('correct');
          else if (b.dataset.idx === chosen && !correct) b.classList.add('wrong');
          b.disabled = true;
        });
        if (correct) {
          State.sessionCorrect++;
          if (shouldClearWeakOnCorrect()) State.clearWeakQuestion(q);
          applyLearnedCodeProgress(q, true);
        } else {
          State.missedQuestions.push(q);
          State.trackWeakQuestion(q);
          if (State.currentMode === 'weak-review') applyLearnedCodeMiss(q);
        }
        State.currentQuizAnswered = true;
        AudioFeedback.play(correct);
        showExplanation(q.explanation, q, correct);
        setAnsweredAction(correct);
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
        q.chosenAnswer = String(chosen);
        const correct = chosen === q.answer;
        $$('.tf-btn').forEach(b => {
          const value = b.dataset.value === 'true';
          if (value === q.answer) b.classList.add('correct');
          else if (value === chosen && !correct) b.classList.add('wrong');
          b.disabled = true;
        });
        if (correct) {
          State.sessionCorrect++;
          if (shouldClearWeakOnCorrect()) State.clearWeakQuestion(q);
          applyLearnedCodeProgress(q, true);
        } else {
          State.missedQuestions.push(q);
          State.trackWeakQuestion(q);
          if (State.currentMode === 'weak-review') applyLearnedCodeMiss(q);
        }
        State.currentQuizAnswered = true;
        AudioFeedback.play(correct);
        showExplanation(q.explanation, q, correct);
        setAnsweredAction(correct);
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
  return State.currentMode === 'review' || State.currentMode === 'weak-review' || State.currentMode === 'track-review' || State.currentMode === 'daily-review';
}

function shouldClearWeakOnCorrect() {
  return State.currentMode === 'weak-review' || State.currentMode === 'daily-review';
}

function getQuizModeLabel() {
  if (State.currentMode === 'lesson') return 'Practice Check';
  if (State.currentMode === 'daily-review') return 'Daily Practice';
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
  q.chosenAnswer = userVal;
  const expected = q.answer.trim();
  const normalizedUser = normalizeCodeAnswer(userVal);
  const normalizedExpected = normalizeCodeAnswer(expected);
  const correct = normalizedUser === normalizedExpected;
  const usedShortGCode = correct && /^G[0-9]$/i.test(userVal) && /^G0[0-9]$/i.test(expected);
  inp.classList.add(correct ? 'correct' : 'wrong');
  inp.disabled = true;
  if (correct) {
    State.sessionCorrect++;
    if (shouldClearWeakOnCorrect()) State.clearWeakQuestion(q);
    applyLearnedCodeProgress(q, true);
  } else {
    State.missedQuestions.push(q);
    State.trackWeakQuestion(q);
    if (State.currentMode === 'weak-review') applyLearnedCodeMiss(q);
  }
  State.currentQuizAnswered = true;
  AudioFeedback.play(correct);
  showExplanation(q.explanation + (usedShortGCode ? ' G0 and G00 style codes are both used depending on the control or post. The leading zero form is common in teaching material because it is easier to scan.' : ''), q, correct);
  setAnsweredAction(correct);
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
  cards.forEach(card => { card.disabled = true; });

  if (correct) {
    State.sessionCorrect++;
    if (shouldClearWeakOnCorrect()) State.clearWeakQuestion(q);
    applyLearnedCodeProgress(q, true);
  } else {
    State.missedQuestions.push(q);
    State.trackWeakQuestion(q);
    if (State.currentMode === 'weak-review') applyLearnedCodeMiss(q);
  }
  State.currentQuizAnswered = true;
  AudioFeedback.play(correct);
  showExplanation(q.explanation, q, correct);
  setAnsweredAction(correct);
  showToast(correct ? '✅ Correct!' : '❌ Not quite — see explanation', correct ? 'success' : 'error');
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
  if (isReviewLikeMode()) {
    btn.textContent = isLastStep() ? 'Finish Review' : 'Next →';
    btn.className = 'btn-primary' + (isLastStep() ? ' accent-btn' : '');
    return;
  }
  btn.textContent = isLastStep() ? 'Finish Lesson 🎉' : 'Next →';
  btn.className = 'btn-primary' + (isLastStep() ? ' accent-btn' : '');
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
  const sourceLessonId = question.sourceLessonId || question.originalQuestionId || question.id;
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

  if (xpEarned > 0 && State.missedQuestions.length === 0) {
    (lesson.quiz || []).forEach(q => applyLearnedCodeProgress(q, true));
  }

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

function finishWeakReview() {
  const missed = State.missedQuestions.length;
  const content = $('#lesson-content');

  if (missed > 0) {
    content.innerHTML = `
      <div class="complete-screen review-retry-screen">
        <div class="complete-icon">↻</div>
        <div class="complete-title">Keep These Warm</div>
        <div class="complete-subtitle">${missed} weak spot${missed === 1 ? '' : 's'} need another pass.</div>
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
        <div class="complete-subtitle">${missed} question${missed === 1 ? '' : 's'} need another pass.</div>
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
        <div class="complete-subtitle">${missed} question${missed === 1 ? '' : 's'} need another pass.</div>
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
  const { done, total } = State.getTotalProgress();
  const trackComplete = total > 0 && done === total;
  const codeCount = getRefData().reduce((sum, category) => sum + category.codes.length, 0);

  const cards = [
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
      if (action === 'codes') {
        renderReference();
        showScreen('screen-reference');
      }
    });
  });
}

// ─── PROGRESS SCREEN ─────────────────────────────────────────
function renderProgress() {
  const units = getUnits();
  updateStaticText();
  $('#prog-total-xp').textContent = State.xp;
  $('#prog-streak').textContent = State.streak;
  renderMistakeBank();

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
