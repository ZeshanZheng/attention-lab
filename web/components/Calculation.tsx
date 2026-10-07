import type { AttentionResult, AttentionInput } from '../../src/index.ts';
import { TOKEN_NAMES, TOKEN_COLORS, formatNumber, formatVector } from '../format.ts';
import { Icon } from './Icon.tsx';

export const STEPS = [
  { name: '点积', title: '向量之间，有多匹配？', description: '用当前 Q 与每一个 K 做点积。方向和大小共同影响匹配得分；它不是归一化的余弦相似度。', formula: 'sⱼ = qₓ · kⱼₓ + qᵧ · kⱼᵧ', tag: 'DOT PRODUCT' },
  { name: '缩放', title: '让得分保持合适的尺度', description: '把每个点积除以 √dₖ。这里有 2 个坐标，所以所有得分都除以 √2。', formula: 'zⱼ = sⱼ / √dₖ = sⱼ / √2', tag: 'SCALE' },
  { name: 'Softmax', title: '把匹配得分，变成关注比例', description: '先减去最大的得分，再取指数并归一化。每个权重都非负，所有权重相加等于 1。', formula: 'αⱼ = exp(zⱼ − max z) / Σ exp(zₗ − max z)', tag: 'NORMALIZE' },
  { name: '加权求和', title: '把关注的信息，汇聚成输出', description: '用权重乘每个 V，再逐坐标相加。Q、K 决定关注比例，V 决定实际传递的内容。', formula: 'o = αₐvₐ + αᵦvᵦ + α꜀v꜀', tag: 'WEIGHTED SUM' },
] as const;

interface Props {
  input: AttentionInput;
  result: AttentionResult;
  query: number;
  step: number;
  playing: boolean;
  onStep: (step: number) => void;
  onPlay: () => void;
}

export function Calculation({ input, result, query, step, playing, onStep, onPlay }: Props) {
  const current = STEPS[step]!;
  const scores = result.scaledScores[query]!;
  const maximum = Math.max(...scores);
  const exponentials = scores.map((value) => Math.exp(value - maximum));
  const denominator = exponentials.reduce((sum, value) => sum + value, 0);
  const rowValues = step === 0 ? result.rawScores[query]! : step === 1 ? scores : result.weights[query]!;
  return <section className="card calculation-card" aria-labelledby="calculation-title">
    <div className="card-heading"><div><span className="eyebrow">02 / PROCESS</span><h2 id="calculation-title">一步步看懂计算</h2></div><span className="step-counter">0{step + 1}<span> / 04</span></span></div>
    <div className="step-tabs" aria-label="计算步骤">
      {STEPS.map((item, index) => <button key={item.name} className={`${step === index ? 'active' : ''} ${index < step ? 'completed' : ''}`} aria-label={`${index + 1} ${item.name}`} aria-pressed={step === index} onClick={() => onStep(index)}><span>{index < step ? '✓' : index + 1}</span>{item.name}</button>)}
    </div>
    <div className="step-intro"><span className="eyebrow purple">{current.tag}</span><h3>{current.title}</h3><p>{current.description}</p></div>
    <div className="formula-box"><span className="formula-label">计算公式</span><div className="math-formula">{current.formula}</div></div>
    <div className="active-query"><span className="token-square" style={{ background: TOKEN_COLORS[query] }}>Q{TOKEN_NAMES[query]}</span><span>当前查询向量</span><code>{formatVector(input.queries[query]!, 1)}</code></div>
    <div className="calculation-rows">
      {TOKEN_NAMES.map((name, index) => <div className="calculation-row" key={name}>
        <span className="token-square pale" style={{ color: TOKEN_COLORS[index], background: `${TOKEN_COLORS[index]}14` }}>{step === 3 ? 'V' : 'K'}{name}</span>
        <div className="row-equation">
          {step === 0 && <><span className="equation-detail">{formatNumber(input.queries[query]![0]!, 1)} × {formatNumber(input.keys[index]![0]!, 1)} + {formatNumber(input.queries[query]![1]!, 1)} × {formatNumber(input.keys[index]![1]!, 1)}</span><small>逐坐标乘积 {formatVector(result.dotProducts[query]![index]!)}</small></>}
          {step === 1 && <><span className="equation-detail">{formatNumber(result.rawScores[query]![index]!)} ÷ √2</span><small>维度 dₖ = 2</small></>}
          {step === 2 && <><span className="equation-detail">exp({formatNumber(scores[index]! - maximum)}) ÷ {formatNumber(denominator)}</span><small>稳定指数值 {formatNumber(exponentials[index]!)}</small></>}
          {step === 3 && <><span className="equation-detail">{formatNumber(result.weights[query]![index]!)} × {formatVector(input.values[index]!, 1)}</span><small>该词元对输出的贡献</small></>}
        </div>
        <strong className="equation-result">{step === 3 ? formatVector(result.contributions[query]![index]!) : formatNumber(rowValues[index]!)}</strong>
      </div>)}
    </div>
    <div className="step-summary">
      {step === 0 && <><span>匹配得分</span><code>{formatVector(result.rawScores[query]!)}</code></>}
      {step === 1 && <><span>缩放后得分</span><code>{formatVector(scores)}</code></>}
      {step === 2 && <><span>权重总和</span><code data-testid="weight-sum">{formatNumber(result.weights[query]!.reduce((sum, value) => sum + value, 0))}</code></>}
      {step === 3 && <><span>最终输出向量</span><code>{formatVector(result.outputs[query]!)}</code></>}
    </div>
    <div className="process-footer"><p><span className="live-dot" />参数变化，计算同步更新</p><div className="process-navigation">
      <button className="icon-button previous" aria-label="上一步" disabled={step === 0} onClick={() => onStep(step - 1)}><Icon name="arrow" /></button>
      <button className="button subtle play-button" onClick={onPlay}><Icon name={playing ? 'pause' : 'play'} size={15} />{playing ? '暂停' : '自动演示'}</button>
      <button className="icon-button" aria-label="下一步" disabled={step === 3} onClick={() => onStep(step + 1)}><Icon name="arrow" /></button>
    </div></div>
  </section>;
}
