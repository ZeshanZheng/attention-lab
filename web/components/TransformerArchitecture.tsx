export type AttentionLocation = 'encoder' | 'decoder' | 'cross';

const HIGHLIGHTS = {
  encoder: { x: 205, y: 496, rx: 85, ry: 43, label: '编码器 Self-Attention' },
  decoder: { x: 385, y: 487, rx: 85, ry: 46, label: '解码器 Masked Self-Attention' },
  cross: { x: 385, y: 355, rx: 85, ry: 43, label: '编码器—解码器 Cross-Attention' },
} as const;

const LOCATION_LABELS = {
  encoder: { x: 8, y: 471, lines: ['编码器', 'Self-', 'Attention'] },
  decoder: { x: 477, y: 449, lines: ['解码器', 'Masked', 'Self-', 'Attention'] },
  cross: { x: 477, y: 300, lines: ['编码器—', '解码器', 'Cross-', 'Attention'] },
} as const;

export function TransformerArchitecture({ location = 'encoder', showQkv = false, showHighlightCaption = true, showAllLocations = false }: { location?: AttentionLocation; showQkv?: boolean; showHighlightCaption?: boolean; showAllLocations?: boolean }) {
  const highlight = HIGHLIGHTS[location];
  const highlights = showAllLocations ? Object.values(HIGHLIGHTS) : [highlight];
  const highlightedLabels = highlights.map((item) => item.label).join('、');
  return <figure className="transformer-architecture">
    <div className="architecture-image">
      <img src={`${import.meta.env.BASE_URL}images/transformer-architecture.png`} width="561" height="825" alt={`原始 Transformer 编码器与解码器架构图，红圈标出${highlightedLabels}`} />
      <svg className="architecture-highlight" viewBox="0 0 561 825" aria-hidden="true">{highlights.map((item) => <ellipse key={item.label} cx={item.x} cy={item.y} rx={item.rx} ry={item.ry} />)}{showAllLocations && Object.entries(LOCATION_LABELS).map(([id, label]) => <text key={id} className="architecture-location-label" x={label.x} y={label.y}>{label.lines.map((line, index) => <tspan key={line} x={label.x} dy={index === 0 ? 0 : 23}>{line}</tspan>)}</text>)}{showQkv && <text x="148" y="568">Q K V</text>}</svg>
    </div>
    <figcaption>{showHighlightCaption && <>红圈：{highlightedLabels}。</>}<span>图源：Vaswani 等，Attention Is All You Need，Figure 1。</span></figcaption>
  </figure>;
}
