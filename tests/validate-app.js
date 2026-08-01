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
    isReferenceCodeLearned,
    queueCodesFromQuestion,
    pickLessonQuestions,
    buildUnitReviewQuestions,
    buildTrackReviewQuestions,
    buildDailyMissionQuestions,
    buildTodaysLineQuestion,
    getTodaysLineCandidates,
    TODAYS_LINE_CATALOG,
    startTodaysLine,
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

function validateTodaysLine(api, storage) {
  api.initConceptPools();
  Object.entries(api.TODAYS_LINE_CATALOG).forEach(([trackId, entries]) => {
    assert.ok(entries.length > 0, `${trackId} needs Today’s Line entries`);
    const track = api.TRACKS[trackId];
    entries.forEach(entry => {
      const lesson = track.lessons.find(item => item.id === entry.lessonId);
      assert.ok(lesson, `${trackId} Today’s Line references missing lesson ${entry.lessonId}`);
      assert.ok(lesson.theory.includes(entry.line), `${entry.line} must already appear in ${entry.lessonId}`);
      assert.match(entry.line, /^(G|M)\d+\b/, `${entry.line} must be one executable G-code line`);
      assert.ok(String(entry.prompt).trim() && String(entry.explanation).trim(), `${entry.lessonId} needs a recall prompt and explanation`);
    });
  });

  api.State.resetAllData();
  assert.equal(api.buildTodaysLineQuestion(), null, 'Today’s Line must stay locked before a lesson is completed');

  api.State.trackId = 'cnc';
  api.State.completedLessons = ['u1-l1'];
  const cncQuestion = api.buildTodaysLineQuestion();
  assert.equal(cncQuestion.type, 'fill-blank', 'Today’s Line must use free recall instead of answer choices');
  assert.equal(cncQuestion.sourceLessonId, 'u1-l1', 'Today’s Line must use completed material only');
  assert.equal(api.getTodaysLineCandidates().length, 1, 'Only completed CNC lessons may enter Today’s Line');
  assert.equal(api.buildTodaysLineQuestion().answer, cncQuestion.answer, 'Today’s Line must remain stable during the day');

  const xpBefore = api.State.xp;
  assert.equal(api.State.completeTodaysLine(), true, 'First Today’s Line completion should be recorded');
  assert.equal(api.State.completeTodaysLine(), false, 'Repeat completion should not create another daily record');
  assert.equal(api.State.xp, xpBefore, 'Today’s Line must not change XP or the reward system');
  assert.ok(storage.get('pgct_state_v2').includes('todaysLineCompletions'), 'Today’s Line completion must persist');

  api.State.switchTrack('printing');
  assert.equal(api.buildTodaysLineQuestion(), null, 'CNC completion must not unlock a printing line');
  api.State.completedLessons = ['p-u1-l1'];
  const printingQuestion = api.buildTodaysLineQuestion();
  assert.equal(printingQuestion.sourceLessonId, 'p-u1-l1', 'Printing Today’s Line must use printing material');
  assert.notEqual(printingQuestion.answer, cncQuestion.answer, 'Track-specific Today’s Line content must stay separated');
}

