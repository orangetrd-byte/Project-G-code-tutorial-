'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const readJson = file => JSON.parse(read(file));

function loadAppRuntime() {
  const storage = new Map();
  const context = {
    console,
    Date,
    Math,
    Map,
    Set,
    localStorage: {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    }
  };
  vm.createContext(context);
  const appBeforeBoot = read('js/app.js').split("document.addEventListener('DOMContentLoaded'")[0];
  const expose = `globalThis.__testApi = {
    State,
    TRACKS,
    initConceptPools,
    createRetryNumberVariant,
    normalizeCodeAnswer,
    applyLearnedCodeProgress,
    getLearnedCodeCount,
    toggleLearnedCode,
    escapeLearnedCodeKey,
    queueCodesFromQuestion,
    toggleRoadmapMilestone: State.toggleRoadmapMilestone,
    ROADMAP,
    ROADMAP_LANES
  };`;
  vm.runInContext(`${read('data/lessons.js')}\n${appBeforeBoot}\n${expose}`, context);
  return { api: context.__testApi, storage };
}

function isCodeLearned(api, code, trackId = api.State.trackId) {
  return api.State.learnedCodeCodes.includes(api.escapeLearnedCodeKey(code, trackId));
}

function validateVersions() {
  const appMatch = read('js/app.js').match(/Build (\d{4}\.\d{2}\.\d{2}\.\d{2})/);
  const swMatch = read('sw.js').match(/const BUILD_VERSION = '(\d{4}\.\d{2}\.\d{2}\.\d{2})'/);
  assert.ok(appMatch, 'Visible MGP app build is missing');
  assert.ok(swMatch, 'Service-worker build is missing');
  assert.equal(appMatch[1], swMatch[1], 'App and service-worker builds must match');
  assert.match(read('js/app.js'), /MGP \| Version/, 'MGP must remain visible in version information');
  assert.match(read('css/style.css'), /body\.theme-light \.callout\.warning\s*\{\s*color:\s*#6F101A;/, 'Light warning callouts need dark readable text');
}

function validateActiveCorrection() {
  const app = read('js/app.js');
  assert.match(app, /function requireCorrectionAction/, 'Missed questions must lock the action button');
  assert.match(app, /function completeCorrection/, 'Corrected answers must explicitly unlock progression');
  assert.match(app, /q\.awaitingCorrection/, 'Quiz handlers must track active correction state');
  assert.match(app, /function resetMatchingForCorrection/, 'Matching misses must require a clean rematch');
}

function validateFactCheckContent() {
  const curriculum = read('data/lessons.js');
  const app = read('js/app.js');
  assert.doesNotMatch(curriculum, /G90 = absolute mode/, 'Lathe G90 must not be taught as a universal absolute mode');
  assert.doesNotMatch(curriculum, /Haas lathes use G98 and G99 for those modes/, 'Lathe feed modes must not be framed as a Haas-only brand split; mills use G94/G95');
  assert.match(curriculum, /G99 is feed per revolution on Haas\/Fanuc lathes/, 'Lathe feed-per-revolution must be taught as G99 (not a Fanuc-vs-Haas split)');
  assert.doesNotMatch(curriculum, /G00 ignores feedrate override/, 'Rapid override behavior must remain controller-specific');
  assert.doesNotMatch(curriculum, /Always leave 0\.050/, 'Fixed rapid clearances must not be labeled universally safe');
  assert.doesNotMatch(curriculum, /G02 cuts a concave/, 'Arc direction must not be equated with concavity');
  assert.doesNotMatch(curriculum, /tool offset \(stored in the wear offset page\)/i, 'Geometry and wear offsets must remain distinct');
  assert.doesNotMatch(curriculum, /Dry run tests motion/i, 'Dry Run must not be presented as motion-free verification');
  assert.doesNotMatch(curriculum, /Most offset mistakes come from/i, 'Unsupported incident rankings must not be taught as fact');
  assert.doesNotMatch(curriculum, /Most crashes happen during recovery/i, 'Unsupported crash rankings must not be taught as fact');
  assert.doesNotMatch(curriculum, /Fanuc-style two-block G76 example/, 'G76 must not mix an unsourced controller dialect into the Haas lesson');
  assert.doesNotMatch(curriculum, /G76 P010060 Q0050/, 'Packed two-block G76 syntax must not return to the Haas lesson');
  assert.match(curriculum, /G76 X0\.913 Z-0\.85 K0\.042 D0\.0115 F0\.0714/, 'The Haas G76 lesson must retain the official one-block example');
  assert.match(curriculum, /return move does not retrace the path used to jog away/, 'Recovery content must retain the documented Haas return-path warning');
  assert.match(curriculum, /With Haas Setting 36 enabled/, 'Recovery content must retain the controller-specific restart scan');
  assert.match(curriculum, /Dry Run still moves the machine and can execute programmed tool changes/, 'Dry Run movement and tool-change risk must remain explicit');
  assert.match(curriculum, /M83 ; relative extrusion mode/, 'Retraction examples must declare relative extrusion mode');
  assert.match(curriculum, /M109 S waits while heating/, 'Marlin temperature waits must distinguish S from R');
  assert.match(app, /function renderLessonFactCheck/, 'Learners must see curriculum audit status');
  assert.match(app, /fact-check-card--compact/, 'Lesson fact-check status must remain compact on mobile');
  assert.doesNotMatch(app, /fact-check-links/, 'Lesson theory must not render the full audit-source list');
  assert.match(app, /q\.visual \? `<div class="question-visual">/, 'Questions with required visual context must render it');
}

function validateGrammar() {
  const app = read('js/app.js');
  assert.doesNotMatch(app, /question\$\{missed === 1 \? '' : 's'\} need/, 'Dynamic question counts need singular/plural verb agreement');
  assert.doesNotMatch(app, /weak spot\$\{missed === 1 \? '' : 's'\} need/, 'Dynamic weak-spot counts need singular/plural verb agreement');
  assert.doesNotMatch(app, /G90", name: "Absolute Mode"/, 'Lathe fallback must not teach G90 as universal absolute mode');
  assert.doesNotMatch(app, /Required for threading, drilling, boring/, 'Constant RPM must remain process-specific');
  assert.doesNotMatch(app, /Always call before tool changes/, 'Spindle-stop procedure must remain machine-specific');
}

function validateReferences() {
  const directory = path.join(ROOT, 'data', 'reference');
  const fanucHaasNotes = read('data/reference/fanuc-vs-haas-notes.json');
  assert.doesNotMatch(fanucHaasNotes, /assignment is OPPOSITE|Haas lathes: G98 = feed per REVOLUTION/, 'Reference cards must not reverse Haas lathe G98/G99 meanings');
  assert.match(fanucHaasNotes, /Both use G98 = feed per MINUTE and G99 = feed per REVOLUTION/, 'Fanuc/Haas lathe feed-mode comparison must match the audited curriculum');
  fs.readdirSync(directory)
    .filter(file => file.endsWith('.json'))
    .forEach(file => JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')));

  const index = readJson('data/reference/index.json');
  index.files.forEach(entry => {
    const data = readJson(`data/reference/${entry.file}`);
    if (entry.file === 'metadata.json') return;
    assert.ok(Array.isArray(data.items), `${entry.file} must expose an items array`);
    assert.equal(entry.count, data.items.length, `${entry.file} index count is stale`);
  });

  const requiredGCodes = ['G00', 'G01', 'G02', 'G03', 'G20', 'G21', 'G28', 'G40', 'G54'];
  const gCodeItems = ['mill-g-codes.json', 'lathe-g-codes.json']
    .flatMap(file => readJson(`data/reference/${file}`).items);
  index.files
    .filter(entry => ['g_codes', 'm_codes'].includes(entry.type))
    .forEach(entry => {
      const data = readJson(`data/reference/${entry.file}`);
      data.items.forEach(item => {
        assert.match(item.source_url || '', /^https:\/\//, `${entry.file} ${item.code} needs an official source`);
        const host = new URL(item.source_url).hostname;
        if (entry.category === '3d_printing_marlin') {
          assert.equal(host, 'marlinfw.org', `${entry.file} ${item.code} must use official Marlin documentation`);
        } else {
          assert.equal(host, 'www.haascnc.com', `${entry.file} ${item.code} must use official Haas documentation`);
        }
        if (entry.category === 'cnc_milling') {
          assert.doesNotMatch(item.source_url, /machine%3Dlathe|lathe-operator-s-manual/, `${entry.file} ${item.code} links to lathe documentation`);
        }
        if (entry.category === 'cnc_turning') {
          assert.doesNotMatch(item.source_url, /machine%3Dmill|mill-operator-s-manual/, `${entry.file} ${item.code} links to mill documentation`);
        }
      });
    });

  const metadata = readJson('data/reference/metadata.json');
  assert.equal(metadata.reviewed, '2026-07-14', 'Reference package needs a current source-audit date');
  const blueprintSymbols = readJson('data/reference/blueprint-gdt-symbols.json').items;
  assert.ok(blueprintSymbols.some(item => item.symbol === '▱' && /Flatness/.test(item.meaning)), 'Flatness needs the parallelogram GD&T symbol');
  assert.ok(!blueprintSymbols.some(item => item.symbol === '⏤' && /Flatness/.test(item.meaning)), 'Straightness must not be labeled as flatness');

  ['blueprint-gdt-symbols.json', 'programming-symbols.json'].forEach(file => {
    readJson(`data/reference/${file}`).items.forEach(item => {
      assert.match(item.source_url || '', /^https:\/\//, `${file} ${item.symbol} needs an authoritative source`);
    });
  });

  readJson('data/reference/operation-sheet-symbols.json').items.forEach(item => {
    assert.match(item.notes || '', /Project example only/, `${item.symbol} must be labeled as a shop-defined example`);
  });

  requiredGCodes.forEach(code => {
    const matches = gCodeItems.filter(item => item.code === code);
    assert.ok(matches.length, `Missing beginner reference ${code}`);
    matches.forEach(item => assert.match(item.source_url || '', /^https:\/\//, `${code} needs an official source`));
  });

  const m30 = readJson('data/reference/mill-m-codes.json').items.find(item => item.code === 'M30');
  assert.match(m30?.source_url || '', /^https:\/\//, 'M30 needs an official source');
}

function validateCurriculum(api) {
  api.initConceptPools();
  const firstCncLesson = api.TRACKS.cnc.lessons.find(lesson => lesson.id === 'u1-l1');
  const latheAxesLesson = api.TRACKS.cnc.lessons.find(lesson => lesson.id === 'u1-l2');
  const illustratedAxesQuestion = latheAxesLesson?.quiz.find(question => question.id === 'u1-l2-q5');
  assert.ok(firstCncLesson.quiz.some(question => question.id === 'u1-l1-q8'), 'Beginner context questions must load from curriculum data');
  assert.equal(illustratedAxesQuestion?.visual, 'lathe-axes', 'Questions that reference the lathe setup must display its diagram');
  assert.doesNotMatch(read('index.html'), /const updateQuestion\s*=/, 'Curriculum patches do not belong in index.html');
  api.TRACKS.cnc.lessons.slice(0, 9).forEach(lesson => {
    assert.ok(String(lesson.why || '').trim(), `${lesson.id} must explain why the concept matters before teaching syntax`);
  });
  assert.match(read('js/app.js'), /\$\{whyBlock\}\s*<div class="theory-body">/, 'Why-this-matters content must render before lesson theory');

  const lessonIds = new Set();
  const questionIds = new Set();
  const validTypes = new Set(['multiple-choice', 'true-false', 'fill-blank', 'matching']);

  Object.entries(api.TRACKS).forEach(([trackId, track]) => {
    track.lessons.forEach(lesson => {
      const lessonKey = `${trackId}:${lesson.id}`;
      assert.ok(lesson.id && !lessonIds.has(lessonKey), `Duplicate lesson ${lessonKey}`);
      lessonIds.add(lessonKey);
      assert.ok(Array.isArray(lesson.quiz) && lesson.quiz.length, `${lesson.id} needs quiz questions`);
      const expectedReviewDate = ['u10-l1', 'u11-l1'].includes(lesson.id)
        ? '2026-07-20'
        : ['u4-l1', 'u4-l2', 'u5-l1', 'u5-l2', 'u5-l3', 'u6-l1', 'u6-l2', 'u6-l3', 'u7-l1', 'u8-l1', 'u9-l1'].includes(lesson.id)
          ? '2026-07-16'
          : '2026-07-13';
      assert.equal(lesson.factCheck?.reviewed, expectedReviewDate, `${lesson.id} needs a current fact-check date`);
      assert.ok(String(lesson.factCheck?.dialect || '').trim(), `${lesson.id} needs a controller or firmware scope`);
      assert.ok(Array.isArray(lesson.factCheck?.sources) && lesson.factCheck.sources.length >= 3, `${lesson.id} needs primary source coverage`);
      // Regression: every CNC lesson (id matches uN-lM, not printing p-uN-lM) must have a visible why-before-how.
      if (/^u\d+-l\d+$/.test(lesson.id)) {
        assert.ok(String(lesson.why || '').trim(), `${lesson.id} needs a visible 'why' before the how`);
      }
      lesson.factCheck.sources.forEach(source => {
        assert.match(source.url || '', /^https:\/\//, `${lesson.id} has an invalid audit source`);
      });

      lesson.quiz.forEach(question => {
        assert.ok(question.id && !questionIds.has(question.id), `Duplicate or missing question id ${question.id}`);
        questionIds.add(question.id);
        assert.ok(validTypes.has(question.type), `${question.id} has unsupported type ${question.type}`);
        assert.ok(String(question.question || '').trim(), `${question.id} needs a prompt`);
        assert.ok(String(question.explanation || '').trim(), `${question.id} needs an explanation`);

        if (question.type === 'multiple-choice') {
          assert.ok(Array.isArray(question.options) && question.options.length >= 2, `${question.id} needs choices`);
          assert.ok(Number.isInteger(question.answer), `${question.id} needs a numeric choice answer`);
          assert.ok(question.answer >= 0 && question.answer < question.options.length, `${question.id} answer is out of range`);
        }
        if (question.type === 'true-false') assert.equal(typeof question.answer, 'boolean', `${question.id} needs a boolean answer`);
        if (question.type === 'fill-blank') assert.equal(typeof question.answer, 'string', `${question.id} needs a text answer`);
        if (question.type === 'matching') {
          assert.ok(Array.isArray(question.pairs) && question.pairs.length >= 2, `${question.id} needs matching pairs`);
          question.pairs.forEach(pair => assert.ok(pair.left && pair.right, `${question.id} has an incomplete pair`));
        }
      });
    });
  });
}

function validateStateAndRetries(api, storage) {
  storage.set('pgct_state_v2', JSON.stringify({ trackId: 'invalid-track', profiles: { 'invalid-track': { xp: 999 } } }));
  api.State.load();
  assert.equal(api.State.trackId, 'cnc', 'Invalid saved tracks must fall back to CNC');
  assert.equal(api.State.xp, 0, 'Invalid track profiles must not leak into CNC progress');

  const firstLesson = api.TRACKS.cnc.lessons[0];
  api.State.completedLessons = [firstLesson.id, 'removed-lesson'];
  assert.deepEqual({ ...api.State.getTotalProgress() }, { done: 1, total: api.TRACKS.cnc.lessons.length });

  assert.equal(api.normalizeCodeAnswer('g0'), 'G00');
  assert.equal(api.normalizeCodeAnswer('m3'), 'M03');

  const arithmetic = api.TRACKS.cnc.lessons.find(lesson => lesson.id === 'u5-l1').quiz
    .find(question => question.answer === '0.0050');
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const retry = api.createRetryNumberVariant(arithmetic, arithmetic);
    assert.equal(retry.answer, arithmetic.answer, 'Hidden arithmetic answers must not be randomized');
    assert.equal(retry.question, arithmetic.question, 'Arithmetic prompt must stay consistent with its answer');
  }

  const coordinate = api.TRACKS.cnc.lessons.find(lesson => lesson.id === 'u2-l1').quiz
    .find(question => question.answer === '2.500');
  const retries = Array.from({ length: 25 }, () => api.createRetryNumberVariant(coordinate, coordinate));
  assert.ok(retries.some(retry => retry.answer !== coordinate.answer), 'Visible coordinate retries should eventually vary');
  retries.forEach(retry => {
    assert.ok(retry.question.includes(retry.answer), 'Varied coordinate answer must appear in its prompt');
  });
}

function isCodeLearned(api, code, trackId = api.State.trackId) {
  return api.State.learnedCodeCodes.includes(api.escapeLearnedCodeKey(code, trackId));
}

function validateLearnedCodeAutoUnlock(api) {
  api.initConceptPools();
  const codeRe = /\b(G|M)\d{1,3}\b/i;
  let covered = 0;
  let gaps = 0;
  Object.entries(api.TRACKS).forEach(([trackId, track]) => {
    track.lessons.forEach(lesson => {
      lesson.quiz.forEach(question => {
        if (question.type !== 'multiple-choice' && question.type !== 'fill-blank') return;
        const teaches = codeRe.test(`${question.question} ${question.explanation}`);
        if (!teaches) return; // only code-bearing questions must auto-unlock
        const unlocked = api.queueCodesFromQuestion(question);
        if (unlocked.length === 0) {
          gaps += 1;
          console.error(`  code gap: ${trackId}/${lesson.id}/${question.id}`);
        } else {
          covered += 1;
        }
      });
    });
  });
  assert.ok(covered > 0, 'At least some code-bearing questions should auto-unlock');
  assert.equal(gaps, 0, `Every code-bearing question must unlock a code (gaps=${gaps})`);
}

function validateLearnedCodeLifecycle(api, storage) {
  api.initConceptPools();
  api.State.trackId = 'cnc';
  api.State.learnedCodeCodes = [];
  api.State.save();

  // Manual marking (toggleLearnedCode) persists a track-scoped key.
  api.State.trackId = 'cnc';
  api.toggleLearnedCode('G54');
  assert.ok(isCodeLearned(api, 'G54'), 'Manually marked CNC code should be learned');
  assert.ok(api.State.learnedCodeCodes.includes('cnc::G54'), 'CNC learned code must be stored track-scoped');
  assert.equal(api.getLearnedCodeCount('cnc'), 1, 'CNC learned-code count should be 1 after marking');

  // Track separation: a CNC code must NOT appear under the printing track.
  api.State.trackId = 'printing';
  assert.equal(api.getLearnedCodeCount('printing'), 0, 'Printing count must stay separate from CNC');
  assert.ok(!isCodeLearned(api, 'G54'), 'CNC G54 must not be learned under the printing track');
  api.toggleLearnedCode('G1');
  assert.ok(isCodeLearned(api, 'G1'), 'Manually marked printing code should be learned');
  assert.ok(api.State.learnedCodeCodes.includes('printing::G1'), 'Printing learned code must be stored track-scoped');
  assert.equal(api.getLearnedCodeCount('cnc'), 1, 'CNC count must remain unchanged after printing edit');
  assert.equal(api.getLearnedCodeCount('printing'), 1, 'Printing learned-code count should be 1');

  // Persistence: reload State from the same localStorage and confirm codes survive.
  const saved = storage.get('pgct_state_v2');
  assert.ok(saved && saved.includes('cnc::G54') && saved.includes('printing::G1'), 'Learned codes must persist to storage');
  api.State.load();
  assert.ok(api.State.learnedCodeCodes.includes('cnc::G54'), 'CNC G54 must survive a state reload');
  assert.ok(api.State.learnedCodeCodes.includes('printing::G1'), 'Printing G1 must survive a state reload');

  // Automatic unlocking: answering a code-bearing question correctly queues its code.
  api.State.trackId = 'cnc';
  api.State.learnedCodeCodes = []; // isolate the auto-unlock phase from the manual marks above
  api.State.save();
  const g54Question = api.TRACKS.cnc.lessons
    .flatMap(l => l.quiz)
    .find(q => q.type === 'multiple-choice' && api.queueCodesFromQuestion(q).includes('G54'));
  assert.ok(g54Question, 'A CNC question that unlocks G54 must exist');
  const before = api.getLearnedCodeCount('cnc');
  api.applyLearnedCodeProgress(g54Question, true);
  assert.ok(api.getLearnedCodeCount('cnc') > before, 'Correct answer must increase learned-code count');
  assert.ok(isCodeLearned(api, 'G54'), 'Auto-unlock must learn G54 after a correct answer');

  // Wrong answers must NOT unlock codes.
  const beforeWrong = api.getLearnedCodeCount('cnc');
  api.applyLearnedCodeProgress(g54Question, false);
  assert.equal(api.getLearnedCodeCount('cnc'), beforeWrong, 'Incorrect answers must not unlock codes');

  // Reset clears all learned codes (the app reset is global).
  api.State.trackId = 'cnc';
  api.State.resetAllData();
  assert.equal(api.getLearnedCodeCount('cnc'), 0, 'Reset must clear CNC learned codes');
  assert.equal(api.getLearnedCodeCount('printing'), 0, 'Reset must clear all track learned codes');
}

function validateRoadmap(api, storage) {
  api.initConceptPools();
  api.State.trackId = 'cnc';
  api.State.roadmap = {};
  api.State.save();

  // Toggling a milestone persists it under the active track profile.
  api.State.toggleRoadmapMilestone('p1-a', true);
  assert.ok(api.State.roadmap['p1-a'], 'Toggled milestone must be recorded on State');
  assert.ok(api.State.activeProfile().roadmap['p1-a'], 'Milestone must persist in the active profile');

  // It survives a localStorage reload (persistence).
  const saved = storage.get('pgct_state_v2');
  assert.ok(saved && saved.includes('"roadmap"') && saved.includes('p1-a'), 'Roadmap must persist to storage');
  api.State.load();
  assert.ok(api.State.roadmap['p1-a'], 'Milestone must survive a state reload');

  // Unchecking removes it.
  api.State.toggleRoadmapMilestone('p1-a', false);
  assert.ok(!api.State.roadmap['p1-a'], 'Unchecking must remove the milestone');
  assert.ok(!api.State.activeProfile().roadmap['p1-a'], 'Removal must reflect in the active profile');

  // Roadmap constant must define all five phases with milestones and side-income lanes.
  assert.ok(Array.isArray(api.ROADMAP) && api.ROADMAP.length === 5, 'ROADMAP must define 5 phases');
  const milestoneCount = api.ROADMAP.reduce((n, ph) => n + ph.milestones.length, 0);
  assert.ok(milestoneCount > 0, 'ROADMAP phases must each carry milestones');
  assert.ok(Array.isArray(api.ROADMAP_LANES) && api.ROADMAP_LANES.length === 3, 'ROADMAP_LANES must define 3 side-income lanes');
}

const runtime = loadAppRuntime();
validateVersions();
validateReferences();
validateActiveCorrection();
validateGrammar();
validateFactCheckContent();
validateCurriculum(runtime.api);
validateStateAndRetries(runtime.api, runtime.storage);
validateLearnedCodeAutoUnlock(runtime.api);
validateLearnedCodeLifecycle(runtime.api, runtime.storage);
validateRoadmap(runtime.api, runtime.storage);
console.log('Project G-Code validation passed.');
