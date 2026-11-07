import type { ReactNode } from 'react';
import { TransformerArchitecture } from './TransformerArchitecture.tsx';

export function LearningIntroduction({ nextNavigation }: { nextNavigation: ReactNode }) {
  return <section className="learning-introduction" aria-labelledby="attention-introduction-title">
    <section className="introduction-architecture" aria-labelledby="attention-introduction-title"><h2 id="attention-introduction-title">在 Transformer 架构里的 Attention</h2><div className="architecture-introduction-grid"><TransformerArchitecture showQkv showHighlightCaption={false} /><div className="architecture-introduction-copy"><div className="architecture-introduction-text">
      <p>这张图展示的是原始 Transformer 架构的编码器—解码器架构。左边的编码器处理输入序列，右边的解码器结合已生成的内容和编码器信息，逐步生成输出。</p>
      <p>图中的 N× 表示层会重复堆叠。Attention 之后还会经过残差连接、归一化和前馈网络等环节。当您完成基础学习后，可以在“多头注意力”和“三种 Attention”继续看这些扩展。</p>
      <p>红圈标出左边编码器中的 Multi-Head Attention（多头注意力）子层。它让输入序列中的各个位置交换信息；Q、K、V 来自同一序列的当前层表示，经过不同的学习到的投影得到。Attention 计算每个 Query 应该从哪些 Value 中取回多少信息。</p>
    </div><div className="architecture-introduction-text architecture-attention-note">
        <p>Attention（注意力）是一类机制，Self-Attention（自注意力）是其中一种。Self-Attention 的 Q、K、V 来自同一序列的表示，词元可以从这条序列中的其他位置取回信息。原始 Transformer 的解码器还使用Cross-Attention（交叉注意力）：用解码器的查询去读取编码器提供的信息。</p>
    </div></div></div></section>
    <p className="introduction-sources">背景出处：<a href="https://arxiv.org/abs/1409.0473" target="_blank" rel="noreferrer">早期机器翻译注意力研究（2014）</a><span> · </span><a href="https://arxiv.org/html/1706.03762v7" target="_blank" rel="noreferrer">Transformer 原论文（2017）</a>。</p>
    <div className="introduction-ending"><p className="introduction-next-example">这些向量怎样帮助词元利用上下文？接下来用“书”和“它”的例子，把这个过程串起来。</p>{nextNavigation}</div>
  </section>;
}
