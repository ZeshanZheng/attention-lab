import { useState } from 'react';
import { ASSESSMENT, scoreAssessment } from '../learning/lessons.ts';
import type { AssessmentRecord, LearningProgress } from '../learning/progress.ts';
import { completedLessons } from '../learning/progress.ts';
import { QuestionChoices } from './QuestionChoices.tsx';
import { Icon } from './Icon.tsx';

export function Assessment({ progress, onSubmit, onGuided, onExport }: {
  progress: LearningProgress; onSubmit: (record: AssessmentRecord) => void; onGuided: () => void; onExport: () => void;
}) {
  const [answers, setAnswers] = useState<readonly (number | null)[]>(ASSESSMENT.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const ready = answers.every((answer) => answer !== null);
  const score = submitted ? scoreAssessment(answers as number[]) : null;
  const first = progress.assessments[0];
  const latest = progress.assessments.at(-1);
  return <section className="assessment-section" aria-labelledby="assessment-title">
    <div className="learning-heading"><div><span className="eyebrow">CHECK YOUR UNDERSTANDING</span><h2 id="assessment-title">换一组数字，看看是否真正理解</h2><p>四道新情境题。提交后查看答案与解释，也可以在学习前做一次自测。</p></div></div>
    <div className="assessment-grid"><div className="assessment-questions">
      {ASSESSMENT.map((question, index) => <article className="card assessment-card" key={question.id}>
        <div className="assessment-question-number">QUESTION 0{index + 1}<span>{submitted ? answers[index] === question.correctIndex ? '回答正确' : '值得再练' : '单选题'}</span></div>
        <QuestionChoices question={question} value={answers[index]!} disabled={submitted} onChange={(choice) => setAnswers(answers.map((answer, itemIndex) => itemIndex === index ? choice : answer))} />
        {submitted && <div className={`assessment-answer ${answers[index] === question.correctIndex ? 'correct' : 'revised'}`}><b>正确答案：{question.options[question.correctIndex]}</b><p>{question.explanation}</p></div>}
      </article>)}
      <div className="assessment-submit">{!submitted ? <button className="button primary" disabled={!ready} onClick={() => {
        if (!ready) return;
        onSubmit({ submittedAt: new Date().toISOString(), answers: answers as readonly number[] });
        setSubmitted(true);
      }}>提交自测<Icon name="arrow" size={16} /></button> : <button className="button secondary" onClick={() => { setAnswers(ASSESSMENT.map(() => null)); setSubmitted(false); }}>再做一次自测<Icon name="reset" size={16} /></button>}
      {!submitted && <span>完成全部四题后提交；暂不显示正确答案。</span>}</div>
    </div><aside className="card learning-summary" aria-label="学习记录摘要"><span className="eyebrow">YOUR LEARNING</span><h3>把观察，变成理解</h3>
      <div className="summary-metric"><span>已完成实验</span><b>{completedLessons(progress).length}<small> / 3</small></b></div>
      <div className="summary-metric"><span>首次自测</span><b data-testid="first-score">{first ? `${scoreAssessment(first.answers)} / 4` : '尚未作答'}</b></div>
      <div className="summary-metric"><span>最近自测</span><b data-testid="latest-score">{latest ? `${scoreAssessment(latest.answers)} / 4` : '尚未作答'}</b></div>
      {submitted && <div className="assessment-score" role="status"><span>本次答对</span><strong data-testid="assessment-score">{score} / 4</strong><p>{score === 4 ? '四个概念都答对了。试着用自己的话解释每一步。' : '查看每题解释，再回到对应实验验证你的想法。'}</p></div>}
      <div className="summary-actions"><button className="button secondary" onClick={onGuided}>回到引导实验</button><button className="text-button" onClick={onExport}>导出学习记录<Icon name="save" size={14} /></button></div>
      <p className="summary-note">首次与最近成绩分别保留。重复作答会包含练习效应，分数变化不能单独证明教学效果。</p>
    </aside></div>
  </section>;
}
