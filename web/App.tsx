import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { computeAttention } from '../src/index.ts';
import { createLabState, labReducer } from './state.ts';
import { TOKEN_NAMES } from './format.ts';
import { VectorEditor } from './components/VectorEditor.tsx';
import { Calculation } from './components/Calculation.tsx';
import { Results } from './components/Results.tsx';
import { HelpDialog } from './components/HelpDialog.tsx';
import { Icon } from './components/Icon.tsx';
import { GuidedLessons } from './components/GuidedLessons.tsx';
import { Assessment } from './components/Assessment.tsx';
import { AttentionHeatmap } from './components/AttentionHeatmap.tsx';
import { LESSONS, createLessonInput, getLesson } from './learning/lessons.ts';
import type { LessonId } from './learning/lessons.ts';
import { addAssessmentRecord, addLessonRecord, completedLessons, exportProgress } from './learning/progress.ts';
import { answerComprehension, beginExperiment, checkExperiment, chooseComprehension, choosePrediction, createSession } from './learning/session.ts';
import type { LessonSession } from './learning/session.ts';
import type { LabState } from './state.ts';
import { useLearningProgress } from './learning/useLearningProgress.ts';

export function App() {
  const [state, dispatch] = useReducer(labReducer, undefined, createLabState);
  const [playing, setPlaying] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [mode, setMode] = useState<'free' | 'guided' | 'assessment'>('free');
  const [session, setSession] = useState<LessonSession | null>(null);
  const freeSnapshot = useRef<LabState | null>(null);
  const { progress, setProgress, storageAvailable } = useLearningProgress();
  const completed = completedLessons(progress);
  const result = useMemo(() => computeAttention(state.input), [state.input]);
  const baselineResult = useMemo(() => computeAttention(state.baseline), [state.baseline]);
  const hasChanges = useMemo(() => JSON.stringify(state.input) !== JSON.stringify(state.baseline), [state.input, state.baseline]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (state.step === 3) setPlaying(false);
      else dispatch({ type: 'select-step', step: state.step + 1 });
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [playing, state.step]);

  useEffect(() => {
    if (!announcement) return;
    const timer = window.setTimeout(() => setAnnouncement(''), 4000);
    return () => window.clearTimeout(timer);
  }, [announcement]);

  const selectStep = (step: number) => { setPlaying(false); dispatch({ type: 'select-step', step }); };
  const startLesson = (id: LessonId) => {
    if (mode === 'free') freeSnapshot.current = state;
    const lesson = getLesson(id);
    setPlaying(false);
    dispatch({ type: 'load-lesson', input: createLessonInput(), kind: lesson.kind, token: lesson.token, step: lesson.step });
    setSession(createSession(id, new Date().toISOString()));
    setMode('guided');
  };
  const enterGuided = () => {
    if (mode === 'assessment' && session && state.editPolicy) { setMode('guided'); return; }
    startLesson(LESSONS.find((lesson) => !completed.includes(lesson.id))?.id ?? 'focus');
  };
  const enterFree = () => {
    if (mode === 'free') return;
    setPlaying(false);
    dispatch({ type: 'resume-free', state: freeSnapshot.current ?? createLabState() });
    setSession(null);
    setMode('free');
  };
  const enterAssessment = () => {
    if (mode === 'free') freeSnapshot.current = state;
    setPlaying(false);
    setMode('assessment');
  };
  const downloadProgress = () => {
    const blob = new Blob([exportProgress(progress, new Date().toISOString())], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'attention-lab-learning.json';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setAnnouncement('已导出匿名学习记录');
  };
  const resetExperiment = () => {
    setPlaying(false);
    if (mode === 'guided' && session) { startLesson(session.lessonId); setAnnouncement('已重新开始本实验，已完成进度保留'); }
    else { dispatch({ type: 'reset' }); setAnnouncement('已恢复初始实验，基线也已重置'); }
  };

  return <>
    <header className="site-header"><div className="header-inner">
      <a className="brand" href="./" aria-label="Attention Lab 首页"><svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#7560df" /><path d="m11 28 9-17 9 17M15 23h10" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /><circle cx="29" cy="28" r="2.4" fill="#b6ebd6" /></svg><span>Attention<span className="brand-light"> Lab</span><small>注意力实验室</small></span></a>
      <div className="header-right"><span className="mode-pill"><span className="live-dot" />{mode === 'free' ? '自由探索' : mode === 'guided' ? '引导实验' : '理解自测'}</span><button className="text-button" onClick={() => setHelpOpen(true)}><Icon name="info" size={17} />使用说明</button><a className="github-link" href="https://github.com/ZeshanZheng/attention-lab" target="_blank" rel="noreferrer" aria-label="查看 GitHub 项目（新窗口）"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .9a11.1 11.1 0 0 0-3.5 21.6c.6.1.8-.3.8-.5v-2.1c-3.4.7-4.1-1.4-4.1-1.4-.5-1.3-1.2-1.6-1.2-1.6-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.6-1.4-5.6-6.2 0-1.4.5-2.5 1.2-3.4-.1-.3-.5-1.6.2-3.3 0 0 1-.3 3.5 1.3a12 12 0 0 1 6.4 0c2.4-1.6 3.4-1.3 3.4-1.3.7 1.7.3 3 .2 3.3.8.9 1.3 2 1.3 3.4 0 4.8-2.9 5.9-5.6 6.2.4.4.8 1.1.8 2.3V22c0 .3.2.6.8.5A11.1 11.1 0 0 0 12 .9Z" /></svg></a></div>
    </div></header>
    <main className="main-shell">
      <div className="page-intro"><div><div className="intro-label"><span className="eyebrow">LEARN BY EXPLORING</span><span className="label-line" /></div><h1>动一个向量，<span>看懂注意力。</span></h1><p>从匹配得分到信息聚合，用一场小实验拆解 Attention。</p></div>
        {mode !== 'assessment' && <div className="intro-actions"><button className="button secondary" onClick={resetExperiment}><Icon name="reset" />重置实验</button><button className="button primary" disabled={mode === 'guided'} onClick={() => { dispatch({ type: 'save-baseline' }); setAnnouncement('已保存当前参数作为对比基线'); }}><Icon name="save" size={17} />保存基线</button></div>}
      </div>
      <div className="learning-navigation"><div className="learning-tabs" role="group" aria-label="学习模式">
        <button aria-pressed={mode === 'free'} className={mode === 'free' ? 'active' : ''} onClick={enterFree}>自由探索</button>
        <button aria-pressed={mode === 'guided'} className={mode === 'guided' ? 'active' : ''} onClick={() => { if (mode !== 'guided') enterGuided(); }}>引导实验</button>
        <button aria-pressed={mode === 'assessment'} className={mode === 'assessment' ? 'active' : ''} onClick={enterAssessment}>理解自测</button>
      </div><div className="progress-actions"><span data-testid="saved-progress">实验进度 {completed.length} / 3</span><button className="text-button" onClick={downloadProgress}><Icon name="save" size={14} />导出记录</button></div></div>
      {!storageAvailable && <p className="storage-notice" role="status">浏览器暂不能保存学习进度；本页仍可学习，离开前可导出记录。</p>}
      {mode === 'free' && <div className="learning-entry"><span><b>从观察，到理解</b>三个引导实验，先预测，再用实际计算验证。</span><button className="text-button" onClick={enterGuided}>开始引导实验<Icon name="arrow" size={15} /></button></div>}
      {mode === 'guided' && session && <GuidedLessons key={`${session.lessonId}-${session.startedAt}`} session={session} completed={completed} onStart={startLesson}
        onPredict={(choice) => setSession(choosePrediction(session, choice))}
        onBegin={() => { const next = beginExperiment(session); setSession(next); dispatch({ type: 'allow-lesson-editing', enabled: next.phase === 'experiment' }); }}
        onCheck={() => { const next = checkExperiment(session, state.input); setSession(next); if (next.phase === 'explain') { setPlaying(false); dispatch({ type: 'allow-lesson-editing', enabled: false }); } }}
        onAnswerChoice={(choice) => setSession(chooseComprehension(session, choice))}
        onAnswer={() => { const outcome = answerComprehension(session, new Date().toISOString()); setSession(outcome.session); if (outcome.record) setProgress((previous) => addLessonRecord(previous, outcome.record!)); }}
        onAssessment={enterAssessment} />}
      {mode === 'assessment' && <Assessment progress={progress} onGuided={enterGuided} onExport={downloadProgress}
        onSubmit={(record) => setProgress((previous) => addAssessmentRecord(previous, record))} />}
      {mode !== 'assessment' && <>
      <div className="experiment-toolbar"><div className="observation-control"><span className="section-label">观察谁的 Query</span><div className="segmented" aria-label="观察 Query">
        {TOKEN_NAMES.map((name, index) => <button key={name} aria-label={`观察词元 ${name}`} aria-pressed={state.selectedQueryIndex === index} disabled={mode === 'guided'} className={state.selectedQueryIndex === index ? 'active' : ''} onClick={() => dispatch({ type: 'select-query', index })}>词元 {name}</button>)}
      </div></div><div className="experiment-meta"><span>3 个词元</span><span>2 维向量</span><span>单头 Attention</span></div></div>
      <div className="lab-grid"><VectorEditor state={state} dispatch={dispatch} /><Calculation input={state.input} result={result} query={state.selectedQueryIndex} step={state.step} playing={playing} onStep={selectStep}
        onPlay={() => { if (!playing && state.step === 3) dispatch({ type: 'select-step', step: 0 }); setPlaying(!playing); }} /><Results current={result} baseline={baselineResult} query={state.selectedQueryIndex} hasChanges={hasChanges} /></div>
      <AttentionHeatmap current={result} baseline={baselineResult} query={state.selectedQueryIndex}
        onSelectQuery={mode === 'free' ? (index) => dispatch({ type: 'select-query', index }) : undefined} />
      <div className="baseline-footer"><span><i className={hasChanges ? 'changed-dot' : 'neutral-dot'} />{hasChanges ? '当前参数与基线不同' : '当前参数与基线相同'}</span><button className="text-button" disabled={!hasChanges || mode === 'guided' && session?.phase !== 'experiment'} onClick={() => { setPlaying(false); dispatch({ type: 'restore-baseline' }); setAnnouncement('已恢复保存的基线参数'); }}>恢复基线<Icon name="reset" size={14} /></button></div>
      </>}
      <footer className="page-footer"><p>人为设定的教学向量 · 输出为聚合向量，不是下一词预测</p><span>小规模，可手算，可探索。</span></footer>
    </main>
    <div className={`toast ${announcement ? 'visible' : ''}`} role="status" aria-live="polite">{announcement}</div>
    {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
  </>;
}
