import { useState } from 'react';
import { LESSONS, getLesson } from '../learning/lessons.ts';
import type { LessonId } from '../learning/lessons.ts';
import type { LessonSession } from '../learning/session.ts';
import { QuestionChoices } from './QuestionChoices.tsx';
import { Icon } from './Icon.tsx';

export function GuidedLessons({ session, completed, onStart, onPredict, onBegin, onCheck, onLocate, onAnswerChoice, onAnswer, onAssessment, onSummary }: {
  session: LessonSession; completed: readonly LessonId[];
  onStart: (id: LessonId) => void; onPredict: (choice: number) => void; onBegin: () => void; onCheck: () => void;
  onLocate: () => void;
  onSummary: () => void;
  onAnswerChoice: (choice: number) => void; onAnswer: () => void; onAssessment: () => void;
}) {
  const [hintLevel, setHintLevel] = useState(0);
  const lesson = getLesson(session.lessonId);
  const phaseIndex = ['predict', 'experiment', 'explain', 'complete'].indexOf(session.phase);
  const predictionCorrect = session.prediction === lesson.prediction.correctIndex;
  const nextLesson = LESSONS.find((item) => item.number === lesson.number + 1);

  return <section className="guided-learning" aria-labelledby="guided-title">
    <div className="learning-heading"><div><span className="eyebrow">GUIDED EXPERIMENTS</span><h2 id="guided-title">三次小实验，建立注意力直觉</h2></div><span className="learning-count" data-testid="lesson-progress">已完成 {completed.length} / 3</span></div>
    <div className="lesson-picker" aria-label="选择引导实验">
      {LESSONS.map((item) => <button key={item.id} aria-label={`实验 ${item.number}：${item.title}`} aria-pressed={item.id === lesson.id}
        className={`lesson-card ${item.id === lesson.id ? 'active' : ''} ${completed.includes(item.id) ? 'done' : ''}`}
        onClick={() => { setHintLevel(0); onStart(item.id); }}>
        <span className="lesson-number">{completed.includes(item.id) ? '✓' : `0${item.number}`}</span>
        <span><b>{item.title}</b><small>{item.subtitle}</small></span><span className="lesson-status">{completed.includes(item.id) ? '已完成' : '待探索'}</span>
      </button>)}
    </div>
    <div className="lesson-workspace">
      <div className="lesson-task"><span className="eyebrow purple">EXPERIMENT 0{lesson.number}</span><h3>{lesson.title}</h3><p>{lesson.task}</p>
        <ol className="lesson-path">{['先预测', '动手修改', '解释结果', '完成实验'].map((label, index) => <li key={label} className={index === phaseIndex ? 'active' : index < phaseIndex ? 'done' : ''}><span>{index < phaseIndex ? '✓' : index + 1}</span>{label}</li>)}</ol>
        <div className="learning-constraint"><Icon name="info" size={15} /><span>固定观察 A · 仅开放词元 {lesson.token === 0 ? 'A' : 'B'} 的 {lesson.kind === 'keys' ? 'K' : 'V'}</span></div>
        {session.phase === 'experiment' && <><button className="text-button hint-button" onClick={() => setHintLevel(Math.min(hintLevel + 1, 2))}>{hintLevel === 0 ? '给我一点提示' : hintLevel === 1 ? '再给一点提示' : '提示已展开'}</button>
          {hintLevel > 0 && <p className="lesson-hint">{hintLevel === 1 ? lesson.hint : lesson.deeperHint}</p>}</>}
      </div>
      <div className="lesson-interaction" data-testid="lesson-interaction">
        {session.phase === 'predict' && <><QuestionChoices question={lesson.prediction} value={session.predictionChoice} onChange={onPredict} />
          <div className="lesson-action-row"><span>先记录你的判断，再开放编辑。</span><button className="button primary" disabled={session.predictionChoice === null} onClick={onBegin}>记录预测，开始实验<Icon name="arrow" size={16} /></button></div></>}
        {session.phase === 'experiment' && <><div className="recorded-prediction"><span>你的预测已记录</span><p>{lesson.prediction.options[session.prediction!]}</p></div>
          <p className="experiment-instruction">已开放词元 {lesson.token === 0 ? 'A' : 'B'} 的 {lesson.kind === 'keys' ? 'K' : 'V'} 输入框，紫色边框标出可修改的一行。点击数字直接输入，或拖动坐标圆点；顶部目标栏会持续显示任务。</p>
          <button className="button secondary" onClick={onLocate}>前往可修改的输入框<Icon name="arrow" size={16} /></button>
          {session.goalFeedback && <div className="learning-feedback pending" role="status">{session.goalFeedback.feedback}</div>}
          <div className="lesson-action-row"><span>以实际计算结果判断目标是否达成。</span><button className="button primary" onClick={onCheck}>检查实验结果<Icon name="arrow" size={16} /></button></div></>}
        {(session.phase === 'explain' || session.phase === 'complete') && <>
          <div className="learning-feedback success"><b>{session.goalFeedback!.feedback}</b><p>{session.observation!.explanation}</p></div>
          <div className={`prediction-feedback ${predictionCorrect ? 'correct' : 'revised'}`}><b>{predictionCorrect ? '你的首次预测正确' : '用观察修正了首次预测'}</b><p>{lesson.prediction.explanation}</p></div>
          {session.phase === 'explain' && <><QuestionChoices question={lesson.comprehension} value={session.comprehensionChoice} onChange={onAnswerChoice} />
            {session.comprehensionCorrect === false && <div className="learning-feedback pending" role="status"><b>再想一想</b><p>{lesson.comprehension.retryHint}首次回答会保留在学习记录中。</p></div>}
            <div className="lesson-action-row"><span>解释清楚，才算完成这次实验。</span><button className="button primary" disabled={session.comprehensionChoice === null} onClick={onAnswer}>提交理解题</button></div></>}
          {session.phase === 'complete' && <><div className="completion-explanation"><b>理解题已通过</b><p>{lesson.comprehension.explanation}</p><small>理解题作答 {session.comprehensionAnswers.length} 次 · 完成进度已更新</small></div>
            {!nextLesson && <button className="text-button" onClick={onSummary}>查看实验总结</button>}
            <div className="lesson-action-row"><button className="text-button" onClick={() => { setHintLevel(0); onStart(lesson.id); }}>重新实验</button><button className="button primary" onClick={() => { setHintLevel(0); if (nextLesson) onStart(nextLesson.id); else onAssessment(); }}>{nextLesson ? '下一个实验' : '进入理解自测'}<Icon name="arrow" size={16} /></button></div></>}
        </>}
      </div>
    </div>
  </section>;
}
