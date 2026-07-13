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
    normalizeCodeAnswer
  };`;
  vm.runInContext(`${read('data/lessons.js')}\n${appBeforeBoot}\n${expose}`, context);
  return { api: context.__testApi, storage };
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
  assert.doesNotMatch(curriculum, /G00 ignores feedrate override/, 'Rapid override behavior must remain controller-specific');
  assert.doesNotMatch(curriculum, /Always leave 0\.050/, 'Fixed rapid clearances must not be labeled universally safe');
  assert.doesNotMatch(curriculum, /G02 cuts a concave/, 'Arc direction must not be equated with concavity');
  assert.match(curriculum, /M83 ; relative extrusion mode/, 'Retraction examples must declare relative extrusion mode');
  assert.match(curriculum, /M109 S waits while heating/, 'Marlin temperature waits must distinguish S from R');
  assert.match(app, /function renderLessonFactCheck/, 'Learners must be able to inspect curriculum sources');
}

function validateReferences() {
  const directory = path.join(ROOT, 'data', 'reference');
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
  assert.ok(firstCncLesson.quiz.some(question => question.id === 'u1-l1-q8'), 'Beginner context questions must load from curriculum data');
  assert.doesNotMatch(read('index.html'), /const updateQuestion\s*=/, 'Curriculum patches do not belong in index.html');

  const lessonIds = new Set();
  const questionIds = new Set();
  const validTypes = new Set(['multiple-choice', 'true-false', 'fill-blank', 'matching']);

  Object.entries(api.TRACKS).forEach(([trackId, track]) => {
    track.lessons.forEach(lesson => {
      const lessonKey = `${trackId}:${lesson.id}`;
      assert.ok(lesson.id && !lessonIds.has(lessonKey), `Duplicate lesson ${lessonKey}`);
      lessonIds.add(lessonKey);
      assert.ok(Array.isArray(lesson.quiz) && lesson.quiz.length, `${lesson.id} needs quiz questions`);
      assert.equal(lesson.factCheck?.reviewed, '2026-07-13', `${lesson.id} needs a current fact-check date`);
      assert.ok(String(lesson.factCheck?.dialect || '').trim(), `${lesson.id} needs a controller or firmware scope`);
      assert.ok(Array.isArray(lesson.factCheck?.sources) && lesson.factCheck.sources.length >= 3, `${lesson.id} needs primary source coverage`);
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

const runtime = loadAppRuntime();
validateVersions();
validateReferences();
validateActiveCorrection();
validateFactCheckContent();
validateCurriculum(runtime.api);
validateStateAndRetries(runtime.api, runtime.storage);
console.log('Project G-Code validation passed.');
