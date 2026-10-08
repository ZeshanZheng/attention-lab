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
  const token = state.editingTokenIndex;
  const kind = vectorKinds.find((item) => item.key === state.vectorKind)!;
  return <section ref={editorRef} className={`card editor-card ${state.editPolicy?.enabled ? 'guided-editor' : ''}`} aria-labelledby="editor-title">
    <div className="card-heading"><div><span className="eyebrow">01 / INPUT</span><h2 id="editor-title">编辑输入向量</h2></div><span className="quiet-tag">二维</span></div>
    <p className="section-label">编辑哪个词元</p>
    <div className="token-picker" aria-label="编辑词元">
      {TOKEN_NAMES.map((name, index) => <button key={name} className={`token-button ${index === token ? 'selected' : ''}`} aria-pressed={index === token} disabled={state.editPolicy !== null && index !== state.editPolicy.token} aria-label={`编辑词元 ${name}`} onClick={() => dispatch({ type: 'select-token', index })}>
        <span className="token-dot" style={{ background: TOKEN_COLORS[index] }} />词元 {name}
      </button>)}
    </div>
    <div className="coordinate-table"><label className="coordinate-step-control">调整步长<select aria-label="坐标调整步长" value={coordinateStep} onChange={(event) => onCoordinateStep(Number(event.target.value))}><option value={1}>整数 · 每次 1</option><option value={0.1}>小数 · 每次 0.1</option></select></label><p className="coordinate-step-note">步长用于拖动和方向键；直接输入可用小数。</p>
      <div className="coordinate-head"><span>向量</span><span>x</span><span>y</span></div>
      {vectorKinds.map((item) => <div key={`${token}-${item.key}`} className={`coordinate-row ${state.vectorKind === item.key ? 'active-row' : ''} ${state.editPolicy?.enabled && item.key === state.editPolicy.kind ? 'editable-target' : ''}`}>
        <button className={`vector-kind-label kind-${item.letter}`} onClick={() => dispatch({ type: 'select-kind', kind: item.key })} aria-label={`在坐标图编辑 ${item.letter}`}><b>{item.letter}</b><span>{item.name}</span></button>
        {[0, 1].map((coordinate) => <CoordinateInput key={coordinate} value={state.input[item.key][token]![coordinate]!}
          label={`词元 ${TOKEN_NAMES[token]} 的 ${item.letter} ${coordinate === 0 ? 'x' : 'y'}`}
          step={coordinateStep}
          disabled={state.editPolicy !== null && (!state.editPolicy.enabled || item.key !== state.editPolicy.kind || token !== state.editPolicy.token)}
          onFocus={() => dispatch({ type: 'select-kind', kind: item.key })}
          onChange={(value) => {
            const vector = [...state.input[item.key][token]!] as [number, number];
            vector[coordinate] = value;
            dispatch({ type: 'edit-vector', kind: item.key, token, vector });
          }} />)}
      </div>)}
    </div>
    <div className="plane-heading"><span>向量空间</span><div className="segmented compact" aria-label="坐标图向量类型">
      {vectorKinds.map((item) => <button key={item.key} aria-pressed={state.vectorKind === item.key} className={state.vectorKind === item.key ? 'active' : ''} onClick={() => dispatch({ type: 'select-kind', kind: item.key })}>{item.letter}</button>)}
    </div></div>
    <VectorPlane vectors={state.input[state.vectorKind]} kind={state.vectorKind} selectedToken={token} observedQuery={state.input.queries[state.selectedQueryIndex]!}
      observedToken={state.selectedQueryIndex} editPolicy={state.editPolicy} coordinateStep={coordinateStep} onSelect={(index) => dispatch({ type: 'select-token', index })}
      onChange={(index, vector) => dispatch({ type: 'edit-vector', kind: state.vectorKind, token: index, vector })} />
    <div className={`concept-note note-${kind.letter}`}><b>{kind.letter} · {kind.name}</b><p>{kind.description}</p></div>
  </section>;
}