function validateLessonAndReviewBuilders(api) {
  api.State.resetAllData();
  api.State.trackId = 'cnc';
  const firstLesson = api.TRACKS.cnc.lessons[0];
  const lessonQuestions = api.pickLessonQuestions(firstLesson, 5);
  assert.equal(lessonQuestions.length, Math.min(5, firstLesson.quiz.length), 'Lesson practice must retain its five-question cap');
  lessonQuestions.forEach(question => {
    assert.ok(question.id && firstLesson.quiz.some(source => source.id === question.originalQuestionId || source.id === question.id), 'Lesson practice question must come from its lesson');
  });

  const unitQuestions = api.buildUnitReviewQuestions(firstLesson.unit);
  assert.ok(unitQuestions.length > 0 && unitQuestions.length <= 10, 'Unit quiz must remain bounded');
  assert.ok(unitQuestions.every(question => question.sourceUnit === firstLesson.unit), 'Unit quiz must stay inside its unit');

  api.State.completedLessons = [firstLesson.id];
  const dailyQuestions = api.buildDailyMissionQuestions();
  assert.ok(dailyQuestions.length > 0 && dailyQuestions.length <= 5, 'Daily review must remain a short completed-lesson review');
  assert.ok(dailyQuestions.every(question => question.sourceLessonId === firstLesson.id), 'Daily review must use completed lessons');

  const weakQuestion = firstLesson.quiz[0];
  api.State.trackWeakQuestion(weakQuestion, firstLesson);
  assert.equal(api.State.weakQuestions.length, 1, 'Weak review must retain a missed question');
  assert.equal(api.State.weakQuestions[0].question.sourceLessonId, firstLesson.id, 'Weak review must retain lesson context');

  api.State.completedLessons = api.TRACKS.cnc.lessons.map(lesson => lesson.id);
  const mixedQuestions = api.buildTrackReviewQuestions();
  assert.equal(mixedQuestions.length, 12, 'Mixed review must retain its 12-question cap');
  assert.ok(new Set(mixedQuestions.map(question => question.sourceUnit)).size > 1, 'Mixed review must span multiple units');

  const matchingQuestion = api.TRACKS.cnc.lessons
    .flatMap(lesson => lesson.quiz)
    .find(question => question.type === 'matching');
  assert.ok(matchingQuestion?.pairs.length >= 2, 'Matching review must retain complete pairs');
  assert.equal(new Set(matchingQuestion.pairs.map(pair => pair.left)).size, matchingQuestion.pairs.length, 'Matching left-side prompts must stay distinct');
  api.State.resetAllData();

  api.State.resetAllData();
  api.State.trackId = 'printing';
  const printingLesson = api.TRACKS.printing.lessons[0];
  const printingLessonQuestions = api.pickLessonQuestions(printingLesson, 5);
  assert.equal(printingLessonQuestions.length, Math.min(5, printingLesson.quiz.length), 'Printing lesson practice must retain its five-question cap');
  assert.ok(printingLessonQuestions.every(question => printingLesson.quiz.some(source => source.id === question.originalQuestionId || source.id === question.id)), 'Printing lesson practice must use its own lesson bank');

  const printingUnitQuestions = api.buildUnitReviewQuestions(printingLesson.unit);
  assert.ok(printingUnitQuestions.length > 0 && printingUnitQuestions.length <= 10, 'Printing unit review must remain bounded');
  assert.ok(printingUnitQuestions.every(question => question.sourceUnit === printingLesson.unit), 'Printing unit review must stay inside its unit');
  assert.ok(printingUnitQuestions.every(question => String(question.sourceLessonId).startsWith('p-')), 'Printing unit review must not include CNC questions');

  api.State.completedLessons = [printingLesson.id];
  const printingDailyQuestions = api.buildDailyMissionQuestions();
  assert.ok(printingDailyQuestions.length > 0 && printingDailyQuestions.length <= 5, 'Printing daily review must remain short');
  assert.ok(printingDailyQuestions.every(question => question.sourceLessonId === printingLesson.id), 'Printing daily review must use completed printing lessons only');

  const printingWeakQuestion = printingLesson.quiz[0];
  api.State.trackWeakQuestion(printingWeakQuestion, printingLesson);
  assert.equal(api.State.weakQuestions.length, 1, 'Printing weak review must retain a missed question');
  assert.equal(api.State.weakQuestions[0].question.sourceLessonId, printingLesson.id, 'Printing weak review must retain printing lesson context');

  api.State.completedLessons = api.TRACKS.printing.lessons.map(lesson => lesson.id);
  const printingMixedQuestions = api.buildTrackReviewQuestions();
  assert.equal(printingMixedQuestions.length, 12, 'Printing mixed review must retain its 12-question cap');
  assert.ok(printingMixedQuestions.every(question => String(question.sourceLessonId).startsWith('p-')), 'Printing mixed review must not include CNC questions');
  assert.ok(new Set(printingMixedQuestions.map(question => question.sourceUnit)).size > 1, 'Printing mixed review must span multiple units');

  const printingMatchingQuestion = api.TRACKS.printing.lessons
    .flatMap(lesson => lesson.quiz)
    .find(question => question.type === 'matching');
  assert.ok(printingMatchingQuestion?.pairs.length >= 2, 'Printing matching review must retain complete pairs');
  assert.equal(new Set(printingMatchingQuestion.pairs.map(pair => pair.left)).size, printingMatchingQuestion.pairs.length, 'Printing matching prompts must stay distinct');
}

