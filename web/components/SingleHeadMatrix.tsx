const MATRIX_TOKENS = ['我', '今', '天', '买', '了', '一', '本', '书'];

export function SingleHeadMatrix() {
  return <section className="card single-head-matrix" aria-labelledby="single-head-matrix-title">
    <span className="eyebrow">实验总结 · 从一行计算到整张矩阵</span>
    <h2 id="single-head-matrix-title">单头注意力：这张矩阵怎样读？</h2>
    <p className="reading-lead">把“我今天买了一本书”展开，看看每个 Query 怎样与所有 Key 匹配。</p>
    <div className="reading-table-scroll" tabIndex={0} role="region" aria-label="单头匹配得分矩阵，可横向滚动">
      <table className="single-head-table"><caption>点积匹配得分矩阵 · 缩放与 Softmax 之前</caption><thead><tr><th scope="col">Query ↓ / Key →</th>{MATRIX_TOKENS.map((word, index) => <th key={index} scope="col"><span>“{word}”</span>K<sub>{index + 1}</sub></th>)}</tr></thead><tbody>{MATRIX_TOKENS.map((word, query) => <tr key={query}><th scope="row"><span>“{word}”</span>Q<sub>{query + 1}</sub></th>{MATRIX_TOKENS.map((_, key) => <td key={key}>Q<sub>{query + 1}</sub> · K<sub>{key + 1}</sub></td>)}</tr>)}</tbody></table>
    </div>
    <p className="reading-note">此处按八个字示意词元，实际划分取决于分词器。格子显示计算式；每个 Query 对应一行，缩放后沿这一行做 Softmax，权重之和为 1。手机可在表格内左右滑动。</p>
    <div className="reading-speech" aria-label="单头注意力讲解"><h3>跟着表格读一遍</h3>
      <p>这一页把单头注意力展开成一个矩阵。这里的行表示所有 Query，列表示所有 Key。每一个格子都是某个 Query 和某个 Key 的匹配得分，比如 Q₃ · K₁ 表示第 3 个词元“天”在查询第 1 个词元“我”的信息。它对应一行中的一个位置；我们将整行的点积得分按维度缩放，再经过 Softmax，就得到用来加权 Value 的一组注意力权重。</p>
      <p>为什么可以用点积来匹配？点积同时受到向量方向和长度的影响。在两个向量长度保持不变时，夹角越小，点积越大；夹角超过 90° 时点积为负，垂直时点积为零。模型通过学习 Q/K 的投影来利用这些得分，因此不能单凭点积的正负或零，直接认定两个词的含义相同、相反或毫无关系。</p>
      <p>矩阵把同一套计算放到了所有位置上：每一行分别分配关注比例，再用这一行的权重组合各个 V，得到对应 Query 的输出。自由探索中一次重点观察一个 Query；热力图则把所有 Query 的权重排在一起。下面把这套过程与三个实验的观察结果串起来。</p>
    </div>
  </section>;
}
