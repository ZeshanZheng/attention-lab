import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeAttention } from '../src/index.ts';
import { createLabState, labReducer } from '../web/state.ts';
import { ASSESSMENT, createLessonInput, evaluateGoal, scoreAssessment } from '../web/learning/lessons.ts';
import { answerComprehension, beginExperiment, checkExperiment, chooseComprehension, choosePrediction, createSession } from '../web/learning/session.ts';
import { addAssessmentRecord, addLessonRecord, completedLessons, createAssessmentRecord, emptyProgress, exportProgress, parseProgress } from '../web/learning/progress.ts';
import { LEGACY_QUESTIONS } from '../web/learning/assessment.ts';

const startedAt = '2026-10-07T07:00:00.000Z';
const completedAt = '2026-10-07T07:02:00.000Z';

function completedContentLesson() {
  let session = beginExperiment(choosePrediction(createSession('content', startedAt), 0));
  session = checkExperiment(session, { ...createLessonInput(), values: [[2, 0], [0, 4], [-2, 0]] });
  session = answerComprehension(chooseComprehension(session, 1), completedAt).session;
  return answerComprehension(chooseComprehension(session, 0), completedAt).record!;
}

test('each lesson rejects the initial state and accepts its intended mathematical goal', () => {
  const initial = createLessonInput();
  for (const lesson of ['focus', 'content', 'competition'] as const) assert.equal(evaluateGoal(lesson, initial).met, false);
  assert.equal(evaluateGoal('focus', { ...initial, keys: [[1, 0], [2, 1], [-1, 0]] }).met, true);
  assert.equal(evaluateGoal('content', { ...initial, values: [[2, 0], [0, 4], [-2, 0]] }).met, true);
  assert.equal(evaluateGoal('competition', { ...initial, keys: [[2, 0], [0, 1], [-1, 0]] }).met, true);
  assert.equal(evaluateGoal('focus', { ...initial, queries: [[3, 0], [0, 1], [-1, 0]], keys: [[1, 0], [2, 1], [-1, 0]] }).met, false);
  assert.equal(evaluateGoal('content', { ...initial, values: [[2, 0], [1, 4], [-2, 0]] }).met, false);
});

test('guided policy enforces prediction gating, one-variable editing and a fixed baseline/query', () => {
  let state = labReducer(createLabState(), { type: 'load-lesson', input: createLessonInput(), kind: 'keys', token: 1, step: 0 });
  assert.equal(labReducer(state, { type: 'edit-vector', kind: 'keys', token: 1, vector: [2, 1] }), state);
  state = labReducer(state, { type: 'allow-lesson-editing', enabled: true });
  assert.equal(labReducer(state, { type: 'edit-vector', kind: 'values', token: 1, vector: [0, 4] }), state);
  assert.equal(labReducer(state, { type: 'edit-vector', kind: 'keys', token: 0, vector: [2, 0] }), state);
  assert.equal(labReducer(state, { type: 'select-query', index: 1 }), state);
  assert.equal(labReducer(state, { type: 'save-baseline' }), state);
  const changed = labReducer(state, { type: 'edit-vector', kind: 'keys', token: 1, vector: [2, 1] });
  assert.equal(evaluateGoal('focus', changed.input).met, true);
  assert.deepEqual(changed.baseline.keys[1], [0, 1]);
});

test('a wrong prediction is retained; wrong comprehension is retried without falsely completing', () => {
  let session = createSession('content', startedAt);
  assert.equal(beginExperiment(session), session);
  session = beginExperiment(choosePrediction(session, 0));
  assert.equal(choosePrediction(session, 1), session);
  session = checkExperiment(session, createLessonInput());
  assert.equal(session.phase, 'experiment');
  assert.equal(session.goalFeedback!.met, false);
  session = checkExperiment(session, { ...createLessonInput(), values: [[2, 0], [0, 4], [-2, 0]] });
  const wrong = answerComprehension(chooseComprehension(session, 1), completedAt);
  assert.equal(wrong.record, null);
  assert.equal(wrong.session.phase, 'explain');
  const correct = answerComprehension(chooseComprehension(wrong.session, 0), completedAt);
  assert.equal(correct.session.phase, 'complete');
  assert.equal(correct.record!.prediction, 0);
  assert.deepEqual(correct.record!.comprehensionAnswers, [1, 0]);
  assert.equal(answerComprehension(correct.session, completedAt).record, null);
});

