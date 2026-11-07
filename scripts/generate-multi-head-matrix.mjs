import { writeFileSync } from 'node:fs';

// Regenerate with: node scripts/generate-multi-head-matrix.mjs
// Text stays editable SVG text; no font outlines, raster images or external files.
const words = ['我', '今', '天', '买', '了', '一', '本', '书'];
const corners = [[115, 188], [1138, 92], [1128, 796], [108, 694]];
const columns = [0, .075, ...Array.from({ length: 9 }, (_, index) => .15 + .85 * index / 8)];
const number = (value) => Number(value.toFixed(2));
const point = (u, v) => {
  const [tl, tr, br, bl] = corners;
  return [0, 1].map((axis) => number((1 - v) * ((1 - u) * tl[axis] + u * tr[axis]) + v * ((1 - u) * bl[axis] + u * br[axis])));
};
const position = (u, v) => { const [x, y] = point(u, v); return `x="${x}" y="${y}"`; };
const sub = (index) => `<tspan baseline-shift="sub" font-size="70%">${index}</tspan>`;
const label = (u, v, content, size, extra = '') => `    <text ${position(u, v)} font-size="${size}"${extra}>${content}</text>`;
const line = (start, end) => `    <line x1="${start[0]}" y1="${start[1]}" x2="${end[0]}" y2="${end[1]}" />`;
const outline = (offset) => corners.map(([x, y]) => `${x + offset * 44},${y + offset * 19}`).join(' ');
const parts = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<svg xmlns="http://www.w3.org/2000/svg" width="1630" height="965" viewBox="0 0 1630 965" role="img" aria-labelledby="title description">',
  '  <title id="title">Multi-Head Attention</title>',
  '  <desc id="description">八张矩阵叠放。最前面的表格按我、今、天、买、了、一、本、书示意八个词元；列是 Query，行是 Key，每格为对应的 K 与 Q 的点积。得分经过缩放和逐 Query 的 Softmax 才成为注意力权重。</desc>',
  '  <rect width="1630" height="965" fill="white" />',
  '  <!-- Background sheets: outer borders only; white fills hide occluded edges. -->',
  '  <g id="stacked-heads" fill="white" stroke="#222" stroke-width="1.4" stroke-linejoin="round">',
];
for (let layer = 7; layer >= 1; layer--) parts.push(`    <polygon id="head-${layer + 1}" points="${outline(layer)}" />`);
parts.push('  </g>', '  <!-- Front sheet and complete grid; the first two columns separate words and keys. -->',
  `  <polygon id="head-1" points="${outline(0)}" fill="white" stroke="#111" stroke-width="1.6" stroke-linejoin="round" />`,
  '  <g id="front-grid" fill="none" stroke="#555" stroke-width="1">');
for (const boundary of columns.slice(1, -1)) parts.push(line(point(boundary, 0), point(boundary, 1)));
for (let row = 1; row < 10; row++) parts.push(line(point(0, row / 10), point(1, row / 10)));
parts.push('  </g>', '  <g id="editable-labels" fill="#111" font-family="Arial, Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-weight="400" text-anchor="middle" dominant-baseline="middle">',
  '    <text id="diagram-heading" x="905" y="53" font-size="64" font-weight="700">Multi-Head Attention</text>');
for (let index = 0; index < 8; index++) {
  const center = (columns[index + 2] + columns[index + 3]) / 2;
  parts.push(label(center, .05, words[index], 35, ` data-token="${index + 1}"`));
  parts.push(label(center, .15, `Q${sub(index + 1)}`, 30, ` data-query-label="${index + 1}"`));
  parts.push(label(.0375, (index + 2.5) / 10, words[index], 31));
  parts.push(label(.1125, (index + 2.5) / 10, `K${sub(index + 1)}`, 28, ` data-key-label="${index + 1}"`));
}
parts.push('    <!-- 64 separately editable formulas: row i = Key i, column j = Query j. -->');
for (let key = 1; key <= 8; key++) {
  for (let query = 1; query <= 8; query++) {
    const center = (columns[query + 1] + columns[query + 2]) / 2;
    parts.push(label(center, (key + 1.5) / 10, `K${sub(key)} · Q${sub(query)}`, 25,
      ` id="score-k${key}-q${query}" data-key="${key}" data-query="${query}"`));
  }
}
parts.push('    <text id="diagram-caption" x="1233" y="807" text-anchor="start" font-size="24" font-weight="600">多个 head = 多张注意力矩阵</text>',
  '  </g>', '</svg>', '');
writeFileSync(new URL('../public/images/multi-head-matrices.svg', import.meta.url), parts.join('\n'), 'utf8');
console.log('Generated editable 8 × 8 SVG: public/images/multi-head-matrices.svg');
