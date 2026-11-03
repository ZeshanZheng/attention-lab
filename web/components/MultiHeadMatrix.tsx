const MATRIX_TOKENS = ['我', '今', '天', '买', '了', '一', '本', '书'];

export function MultiHeadMatrix() {
  return <figure className="multi-head-figure">
    <div className="multi-head-diagram-heading"><h3>多个 head，多张注意力矩阵</h3><p>每个头使用自己的投影参数，独立计算一张矩阵；下方展开头 1 的计算式。</p></div>
    <div className="multi-head-labels" aria-label="原始基础模型的八个注意力头">{Array.from({ length: 8 }, (_, index) => <span key={index} className={index === 0 ? 'front-head' : ''}>头 {index + 1}</span>)}</div>
    <div className="multi-head-matrix-stack">
      <div className="reading-table-scroll" tabIndex={0} role="region" aria-label="多头匹配得分矩阵，可横向滚动">
        <table className="multi-head-symbol-table"><caption>头 1 · 点积匹配得分矩阵</caption>
          <thead><tr><th scope="col">Query ↓<br />Key →</th>{MATRIX_TOKENS.map((word, key) => <th scope="col" key={key}><span>“{word}”</span>K<sub>{key + 1}</sub></th>)}</tr></thead>
          <tbody>{MATRIX_TOKENS.map((word, query) => <tr key={query}><th scope="row"><span>“{word}”</span>Q<sub>{query + 1}</sub></th>{MATRIX_TOKENS.map((_, key) => <td key={key}>Q<sub>{query + 1}</sub> · K<sub>{key + 1}</sub></td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
    <figcaption>每个 head 都有一张这样的矩阵，这里展开头 1 的计算式。行是 Query，列是 Key，与实验总结一致。格子中的点积匹配得分还需经过缩放与 Softmax，才成为注意力权重。手机可在表格内左右滑动。</figcaption>
  </figure>;
}
