import { TransformerArchitecture } from './TransformerArchitecture.tsx';

export function LearningIntroduction() {
  return <section className="learning-introduction" aria-labelledby="attention-introduction-title">
    <div className="introduction-heading"><span className="eyebrow">开始前 · 一分钟导读</span><h2 id="attention-introduction-title">先认识 Attention：它为什么重要？</h2></div>
    <p className="introduction-lead">理解一句话，往往需要把一个词和上下文联系起来。Attention（注意力机制）让模型计算<strong>“从哪些位置取回多少信息”</strong>，再按比例组合这些信息，为当前词元补充上下文。</p>
    <div className="introduction-cards">
      <article><h3>它从哪里来？</h3><p>注意力机制早已用于机器翻译，帮助模型在生成译文时参考相关的原文位置。2017 年提出的 Transformer 将注意力机制放在架构的核心，让不同位置的信息可以直接建立联系。</p></article>
      <article><h3>它在 Transformer 中做什么？</h3><p>Transformer 是一种神经网络架构。它的 Attention 子层负责在词元之间交换信息，前馈网络进一步加工每个位置的表示；它们配合残差连接与归一化，逐层更新表示。</p></article>
      <article><h3>理解它有什么帮助？</h3><p>可以把“模型利用上下文”拆成具体计算：Q/K 怎样匹配、权重怎样分配、V 怎样汇合。这样更容易读懂公式和热力图，也为继续学习多头注意力与完整 Transformer 打下基础。</p></article>
    </div>
    <section className="introduction-architecture" aria-labelledby="architecture-introduction-title"><h3 id="architecture-introduction-title">在完整架构里，找到 Attention</h3><div className="architecture-introduction-grid"><TransformerArchitecture showQkv /><div className="architecture-introduction-text">
      <p>这张图展示的是原始 Transformer 的编码器—解码器架构。左边的编码器处理输入序列，右边的解码器结合已生成的内容和编码器信息，逐步生成输出。</p>
      <p><strong>红圈标出左边编码器中的 Multi-Head Attention（多头注意力）子层。</strong>它让输入序列中的各个位置交换信息；Q、K、V 来自同一序列的当前层表示，经过不同的学习到的投影得到。</p>
      <p>可以用三个问题建立直觉：<b>K</b> 描述“我有哪些可被匹配的特征”；<b>Q</b> 描述“我在查询什么信息”；<b>V</b> 描述“别人关注我时，我能提供什么内容”。Attention 计算每个 Query 应该从哪些 Value 中取回多少信息。</p>
      <p>图中的 N× 表示层会重复堆叠。Attention 之后还会经过残差连接、归一化和前馈网络等环节。本实验先拆开其中一个头的计算；完成基础学习后，可以在“多头注意力”和“三种 Attention”继续看这些扩展。</p>
    </div></div></section>
    <details className="introduction-details"><summary>再了解一点：Self-Attention、多头与本实验的范围</summary>
      <div className="introduction-more">
        <h3>Self-Attention 是什么？</h3><p>Self-Attention（自注意力）的 Q、K、V 来自同一序列的表示，词元可以从这条序列中的其他位置取回信息。原始 Transformer 的解码器还使用跨注意力：用解码器的查询去读取编码器提供的信息。</p>
        <h3>Attention 是完整模型中的一个环节</h3>
        <ol className="introduction-flow" aria-label="原始 Transformer 编码器层的简化信息流"><li>输入的词元向量</li><li className="attention-flow-focus">Attention<span>跨位置交换信息</span></li><li>前馈网络<span>加工每个位置的表示</span></li><li>更新后的词元向量</li></ol>
        <p className="introduction-flow-note">这是编码器层的简化示意，省略了残差连接与归一化等步骤。真实模型还需要位置相关信息，并堆叠多层；解码器的自注意力会用遮罩限制对未来位置的访问。</p>
        <h3>为什么先学这个小实验？</h3><p>本实验用三个词元、二维向量和单个注意力头，把一次“匹配 → 分配比例 → 聚合内容”展开。真实 Transformer 会学习 Q/K/V 的投影，并用多个注意力头从不同角度聚合信息；先理解一个头，更容易理解这些扩展。</p>
        <p>这里的 A、B、C 和 Q/K/V 都是人为设定的教学数据，没有训练语言模型。输出是聚合向量，得到下一个词还需要其他模块；热力图显示分配比例，单看它不足以解释模型的全部行为。</p>
        <p className="introduction-sources">背景出处，可选阅读：<a href="https://arxiv.org/abs/1409.0473" target="_blank" rel="noreferrer">早期机器翻译注意力研究（2014）</a><span> · </span><a href="https://arxiv.org/html/1706.03762v7" target="_blank" rel="noreferrer">Transformer 原论文（2017）</a>。</p>
      </div>
    </details>
    <p className="introduction-route"><b>建议顺序：</b>先用“自由探索”观察变化，对照“实验总结”理解公式，再做“引导实验”验证预测，最后用“理解自测”检查掌握情况。</p>
  </section>;
}
