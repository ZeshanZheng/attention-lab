export function MultiHeadMatrix() {
  return <figure className="multi-head-figure">
    <img src={`${import.meta.env.BASE_URL}images/multi-head-matrices.png?v=20261107-readable`} alt="多张单头匹配矩阵叠在一起，示意多个注意力头各自计算一组关注关系" width="1630" height="965" />
    <figcaption>多个 head，对应多组注意力计算。各个头有不同的投影参数，可以产生不同的权重矩阵。图中列为 Query、行为 Key，是实验总结表格的转置画法；格子的匹配得分还需经过缩放与 Softmax 才成为权重。</figcaption>
  </figure>;
}
