import { useEffect, useState } from 'react';
import type { Dispatch, RefObject } from 'react';
import { TOKEN_NAMES, TOKEN_COLORS } from '../format.ts';
import { VECTOR_LIMIT } from '../state.ts';
import type { LabAction, LabState, VectorKind } from '../state.ts';
import { VectorPlane } from './VectorPlane.tsx';

const vectorKinds: readonly { key: VectorKind; letter: string; name: string; description: string }[] = [
  { key: 'queries', letter: 'Q', name: '查询', description: '我在寻找什么？与所有 K 匹配，决定当前词元关注谁。' },
  { key: 'keys', letter: 'K', name: '键', description: '我能被怎样找到？修改 K，观察匹配得分和权重的变化。' },
  { key: 'values', letter: 'V', name: '值', description: '我传递什么信息？修改 V，观察权重不变时输出如何变化。' },
];

function CoordinateInput({ value, label, onChange, onFocus, disabled, step }: { value: number; label: string; onChange: (value: number) => void; onFocus: () => void; disabled: boolean; step: number }) {
  const [draft, setDraft] = useState(String(value));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => { setDraft(String(value)); setInvalid(false); }, [value]);
  return <div className="coordinate-field">
    <input type="number" aria-label={label} aria-invalid={invalid} min={-VECTOR_LIMIT} max={VECTOR_LIMIT} step={step} value={draft} onFocus={onFocus} disabled={disabled}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        const number = Number(text);
        const valid = text.trim() !== '' && Number.isFinite(number) && Math.abs(number) <= VECTOR_LIMIT;
        setInvalid(!valid);
        if (valid) onChange(number);
      }}
      onBlur={() => { if (invalid) { setDraft(String(value)); setInvalid(false); } }} />
    {invalid && <span className="field-error" role="alert">请输入 −5 到 5</span>}
  </div>;
}

export function VectorEditor({ state, dispatch, editorRef, coordinateStep, onCoordinateStep }: { state: LabState; dispatch: Dispatch<LabAction>; editorRef: RefObject<HTMLElement | null>; coordinateStep: number; onCoordinateStep: (step: number) => void }) {
  const [plotOpen, setPlotOpen] = useState(() => !window.matchMedia('(max-width: 700px)').matches);
  const token = state.editingTokenIndex;
  const kind = vectorKinds.find((item) => item.key === (state.editPolicy?.kind ?? state.vectorKind))!;
  const row = (item: typeof vectorKinds[number]) => <div key={`${token}-${item.key}`} className={`coordinate-row ${item.key === kind.key ? 'active-row' : ''} ${state.editPolicy?.enabled && item.key === state.editPolicy.kind ? 'editable-target' : ''}`}>
    <span className={`vector-kind-label kind-${item.letter}`}><b>{item.letter}</b><span>{item.name}</span></span>
    {[0, 1].map((coordinate) => <CoordinateInput key={coordinate} value={state.input[item.key][token]![coordinate]!}
      label={`词元 ${TOKEN_NAMES[token]} 的 ${item.letter} ${coordinate === 0 ? 'x' : 'y'}`} step={coordinateStep}
      disabled={state.editPolicy !== null && (!state.editPolicy.enabled || item.key !== state.editPolicy.kind || token !== state.editPolicy.token)}
      onFocus={() => dispatch({ type: 'select-kind', kind: item.key })}
      onChange={(value) => {
        const vector = [...state.input[item.key][token]!] as [number, number];
        vector[coordinate] = value;
        dispatch({ type: 'edit-vector', kind: item.key, token, vector });
      }} />)}
  </div>;
  return <section ref={editorRef} className={`card editor-card ${state.editPolicy?.enabled ? 'guided-editor' : ''}`} aria-labelledby="editor-title">
    <div className="card-heading"><div><h2 id="editor-title">编辑输入向量</h2></div><span className="quiet-tag">二维</span></div>
    {state.editPolicy ? <p className="target-vector-label">词元 {TOKEN_NAMES[token]} · {kind.letter}（{kind.name}）</p> : <>
    <p className="section-label">编辑哪个词元</p>
    <div className="token-picker" aria-label="编辑词元">
      {TOKEN_NAMES.map((name, index) => <button key={name} className={`token-button ${index === token ? 'selected' : ''}`} aria-pressed={index === token} aria-label={`编辑词元 ${name}`} onClick={() => dispatch({ type: 'select-token', index })}>
        <span className="token-dot" style={{ background: TOKEN_COLORS[index] }} />词元 {name}
      </button>)}
    </div>
    <div className="vector-type-picker segmented" role="group" aria-label="选择向量类型">{vectorKinds.map((item) => <button key={item.key} aria-label={`在坐标图编辑 ${item.letter}`} aria-pressed={kind.key === item.key} className={kind.key === item.key ? 'active' : ''} onClick={() => dispatch({ type: 'select-kind', kind: item.key })}>{item.letter} · {item.name}</button>)}</div>
    </>}
    <div className="coordinate-table"><div className="coordinate-head"><span>向量</span><span>x</span><span>y</span></div>{row(kind)}
    </div>
    {state.editPolicy && <details className="other-vectors"><summary>查看其他向量</summary><div className="coordinate-table"><div className="coordinate-head"><span>向量</span><span>x</span><span>y</span></div>{vectorKinds.filter((item) => item.key !== kind.key).map(row)}</div></details>}
    <label className="coordinate-step-control">调整步长<select aria-label="坐标调整步长" value={coordinateStep} onChange={(event) => onCoordinateStep(Number(event.target.value))}><option value={1}>整数 · 每次 1</option><option value={0.1}>小数 · 每次 0.1</option></select></label>
    <details className="vector-visualization" open={plotOpen} onToggle={(event) => setPlotOpen(event.currentTarget.open)}><summary>{kind.letter} 向量空间<span className="plane-edit-hint"> · 拖动圆点调整</span></summary>
    <VectorPlane vectors={state.input[kind.key]} kind={kind.key} selectedToken={token} observedQuery={state.input.queries[state.selectedQueryIndex]!}
      observedToken={state.selectedQueryIndex} editPolicy={state.editPolicy} coordinateStep={coordinateStep} onSelect={(index) => dispatch({ type: 'select-token', index })}
      onChange={(index, vector) => dispatch({ type: 'edit-vector', kind: kind.key, token: index, vector })} /></details>
    <p className="vector-purpose">{kind.description}</p>
  </section>;
}
