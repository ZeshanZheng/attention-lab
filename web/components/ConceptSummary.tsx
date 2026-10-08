export function ConceptSummary() {
  return <section className="card concept-summary" aria-labelledby="concept-summary-title">
    <h2 id="concept-summary-title">把三个实验串起来：Attention 到底在算什么？</h2>
    <p>词元是参与计算的一个文本单位；这里用 A、B、C 代替真实文字。向量是一组数字，二维向量有 x、y 两个坐标。我们直接编辑人为设定的向量，观察计算关系。</p>
    <dl className="concept-definitions"><div><dt>Q · Query · 查询</dt><dd>当前词元在寻找什么信息。它与每个 K 比较。</dd></div><div><dt>K · Key · 键</dt><dd>每个词元用于被匹配的特征。Q/K 一起决定关注谁。</dd></div><div><dt>V · Value · 值</dt><dd>每个词元实际提供的内容。按关注比例取回并合并。</dd></div></dl>
    <div className="formula-box"><span className="formula-label">完整公式，按从左到右的四步理解</span><div className="math-formula">sⱼ = Q · Kⱼ → zⱼ = sⱼ / √dₖ → αⱼ = exp(zⱼ) / Σ exp(zₗ) → o = Σ αⱼVⱼ</div></div>
    <p>先算点积得分，再按维度缩放，用 Softmax 转成总和为 1 的权重，最后对 V 加权求和。Σ 读作“把所有词元的这一项相加”；α 是权重，o 是输出向量。</p>
    <div className="beginner-example"><b>默认实验的完整例子，观察 Q_A = (1, 0)</b><p>点积得分 (1, 0, −1) → 除以 √2，得 (0.707, 0, −0.707) → Softmax 权重约为 (0.576, 0.284, 0.140) → 对 V_A = (2, 0)、V_B = (0, 2)、V_C = (−2, 0) 加权。</p><p>输出 x ≈ 0.576×2 + 0.284×0 + 0.140×(−2) = 0.872；输出 y ≈ 0.576×0 + 0.284×2 + 0.140×0 = 0.568。展示值已四舍五入。</p></div>
    <p>实验一说明 Q/K 改变匹配，实验二说明 V 改变内容，实验三说明各权重共同分配 100%。这个输出是聚合后的向量；预测下一个词还需要完整模型中的其他模块。</p>
  </section>;
}
