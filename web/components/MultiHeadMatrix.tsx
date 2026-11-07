export function MultiHeadMatrix() {
  return <figure className="multi-head-figure">
    <img src={`${import.meta.env.BASE_URL}images/multi-head-matrices.svg`} alt="八张单头匹配矩阵叠放，前表列为 Query、行为 Key，每格为对应 K 与 Q 的点积" width="1630" height="965" />
    <figcaption>多个 head，对应多组注意力计算。各个头有不同的投影参数，可以产生不同的权重矩阵。图中列为 Query、行为 Key，是实验总结表格的转置画法；格子的匹配得分还需经过缩放与 Softmax 才成为权重。</figcaption>
  </figure>;
}
