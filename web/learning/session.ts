import { computeAttention } from '../../src/index.ts';
import type { AttentionInput } from '../../src/index.ts';
import { createObservation, evaluateGoal, getLesson } from './lessons.ts';
import type { GoalEvaluation, LessonId, Observation } from './lessons.ts';
import type { LessonRecord } from './progress.ts';

export type LessonPhase = 'predict' | 'experiment' | 'explain' | 'complete';
export interface LessonSession {
  readonly lessonId: LessonId;
  readonly startedAt: string;
  readonly phase: LessonPhase;
  readonly predictionChoice: number | null;
  readonly prediction: number | null;
  readonly observation: Observation | null;
  readonly goalFeedback: GoalEvaluation | null;
  readonly comprehensionChoice: number | null;
  readonly comprehensionAnswers: readonly number[];
  readonly comprehensionCorrect: boolean | null;
}
export function createSession(lessonId: LessonId, startedAt: string): LessonSession {
  return { lessonId, startedAt, phase: 'predict', predictionChoice: null, prediction: null, observation: null,
    goalFeedback: null, comprehensionChoice: null, comprehensionAnswers: [], comprehensionCorrect: null };
}
function validChoice(value: number, count: number): boolean { return Number.isInteger(value) && value >= 0 && value < count; }
export function choosePrediction(session: LessonSession, choice: number): LessonSession {
  return session.phase === 'predict' && validChoice(choice, getLesson(session.lessonId).prediction.options.length)
    ? { ...session, predictionChoice: choice } : session;
}
export function beginExperiment(session: LessonSession): LessonSession {
  return session.phase === 'predict' && session.predictionChoice !== null
    ? { ...session, prediction: session.predictionChoice, phase: 'experiment' } : session;
}
export function checkExperiment(session: LessonSession, input: AttentionInput): LessonSession {
  if (session.phase !== 'experiment') return session;
  const goalFeedback = evaluateGoal(session.lessonId, input);
  return goalFeedback.met ? { ...session, phase: 'explain', goalFeedback,
    observation: createObservation(input, computeAttention(input), goalFeedback.explanation) } : { ...session, goalFeedback };
}
export function chooseComprehension(session: LessonSession, choice: number): LessonSession {
  return session.phase === 'explain' && validChoice(choice, getLesson(session.lessonId).comprehension.options.length)
    ? { ...session, comprehensionChoice: choice, comprehensionCorrect: null } : session;
}
export function answerComprehension(session: LessonSession, completedAt: string): { session: LessonSession; record: LessonRecord | null } {
  if (session.phase !== 'explain' || session.comprehensionChoice === null || session.prediction === null || session.observation === null) {
    return { session, record: null };
  }
  const answers = [...session.comprehensionAnswers, session.comprehensionChoice];
  const correct = session.comprehensionChoice === getLesson(session.lessonId).comprehension.correctIndex;
  const next = { ...session, comprehensionAnswers: answers, comprehensionCorrect: correct, phase: correct ? 'complete' as const : 'explain' as const };
  return { session: next, record: correct ? { lessonId: session.lessonId, startedAt: session.startedAt, completedAt,
    prediction: session.prediction, comprehensionAnswers: answers, observation: session.observation } : null };
}
