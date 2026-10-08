import { useEffect, useRef } from 'react';
import { Icon } from './Icon.tsx';

export function HelpDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  return <dialog ref={dialog} className="help-dialog" aria-labelledby="help-title" onCancel={onClose}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="dialog-heading"><div><span className="eyebrow">QUICK GUIDE</span><h2 id="help-title">欢迎来到注意力实验室</h2></div><button className="icon-button" onClick={onClose} aria-label="关闭说明"><Icon name="close" /></button></div>
    <p>自由探索可以修改所有向量；引导实验会限定一个变量，先预测再验证。</p>
    <p>页面顶部依次为 Attention 引言、自由探索、小栗子🌰、实验总结、引导实验、理解自测、多头注意力和三种 Attention。引言介绍背景与架构，小栗子分步讲解“书”和“它”；总结先展示单头矩阵，再整理公式与数值例子。自测之后的两个入口提供进阶阅读。阅读后回到原来的实验或自测，会保留本页中的操作和答案。</p>
    <ol className="guide-list">
      <li><b>选择观察对象</b><span>页面上方选择 A、B 或 C，观察它的 Query 如何关注其他词元。</span></li>
      <li><b>改变一个向量</b><span>选中编辑词元，输入数字，或拖动 Q/K/V 的圆点。默认拖动和方向键按整数调整，可切换为 0.1 步长；直接输入可用小数。向量各坐标范围为 −5 到 5。</span></li>
      <li><b>沿着四步计算走一遍</b><span>每一步说明输入、结果、用途和符号含义，并用当前数值举例。默认手动点“下一步”；自动演示可暂停，每步停留时间可选 5、10 或 20 秒。</span></li>
      <li><b>比较修改前后</b><span>默认基线是初始实验。也可以保存当前参数作为新基线，或恢复基线继续实验。</span></li>
    </ol>
    <div className="dialog-note"><b>怎样读热力图</b><p>行表示谁的 Query 在关注，列表示被关注的 Key；颜色越深，权重越大，每行的权重之和为 1。点选、悬停或用 Tab 聚焦一格，可以查看实际权重、点积和基线差值。自由探索中点击单元格会切换观察 Query；引导实验固定观察 A。只改 V 不会改变热力图。</p></div>
    <div className="dialog-note"><b>三次引导实验与理解自测</b><p>进入“引导实验”，按预测、修改、解释和理解题的顺序完成任务。记录预测后会定位并聚焦可编辑输入框，紫色边框标出开放的向量；顶部目标栏保留任务，也能直接检查修改。完成三个实验后可以查看概念与公式总结。自测题库有 20 道，每轮抽取 5 道；点击“换一组题”会清空未提交答案，最近三轮的题目不重复。已完成进度与自测题目、成绩保存在当前浏览器，可导出匿名记录；旧版四题成绩仍保留。未完成实验重新进入时从预测开始，重置实验保留学习进度。</p></div>
    <div className="dialog-note"><b>这是一个简化的教学模型</b><p>向量由人为设置，直接编辑 Q/K/V。点积是匹配得分，不是余弦相似度；输出是聚合向量，不是下一词预测。本实验没有加入训练、位置编码和多头机制。</p></div>
    <button className="button primary" onClick={onClose}>开始探索<Icon name="arrow" /></button>
  </dialog>;
}
