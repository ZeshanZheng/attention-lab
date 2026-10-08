export function MultiHeadAttention() {
  return <section className="card advanced-reading" aria-labelledby="multi-head-title">
    <span className="eyebrow">进阶阅读 · 从一个头到多个头</span>
    <h2 id="multi-head-title">多头注意力：同时从不同角度读取信息</h2>
    <p className="reading-lead">单头得到一张注意力矩阵，多头则并行计算多组关注关系，再汇合各个头的结果。</p>
    <figure className="multi-head-figure"><img src={`${import.meta.env.BASE_URL}images/multi-head-matrices.png`} alt="多张单头匹配矩阵叠在一起，示意多个注意力头各自计算一组关注关系" width="1920" height="1080" /><figcaption>多个 head，对应多组注意力计算。各个头有不同的投影参数，可以产生不同的权重矩阵。图中列为 Query、行为 Key，是实验总结表格的转置画法；格子的匹配得分还需经过缩放与 Softmax 才成为权重。<a href={`${import.meta.env.BASE_URL}images/multi-head-matrices.png`} target="_blank" rel="noreferrer">查看大图</a></figcaption></figure>
    <div className="reading-speech"><h3>为什么叫 Multi-Head Attention？</h3>
      <p>所谓“多头”，可以理解为模型同时并行地做多次注意力计算。每一个头都有自己独立的一组参数矩阵，相当于从不同角度观察输入句子。每个头分别生成 Q、K、V，再进行点积、缩放、Softmax 和对 V 的加权求和。</p>
      <p>比如，有的头可能更关注句子的语法结构，判断词和词之间在语法上是什么关系；有的头可能更关注代词，帮助关联它与前面的对象；还有的头可能关注与情绪表达相关的信息，例如偏积极或偏负面的词语。</p>
      <p>这些语法结构、代词指代、情绪色彩的例子，只是为了方便直观理解。模型并不会提前规定每个头必须负责什么；各个头通过训练学习参数，形成适合任务的关注方式。不能把某一个头永久命名为“语法头”或“情绪头”。</p>
      <h3>512 维、8 个头、每头 64 维，怎样联系起来？</h3>
      <p>原始 Transformer 的基础模型使用 512 维的模型表示和 8 个注意力头；每个头的 Q/K 与 V 都是 64 维。每个头用自己的参数矩阵，把完整的 512 维输入表示投影到 64 维，并独立产生一个 64 维的聚合结果。这里不是把输入向量直接切成八段，也不是因为某个头被预先限定只懂某一方面。</p>
      <p>最后把 8 个 64 维结果拼接，得到 512 维的向量，再经过输出投影 Wₒ，回到模型的表示空间。通过这种多头机制，模型可以组合不同表示子空间、不同位置的信息，增强表达能力。这些数字是原论文基础模型的配置示例，其他模型可以采用不同维度和头数。</p>
    </div>
    <div className="multi-head-flow" aria-label="原始基础模型多头注意力的维度示意"><div className="head-flow-input">输入表示 X<small>512 维</small></div><div className="head-flow-branches"><div>头 1<small>独立投影 → Attention → 64 维</small></div><div>头 2<small>独立投影 → Attention → 64 维</small></div><div>… 头 8<small>独立投影 → Attention → 64 维</small></div></div><div className="head-flow-output">拼接 8 个结果<small>8 × 64 = 512 维</small></div><div className="head-flow-output">输出投影 Wₒ<small>512 维</small></div></div>
    <div className="reading-speech"><h3>把每个头的计算放回整体流程</h3>
      <p>每个头内部仍然使用熟悉的计算：Q 与 K 做点积，除以 √dₖ 缩放，经过 Softmax 得到权重，再用权重加权 V。当向量维度较大时，点积可能变大，让 Softmax 的分配过于集中、梯度变小；缩放有助于控制得分的尺度。</p>
      <p>如果某些位置不能被读取，要在 Softmax 之前给它们加上 Mask。多头计算完成后，各头结果拼接，再经过线性输出投影。在原始 Transformer 中，接下来使用残差连接与层归一化；它们和后续的前馈网络一起继续更新表示。</p>
    </div>
    <p className="reading-note">当前自由探索展示单头、二维的教学计算。本页说明多头如何扩展这一过程，没有提取真实模型的各头权重。</p>
    <p className="reading-source">原理与配置：<a href="https://arxiv.org/html/1706.03762v7" target="_blank" rel="noreferrer">Transformer 原论文 §3.1、§3.2</a>。</p>
  </section>;
}
