import { LESSONS, getLesson } from './lessons.ts';
import type { LessonId, Observation } from './lessons.ts';
import { LEGACY_QUESTIONS, TOPICS, scoreAnswers } from './assessment.ts';
import type { AssessmentQuestion } from './assessment.ts';

export const STORAGE_KEY = 'attention-lab.learning.v1';
const MAX_RECORDS = 30;

export interface LessonRecord {
  readonly lessonId: LessonId;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly prediction: number;
  readonly comprehensionAnswers: readonly number[];
  readonly observation: Observation;
}
export interface AssessmentRecord {
  readonly submittedAt: string;
  readonly questions: readonly AssessmentQuestion[];
  readonly answers: readonly number[];
}
export function createAssessmentRecord(questions: readonly AssessmentQuestion[], answers: readonly number[], submittedAt: string): AssessmentRecord {
  return { submittedAt, questions: questions.map((question) => ({ ...question, options: [...question.options] })), answers: [...answers] };
}
export interface LearningProgress {
  readonly version: 2;
  readonly lessons: readonly LessonRecord[];
  readonly assessments: readonly AssessmentRecord[];
}
export function emptyProgress(): LearningProgress { return { version: 2, lessons: [], assessments: [] }; }
export function completedLessons(progress: LearningProgress): LessonId[] {
  return LESSONS.filter((lesson) => progress.lessons.some((record) => record.lessonId === lesson.id)).map((lesson) => lesson.id);
}
export function addLessonRecord(progress: LearningProgress, record: LessonRecord): LearningProgress {
  // Preserve the first completion of each lesson even when repeat practice grows.
  const next = [...progress.lessons, record];
  const first = LESSONS.map((lesson) => next.find((item) => item.lessonId === lesson.id)).filter((item): item is LessonRecord => item !== undefined);
  const recent = next.slice(-(MAX_RECORDS - first.length));
  return { ...progress, lessons: [...new Set([...first, ...recent])] };
}
export function addAssessmentRecord(progress: LearningProgress, record: AssessmentRecord): LearningProgress {
  const next = [...progress.assessments, record];
  return { ...progress, assessments: next.length <= MAX_RECORDS ? next : [next[0]!, ...next.slice(-(MAX_RECORDS - 1))] };
}

