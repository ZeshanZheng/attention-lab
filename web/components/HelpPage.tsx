import { Icon } from './Icon.tsx';

const MODULE_OVERVIEW = [
  { title: 'Attention 引言', description: '介绍注意力机制的背景、在 Transformer 中的位置及作用，建立整体认识。' },
  { title: '小栗子🌰', description: '用“书”和“它”的指代例子，分步解释 Q、K、V 如何配合，帮助直观理解。' },
  { title: '自由探索', description: '自由修改或拖动向量，实时观察匹配得分、注意力权重和输出的变化。' },
  { title: '实验总结', description: '整理单头注意力矩阵、核心公式与计算例子，把操作现象和数学原理联系起来。' },
  { title: '引导实验', description: '按“先预测、再修改、再验证”的流程完成任务，理解不同向量的作用。' },
  { title: '理解自测', description: '通过答题和解析检查掌握情况，发现容易混淆的概念。' },
  { title: '多头注意力', description: '介绍多个注意力头如何并行计算、拼接并组合结果，进一步理解信息聚合。' },
  { title: '三种 Attention', description: '对比编码器自注意力、解码器遮罩自注意力和交叉注意力的用途、信息来源与可见范围。' },
] as const;

export function HelpPage({ onExplore }: { onExplore: () => void }) {
  return <section className="help-page" aria-labelledby="help-title">
    <div className="help-heading"><span className="eyebrow">使用说明 · 开始之前</span><h2 id="help-title">欢迎来到注意力实验室</h2></div>
    <p>先了解各模块的功能与用途，再从页面顶部选择想学习的内容。详细操作说明放在对应模块中，可展开查看。</p>
    <div className="help-module-list">{MODULE_OVERVIEW.map((module) => <article key={module.title}><h3>{module.title}</h3><p>{module.description}</p></article>)}</div>
    <p>阅读后回到原来的实验或自测，会保留本页中的操作和答案。</p>
    <button className="button primary" onClick={onExplore}>开始探索<Icon name="arrow" /></button>
  </section>;
}
