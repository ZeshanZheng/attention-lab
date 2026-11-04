import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { computeAttention } from '../src/index.ts';
import { createLabState, labReducer } from './state.ts';
import { TOKEN_NAMES } from './format.ts';
import { VectorEditor } from './components/VectorEditor.tsx';
import { Calculation } from './components/Calculation.tsx';
import { Results } from './components/Results.tsx';
import { HelpPage } from './components/HelpPage.tsx';
import { WelcomePage } from './components/WelcomePage.tsx';
import { ModuleInstructions } from './components/ModuleInstructions.tsx';
import { Icon } from './components/Icon.tsx';
import { GuidedLessons } from './components/GuidedLessons.tsx';
import { Assessment } from './components/Assessment.tsx';
import { AttentionHeatmap } from './components/AttentionHeatmap.tsx';
import { ConceptSummary } from './components/ConceptSummary.tsx';
import { LearningIntroduction } from './components/LearningIntroduction.tsx';
import { SentenceExample } from './components/SentenceExample.tsx';
import { MultiHeadAttention } from './components/MultiHeadAttention.tsx';
import { AttentionTypes } from './components/AttentionTypes.tsx';
import { LESSONS, createLessonInput, getLesson } from './learning/lessons.ts';
import type { LessonId } from './learning/lessons.ts';
import { addAssessmentRecord, addLessonRecord, completedLessons, exportProgress } from './learning/progress.ts';
import { answerComprehension, beginExperiment, checkExperiment, chooseComprehension, choosePrediction, createSession } from './learning/session.ts';
import type { LessonSession } from './learning/session.ts';
import type { LabState } from './state.ts';
import { useLearningProgress } from './learning/useLearningProgress.ts';

type ReadingView = 'help' | 'introduction' | 'example' | 'summary' | 'multihead' | 'types';
const VIEW_LABELS = { help: '使用说明', introduction: 'Attention 引言', example: '小栗子🌰', summary: '实验总结', multihead: '多头注意力', types: '三种 Attention', free: '自由探索', guided: '引导实验', assessment: '理解自测' };
type LearningView = keyof typeof VIEW_LABELS;
const MODULE_ORDER = ['help', 'introduction', 'example', 'free', 'summary', 'guided', 'assessment', 'multihead', 'types'] as const satisfies readonly LearningView[];

export function App() {
  const [entered, setEntered] = useState(false);
  return entered ? <Laboratory /> : <WelcomePage onEnter={() => setEntered(true)} />;
}

