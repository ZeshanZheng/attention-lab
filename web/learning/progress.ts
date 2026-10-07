import { ASSESSMENT, LESSONS, getLesson, scoreAssessment } from './lessons.ts';
import type { LessonId, Observation } from './lessons.ts';

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
export interface AssessmentRecord { readonly submittedAt: string; readonly answers: readonly number[]; }
export interface LearningProgress {
  readonly version: 1;
  readonly lessons: readonly LessonRecord[];
  readonly assessments: readonly AssessmentRecord[];
}
export function emptyProgress(): LearningProgress { return { version: 1, lessons: [], assessments: [] }; }
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
function validAssessmentRecord(value: unknown): value is AssessmentRecord {
  if (!object(value) || !date(value['submittedAt']) || !Array.isArray(value['answers']) || value['answers'].length !== ASSESSMENT.length) return false;
  return value['answers'].every((answer: unknown, index: number) => choice(answer, ASSESSMENT[index]!.options.length));
}
export function parseProgress(raw: string | null): LearningProgress {
  if (raw === null || raw.length > 200_000) return emptyProgress();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!object(parsed) || parsed['version'] !== 1 || !Array.isArray(parsed['lessons']) || !Array.isArray(parsed['assessments'])
      || parsed['lessons'].length > MAX_RECORDS || parsed['assessments'].length > MAX_RECORDS
      || !parsed['lessons'].every(validLessonRecord) || !parsed['assessments'].every(validAssessmentRecord)) return emptyProgress();
    return { version: 1, lessons: parsed['lessons'], assessments: parsed['assessments'] };
  } catch { return emptyProgress(); }
}

/** Answer labels and observation snapshots make anonymous exported evidence reviewable. */
export function exportProgress(progress: LearningProgress, exportedAt: string): string {
  return JSON.stringify({
    product: 'Attention Lab', version: 1, exportedAt,
    completedLessons: completedLessons(progress),
    notice: '匿名本地学习记录；包含重试，不能单独证明教学效果。',
    lessonAttempts: progress.lessons.map((record) => {
      const lesson = getLesson(record.lessonId);
      return { ...record, title: lesson.title, firstPredictionCorrect: record.prediction === lesson.prediction.correctIndex,
        predictionQuestion: lesson.prediction.prompt, predictionAnswer: lesson.prediction.options[record.prediction],
        firstComprehensionCorrect: record.comprehensionAnswers[0] === lesson.comprehension.correctIndex,
        comprehensionQuestion: lesson.comprehension.prompt, comprehensionAttempts: record.comprehensionAnswers.length };
    }),
    assessmentAttempts: progress.assessments.map((record) => ({ ...record, score: scoreAssessment(record.answers), total: ASSESSMENT.length,
      questions: ASSESSMENT.map((question, index) => ({ prompt: question.prompt, selected: question.options[record.answers[index]!],
        correct: record.answers[index] === question.correctIndex })) })),
  }, null, 2);
}
