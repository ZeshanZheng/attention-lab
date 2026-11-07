import { SingleHeadMatrix } from './SingleHeadMatrix.tsx';
import { Exponential } from './MathText.tsx';

export function ConceptSummary() {
  return <><SingleHeadMatrix /><section className="card concept-summary" id="concept-summary-title" aria-label="Attention 计算公式与详细解释">
    <div className="formula-box summary-formula"><div className="math-formula"><span className="summary-formula-term">s<sub>j</sub> = Q · K<sub>j</sub></span> → <span className="summary-formula-term">z<sub>j</sub> = s<sub>j</sub> / √d<sub>k</sub></span> → <span className="summary-formula-term">α<sub>j</sub> = <Exponential label="z 下标 j">z<sub>j</sub></Exponential> / Σ <Exponential label="z 下标 l">z<sub>l</sub></Exponential></span> → <span className="summary-formula-term">o = Σ α<sub>j</sub>V<sub>j</sub></span></div></div>
    <div className="summary-explanation" aria-label="公式的详细解释">
      <p>这条公式描述的是：<strong>先判断关注谁，再决定关注多少，最后汇合信息。</strong>箭头表示依次计算。</p>
      <ol className="summary-calculation-steps">
        <li><b>计算匹配得分：</b><code>s<sub>j</sub> = Q · K<sub>j</sub></code>
          <p>用当前观察词元的 Q，与第 j 个词元的 K 做点积，得到得分 s<sub>j</sub>。这里的 j 是词元编号，例如 A、B、C。</p>
        </li>
        <li><b>缩放得分：</b><code>z<sub>j</sub> = s<sub>j</sub> / √d<sub>k</sub></code>
          <p>把得分除以向量维度的平方根，调整数值尺度。网页里 Q、K 都是二维向量，所以 d<sub>k</sub> = 2，除以 √2。</p>
        </li>
        <li><b>转换成权重：</b><code>α<sub>j</sub> = <Exponential label="z 下标 j">z<sub>j</sub></Exponential> / Σ <Exponential label="z 下标 l">z<sub>l</sub></Exponential></code>
          <p>这一步叫 <strong>Softmax</strong>：</p>
          <ul><li><Exponential label="z">z</Exponential> 表示 e 的 z 次方，e ≈ 2.718。</li><li>Σ 表示把所有词元对应的数值相加；这里的 l 遍历所有参与计算的词元。</li><li>每项除以总和，得到关注比例 α<sub>j</sub>，各项权重相加为 1。</li></ul>
        </li>
        <li><b>得到输出：</b><code>o = Σ α<sub>j</sub>V<sub>j</sub></code>
          <p>用各词元的权重乘它自己的 V，再把这些向量逐坐标相加，得到输出向量 o。</p>
        </li>
      </ol>
    </div>
    <div className="beginner-example"><b>默认实验的完整例子，观察 Q<sub>A</sub> = (1, 0)</b><p>点积得分 (1, 0, −1) → 除以 √2，得 (0.707, 0, −0.707) → Softmax 权重约为 (0.576, 0.284, 0.140)，即 (57.6%, 28.4%, 14.0%) → 对 V<sub>A</sub> = (2, 0)、V<sub>B</sub> = (0, 2)、V<sub>C</sub> = (−2, 0) 加权。</p><p>输出 x ≈ 0.576×2 + 0.284×0 + 0.140×(−2) = 0.872；输出 y ≈ 0.576×0 + 0.284×2 + 0.140×0 = 0.568。</p></div>
    <p>其中，<strong>Q/K 决定关注比例，V 提供被汇合的信息，o 是汇合后的向量。</strong></p>
    <p>实验一说明 Q/K 改变匹配，实验二说明 V 改变内容，实验三说明各权重共同分配 100%。这个输出是聚合后的向量；预测下一个词还需要完整模型中的其他模块。</p>
  </section></>;
}
