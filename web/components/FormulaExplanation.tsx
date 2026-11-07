import { Exponential, Fraction } from './MathText.tsx';
import { SingleHeadMatrix } from './SingleHeadMatrix.tsx';

export function FormulaExplanation() {
  return <section className="card formula-explanation" id="attention-calculation-title" aria-label="Attention 计算公式与详细解释">
    <div className="summary-explanation" aria-label="公式的详细解释">
      <ol className="summary-calculation-steps">
        <li><b>计算匹配得分：</b><code>s<sub>j</sub> = Q · K<sub>j</sub></code>
          <p>用当前观察词元的 Q，与第 j 个词元的 K 做点积，得到得分 s<sub>j</sub>。这里的 j 是词元编号，例如 A、B、C。</p>
        </li>
        <li><b>缩放得分：</b><code>z<sub>j</sub> = <Fraction numerator={<>s<sub>j</sub></>} denominator={<>√d<sub>k</sub></>} label="s 下标 j 除以 d 下标 k 的平方根" /></code>
          <p>把得分除以向量维度的平方根，调整数值尺度。网页里 Q、K 都是二维向量，所以 d<sub>k</sub> = 2，除以 √2。</p>
          <p>当向量维度较大时，点积可能变大，让 Softmax 的分配过于集中、梯度变小；缩放有助于控制得分的尺度。</p>
        </li>
        <li><b>转换成权重：</b><code>α<sub>j</sub> = <Fraction numerator={<Exponential label="z 下标 j">z<sub>j</sub></Exponential>} denominator={<>Σ <Exponential label="z 下标 l">z<sub>l</sub></Exponential></>} label="e 的 z 下标 j 次方，除以所有 e 的 z 下标 l 次方之和" /></code>
          <p>这一步叫 <strong>Softmax</strong>：</p>
          <ul><li><Exponential label="z">z</Exponential> 表示 e 的 z 次方，e ≈ 2.718。</li><li>Σ 表示把所有词元对应的数值相加；这里的 l 遍历所有参与计算的词元。</li><li>每项除以总和，得到关注比例 α<sub>j</sub>，各项权重相加为 1。</li></ul>
        </li>
        <li><b>得到输出：</b><code>o = Σ α<sub>j</sub>V<sub>j</sub></code>
          <p>用各词元的权重乘它自己的 V，再把这些向量逐坐标相加，得到输出向量 o。</p>
        </li>
      </ol>
    </div>
    <div className="beginner-example"><b>默认实验的完整例子，观察 Q<sub>A</sub> = (1, 0)</b><p>点积得分 (1, 0, −1) → 除以 √2，得 (0.707, 0, −0.707) → Softmax 权重约为 (0.576, 0.284, 0.140)，即 (57.6%, 28.4%, 14.0%) → 对 V<sub>A</sub> = (2, 0)、V<sub>B</sub> = (0, 2)、V<sub>C</sub> = (−2, 0) 加权。</p><p>输出 x ≈ 0.576×2 + 0.284×0 + 0.140×(−2) = 0.872；输出 y ≈ 0.576×0 + 0.284×2 + 0.140×0 = 0.568。</p></div>
    <details className="calculation-matrix">
      <summary>单头注意力矩阵与讲解</summary>
      <SingleHeadMatrix />
    </details>
  </section>;
}