function object(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function date(value: unknown): value is string { return typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value)); }
function choice(value: unknown, count: number): value is number { return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < count; }
function vector(value: unknown, size: number): value is readonly number[] {
  return Array.isArray(value) && value.length === size && value.every((coordinate: unknown) => typeof coordinate === 'number' && Number.isFinite(coordinate));
}
function validObservation(value: unknown): value is Observation {
  if (!object(value) || !object(value['input'])) return false;
  const input = value['input'];
  return (['queries', 'keys', 'values'] as const).every((kind) => {
    const matrix = input[kind];
    return Array.isArray(matrix) && matrix.length === 3 && matrix.every((row: unknown) => vector(row, 2) && row.every((coordinate) => Math.abs(coordinate) <= 5));
  }) && vector(value['weights'], 3) && value['weights'].every((weight) => weight >= 0 && weight <= 1)
    && Math.abs(value['weights'].reduce((sum, weight) => sum + weight, 0) - 1) < 1e-8 && vector(value['output'], 2)
    && typeof value['explanation'] === 'string' && value['explanation'].length <= 1500;
}
function validLessonRecord(value: unknown): value is LessonRecord {
  if (!object(value) || !LESSONS.some((lesson) => lesson.id === value['lessonId'])) return false;
  const lesson = getLesson(value['lessonId'] as LessonId);
  const answers = value['comprehensionAnswers'];
  return date(value['startedAt']) && date(value['completedAt']) && Date.parse(value['completedAt']) >= Date.parse(value['startedAt'])
    && choice(value['prediction'], lesson.prediction.options.length) && Array.isArray(answers) && answers.length > 0 && answers.length <= 100
    && answers.every((answer: unknown) => choice(answer, lesson.comprehension.options.length)) && answers.at(-1) === lesson.comprehension.correctIndex
    && validObservation(value['observation']);
}
function validQuestion(value: unknown): value is AssessmentQuestion {
  if (!object(value)) return false;
  const options = value['options'];
  return typeof value['id'] === 'string' && value['id'].length > 0 && value['id'].length <= 100
    && typeof value['prompt'] === 'string' && value['prompt'].length > 0 && value['prompt'].length <= 1500
    && typeof value['topic'] === 'string' && TOPICS.some((topic) => topic === value['topic'])
    && Array.isArray(options) && options.length >= 2 && options.length <= 6
    && options.every((option: unknown) => typeof option === 'string' && option.length > 0 && option.length <= 1000)
    && choice(value['correctIndex'], options.length)
    && typeof value['explanation'] === 'string' && value['explanation'].length <= 1500
    && typeof value['retryHint'] === 'string' && value['retryHint'].length <= 1500;
}
function validAssessmentRecord(value: unknown): value is AssessmentRecord {
  if (!object(value) || !date(value['submittedAt']) || !Array.isArray(value['questions']) || !Array.isArray(value['answers'])) return false;
  const questions = value['questions'];
  return questions.length >= 1 && questions.length <= 10 && questions.every(validQuestion)
    && new Set(questions.map((question) => question.id)).size === questions.length
    && value['answers'].length === questions.length
    && value['answers'].every((answer: unknown, index: number) => choice(answer, questions[index]!.options.length));
}
function migrateAssessment(value: unknown): AssessmentRecord | null {
  if (!object(value) || !date(value['submittedAt']) || !Array.isArray(value['answers']) || value['answers'].length !== LEGACY_QUESTIONS.length
    || !value['answers'].every((answer: unknown, index: number) => choice(answer, LEGACY_QUESTIONS[index]!.options.length))) return null;
  return createAssessmentRecord(LEGACY_QUESTIONS, value['answers'], value['submittedAt']);
}
export function parseProgress(raw: string | null): LearningProgress {
  if (raw === null || raw.length > 200_000) return emptyProgress();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!object(parsed) || ![1, 2].includes(parsed['version'] as number) || !Array.isArray(parsed['lessons']) || !Array.isArray(parsed['assessments'])
      || parsed['lessons'].length > MAX_RECORDS || parsed['assessments'].length > MAX_RECORDS
      || !parsed['lessons'].every(validLessonRecord)) return emptyProgress();
    if (parsed['version'] === 1) {
      const migrated = parsed['assessments'].map(migrateAssessment);
      if (migrated.some((record) => record === null)) return emptyProgress();
      return { version: 2, lessons: parsed['lessons'], assessments: migrated as AssessmentRecord[] };
    }
    if (!parsed['assessments'].every(validAssessmentRecord)) return emptyProgress();
    return { version: 2, lessons: parsed['lessons'], assessments: parsed['assessments'] };
  } catch { return emptyProgress(); }
}

/** Answer labels and observation snapshots make anonymous exported evidence reviewable. */
export function exportProgress(progress: LearningProgress, exportedAt: string): string {
  return JSON.stringify({
    product: 'Attention Lab', version: 2, exportedAt,
    completedLessons: completedLessons(progress),
    notice: '匿名本地学习记录；包含重试，不能单独证明教学效果。',
    lessonAttempts: progress.lessons.map((record) => {
      const lesson = getLesson(record.lessonId);
      return { ...record, title: lesson.title, firstPredictionCorrect: record.prediction === lesson.prediction.correctIndex,
        predictionQuestion: lesson.prediction.prompt, predictionAnswer: lesson.prediction.options[record.prediction],
        firstComprehensionCorrect: record.comprehensionAnswers[0] === lesson.comprehension.correctIndex,
        comprehensionQuestion: lesson.comprehension.prompt, comprehensionAttempts: record.comprehensionAnswers.length };
    }),
    assessmentAttempts: progress.assessments.map((record) => ({ ...record, score: scoreAnswers(record.questions, record.answers), total: record.questions.length,
      questions: record.questions.map((question, index) => ({ ...question, selected: question.options[record.answers[index]!],
        correct: record.answers[index] === question.correctIndex })) })),
  }, null, 2);
}