function Laboratory() {
  const [state, dispatch] = useReducer(labReducer, undefined, createLabState);
  const [coordinateStep, setCoordinateStep] = useState(1);
  const [announcement, setAnnouncement] = useState('');
  const [mode, setMode] = useState<'free' | 'guided' | 'assessment'>('free');
  const [readingView, setReadingView] = useState<ReadingView | null>('help');
  const activeView = readingView ?? mode;
  const nextView = MODULE_ORDER[(MODULE_ORDER.indexOf(activeView) + 1) % MODULE_ORDER.length]!;
  const [session, setSession] = useState<LessonSession | null>(null);
  const freeSnapshot = useRef<LabState | null>(null);
  const editorRef = useRef<HTMLElement>(null);
  const guidedRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);
  const { progress, setProgress, storageAvailable } = useLearningProgress();
  const completed = completedLessons(progress);
  const result = useMemo(() => computeAttention(state.input), [state.input]);
  const baselineResult = useMemo(() => computeAttention(state.baseline), [state.baseline]);
  const hasChanges = useMemo(() => JSON.stringify(state.input) !== JSON.stringify(state.baseline), [state.input, state.baseline]);
  const activeLesson = session ? getLesson(session.lessonId) : null;
  const locateEditor = () => {
    editorRef.current?.scrollIntoView({ block: 'start' });
    editorRef.current?.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (readingView !== null || mode !== 'guided' || !session) return;
    if (session.phase === 'experiment') locateEditor();
    else if (session.phase === 'explain' || session.phase === 'complete') guidedRef.current?.querySelector<HTMLElement>('.lesson-interaction')?.scrollIntoView({ block: 'start' });
    else guidedRef.current?.scrollIntoView({ block: 'start' });
  }, [mode, readingView, session?.phase, session?.lessonId]);

  useEffect(() => {
    if (activeView === 'guided') return;
    navigationRef.current?.scrollIntoView({ block: 'start' });
    navigationRef.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus({ preventScroll: true });
  }, [activeView]);

  useEffect(() => {
    if (!announcement) return;
    const timer = window.setTimeout(() => setAnnouncement(''), 4000);
    return () => window.clearTimeout(timer);
  }, [announcement]);

  const selectStep = (step: number) => dispatch({ type: 'select-step', step });
  const startLesson = (id: LessonId) => {
    setReadingView(null);
    if (mode === 'free') freeSnapshot.current = state;
    const lesson = getLesson(id);
    dispatch({ type: 'load-lesson', input: createLessonInput(), kind: lesson.kind, token: lesson.token, step: lesson.step });
    setSession(createSession(id, new Date().toISOString()));
    setMode('guided');
  };
  const enterGuided = () => {
    setReadingView(null);
    if (mode === 'guided' && session) return;
    if (mode === 'assessment' && session && state.editPolicy) { setMode('guided'); return; }
    startLesson(LESSONS.find((lesson) => !completed.includes(lesson.id))?.id ?? 'focus');
  };
  const enterFree = () => {
    setReadingView(null);
    if (mode === 'free') return;
    dispatch({ type: 'resume-free', state: freeSnapshot.current ?? createLabState() });
    setSession(null);
    setMode('free');
  };
  const enterAssessment = () => {
    setReadingView(null);
    if (mode === 'free') freeSnapshot.current = state;
    setMode('assessment');
  };
  const enterReading = (view: ReadingView) => setReadingView(view);
  const enterModule = (view: LearningView) => {
    if (view === 'free') enterFree();
    else if (view === 'guided') enterGuided();
    else if (view === 'assessment') enterAssessment();
    else enterReading(view);
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
    if (mode === 'guided' && session) { startLesson(session.lessonId); setAnnouncement('已重新开始本实验，已完成进度保留'); }
    else { dispatch({ type: 'reset' }); setAnnouncement('已恢复初始实验，基线也已重置'); }
  };
  const checkCurrentExperiment = () => {
    if (!session) return;
    const next = checkExperiment(session, state.input);
    setSession(next);
    if (next.phase === 'explain') dispatch({ type: 'allow-lesson-editing', enabled: false });
    else setAnnouncement(next.goalFeedback?.feedback ?? '继续修改，再检查结果');
  };

  return <>
    <header className="site-header"><div className="header-inner">
      <a className="brand" href="./" aria-label="Attention Lab 首页"><svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#7560df" /><path d="m11 28 9-17 9 17M15 23h10" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /><circle cx="29" cy="28" r="2.4" fill="#b6ebd6" /></svg><span>Attention<span className="brand-light"> Lab</span><small>注意力实验室</small></span></a>
      <div className="header-right"><span className="mode-pill"><span className="live-dot" />{VIEW_LABELS[activeView]}</span><a className="github-link" href="https://github.com/ZeshanZheng/attention-lab" target="_blank" rel="noreferrer" aria-label="查看 GitHub 项目（新窗口）"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .9a11.1 11.1 0 0 0-3.5 21.6c.6.1.8-.3.8-.5v-2.1c-3.4.7-4.1-1.4-4.1-1.4-.5-1.3-1.2-1.6-1.2-1.6-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.6-1.4-5.6-6.2 0-1.4.5-2.5 1.2-3.4-.1-.3-.5-1.6.2-3.3 0 0 1-.3 3.5 1.3a12 12 0 0 1 6.4 0c2.4-1.6 3.4-1.3 3.4-1.3.7 1.7.3 3 .2 3.3.8.9 1.3 2 1.3 3.4 0 4.8-2.9 5.9-5.6 6.2.4.4.8 1.1.8 2.3V22c0 .3.2.6.8.5A11.1 11.1 0 0 0 12 .9Z" /></svg></a></div>
    </div></header>
    <main className="main-shell">
      <div ref={navigationRef} className="learning-navigation"><div className="learning-tabs" role="group" aria-label="学习模式">
        {MODULE_ORDER.map((view) => <button key={view} aria-pressed={activeView === view} className={activeView === view ? 'active' : ''} onClick={() => enterModule(view)}>{VIEW_LABELS[view]}</button>)}
      </div><div className="progress-actions"><span data-testid="saved-progress">实验进度 {completed.length} / 3</span><button className="text-button" onClick={downloadProgress}><Icon name="save" size={14} />导出记录</button></div></div>
      {!storageAvailable && <p className="storage-notice" role="status">浏览器暂不能保存学习进度；本页仍可学习，离开前可导出记录。</p>}
      {readingView === null && mode !== 'assessment' && <div className={`page-intro ${mode === 'free' ? 'free-exploration-intro' : 'experiment-actions-only'}`}>
        {mode === 'free' && <div><h1>通过改变一个向量来看懂注意力</h1><p>从匹配得分到信息聚合，用一场小实验拆解 Attention。</p></div>}
        <div className="intro-actions"><button className="button secondary" onClick={resetExperiment}><Icon name="reset" />重置实验</button><button className="button primary" disabled={mode === 'guided'} onClick={() => { dispatch({ type: 'save-baseline' }); setAnnouncement('已保存当前参数作为对比基线'); }}><Icon name="save" size={17} />保存基线</button></div>
      </div>}
      <div hidden={readingView !== 'help'}><HelpPage onNavigate={enterModule} /></div>
      <div hidden={readingView !== 'introduction'}><LearningIntroduction /></div>
      <div hidden={readingView !== 'example'}><SentenceExample /></div>
      <div hidden={readingView !== 'summary'}><ConceptSummary /></div>
      <div hidden={readingView !== 'multihead'}><MultiHeadAttention /></div>
      <div hidden={readingView !== 'types'}><AttentionTypes /></div>
      {readingView === null && mode === 'free' && <>
        <section className="free-experiment-scope" aria-labelledby="free-experiment-scope-title">
          <h2 id="free-experiment-scope-title">关于这个小实验</h2>
          <p>本实验用三个词元、二维向量和单个注意力头，把一次“匹配 → 分配比例 → 聚合内容”展开。真实 Transformer 会学习 Q/K/V 的投影，并用多个注意力头从不同角度聚合信息；先理解一个头，更容易理解这些扩展。</p>
          <p>这里的 A、B、C 和 Q/K/V 都是人为设定的教学数据，没有训练语言模型。输出是聚合向量，得到下一个词还需要其他模块；热力图显示分配比例，单看它不足以解释模型的全部行为。</p>
          <p>点积是匹配得分，不是余弦相似度。本实验没有加入训练、位置编码和多头机制。</p>
        </section>
        <ModuleInstructions title="自由探索操作说明">
          <ol className="guide-list">
            <li><b>选择观察对象</b><span>页面上方选择 A、B 或 C，观察它的 Query 如何关注其他词元。</span></li>
            <li><b>改变一个向量</b><span>选中编辑词元，输入数字，或拖动 Q/K/V 的圆点。默认拖动和方向键按整数调整，可切换为 0.1 步长；直接输入可用小数。向量各坐标范围为 −5 到 5。</span></li>
            <li><b>沿着四步计算走一遍</b><span>每一步说明输入、结果、用途和符号含义，并用当前数值举例。点击步骤标签，或使用“上一步”“下一步”，按自己的节奏阅读。</span></li>
            <li><b>比较修改前后</b><span>默认基线是初始实验。也可以保存当前参数作为新基线，或恢复基线继续实验。</span></li>
          </ol>
        </ModuleInstructions>
        <div className="learning-entry"><span><b>从观察，到理解</b>三个引导实验，先预测，再用实际计算验证。</span><button className="text-button" onClick={enterGuided}>开始引导实验<Icon name="arrow" size={15} /></button></div>
      </>}
      {mode === 'guided' && session && <div hidden={readingView !== null} ref={guidedRef} className="guided-anchor"><GuidedLessons key={`${session.lessonId}-${session.startedAt}`} session={session} completed={completed} onStart={startLesson}
        onPredict={(choice) => setSession(choosePrediction(session, choice))}
        onBegin={() => { const next = beginExperiment(session); setSession(next); dispatch({ type: 'allow-lesson-editing', enabled: next.phase === 'experiment' }); }}
        onCheck={checkCurrentExperiment} onLocate={locateEditor}
        onAnswerChoice={(choice) => setSession(chooseComprehension(session, choice))}
        onAnswer={() => { const outcome = answerComprehension(session, new Date().toISOString()); setSession(outcome.session); if (outcome.record) setProgress((previous) => addLessonRecord(previous, outcome.record!)); }}
        onAssessment={enterAssessment} onSummary={() => enterReading('summary')} /></div>}
      {mode === 'assessment' && <div hidden={readingView !== null}><Assessment progress={progress} onGuided={enterGuided} onExport={downloadProgress}
        onSubmit={(record) => setProgress((previous) => addAssessmentRecord(previous, record))} /></div>}
      {mode !== 'assessment' && <div hidden={readingView !== null}>
      {mode === 'guided' && session?.phase === 'experiment' && activeLesson && <div className="guided-taskbar" role="region" aria-label="当前实验目标"><div><b>现在修改：词元 {TOKEN_NAMES[activeLesson.token]} 的 {activeLesson.kind === 'keys' ? 'K' : 'V'}</b><p>{activeLesson.task}</p>{session.goalFeedback && <p role="status">{session.goalFeedback.feedback}</p>}</div><div className="taskbar-actions"><button className="button secondary" onClick={locateEditor}>定位输入框</button><button className="button primary" onClick={checkCurrentExperiment}>检查当前修改</button></div></div>}
      <div className="experiment-toolbar"><div className="observation-control"><span className="section-label">观察谁的 Query</span><div className="segmented" aria-label="观察 Query">
        {TOKEN_NAMES.map((name, index) => <button key={name} aria-label={`观察词元 ${name}`} aria-pressed={state.selectedQueryIndex === index} disabled={mode === 'guided'} className={state.selectedQueryIndex === index ? 'active' : ''} onClick={() => dispatch({ type: 'select-query', index })}>词元 {name}</button>)}
      </div></div><div className="experiment-meta"><span>3 个词元</span><span>2 维向量</span><span>单头 Attention</span></div></div>
      <div className="lab-grid"><VectorEditor state={state} dispatch={dispatch} editorRef={editorRef} coordinateStep={coordinateStep} onCoordinateStep={setCoordinateStep} /><Calculation input={state.input} result={result} query={state.selectedQueryIndex} step={state.step} onStep={selectStep} /><Results current={result} baseline={baselineResult} query={state.selectedQueryIndex} hasChanges={hasChanges} /></div>
      <AttentionHeatmap current={result} baseline={baselineResult} query={state.selectedQueryIndex}
        onSelectQuery={mode === 'free' ? (index) => dispatch({ type: 'select-query', index }) : undefined} />
      <div className="baseline-footer"><span><i className={hasChanges ? 'changed-dot' : 'neutral-dot'} />{hasChanges ? '当前参数与基线不同' : '当前参数与基线相同'}</span><button className="text-button" disabled={!hasChanges || mode === 'guided' && session?.phase !== 'experiment'} onClick={() => { dispatch({ type: 'restore-baseline' }); setAnnouncement('已恢复保存的基线参数'); }}>恢复基线<Icon name="reset" size={14} /></button></div>
      </div>}
      <nav className="module-next" aria-label="下一模块"><button className="button primary" onClick={() => enterModule(nextView)}>{nextView === 'help' ? '返回使用说明' : `进入${VIEW_LABELS[nextView]}模块`}<Icon name="arrow" size={17} /></button></nav>
    </main>
    <div className={`toast ${announcement ? 'visible' : ''}`} role="status" aria-live="polite">{announcement}</div>
  </>;
}
