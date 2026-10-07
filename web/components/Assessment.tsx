import { useRef, useState } from 'react';
import { QUESTION_BANK, ROUND_SIZE, TOPIC_LABELS, createAssessment, scoreAnswers } from '../learning/assessment.ts';
import type { AssessmentRecord, LearningProgress } from '../learning/progress.ts';
import { completedLessons, createAssessmentRecord } from '../learning/progress.ts';
import { QuestionChoices } from './QuestionChoices.tsx';
import { Icon } from './Icon.tsx';

function newQuiz(previousRounds: readonly (readonly string[])[]) {
  const questions = createAssessment(previousRounds);
  return { questions, answers: questions.map((): number | null => null), submitted: false,
    recentRounds: [...previousRounds.slice(-2), questions.map((question) => question.id)] };
}

export function Assessment({ progress, onSubmit, onGuided, onExport }: {
  progress: LearningProgress; onSubmit: (record: AssessmentRecord) => void; onGuided: () => void; onExport: () => void;
}) {
  const [quiz, setQuiz] = useState(() => newQuiz(progress.assessments.map((record) => record.questions.map((question) => question.id))));
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { questions, answers, submitted } = quiz;
  const ready = answers.every((answer) => answer !== null);
  const score = submitted ? scoreAnswers(questions, answers as number[]) : null;
  const first = progress.assessments[0];
  const latest = progress.assessments.at(-1);
  const nextQuiz = () => {
    setQuiz((previous) => newQuiz(previous.recentRounds));
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: 'start' });
  };
  const recordScore = (record: AssessmentRecord) => `${scoreAnswers(record.questions, record.answers)} / ${record.questions.length}`;
  return <section className="assessment-section" aria-labelledby="assessment-title">
    <div className="learning-heading"><div><span className="eyebrow">CHECK YOUR UNDERSTANDING</span><h2 id="assessment-title" ref={headingRef} tabIndex={-1}>换一组题，看看是否真正理解</h2><p>题库 {QUESTION_BANK.length} 道，每轮 {ROUND_SIZE} 道，覆盖五类概念。最近三轮不重复，提交后查看答案与解释。</p></div></div>
    <div className="assessment-grid"><div className="assessment-questions">
      {questions.map((question, index) => <article className="card assessment-card" key={question.id} data-testid="assessment-question" data-question-id={question.id}>
        <div className="assessment-question-number">QUESTION {String(index + 1).padStart(2, '0')} · {TOPIC_LABELS[question.topic]}<span>{submitted ? answers[index] === question.correctIndex ? '回答正确' : '值得再练' : '单选题'}</span></div>
        <QuestionChoices question={question} value={answers[index]!} disabled={submitted} onChange={(choice) => setQuiz({ ...quiz, answers: answers.map((answer, itemIndex) => itemIndex === index ? choice : answer) })} />
        {submitted && <div className={`assessment-answer ${answers[index] === question.correctIndex ? 'correct' : 'revised'}`}><b>正确答案：{question.options[question.correctIndex]}</b><p>{question.explanation}</p></div>}
      </article>)}
      <div className="assessment-submit">{!submitted ? <>
        <button className="button primary" disabled={!ready} onClick={() => {
          if (!ready) return;
          onSubmit(createAssessmentRecord(questions, answers as readonly number[], new Date().toISOString()));
          setQuiz({ ...quiz, submitted: true });
        }}>提交自测<Icon name="arrow" size={16} /></button>
        <button className="button secondary" onClick={nextQuiz}>换一组题<Icon name="reset" size={16} /></button>
        <span>完成全部 {ROUND_SIZE} 题后提交；换题会清空本轮未提交的答案。</span>
      </> : <button className="button secondary" onClick={nextQuiz}>换一组题，再测一次<Icon name="reset" size={16} /></button>}</div>
    </div><aside className="card learning-summary" aria-label="学习记录摘要"><span className="eyebrow">YOUR LEARNING</span><h3>把观察，变成理解</h3>
      <div className="summary-metric"><span>已完成实验</span><b>{completedLessons(progress).length}<small> / 3</small></b></div>
      <div className="summary-metric"><span>首次自测</span><b data-testid="first-score">{first ? recordScore(first) : '尚未作答'}</b></div>
      <div className="summary-metric"><span>最近自测</span><b data-testid="latest-score">{latest ? recordScore(latest) : '尚未作答'}</b></div>
      {submitted && <div className="assessment-score" role="status"><span>本次答对</span><strong data-testid="assessment-score">{score} / {questions.length}</strong><p>{score === questions.length ? '本轮五类概念都答对了。可以换一组题，试试新的情境。' : '查看每题解释，再回到对应实验验证你的想法。'}</p></div>}
      <div className="summary-actions"><button className="button secondary" onClick={onGuided}>回到引导实验</button><button className="text-button" onClick={onExport}>导出学习记录<Icon name="save" size={14} /></button></div>
      <p className="summary-note">每次保存实际题目和答案；旧版四题成绩保留。不同题组难度可能不同，成绩不能直接作为学习提升的证明。</p>
    </aside></div>
  </section>;
}
