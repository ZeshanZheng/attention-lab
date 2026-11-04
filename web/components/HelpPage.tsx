import { Icon } from './Icon.tsx';

const MODULE_OVERVIEW = [
  { id: 'introduction', title: 'Attention 引言', description: '介绍了注意力机制的背景、在 Transformer 中的位置及作用，建立整体认识。' },
  { id: 'example', title: '小栗子🌰', description: '用“书”和“它”的具体例子，连贯解释 Q、K、V 如何配合，帮助直观理解Q、K、V。' },
  { id: 'free', title: '自由探索', description: '您可以自由修改或拖动某一个向量，实时观察匹配得分、注意力权重和输出的变化。' },
  { id: 'summary', title: '实验总结', description: '整理单头注意力矩阵、核心公式与计算例子，把操作现象和数学原理联系起来。' },
  { id: 'guided', title: '引导实验', description: '您可以按照“先预测、再修改、再验证”的流程完成任务，理解不同向量的作用。' },
  { id: 'assessment', title: '理解自测', description: '您可以通过答题和解析检查掌握情况，从而发现容易混淆的概念。' },
  { id: 'multihead', title: '多头注意力', description: '介绍了多个注意力头如何并行计算、拼接并组合结果，进一步理解信息聚合。' },
  { id: 'types', title: '三种 Attention', description: '对比了编码器自注意力、解码器遮罩自注意力和交叉注意力的用途、信息来源与可见范围。' },
] as const;

export type HelpModule = typeof MODULE_OVERVIEW[number]['id'];

export function HelpPage({ onNavigate }: { onNavigate: (module: HelpModule) => void }) {
  return <section className="help-page" aria-labelledby="help-title">
    <div className="help-heading"><span className="eyebrow">使用说明 · 开始之前</span><h2 id="help-title">欢迎您来到注意力实验室！</h2></div>
    <p>您可以先了解各模块的功能与用途，点击下方模块即可进入对应页面。</p>
    <div className="help-module-list">{MODULE_OVERVIEW.map((module) => <button type="button" className="help-module-card" key={module.id} aria-label={`打开${module.title}`} onClick={() => onNavigate(module.id)}>
      <span className="help-module-title">{module.title}<Icon name="arrow" size={18} /></span>
      <span className="help-module-description">{module.description}</span>
    </button>)}</div>
  </section>;
}
