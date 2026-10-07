import assert from 'node:assert/strict';
import test from 'node:test';
import { computeAttention, softmax } from '../src/index.ts';
import { LEGACY_QUESTIONS, QUESTION_BANK, TOPICS, createAssessment, scoreAnswers } from '../web/learning/assessment.ts';
import { addAssessmentRecord, createAssessmentRecord, emptyProgress, exportProgress, parseProgress } from '../web/learning/progress.ts';

const submittedAt = '2026-10-07T10:00:00.000Z';
function randomGenerator(seed: number) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

test('question bank has twenty unique, valid questions and four variants for every topic', () => {
  assert.equal(QUESTION_BANK.length, 20);
  assert.equal(new Set(QUESTION_BANK.map((question) => question.id)).size, 20);
  for (const topic of TOPICS) assert.equal(QUESTION_BANK.filter((question) => question.topic === topic).length, 4);
  for (const question of QUESTION_BANK) {
    assert.ok(question.correctIndex >= 0 && question.correctIndex < question.options.length);
    assert.equal(new Set(question.options).size, question.options.length);
  }
});

test('rounds cover all topics and avoid the previous three rounds across many seeds', () => {
  for (let seed = 0; seed < 25; seed += 1) {
    const random = randomGenerator(seed);
    const history: string[][] = [];
    for (let index = 0; index < 20; index += 1) {
      const questions = createAssessment(history, random);
      assert.deepEqual([...new Set(questions.map((question) => question.topic))].sort(), [...TOPICS].sort());
      const recent = new Set(history.slice(-3).flat());
      assert.ok(questions.every((question) => !recent.has(question.id)));
      history.push(questions.map((question) => question.id));
    }
    assert.equal(new Set(history.slice(0, 4).flat()).size, 20);
  }
  assert.deepEqual(createAssessment([], randomGenerator(7)), createAssessment([], randomGenerator(7)));
});

test('new numerical question answers agree with attention and independently computed sums', () => {
  const matching = (query: number[], keys: number[][]) => computeAttention({ queries: [query], keys, values: keys.map(() => [0]) }).weights[0]!;
  assert.ok(matching([0, 1], [[3, 0], [0, 2]])[1]! > 0.5);
  assert.ok(matching([-1, 0], [[-2, 1], [1, 4]])[0]! > 0.5);
  assert.deepEqual(matching([1, 1], [[2, 0], [0, 2]]), [0.5, 0.5]);
  assert.deepEqual([0.5 * 2 + 0.5 * 0, 0.5 * -2 + 0.5 * 4], [1, 1]);
  assert.equal(0.2 + 0.3 + 0.5, 1);
  assert.equal(0.5 * 2 + 0.5 * -2, 0);
  const masked = computeAttention({ queries: [[0, 0]], keys: [[1, 0], [0, 1], [1, 1]], values: [[0], [0], [0]], mask: [[true, false, true]] });
  assert.deepEqual(masked.weights[0], [0.5, 0, 0.5]);
  assert.ok(softmax([2, 0])[0]! > softmax([1, 0])[0]!);
  assert.ok(softmax([1, 0])[0]! > 0.5);
  assert.deepEqual(softmax([5, 5, 5]), [1 / 3, 1 / 3, 1 / 3]);
});

test('scoring and export follow the actual shuffled snapshot and preserve it independently', () => {
  const questions = createAssessment([], randomGenerator(8));
  const answers = questions.map((question) => question.correctIndex);
  const record = createAssessmentRecord(questions, answers, submittedAt);
  const exported = JSON.parse(exportProgress(addAssessmentRecord(emptyProgress(), record), submittedAt));
  assert.equal(exported.assessmentAttempts[0].score, 5);
  assert.equal(exported.assessmentAttempts[0].total, 5);
  assert.deepEqual(exported.assessmentAttempts[0].questions.map((question: { id: string }) => question.id), questions.map((question) => question.id));
  answers[0] = (answers[0]! + 1) % 3;
  questions[0] = { ...questions[0]!, correctIndex: (questions[0]!.correctIndex + 1) % 3 };
  assert.equal(scoreAnswers(record.questions, record.answers), 5);
  assert.equal(scoreAnswers(record.questions, answers), 4);
  assert.deepEqual(parseProgress(JSON.stringify(addAssessmentRecord(emptyProgress(), record))).assessments[0], record);
});

test('version one four-question records migrate without changing first scores or lesson data', () => {
  const legacy = { version: 1, lessons: [], assessments: [{ submittedAt, answers: [1, 0, 0, 1] }, { submittedAt, answers: [0, 2, 1, 0] }] };
  const migrated = parseProgress(JSON.stringify(legacy));
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.assessments[0]!.questions, LEGACY_QUESTIONS);
  assert.equal(scoreAnswers(migrated.assessments[0]!.questions, migrated.assessments[0]!.answers), 0);
  assert.equal(scoreAnswers(migrated.assessments[1]!.questions, migrated.assessments[1]!.answers), 4);
  const questions = createAssessment(migrated.assessments.map((record) => record.questions.map((question) => question.id)), randomGenerator(10));
  const combined = addAssessmentRecord(migrated, createAssessmentRecord(questions, questions.map((question) => question.correctIndex), submittedAt));
  const exported = JSON.parse(exportProgress(combined, submittedAt));
  assert.deepEqual(exported.assessmentAttempts.map((record: { total: number }) => record.total), [4, 4, 5]);
  assert.deepEqual(parseProgress(JSON.stringify(combined)), combined);
});

test('corrupt snapshots and answer mismatches recover safely', () => {
  const record = createAssessmentRecord(createAssessment([], randomGenerator(2)), [0, 0, 0, 0, 0], submittedAt);
  for (const malformed of [
    { ...record, answers: [0] },
    { ...record, questions: [{ ...record.questions[0], correctIndex: 99 }] },
    { ...record, questions: record.questions.map(() => record.questions[0]) },
    { ...record, answers: [0, 0, 0, 0, 99] },
  ]) assert.deepEqual(parseProgress(JSON.stringify({ version: 2, lessons: [], assessments: [malformed] })), emptyProgress());
});
