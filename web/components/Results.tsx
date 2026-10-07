import type { AttentionResult } from '../../src/index.ts';
import { TOKEN_NAMES, TOKEN_COLORS, formatNumber, formatVector, formatDelta } from '../format.ts';

function OutputPlane({ current, baseline }: { current: readonly number[]; baseline: readonly number[] }) {
  // Fit both vectors to the same visible range so the comparison stays readable.
  const range = Math.max(1.5, Math.ceil(Math.max(...current.map(Math.abs), ...baseline.map(Math.abs)) * 1.2 * 2) / 2);
  const x = (value: number) => 135 + value * 95 / range;
  const y = (value: number) => 100 - value * 85 / range;
  return <svg className="output-plane" viewBox="0 0 270 200" role="img" aria-label={`当前输出 ${formatVector(current)}，基线输出 ${formatVector(baseline)}`}>
    <defs><marker id="output-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7z" fill="#7560df" /></marker></defs>
    {Array.from({ length: 11 }, (_, index) => (index - 5) * range / 5).map((tick) => <g key={tick}>
      <line x1={x(tick)} x2={x(tick)} y1="15" y2="185" stroke={tick === 0 ? '#cbd0df' : '#e9eaf3'} />
      <line y1={y(tick)} y2={y(tick)} x1="30" x2="240" stroke={tick === 0 ? '#cbd0df' : '#e9eaf3'} />
    </g>)}
    <text x="242" y="94" className="axis-label">x</text><text x="141" y="13" className="axis-label">y</text>
    <text x="34" y="14" className="axis-label">范围 ±{formatNumber(range, 1)}</text>
    <text x="230" y="114" textAnchor="middle" className="axis-label">{formatNumber(range, 1)}</text>
    <text x="127" y="24" textAnchor="end" className="axis-label">{formatNumber(range, 1)}</text>
    <text x="126" y="114" className="axis-label">0</text>
    <line x1="135" y1="100" x2={x(baseline[0]!)} y2={y(baseline[1]!)} stroke="#8d94a8" strokeWidth="2" strokeDasharray="4 3" />
    <circle cx={x(baseline[0]!)} cy={y(baseline[1]!)} r="7" stroke="#8d94a8" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
    <line x1="135" y1="100" x2={x(current[0]!)} y2={y(current[1]!)} stroke="#7560df" strokeWidth="3" markerEnd="url(#output-arrow)" />
    <circle cx={x(current[0]!)} cy={y(current[1]!)} r="4" fill="#7560df" />
    <text x={x(current[0]!) + 10} y={y(current[1]!) - 9} className="vector-label" fill="#7560df">o</text>
    <circle cx="135" cy="100" r="3" fill="#9ba2b4" />
  </svg>;
}

export function Results({ current, baseline, query, hasChanges }: { current: AttentionResult; baseline: AttentionResult; query: number; hasChanges: boolean }) {
  const weights = current.weights[query]!;
  const previousWeights = baseline.weights[query]!;
  const output = current.outputs[query]!;
  const previousOutput = baseline.outputs[query]!;
  const weightsChanged = weights.some((value, index) => Math.abs(value - previousWeights[index]!) > 1e-10);
  const outputChanged = output.some((value, index) => Math.abs(value - previousOutput[index]!) > 1e-10);
  const insight = !hasChanges ? '试试只修改 B 的 V：权重会变化吗？输出又会怎样变化？'
    : !weightsChanged && outputChanged ? '权重没变，输出变了。相同的关注比例，也能传递不同的内容。'
    : weightsChanged && !outputChanged ? '关注比例变了，输出保持不变。不同的权重组合，也可能得到相同的输出。'
    : weightsChanged ? '关注比例发生了变化。一个得分的变化，会通过 Softmax 影响整组权重。'
    : '参数已调整，但当前 Query 的权重和输出保持不变。试着观察另一个词元。';

  return <section className="card results-card" aria-labelledby="results-title">
    <div className="card-heading"><div><span className="eyebrow">03 / OUTPUT</span><h2 id="results-title">观察结果变化</h2></div><span className="live-badge"><span className="live-dot" />实时</span></div>
    <div className="result-heading"><h3>注意力权重</h3><span>Q{TOKEN_NAMES[query]} → 所有 K</span></div>
    <div className="chart-legend"><span><i className="legend-current" />当前</span><span><i className="legend-baseline" />基线</span></div>
    <div className="weight-chart" aria-label="当前注意力权重与基线对比">
      {TOKEN_NAMES.map((name, index) => {
        const difference = (weights[index]! - previousWeights[index]!) * 100;
        return <div className="weight-row" key={name}>
          <div className="weight-label"><span><i className="token-dot" style={{ background: TOKEN_COLORS[index] }} />词元 {name}</span><b data-testid={`weight-${index}`}>{formatNumber(weights[index]! * 100, 1)}<small>%</small></b></div>
          <div className="weight-track"><div className="weight-fill" style={{ width: `${weights[index]! * 100}%`, background: TOKEN_COLORS[index] }} /><i className="baseline-tick" style={{ left: `calc(${previousWeights[index]! * 100}% - 1px)` }} title={`基线：${formatNumber(previousWeights[index]! * 100, 1)}%`} /></div>
          <span className={`weight-delta ${Math.abs(difference) < 0.05 ? 'unchanged' : ''}`} data-testid={`weight-delta-${index}`}>{Math.abs(difference) < 0.05 ? '与基线相同' : `${formatDelta(difference, 1)} 个百分点`}</span>
        </div>;
      })}
    </div>
    <div className="weight-total"><span>权重之和</span><code>{formatNumber(weights.reduce((sum, value) => sum + value, 0))}</code></div>
    <div className="output-section"><div className="result-heading"><h3>输出向量</h3><span>V 的加权组合</span></div>
      <div className="output-vector" data-testid="output-vector"><span>o =</span><strong>{formatVector(output)}</strong></div>
      <div className="output-plot"><OutputPlane current={output} baseline={previousOutput} /></div>
      <div className="output-comparison"><span>基线</span><code data-testid="baseline-output">{formatVector(previousOutput)}</code></div>
      <div className="coordinate-deltas">{['x', 'y'].map((coordinate, index) => <div key={coordinate}><span>Δ{coordinate}</span><b data-testid={`output-delta-${coordinate}`}>{formatDelta(output[index]! - previousOutput[index]!)}</b></div>)}</div>
    </div>
    <div className="insight-box"><span className="insight-symbol">✦</span><p data-testid="insight">{insight}</p></div>
  </section>;
}
