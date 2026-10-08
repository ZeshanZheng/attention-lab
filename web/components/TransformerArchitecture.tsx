export type AttentionLocation = 'encoder' | 'decoder' | 'cross';

const HIGHLIGHTS = {
  encoder: { x: 205, y: 496, rx: 85, ry: 43, label: '编码器自注意力' },
  decoder: { x: 385, y: 487, rx: 85, ry: 46, label: '解码器遮罩自注意力' },
  cross: { x: 385, y: 355, rx: 85, ry: 43, label: '编码器—解码器跨注意力' },
} as const;

export function TransformerArchitecture({ location = 'encoder', showQkv = false }: { location?: AttentionLocation; showQkv?: boolean }) {
  const highlight = HIGHLIGHTS[location];
  return <figure className="transformer-architecture">
    <div className="architecture-image">
      <img src={`${import.meta.env.BASE_URL}images/transformer-architecture.png`} width="561" height="825" alt={`原始 Transformer 编码器与解码器架构图，红圈标出${highlight.label}`} />
      <svg className="architecture-highlight" viewBox="0 0 561 825" aria-hidden="true"><ellipse cx={highlight.x} cy={highlight.y} rx={highlight.rx} ry={highlight.ry} />{showQkv && <text x="148" y="568">Q K V</text>}</svg>
    </div>
    <figcaption>红圈：{highlight.label}。<a href={`${import.meta.env.BASE_URL}images/transformer-architecture.png`} target="_blank" rel="noreferrer">查看原图</a><span>图源：Vaswani 等，Attention Is All You Need，Figure 1。</span></figcaption>
  </figure>;
}
