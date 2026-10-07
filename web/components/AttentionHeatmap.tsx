import { useState } from 'react';
import type { AttentionResult } from '../../src/index.ts';
import { TOKEN_NAMES, formatDelta, formatNumber } from '../format.ts';

function weightColor(weight: number) {
  // One absolute 0–1 scale for every row, baseline and edit.
  const light = [247, 244, 255];
  const dark = [98, 72, 201];
  const channels = light.map((value, index) => Math.round(value + (dark[index]! - value) * weight));
  const linear = channels.map((value) => {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  const luminance = linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722;
  return { backgroundColor: `rgb(${channels.join(', ')})`, color: luminance > 0.179 ? '#000' : '#fff' };
}

export function AttentionHeatmap({ current, baseline, query, onSelectQuery }: {
  current: AttentionResult; baseline: AttentionResult; query: number; onSelectQuery: ((query: number) => void) | undefined;
}) {
  const highest = (row: number) => current.weights[row]!.reduce((best, value, index, values) => value > values[best]! ? index : best, 0);
  const [inspection, setInspection] = useState({ row: query, column: highest(query), observedQuery: query });
  // External Query changes follow the new row; edits retain the inspected cell.
  const cell = inspection.observedQuery === query ? inspection : { row: query, column: highest(query) };
  const weight = current.weights[cell.row]![cell.column]!;
  const previous = baseline.weights[cell.row]![cell.column]!;
  const inspect = (row: number, column: number) => setInspection({ row, column, observedQuery: query });

  return <section className="card heatmap-card" aria-labelledby="heatmap-title">
    <div className="heatmap-intro"><span className="eyebrow">04 / ATTENTION MATRIX</span><h2 id="heatmap-title">注意力权重热力图</h2>
      <p>一张图，看见三个词元的关注关系。颜色越深，分配的权重越大。</p>
      <div className="heatmap-axis-guide"><span><b>行 · Query</b>谁在关注</span><span><b>列 · Key</b>关注谁</span></div>
      <p className="heatmap-instruction">{onSelectQuery ? '悬停或聚焦查看数值；点击一格，同步观察这一行的 Query。' : '引导实验固定观察 A；点选其他单元格仍可查看数值。'}</p>
    </div>
    <div className="heatmap-matrix">
      <table className="attention-matrix" aria-label="所有词元的 Attention 权重" data-testid="attention-heatmap">
        <caption>行表示 Query，列表示 Key；高亮行是当前观察对象。</caption>
        <thead><tr><th scope="col"><span className="heatmap-corner">Q ↓ / K →</span></th>{TOKEN_NAMES.map((name) => <th scope="col" key={name} aria-label={`词元 ${name} 的 Key`}>K<sub>{name}</sub></th>)}</tr></thead>
        <tbody>{TOKEN_NAMES.map((name, row) => <tr key={name} data-testid={`heatmap-row-${row}`} data-observed={row === query} className={row === query ? 'observed' : ''}>
          <th scope="row" aria-label={`词元 ${name} 的 Query${row === query ? '，当前观察' : ''}`}><span>Q<sub>{name}</sub>{row === query && <i aria-hidden="true">←</i>}</span></th>
          {TOKEN_NAMES.map((target, column) => {
            const value = current.weights[row]![column]!;
            const label = `${name} 关注 ${target}，权重 ${formatNumber(value * 100, 1)}%`;
            const selected = cell.row === row && cell.column === column;
            return <td key={target}><button className={`heatmap-cell ${selected ? 'inspected' : ''}`} style={weightColor(value)}
              aria-label={label} aria-pressed={selected} title={label} data-testid={`heatmap-cell-${row}-${column}`} data-weight={value}
              onMouseEnter={() => inspect(row, column)} onFocus={() => inspect(row, column)} onClick={() => {
                setInspection({ row, column, observedQuery: onSelectQuery ? row : query });
                onSelectQuery?.(row);
              }}>{formatNumber(value * 100, 1)}<small>%</small></button></td>;
          })}
        </tr>)}</tbody>
      </table>
      <div className="heatmap-legend" aria-label="色阶范围：0% 到 100%"><span>0%</span><i /><span>100%</span></div>
      <p className="heatmap-rounding">每行权重之和为 1，百分比显示已四舍五入。</p>
    </div>
    <div className="heatmap-reading" aria-live="polite" aria-atomic="true" data-testid="heatmap-detail">
      <span className="eyebrow">READ ONE CELL</span><h3>{TOKEN_NAMES[cell.row]} 在关注 {TOKEN_NAMES[cell.column]}</h3>
      <p>Q<sub>{TOKEN_NAMES[cell.row]}</sub> → K<sub>{TOKEN_NAMES[cell.column]}</sub> · <span>{cell.row === query ? '当前观察行' : '查看其他行'}</span></p>
      <dl><div><dt>当前权重</dt><dd data-testid="heatmap-current">{formatNumber(weight * 100, 1)}%</dd></div>
        <div><dt>基线权重</dt><dd data-testid="heatmap-baseline">{formatNumber(previous * 100, 1)}%</dd></div>
        <div><dt>与基线相比</dt><dd data-testid="heatmap-delta">{Math.abs(weight - previous) < 0.0005 ? '未变化' : `${formatDelta((weight - previous) * 100, 1)} 个百分点`}</dd></div>
        <div><dt>点积得分</dt><dd data-testid="heatmap-dot">{formatNumber(current.rawScores[cell.row]![cell.column]!)}</dd></div>
        <div><dt>缩放后得分</dt><dd>{formatNumber(current.scaledScores[cell.row]![cell.column]!)}</dd></div></dl>
      <div className="heatmap-note">权重由 Q、K 决定。只修改 V 时，热力图保持不变，输出向量可能改变。</div>
    </div>
  </section>;
}
