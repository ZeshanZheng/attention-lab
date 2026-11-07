import type { AssessmentQuestion, AssessmentTopic } from './assessment.ts';
import { getLesson } from './lessons.ts';
import type { LessonId } from './lessons.ts';

export type AssessmentReview =
  | { readonly kind: 'lesson'; readonly lessonId: LessonId; readonly label: string }
  | { readonly kind: 'reading'; readonly view: 'types'; readonly label: string };

const TOPIC_LESSONS: Record<AssessmentTopic, LessonId> = {
  matching: 'focus', aggregation: 'content', normalization: 'competition',
  invariance: 'competition', interpretation: 'content',
};

// Resolve learning links at display time; historical question snapshots stay intact.
export function reviewForQuestion(question: AssessmentQuestion): AssessmentReview {
  if (question.id === 'normalization-mask') return { kind: 'reading', view: 'types', label: '去了解：遮罩与可见位置' };
  const lessonId = question.id === 'invariance-value' ? 'content'
    : question.id === 'interpretation-dot' ? 'focus' : TOPIC_LESSONS[question.topic];
  return { kind: 'lesson', lessonId, label: `去验证：${getLesson(lessonId).title}` };
}
