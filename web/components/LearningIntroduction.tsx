import { TransformerArchitecture } from './TransformerArchitecture.tsx';

export function LearningIntroduction() {
  return <section className="learning-introduction" aria-labelledby="attention-introduction-title">
    <div className="introduction-heading"><span className="eyebrow">开始前 · 一分钟导读</span><h2 id="attention-introduction-title">认识 Attention（注意力机制）</h2></div>
    <p className="introduction-lead">当我们理解一句话时，往往需要把一个词和上下文联系起来。Attention 让模型计算“应该从哪些位置取回多少信息”，再按比例组合这些信息，为当前词元补充上下文。</p>
    <div className="introduction-cards">
      <article><h3>1.它从哪里来？</h3><p>注意力机制早已用于机器翻译，帮助模型在生成译文时参考相关的原文位置。2017 年提出的 Transformer 将注意力机制放在架构的核心，让不同位置的信息可以直接建立联系。</p></article>
      <article><h3>2.它在 Transformer 中做什么？</h3><p>Transformer 是一种神经网络架构。它的 Attention 子层负责在词元之间交换信息，前馈网络进一步加工每个位置的表示；它们配合残差连接与归一化，逐层更新表示。</p></article>
      <article><h3>3.理解它有什么帮助？</h3><p>可以把“模型利用上下文”拆成具体计算：Q/K 怎样匹配、权重怎样分配、V 怎样汇合。这样更容易读懂公式和热力图，也为继续学习多头注意力与完整 Transformer 打下基础。</p></article>
    </div>
    <section className="introduction-architecture" aria-labelledby="architecture-introduction-title"><h3 id="architecture-introduction-title">在 Transformer 架构里的 Attention</h3><div className="architecture-introduction-grid"><TransformerArchitecture showQkv showHighlightCaption={false} /><div className="architecture-introduction-copy"><div className="architecture-introduction-text">
      <p>这张图展示的是原始 Transformer 架构的编码器—解码器架构。左边的编码器处理输入序列，右边的解码器结合已生成的内容和编码器信息，逐步生成输出。</p>
      <p>红圈标出左边编码器中的 Multi-Head Attention（多头注意力）子层。它让输入序列中的各个位置交换信息；Q、K、V 来自同一序列的当前层表示，经过不同的学习到的投影得到。（Q、K、V 分别是英文单词 Query（查询）、Key（键）和 Value（值）的首字母缩写。）Attention 计算每个 Query 应该从哪些 Value 中取回多少信息。</p>
      <p>图中的 N× 表示层会重复堆叠。Attention 之后还会经过残差连接、归一化和前馈网络等环节。本实验先拆开其中一个头的计算；当您完成基础学习后，可以在“多头注意力”和“三种 Attention”继续看这些扩展。</p>
    </div><div className="architecture-introduction-text architecture-attention-note">
        <p>Attention（注意力）是一类机制，Self-Attention（自注意力）是其中一种。Self-Attention 的 Q、K、V 来自同一序列的表示，词元可以从这条序列中的其他位置取回信息。原始 Transformer 的解码器还使用Cross-Attention（交叉注意力）：用解码器的查询去读取编码器提供的信息。</p>
    </div></div></div></section>
    <p className="introduction-sources">背景出处，可选阅读：<a href="https://arxiv.org/abs/1409.0473" target="_blank" rel="noreferrer">早期机器翻译注意力研究（2014）</a><span> · </span><a href="https://arxiv.org/html/1706.03762v7" target="_blank" rel="noreferrer">Transformer 原论文（2017）</a>。</p>
  </section>;
}