function validateRegressionSurfaces() {
  const app = read('js/app.js');
  const css = read('css/style.css');
  const sw = read('sw.js');
  assert.match(app, /State\.currentMode === 'lesson'/, 'Lesson mode regression guard is missing');
  assert.match(app, /State\.currentMode === 'weak-review'/, 'Weak-review mode regression guard is missing');
  assert.match(app, /State\.currentMode === 'track-review'/, 'Mixed-review mode regression guard is missing');
  assert.match(app, /function checkMatching\(q\)/, 'Matching behavior must remain wired');
  assert.match(sw, /'\.\/index\.html'/, 'Offline cache must retain the app shell');
  assert.match(sw, /'\.\/js\/app\.js'/, 'Offline cache must retain app logic');
  assert.match(sw, /'\.\/data\/lessons\.js'/, 'Offline cache must retain curriculum data');
  const precacheBlock = sw.match(/const PRECACHE_ASSETS = \[([\s\S]*?)\]/)?.[1] || '';
  const precacheAssets = [...precacheBlock.matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.ok(precacheAssets.length > 0, 'Offline precache list must not be empty');
  precacheAssets.filter(asset => !asset.startsWith('http')).forEach(asset => {
    const relativePath = asset === './' ? '.' : asset.replace(/^\.\//, '');
    assert.ok(fs.existsSync(path.join(ROOT, relativePath)), `Offline precache asset is missing: ${asset}`);
  });
  assert.match(css, /\.practice-scroll[\s\S]*?safe-area-inset-bottom/, 'Practice cards need bottom safe-area clearance');
  assert.match(css, /\.fill-blank-input[\s\S]*?max-width:\s*calc\(100vw - 2rem\)/, 'Recall input must fit narrow mobile screens');
  assert.match(css, /@media\s*\(max-width:\s*\d+px\)/, 'Mobile layout regression rules must remain present');
  assert.match(read('index.html'), /name="viewport"/, 'Mobile viewport configuration must remain present');
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
  assert.doesNotMatch(curriculum, /SET_EXTRUDE_FACTOR/, 'Printing lessons must retain the documented M221 flow command');
  assert.doesNotMatch(curriculum, /native Klipper bed mesh|Klipper macro-style command/, 'Klipper bed-mesh commands must retain configuration scope');
  assert.match(curriculum, /BED_MESH_CALIBRATE is available only when \[bed_mesh\] is configured/, 'Klipper bed-mesh guidance must name the required configuration section');
  assert.doesNotMatch(curriculum, /G1 X0 Y220|Complete a 10 mm lift|Which line primes filament/, 'Printing lessons must not teach machine- or mode-dependent moves as universal');
  assert.match(curriculum, /M83 ; temporarily use relative extrusion[\s\S]*M82 ; restore the surrounding file's absolute extrusion mode/, 'The purge example must establish and restore extrusion mode');
  assert.match(curriculum, /well-ventilated room while preventing drafts around the print/, 'ABS guidance must retain ventilation and draft safety');
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
  assert.doesNotMatch(app, /Choose Settings To Begin Learning|Sharpen the shop skills|Wrap it again anytime|Nice run\. Keep the setup moving|Not quite — see explanation|Correction locked in|Confidence saved/, 'Awkward or incomplete UI copy must not return');
  assert.doesNotMatch(app, /\$\{State\.streak\} day<\/strong>/, 'Streak labels need singular/plural agreement');
  assert.match(app, /Práctica/, 'Spanish navigation needs correct accents');
  assert.match(app, /Español/, 'Spanish language labels need correct accents');
  assert.match(app, /¿Quieres restablecer todos los datos\?/, 'Spanish confirmation questions need opening punctuation');
  assert.doesNotMatch(app, /Own this and you stop being the last choice|Your stated strength\. Make it deliberate|The literal \"code angles\" goal|MILESTONE, not the start|Once Phase 5 lands, real parts/, 'Roadmap fragments and discouraging copy must not return');
  assert.doesNotMatch(app, /milestones complete<\/div>|codes marked learned<\/div>|lessons complete<\/div>/, 'Progress summaries need complete sentence structure');
}

function validateReferences() {
  const directory = path.join(ROOT, 'data', 'reference');
  const fanucHaasNotes = read('data/reference/fanuc-vs-haas-notes.json');
  assert.doesNotMatch(fanucHaasNotes, /assignment is OPPOSITE|Haas lathes: G98 = feed per REVOLUTION/, 'Reference cards must not reverse Haas lathe G98/G99 meanings');
  assert.match(fanucHaasNotes, /Both use G98 for feed per minute and G99 for feed per revolution/, 'Fanuc/Haas lathe feed-mode comparison must match the audited curriculum');
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
  const requiredPrintingCodes = ['G0/G1', 'G28', 'G29', 'G90', 'G91', 'G92', 'M0', 'M25', 'M82', 'M83', 'M84', 'M104', 'M106', 'M107', 'M109', 'M140', 'M190', 'M221', 'M486', 'M600', 'T0', 'T1'];
  const printingCodeItems = ['marlin-3d-printer-g-codes.json', 'marlin-3d-printer-m-codes.json', 'marlin-3d-printer-t-codes.json']
    .flatMap(file => readJson(`data/reference/${file}`).items);
  index.files
    .filter(entry => ['g_codes', 'm_codes', 't_codes'].includes(entry.type))
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
  assert.equal(metadata.reviewed, '2026-07-31', 'Reference package needs a current source-audit date');
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
    assert.match(item.usage || '', /[.!?]$/, `${item.symbol} usage guidance must be a complete sentence`);
  });

  const referenceProse = index.files
    .filter(entry => entry.file !== 'metadata.json')
    .flatMap(entry => readJson(`data/reference/${entry.file}`).items || [])
    .flatMap(item => [item.usage, item.notes].filter(Boolean));
  referenceProse.forEach(text => {
    assert.doesNotMatch(text, /\b(?:per-min|per-rev|incl\.)\b|axis\(es\)|before\/while|offset\s*\/\s*parameter/i, `Reference prose contains avoidable shorthand: ${text}`);
  });
  assert.doesNotMatch(fanucHaasNotes, /\b(?:YOUR|NOT|BUILDER-DEFINED|PARAMETER FORMAT|MINUTE|REVOLUTION)\b/, 'Comparison notes must not use all caps for emphasis');

  requiredGCodes.forEach(code => {
    const matches = gCodeItems.filter(item => item.code === code);
    assert.ok(matches.length, `Missing beginner reference ${code}`);
    matches.forEach(item => assert.match(item.source_url || '', /^https:\/\//, `${code} needs an official source`));
  });
  requiredPrintingCodes.forEach(code => {
    const match = printingCodeItems.find(item => item.code === code);
    assert.match(match?.source_url || '', /^https:\/\/marlinfw\.org\//, `Missing official Marlin reference ${code}`);
  });

  const m30 = readJson('data/reference/mill-m-codes.json').items.find(item => item.code === 'M30');
  assert.match(m30?.source_url || '', /^https:\/\//, 'M30 needs an official source');
}

function validateCurriculum(api) {
  api.initConceptPools();
  const firstCncLesson = api.TRACKS.cnc.lessons.find(lesson => lesson.id === 'u1-l1');
  const latheAxesLesson = api.TRACKS.cnc.lessons.find(lesson => lesson.id === 'u1-l2');
  const illustratedAxesQuestion = latheAxesLesson?.quiz.find(question => question.id === 'u1-l2-q5');
  const modalContextQuestion = firstCncLesson?.quiz.find(question => question.id === 'u1-l1-q8');
  assert.ok(modalContextQuestion, 'Beginner context questions must load from curriculum data');
  assert.match(modalContextQuestion.question, /without the lines that come before it/, 'Coordinate-only questions must state that surrounding modal context is unavailable');
  assert.match(modalContextQuestion.explanation, /motion mode set on an earlier line/, 'Coordinate-only explanations must teach modal carryover');
  assert.doesNotMatch(modalContextQuestion.question, /weak beginner code|What is missing from this code/i, 'Ambiguous beginner wording must not return');
  assert.equal(illustratedAxesQuestion?.visual, 'lathe-axes', 'Questions that reference the lathe setup must display its diagram');
  assert.doesNotMatch(read('index.html'), /const updateQuestion\s*=/, 'Curriculum patches do not belong in index.html');
  api.TRACKS.cnc.lessons.slice(0, 9).forEach(lesson => {
    assert.ok(String(lesson.why || '').trim(), `${lesson.id} must explain why the concept matters before teaching syntax`);
  });
  api.TRACKS.printing.lessons.forEach(lesson => {
    assert.ok(String(lesson.why || '').trim(), `${lesson.id} must explain why the concept matters before teaching syntax`);
  });
  assert.match(read('js/app.js'), /\$\{whyBlock\}\s*<div class="theory-body">/, 'Why-this-matters content must render before lesson theory');
  const printingReferenceCodes = new Set(
    ['marlin-3d-printer-g-codes.json', 'marlin-3d-printer-m-codes.json', 'marlin-3d-printer-t-codes.json']
      .flatMap(file => readJson(`data/reference/${file}`).items)
      .flatMap(item => String(item.code).match(/\b(?:G|M|T)\d+\b/g) || [])
  );
  const learnablePrintingCodes = new Set(api.TRACKS.printing.lessons
    .flatMap(lesson => lesson.quiz)
    .flatMap(question => api.queueCodesFromQuestion(question)));
  assert.ok(learnablePrintingCodes.size > 0, 'Printing curriculum must expose learnable codes');
  learnablePrintingCodes.forEach(code => assert.ok(printingReferenceCodes.has(code), `Printing Code Bank is missing learnable code ${code}`));
  const printingPauseLesson = api.TRACKS.printing.lessons.find(lesson => lesson.id === 'p-u9-l1');
  const printingPauseCopy = `${printingPauseLesson?.theory || ''} ${(printingPauseLesson?.quiz || []).map(question => `${question.question} ${question.explanation}`).join(' ')}`;
  assert.match(printingPauseCopy, /M0 requests an unconditional stop/, 'The Marlin M0 lesson must teach its documented stop behavior');
  assert.doesNotMatch(printingPauseCopy, /M0 mean on some printers|common pause command, but support varies/, 'Vague M0 wording must not return');
  const printingFoundations = api.TRACKS.printing.lessons.slice(0, 3).map(lesson => lesson.theory).join(' ');
  assert.match(printingFoundations, /A slicer is software that converts a 3D model/, 'Printing foundations must define slicer');
  assert.match(printingFoundations, /An endstop is a switch or sensor/, 'Printing foundations must define endstop');
  assert.match(printingFoundations, /A bed mesh is a map of small height differences/, 'Printing foundations must define bed mesh');
  assert.match(printingFoundations, /The hotend is the heated assembly that melts filament/, 'Printing foundations must define hotend');
  assert.doesNotMatch(printingFoundations, /knowing the blocks/, 'Printing foundations must use beginner-friendly wording');
  assert.doesNotMatch(JSON.stringify(api.TRACKS.printing.lessons[0].quiz), /More E value means/, 'Extrusion guidance must respect absolute and relative modes');
  const printingMotionTheory = api.TRACKS.printing.lessons.filter(lesson => lesson.unit === 2).map(lesson => lesson.theory).join(' ');
  assert.match(printingMotionTheory, /Extrusion means pushing filament through the nozzle/, 'Printing motion must define extrusion');
  assert.match(printingMotionTheory, /A travel move changes the nozzle's position without intentionally depositing filament/, 'Printing motion must define travel move');
  assert.match(printingMotionTheory, /Extrusion mode tells the printer how to interpret E values/, 'Printing motion must define extrusion mode');
  assert.match(printingMotionTheory, /A bridge spans an open gap.*An overhang extends outward/s, 'Printing cooling must define bridges and overhangs');
  const printingUnitThree = api.TRACKS.printing.lessons.filter(lesson => lesson.unit === 3);
  const printingUnitThreeTheory = printingUnitThree.map(lesson => lesson.theory).join(' ');
  const printingUnitThreeCopy = printingUnitThree.map(lesson => lesson.theory + ' ' + lesson.quiz.map(question => question.question + ' ' + question.explanation).join(' ')).join(' ');
  assert.match(printingUnitThreeTheory, /Start G-code is the group of commands/, 'Printing Unit 3 must define start G-code');
  assert.match(printingUnitThreeTheory, /Priming means pushing a small amount of\s+filament/, 'Printing Unit 3 must define priming');
  assert.match(printingUnitThreeTheory, /A target temperature is the temperature/, 'Printing Unit 3 must define target temperature');
  assert.match(printingUnitThreeTheory, /End G-code is the group of commands/, 'Printing Unit 3 must define end G-code');
  assert.match(printingUnitThreeTheory, /Stepper motors move and hold/, 'Printing Unit 3 must define stepper motors');
  assert.match(printingUnitThreeTheory, /Coordinate mode tells the printer/, 'Printing Unit 3 must define coordinate mode');
  assert.match(printingUnitThreeTheory, /A toolpath is the route/, 'Printing Unit 3 must define toolpath');
  assert.match(printingUnitThreeTheory, /comments—notes for people reading the file/, 'Printing Unit 3 must define comments');
  assert.match(printingUnitThreeCopy, /Whether its E value deposits filament depends on the active extrusion mode and current E position/, 'Printing Unit 3 must keep executable motion separate from mode-dependent extrusion');
  assert.doesNotMatch(printingUnitThreeCopy, /G1 with X\/Y\/E\/F is an executable motion\/extrusion line/, 'Printing Unit 3 must not treat every E word as universal extrusion');
  const printingUnitFour = api.TRACKS.printing.lessons.filter(lesson => lesson.unit === 4);
  const printingUnitFourTheory = printingUnitFour.map(lesson => lesson.theory).join(' ');
  const printingUnitFourCopy = printingUnitFour.map(lesson => lesson.theory + ' ' + lesson.quiz.map(question => question.question + ' ' + question.explanation).join(' ')).join(' ');
  assert.match(printingUnitFourTheory, /Bed adhesion means how well/, 'Printing Unit 4 must define bed adhesion');
  assert.match(printingUnitFourTheory, /The Z offset is the configured difference/, 'Printing Unit 4 must define Z offset');
  assert.match(printingUnitFourTheory, /Under-extrusion means too little material.*over-extrusion means too much/s, 'Printing Unit 4 must define under- and over-extrusion');
  assert.match(printingUnitFourTheory, /An extrusion-factor override scales commanded E movement/, 'Printing Unit 4 must define extrusion-factor override');
  assert.match(printingUnitFourTheory, /M83[\s\S]*G1 X100 E0\.5/, 'Printing Unit 4 flow example must declare relative extrusion mode');
  assert.doesNotMatch(printingUnitFourCopy, /Complete a safe first-layer height move|G1 X100 E5\.0/, 'Printing Unit 4 must not teach unscoped first-layer or extrusion moves');
  const printingUnitFive = api.TRACKS.printing.lessons.find(lesson => lesson.unit === 5);
  const printingUnitFiveCopy = (printingUnitFive?.theory || '') + ' ' + (printingUnitFive?.quiz.map(question => question.question + ' ' + question.explanation).join(' ') || '');
  assert.match(printingUnitFiveCopy, /A material profile is a saved group/, 'Printing Unit 5 must define material profile');
  assert.match(printingUnitFiveCopy, /Part cooling is airflow aimed at newly deposited plastic/, 'Printing Unit 5 must define part cooling');
  assert.match(printingUnitFiveCopy, /An enclosure is a cabinet or cover/, 'Printing Unit 5 must define enclosure');
  assert.match(printingUnitFiveCopy, /This Marlin-style example uses the common 0–255 fan scale/, 'Printing Unit 5 must scope its fan example');
  assert.doesNotMatch(printingUnitFiveCopy, /PETG often needs less cooling and more bed heat/, 'Printing Unit 5 must not overgeneralize PETG cooling');
  const printingUnitSix = api.TRACKS.printing.lessons.find(lesson => lesson.unit === 6);
  const printingUnitSixCopy = (printingUnitSix?.theory || '') + ' ' + (printingUnitSix?.quiz.map(question => question.question + ' ' + question.explanation).join(' ') || '');
  assert.match(printingUnitSixCopy, /An overhang extends outward with limited material beneath it/, 'Printing Unit 6 must define overhang');
  assert.match(printingUnitSixCopy, /Support is temporary printed\s+material/, 'Printing Unit 6 must define support');
  assert.match(printingUnitSixCopy, /Support distance is the planned gap/, 'Printing Unit 6 must define support distance');
  assert.match(printingUnitSixCopy, /M83 ; relative extrusion mode/, 'Printing Unit 6 must declare extrusion mode');
  assert.doesNotMatch(printingUnitSixCopy, /Why should you reduce the bridge speed/, 'Printing Unit 6 must not prescribe one universal bridge speed');
  const printingUnitSeven = api.TRACKS.printing.lessons.find(lesson => lesson.unit === 7);
  const printingUnitSevenCopy = (printingUnitSeven?.theory || '') + ' ' + (printingUnitSeven?.quiz.map(question => question.question + ' ' + question.explanation).join(' ') || '');
  assert.match(printingUnitSevenCopy, /Firmware is the control software running on the printer/, 'Printing Unit 7 must define firmware');
  assert.match(printingUnitSevenCopy, /A macro is a named command that runs a saved sequence/, 'Printing Unit 7 must define macro');
  assert.match(printingUnitSevenCopy, /A configuration section is a group of/, 'Printing Unit 7 must define configuration section');
  assert.match(printingUnitSevenCopy, /M486 S2.*identifies the current object; it does not cancel object 2/s, 'Printing Unit 7 must teach M486 S accurately');

  const lessonIds = new Set();
  const questionIds = new Set();
  const validTypes = new Set(['multiple-choice', 'true-false', 'fill-blank', 'matching']);
  const nonDomainDistractor = /\b(?:app|theme|wi-?fi|xp|phone|browser|logo|clock|file name|program name|screen brightness|keyboard|tabs|comment color|comments? (?:execute|run|cut|move|heat|home))\b/i;
  const ambiguousQuestionStem = /^(?:Which is\b|Why does this matter\b)/i;
  const ellipticalWhyStem = /^Why\s+(?!(?:is|are|was|were|do|does|did|can|could|will|would|should|must|might|has|have|had)\b)/i;

  Object.entries(api.TRACKS).forEach(([trackId, track]) => {
    track.lessons.forEach(lesson => {
      const lessonKey = `${trackId}:${lesson.id}`;
      assert.ok(lesson.id && !lessonIds.has(lessonKey), `Duplicate lesson ${lessonKey}`);
      lessonIds.add(lessonKey);
      assert.ok(Array.isArray(lesson.quiz) && lesson.quiz.length, `${lesson.id} needs quiz questions`);
      const expectedReviewDate = ['p-u1-l1', 'p-u1-l2', 'p-u1-l3', 'p-u2-l1', 'p-u2-l2', 'p-u2-l3', 'p-u3-l2', 'p-u4-l3', 'p-u5-l1', 'p-u7-l1', 'p-u8-l1', 'p-u9-l1'].includes(lesson.id)
        ? '2026-07-31'
        : ['u10-l1', 'u11-l1'].includes(lesson.id)
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
          assert.match(String(question.question), /\?/, `${question.id} multiple-choice prompt must be a complete question`);
          assert.doesNotMatch(String(question.question).trim(), ambiguousQuestionStem, `${question.id} has an ambiguous question stem`);
          assert.doesNotMatch(String(question.question).trim(), ellipticalWhyStem, `${question.id} has an elliptical Why question`);
          const reasonStarters = question.options
            .map(option => String(option).match(/^(To|So|Because)\b/i)?.[1]?.toLowerCase())
            .filter(Boolean);
          if (reasonStarters.length) {
            assert.equal(reasonStarters.length, question.options.length, `${question.id} mixes reason phrases with other option structures`);
            assert.equal(new Set(reasonStarters).size, 1, `${question.id} uses inconsistent reason-phrase starters`);
          }
          const normalizedOptions = question.options.map(option => String(option).trim().toLowerCase());
          assert.ok(normalizedOptions.every(Boolean), `${question.id} has a blank choice`);
          assert.equal(new Set(normalizedOptions).size, normalizedOptions.length, `${question.id} has duplicate choices`);
          question.options.forEach((option, index) => {
            if (index !== question.answer) assert.doesNotMatch(String(option), nonDomainDistractor, `${question.id} has a non-domain distractor: ${option}`);
          });
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
  const codeRe = /\b(G|M|T)\d{1,3}\b/i;
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
  assert.ok(api.isReferenceCodeLearned('G0/G1', 'printing'), 'Learning G1 must reveal the combined G0/G1 reference card');
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
validateRegressionSurfaces();
validateReferences();
validateActiveCorrection();
validateGrammar();
validateFactCheckContent();
validateCurriculum(runtime.api);
validateTodaysLine(runtime.api, runtime.storage);
validateLessonAndReviewBuilders(runtime.api);
validateStateAndRetries(runtime.api, runtime.storage);
validateLearnedCodeAutoUnlock(runtime.api);
validateLearnedCodeLifecycle(runtime.api, runtime.storage);
validateRoadmap(runtime.api, runtime.storage);
console.log('Project G-Code validation passed.');
