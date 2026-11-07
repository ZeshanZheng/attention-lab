import { useState } from 'react';
import { LESSONS, getLesson } from '../learning/lessons.ts';
import type { LessonId } from '../learning/lessons.ts';
import type { LessonSession } from '../learning/session.ts';
import { QuestionChoices } from './QuestionChoices.tsx';
import { Icon } from './Icon.tsx';
import { MathText } from './MathText.tsx';

export function GuidedLessons({ session, completed, onStart, onPredict, onBegin, onAnswerChoice, onAnswer, onAssessment, onSummary }: {
  session: LessonSession; completed: readonly LessonId[];
  onStart: (id: LessonId) => void; onPredict: (choice: number) => void; onBegin: () => void;
  onSummary: () => void;
  onAnswerChoice: (choice: number) => void; onAnswer: () => void; onAssessment: () => void;
}) {
  const [hintLevel, setHintLevel] = useState(0);
  const lesson = getLesson(session.lessonId);
  const phaseIndex = ['predict', 'experiment', 'explain', 'complete'].indexOf(session.phase);
  const predictionCorrect = session.prediction === lesson.prediction.correctIndex;
  const nextLesson = LESSONS.find((item) => item.number === lesson.number + 1);

  return <section className="guided-learning guided-compact" aria-labelledby="guided-title">
    <div className="guided-controls"><h2 id="guided-title">引导任务</h2><span className="learning-count" data-testid="lesson-progress">已完成 {completed.length} / 3</span></div>
    <div className="lesson-picker" aria-label="选择引导任务">
      {LESSONS.map((item) => <button key={item.id} aria-label={`实验 ${item.number}：${item.title}`} aria-pressed={item.id === lesson.id}
        className={`lesson-card ${item.id === lesson.id ? 'active' : ''} ${completed.includes(item.id) ? 'done' : ''}`}
        onClick={() => { setHintLevel(0); onStart(item.id); }}>
        <span className="lesson-number">{completed.includes(item.id) ? '✓' : `0${item.number}`}</span>
        <span><b>{item.title}</b></span>
      </button>)}
    </div>
    <div className="lesson-workspace">
      <div className="lesson-task"><h3>实验 {lesson.number}：{lesson.title}</h3>{session.phase !== 'experiment' && <p>{lesson.task}</p>}
        <ol className="lesson-path">{['先预测', '动手修改', '解释结果', '完成实验'].map((label, index) => <li key={label} className={index === phaseIndex ? 'active' : index < phaseIndex ? 'done' : ''}><span>{index < phaseIndex ? '✓' : index + 1}</span>{label}</li>)}</ol>
        {session.phase === 'experiment' && <><button className="text-button hint-button" onClick={() => setHintLevel(Math.min(hintLevel + 1, 2))}>{hintLevel === 0 ? '给我一点提示' : hintLevel === 1 ? '再给一点提示' : '提示已展开'}</button>
          {hintLevel > 0 && <p className="lesson-hint">{hintLevel === 1 ? lesson.hint : lesson.deeperHint}</p>}</>}
      </div>
      <div className="lesson-interaction" data-testid="lesson-interaction">
        {session.phase === 'predict' && <><QuestionChoices question={lesson.prediction} value={session.predictionChoice} onChange={onPredict} />
          <div className="lesson-action-row"><span>先记录你的判断，再开放编辑。</span><button className="button primary" disabled={session.predictionChoice === null} onClick={onBegin}>记录预测，开始实验<Icon name="arrow" size={16} /></button></div></>}
        {session.phase === 'experiment' && <details className="recorded-prediction"><summary>查看已记录的预测</summary><p>{lesson.prediction.options[session.prediction!]}</p></details>}
        {(session.phase === 'explain' || session.phase === 'complete') && <>
          {session.phase === 'explain' && <><div className="learning-feedback success"><b>{session.goalFeedback!.feedback}</b><p>{session.observation!.explanation}</p></div>
          <details className={`prediction-feedback ${predictionCorrect ? 'correct' : 'revised'}`}><summary>{predictionCorrect ? '你的首次预测正确' : '用观察修正了首次预测'}</summary><p><MathText>{lesson.prediction.explanation}</MathText></p></details></>}
          {session.phase === 'explain' && <><QuestionChoices question={lesson.comprehension} value={session.comprehensionChoice} onChange={onAnswerChoice} />
            {session.comprehensionCorrect === false && <div className="learning-feedback pending" role="status"><b>再想一想</b><p><MathText>{lesson.comprehension.retryHint}</MathText>首次回答会保留在学习记录中。</p></div>}
            <div className="lesson-action-row comprehension-actions"><button className="button primary" disabled={session.comprehensionChoice === null} onClick={onAnswer}>提交理解题</button></div></>}
          {session.phase === 'complete' && <><div className="completion-explanation"><b>理解题已通过</b><p><MathText>{lesson.comprehension.explanation}</MathText></p><small>理解题作答 {session.comprehensionAnswers.length} 次 · 完成进度已更新</small></div>
            <details className="completed-record"><summary>查看本次实验记录</summary><p>{session.observation!.explanation}</p><p>首次预测：{lesson.prediction.options[session.prediction!]}</p></details>
            <div className="lesson-action-row"><button className="text-button" onClick={() => { setHintLevel(0); onStart(lesson.id); }}>重新实验</button><button className="button primary" onClick={() => { setHintLevel(0); if (nextLesson) onStart(nextLesson.id); else onSummary(); }}>{nextLesson ? '下一个实验' : '查看实验总结'}<Icon name="arrow" size={16} /></button></div>
            {!nextLesson && <button className="text-button" onClick={onAssessment}>直接进入理解自测</button>}</>}
        </>}
      </div>
    </div>
  </section>;
}
