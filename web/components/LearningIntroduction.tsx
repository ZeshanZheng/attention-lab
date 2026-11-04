import { TransformerArchitecture } from './TransformerArchitecture.tsx';

export function LearningIntroduction() {
  return <section className="learning-introduction" aria-labelledby="attention-introduction-title">
    <div className="introduction-heading"><h2 id="attention-introduction-title">先认识 Attention 中的 Q、K、V</h2></div>
    <dl className="introduction-qkv">
      <div><dt>Q · Query · 查询</dt><dd>当前位置想寻找什么信息。</dd></div>
      <div><dt>K · Key · 键</dt><dd>各个位置提供哪些可供匹配的特征。</dd></div>
      <div><dt>V · Value · 值</dt><dd>各个位置实际提供什么信息。</dd></div>
    </dl>
    <p className="introduction-vector-note">Q、K、V 分别是英文单词 Query、Key 和 Value 的首字母缩写。上面的说法是帮助理解的比喻，实际的 Q、K、V 都是数学向量，由当前层的输入表示经过学习到的变换得到。</p>
    <section className="introduction-calculation" aria-labelledby="introduction-calculation-title">
      <h3 id="introduction-calculation-title">一次 Attention，按这四步计算</h3>
      <ol className="introduction-flow" aria-label="Attention 计算流程">
        <li><b>Q 与 K 匹配</b><span>计算点积得分</span></li>
        <li><b>缩放与 Softmax</b><span>得到注意力权重</span></li>
        <li><b>按权重汇合 V</b><span>把各位置的信息加权相加</span></li>
        <li><b>得到输出向量</b><span>得到汇合后的信息</span></li>
      </ol>
      <p className="introduction-vector-note">输出仍是一组数字，为更新当前位置的表示提供信息，还不是最终生成的文字。</p>
    </section>
    <section className="introduction-architecture" aria-labelledby="architecture-introduction-title"><h3 id="architecture-introduction-title">在 Transformer 架构里的 Attention</h3><div className="architecture-introduction-grid"><TransformerArchitecture showQkv showHighlightCaption={false} /><div className="architecture-introduction-copy"><div className="architecture-introduction-text">
      <p><strong>先看红圈中的注意力子层，本实验主要拆解其中一个注意力头的计算。</strong></p>
      <p>红圈标出左边编码器中的 Multi-Head Attention（多头注意力）子层。它让输入序列中的各个位置交换信息；Q、K、V 来自同一序列的当前层表示，经过不同的学习到的投影得到。Attention 计算每个 Query 应该从哪些 Value 中取回多少信息。</p>
    </div><div className="architecture-introduction-text architecture-attention-note">
        <p>Attention（注意力）是一类机制，Self-Attention（自注意力）是其中一种。Self-Attention 的 Q、K、V 来自同一序列的表示，词元可以从这条序列中的其他位置取回信息。原始 Transformer 的解码器还使用Cross-Attention（交叉注意力）：用解码器的查询去读取编码器提供的信息。</p>
    </div><details className="introduction-details architecture-context">
      <summary>了解图中其他模块</summary>
      <div className="architecture-context-copy">
        <p>这张图展示的是原始 Transformer 架构的编码器—解码器架构。左边的编码器处理输入序列，右边的解码器结合已生成的内容和编码器信息，逐步生成输出。</p>
        <p>图中的 N× 表示层会重复堆叠。Attention 之后还会经过残差连接、归一化和前馈网络等环节。当您完成基础学习后，可以在“多头注意力”和“三种 Attention”继续看这些扩展。</p>
      </div>
    </details></div></div></section>
    <p className="introduction-sources">背景出处，可选阅读：<a href="https://arxiv.org/abs/1409.0473" target="_blank" rel="noreferrer">早期机器翻译注意力研究（2014）</a><span> · </span><a href="https://arxiv.org/html/1706.03762v7" target="_blank" rel="noreferrer">Transformer 原论文（2017）</a>。</p>
    <p className="introduction-next-example">这些向量怎样帮助词元利用上下文？接下来用“书”和“它”的例子，把这个过程串起来。</p>
  </section>;
}