test('observation is a frozen-in-time independent snapshot', () => {
  const values = [[2, 0], [0, 4], [-2, 0]];
  const session = checkExperiment(beginExperiment(choosePrediction(createSession('content', startedAt), 1)), { ...createLessonInput(), values });
  values[1]![1] = 5;
  assert.deepEqual(session.observation!.input.values[1], [0, 4]);
  assert.equal(session.observation!.output[1], 2 * computeAttention(createLessonInput()).outputs[0]![1]!);
});

test('legacy assessment examples and scoring agree with independently checked mathematics', () => {
  assert.equal(scoreAssessment(ASSESSMENT.map((question) => question.correctIndex)), 4);
  assert.equal(scoreAssessment([1, 0, 0, 1]), 0);
  const matching = computeAttention({ queries: [[1, 0]], keys: [[2, 2], [0, 3]], values: [[0], [0]] });
  assert.ok(matching.weights[0]![0]! > matching.weights[0]![1]!);
  assert.deepEqual([0.25 * 4 + 0.75 * 0, 0.25 * 0 + 0.75 * 4], [1, 3]);
});

test('valid completed progress round-trips; corrupt, unknown-version and malformed data recover safely', () => {
  const progress = addLessonRecord(emptyProgress(), completedContentLesson());
  assert.deepEqual(parseProgress(JSON.stringify(progress)), progress);
  assert.deepEqual(parseProgress(JSON.stringify({ ...progress, version: 1 })), progress);
  assert.deepEqual(completedLessons(progress), ['content']);
  for (const raw of [null, 'not json', '{"version":99,"lessons":[],"assessments":[]}', '{"version":1,"lessons":[{}],"assessments":[]}']) {
    assert.deepEqual(parseProgress(raw), emptyProgress());
  }
  const badSnapshot = { ...progress, lessons: [{ ...progress.lessons[0], observation: { input: {}, weights: [0, 0, 0], output: [0, 0], explanation: '' } }] };
  assert.deepEqual(parseProgress(JSON.stringify(badSnapshot)), emptyProgress());
});

test('history is bounded while retaining first lesson completion and first assessment score', () => {
  let progress = addLessonRecord(emptyProgress(), completedContentLesson());
  for (let index = 0; index < 40; index += 1) {
    progress = addLessonRecord(progress, { ...completedContentLesson(), prediction: 1 });
    progress = addAssessmentRecord(progress, createAssessmentRecord(LEGACY_QUESTIONS, index === 0 ? [1, 0, 0, 1] : [0, 2, 1, 0], completedAt));
  }
  assert.ok(progress.lessons.length <= 30);
  assert.equal(progress.lessons[0]!.prediction, 0);
  assert.equal(progress.assessments.length, 30);
  assert.equal(scoreAssessment(progress.assessments[0]!.answers), 0);
  assert.equal(scoreAssessment(progress.assessments.at(-1)!.answers), 4);
  assert.deepEqual(parseProgress(JSON.stringify(progress)), progress);
});

test('export separates first answers from eventual completion and includes numerical evidence', () => {
  const progress = addLessonRecord(emptyProgress(), completedContentLesson());
  const exported = JSON.parse(exportProgress(progress, completedAt));
  assert.equal(exported.lessonAttempts[0].firstPredictionCorrect, false);
  assert.equal(exported.lessonAttempts[0].firstComprehensionCorrect, false);
  assert.equal(exported.lessonAttempts[0].comprehensionAttempts, 2);
  assert.deepEqual(exported.lessonAttempts[0].observation.input.values[1], [0, 4]);
  assert.equal(exported.lessonAttempts[0].observation.weights.length, 3);
});

test('returning to free exploration restores original parameters and removes guided restrictions', () => {
  const free = labReducer(createLabState(), { type: 'edit-vector', kind: 'values', token: 2, vector: [-3, 1] });
  const guided = labReducer(free, { type: 'load-lesson', input: createLessonInput(), kind: 'keys', token: 1, step: 0 });
  const restored = labReducer(guided, { type: 'resume-free', state: free });
  assert.deepEqual(restored.input.values[2], [-3, 1]);
  assert.equal(restored.editPolicy, null);
  assert.notEqual(restored.input.values[2], free.input.values[2]);
});
