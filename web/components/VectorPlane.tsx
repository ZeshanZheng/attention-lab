import { useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import type { Matrix, Vector } from '../../src/index.ts';
import { TOKEN_COLORS, TOKEN_NAMES, formatVector } from '../format.ts';
import { VECTOR_LIMIT } from '../state.ts';
import type { EditPolicy, VectorKind } from '../state.ts';

const CENTER = 140;
const UNIT = 23;
const kinds = { queries: 'Q', keys: 'K', values: 'V' } as const;
const snap = (value: number, step: number) => Math.max(-VECTOR_LIMIT, Math.min(VECTOR_LIMIT, Math.round(Math.round(value / step) * step * 10) / 10));
const move = (value: number, offset: number) => Math.max(-VECTOR_LIMIT, Math.min(VECTOR_LIMIT, Number((value + offset).toFixed(10))));

interface Props {
  vectors: Matrix;
  kind: VectorKind;
  selectedToken: number;
  observedQuery: Vector;
  observedToken: number;
  editPolicy: EditPolicy | null;
  coordinateStep: number;
  onSelect: (token: number) => void;
  onChange: (token: number, vector: readonly [number, number]) => void;
}

export function VectorPlane({ vectors, kind, selectedToken, observedQuery, observedToken, editPolicy, coordinateStep, onSelect, onChange }: Props) {
  const dragging = useRef<{ token: number; pointerId: number } | null>(null);
  const editable = (token: number) => editPolicy === null || editPolicy.enabled && token === editPolicy.token && kind === editPolicy.kind;
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragging.current || event.pointerId !== dragging.current.pointerId || !editable(dragging.current.token)) return;
    const transform = event.currentTarget.getScreenCTM();
    if (!transform) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(transform.inverse());
    onChange(dragging.current.token, [snap((point.x - CENTER) / UNIT, coordinateStep), snap((CENTER - point.y) / UNIT, coordinateStep)]);
  };
  const startDrag = (event: PointerEvent<SVGCircleElement>, token: number) => {
    if (event.button !== 0 || !editable(token)) return;
    event.preventDefault();
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    dragging.current = { token, pointerId: event.pointerId };
    svg.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    onSelect(token);
  };
  const moveWithKeyboard = (event: KeyboardEvent<SVGCircleElement>, token: number) => {
    if (!editable(token)) return;
    const delta = event.shiftKey ? 1 : coordinateStep;
    const vector = vectors[token]!;
    const offsets: Record<string, readonly [number, number]> = {
      ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, delta], ArrowDown: [0, -delta],
    };
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(token); }
    else if (offsets[event.key]) {
      event.preventDefault();
      onSelect(token);
      const offset = offsets[event.key]!;
      onChange(token, [offset[0] ? move(vector[0]!, offset[0]) : vector[0]!, offset[1] ? move(vector[1]!, offset[1]) : vector[1]!]);
    }
  };
  const finishDrag = () => { dragging.current = null; };

  return <div className="vector-plane-wrap">
    <svg className="vector-plane" viewBox="0 0 280 280" role="group" aria-label={`${kinds[kind]} 二维向量编辑器`}
      onPointerMove={onPointerMove} onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={finishDrag}>
      <defs>
        {TOKEN_COLORS.map((color, index) => <marker key={color} id={`vector-arrow-${index}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 6 3 0 6z" fill={color} /></marker>)}
      </defs>
      <rect x="0" y="0" width="280" height="280" rx="12" fill="#f8f9fc" />
      {Array.from({ length: 11 }, (_, index) => index - 5).map((tick) => <g key={tick}>
        <line x1={CENTER + tick * UNIT} x2={CENTER + tick * UNIT} y1="18" y2="262" stroke={tick === 0 ? '#c8cddc' : '#e8ebf2'} />
        <line y1={CENTER + tick * UNIT} y2={CENTER + tick * UNIT} x1="18" x2="262" stroke={tick === 0 ? '#c8cddc' : '#e8ebf2'} />
        {tick !== 0 && tick % 2 === 0 && <><text x={CENTER + tick * UNIT} y="154" className="axis-label" textAnchor="middle">{tick}</text><text x="132" y={CENTER - tick * UNIT + 4} className="axis-label" textAnchor="end">{tick}</text></>}
      </g>)}
      <text x="260" y="133" className="axis-label">x</text><text x="148" y="22" className="axis-label">y</text><text x="130" y="154" className="axis-label">0</text>
      {kind === 'keys' && <g className="query-reference" pointerEvents="none">
        <line x1={CENTER} y1={CENTER} x2={CENTER + observedQuery[0]! * UNIT} y2={CENTER - observedQuery[1]! * UNIT} stroke="#626c84" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx={CENTER + observedQuery[0]! * UNIT} cy={CENTER - observedQuery[1]! * UNIT} r="12" fill="none" stroke="#626c84" strokeDasharray="3 3" />
      </g>}
      {vectors.map((vector, index) => {
        const x = CENTER + vector[0]! * UNIT;
        const y = CENTER - vector[1]! * UNIT;
        return <g key={index}>
          <line x1={CENTER} y1={CENTER} x2={x} y2={y} stroke={TOKEN_COLORS[index]} strokeWidth={selectedToken === index ? 2.5 : 1.8} markerEnd={`url(#vector-arrow-${index})`} />
          <text x={x + (vector[0]! >= 0 ? 14 : -14)} y={y - 13 - (index === 2 ? 2 : 0)} textAnchor={vector[0]! >= 0 ? 'start' : 'end'} className="vector-label" fill={TOKEN_COLORS[index]}>{kinds[kind]}{TOKEN_NAMES[index]}</text>
          {selectedToken === index && <circle cx={x} cy={y} r="13" fill={TOKEN_COLORS[index]} opacity="0.12" pointerEvents="none" />}
          <circle cx={x} cy={y} r="7" fill={TOKEN_COLORS[index]} stroke="white" strokeWidth="2" tabIndex={editable(index) ? 0 : -1} role="button" aria-disabled={!editable(index)} data-editable={editable(index)}
            aria-label={`拖动词元 ${TOKEN_NAMES[index]} 的 ${kinds[kind]} 向量`}
            aria-describedby="drag-help" data-testid={`vector-handle-${index}`}
            onPointerDown={(event) => startDrag(event, index)} onKeyDown={(event) => moveWithKeyboard(event, index)}>
            <title>{kinds[kind]}{TOKEN_NAMES[index]} = {formatVector(vector, 1)}；方向键调整，Shift + 方向键调整 1</title>
          </circle>
        </g>;
      })}
      <circle cx={CENTER} cy={CENTER} r="3" fill="#9099ad" pointerEvents="none" />
    </svg>
    <p className="micro-copy" id="drag-help">拖动或方向键调整 {coordinateStep} · Shift + 方向键调整 1{kind === 'keys' && <span>虚线圆圈：正在观察的 Q{TOKEN_NAMES[observedToken]}</span>}</p>
  </div>;
}
