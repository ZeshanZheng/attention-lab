import type { AttentionResult, AttentionInput } from '../../src/index.ts';
import { TOKEN_NAMES, TOKEN_COLORS, formatNumber, formatVector } from '../format.ts';
import { Icon } from './Icon.tsx';

export const STEPS = [
  { name: '点积', title: '向量之间，有多匹配？', description: '用当前 Q 与每一个 K 做点积。方向和大小共同影响匹配得分；它不是归一化的余弦相似度。', formula: 'sⱼ = qₓ · kⱼₓ + qᵧ · kⱼᵧ', tag: 'DOT PRODUCT' },
  { name: '缩放', title: '让得分保持合适的尺度', description: 'dₖ 是每个 Q、K 向量的坐标数量。这里每个向量有 x、y 两个坐标，因此 dₖ = 2，除数是 √2 ≈ 1.414；不是因为有两个词元。', formula: 'zⱼ = sⱼ / √dₖ = sⱼ / √2', tag: 'SCALE' },
  { name: 'Softmax', title: '把匹配得分，变成关注比例', description: 'Softmax 是把一组得分转换为比例的方法：先取指数，得到正数，再除以这些正数的总和。得分越大，分到的比例越大；每行权重相加为 1。', formula: 'αⱼ = exp(zⱼ − max z) / Σ exp(zₗ − max z)', tag: 'NORMALIZE' },
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
  playbackSeconds: number;
  onSpeed: (seconds: number) => void;
}

const STEP_GUIDES = [
  { input: '当前词元的 Q（查询）和每个词元的 K（键）。', output: '每个词元一个匹配得分 s，可正、可负，不是百分比。', purpose: '比较当前查询与哪一个键更匹配，供后续分配权重。', symbols: 'j 表示正在比较的词元；x、y 表示两个坐标；· 表示相乘。点积就是对应坐标相乘，再相加。' },
  { input: '上一步得到的匹配得分 s。', output: '缩放后的得分 z，仍然不是百分比。', purpose: '高维向量的点积波动通常更大。标准 Attention 用 √dₖ 调整尺度，减少 Softmax 过度偏向某一项；同样的除数不会改变得分排序。', symbols: 'dₖ 是 Q/K 的维度，即坐标数量；√ 表示平方根。二维除以 √2，四维除以 √4 = 2，与词元数量无关。' },
  { input: '这一行所有词元的缩放得分 z。', output: '每个词元的权重 α，例如 0.284 表示分到 28.4%。', purpose: '把可正可负的得分变成非负、总和为 1 的关注比例，用于分配各个 V 的贡献。', symbols: 'exp(t) 就是 e 的 t 次方，e ≈ 2.718；Σ 表示把这一行的各项相加。max z 是最大得分；先减它可避免数字过大，共同的指数因子会抵消，所以权重不变。' },
  { input: '每个词元的权重 α，以及它携带的 V（值）向量。', output: '一个新的向量 o，表示取回的信息。', purpose: '让关注较多的词元贡献较多内容，再合并成输出；只改 V 会影响这一步，不会改变前面的权重。', symbols: 'α 是上一阶段的比例，v 是该词元的 V。先用比例乘 V 的每个坐标，再分别把所有 x 和所有 y 相加；不是直接把 V 全部相加。' },
] as const;

export function Calculation({ input, result, query, step, playing, onStep, onPlay, playbackSeconds, onSpeed }: Props) {
  const current = STEPS[step]!;
  const scores = result.scaledScores[query]!;
  const maximum = Math.max(...scores);
  const exponentials = scores.map((value) => Math.exp(value - maximum));
  const denominator = exponentials.reduce((sum, value) => sum + value, 0);
  const rowValues = step === 0 ? result.rawScores[query]! : step === 1 ? scores : result.weights[query]!;
  const guide = STEP_GUIDES[step]!;
  return <section className="card calculation-card" aria-labelledby="calculation-title">
    <div className="card-heading"><div><span className="eyebrow">02 / PROCESS</span><h2 id="calculation-title">一步步看懂计算</h2></div><span className="step-counter">0{step + 1}<span> / 04</span></span></div>
    <div className="step-tabs" aria-label="计算步骤">
      {STEPS.map((item, index) => <button key={item.name} className={`${step === index ? 'active' : ''} ${index < step ? 'completed' : ''}`} aria-label={`${index + 1} ${item.name}`} aria-pressed={step === index} onClick={() => onStep(index)}><span>{index < step ? '✓' : index + 1}</span>{item.name}</button>)}
    </div>
    <div className="step-intro"><span className="eyebrow purple">{current.tag}</span><h3>{current.title}</h3><p>{current.description}</p></div>
    <div className="formula-box"><span className="formula-label">计算公式</span><div className="math-formula">{current.formula}</div></div>
    <div className="step-guide" data-testid="step-guide"><dl><div><dt>用什么算</dt><dd>{guide.input}</dd></div><div><dt>得到什么</dt><dd>{guide.output}</dd></div><div><dt>有什么用</dt><dd>{guide.purpose}</dd></div></dl><p><b>符号怎么读：</b>{guide.symbols}</p></div>
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
    <div className="beginner-example" data-testid="beginner-example"><b>用当前数值走一遍</b>
      {step === 0 && <p>以 K_A 为例：{formatNumber(input.queries[query]![0]!, 1)} × {formatNumber(input.keys[0]![0]!, 1)} + {formatNumber(input.queries[query]![1]!, 1)} × {formatNumber(input.keys[0]![1]!, 1)} = {formatNumber(result.rawScores[query]![0]!)}。先相乘再相加，得到得分，而不是权重。</p>}
      {step === 1 && <p>A 的得分 {formatNumber(result.rawScores[query]![0]!)} ÷ 1.414… ≈ {formatNumber(scores[0]!)}。所有词元都这样缩放，然后一起送入 Softmax。</p>}
      {step === 2 && <p>A 的指数值约为 {formatNumber(exponentials[0]!)}，这一行的指数值总和约为 {formatNumber(denominator)}。两者相除，得到 A 的权重 {formatNumber(result.weights[query]![0]!)}，即 {formatNumber(result.weights[query]![0]! * 100, 1)}%。计算使用完整精度。</p>}
      {step === 3 && <p>输出 x：{TOKEN_NAMES.map((_, index) => `${formatNumber(result.weights[query]![index]!)} × (${formatNumber(input.values[index]![0]!, 1)})`).join(' + ')} ≈ {formatNumber(result.outputs[query]![0]!)}。y 也按同样方式单独相加，最终得到 {formatVector(result.outputs[query]!)}。</p>}
    </div>
    <div className="process-footer"><p><span className="live-dot" />默认手动阅读，准备好再点下一步</p><div className="process-navigation">
      <button className="icon-button previous" aria-label="上一步" disabled={step === 0} onClick={() => onStep(step - 1)}><Icon name="arrow" /></button>
      <button className="button primary manual-next" aria-label="下一步" disabled={step === 3} onClick={() => onStep(step + 1)}>下一步<Icon name="arrow" size={16} /></button>
    </div><div className="playback-controls"><button className="button subtle play-button" onClick={onPlay}><Icon name={playing ? 'pause' : 'play'} size={15} />{playing ? '暂停' : '自动演示'}</button><label>每步停留<select aria-label="每步停留时间" value={playbackSeconds} onChange={(event) => onSpeed(Number(event.target.value))}><option value={5}>5 秒</option><option value={10}>10 秒</option><option value={20}>20 秒</option></select></label></div></div>
  </section>;
}
