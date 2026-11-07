import { Icon } from './Icon.tsx';

const MODULE_OVERVIEW = [
  { id: 'introduction', title: 'Attention 引言', description: '结合 Transformer 架构图，认识 Attention 所在的位置与作用，了解自注意力与交叉注意力的区别。' },
  { id: 'example', title: '理解Q,K,V', description: '用“书”和“它”的具体例子，连贯解释 Q、K、V 如何配合，帮助直观理解Q、K、V。' },
  { id: 'calculation', title: 'Attention 计算', description: '按点积、缩放、Softmax 和加权求和四步理解完整公式，结合默认数值例子认识权重与输出；底部可展开单头注意力矩阵与讲解。' },
  { id: 'experiment', title: '动手实验', description: '切换自由探索与引导任务，修改 Q/K/V，观察匹配得分、注意力权重和输出的变化，直接比较修改前后结果，需要时展开热力图。' },
  { id: 'assessment', title: '理解自测', description: '通过答题和解析检查掌握情况；答错后可直接进入对应任务或说明页，再回来核对理解。' },
  { id: 'multihead', title: '多头注意力', description: '介绍了多个注意力头如何并行计算、拼接并组合结果，进一步理解信息聚合。' },
  { id: 'types', title: '三种 Attention', description: '对比了编码器自注意力、解码器遮罩自注意力和交叉注意力的用途、信息来源与可见范围。' },
] as const;

export type HelpModule = typeof MODULE_OVERVIEW[number]['id'];

export function HelpPage({ onNavigate }: { onNavigate: (module: HelpModule) => void }) {
  return <section className="help-page" aria-labelledby="help-title">
    <section className="help-attention-overview">
      <div className="help-heading"><h2 id="help-title">认识 Attention（注意力机制）</h2></div>
      <p className="introduction-lead">当我们理解一句话时，往往需要把一个词和上下文联系起来。Attention 让模型计算“应该从哪些位置取回多少信息”，再按比例组合这些信息，为当前词元补充上下文。</p>
      <div className="introduction-cards">
        <article><h4>1.它从哪里来？</h4><p>注意力机制早已用于机器翻译，帮助模型在生成译文时参考相关的原文位置。2017 年提出的 Transformer 将注意力机制放在架构的核心，让不同位置的信息可以直接建立联系。</p></article>
        <article><h4>2.它在 Transformer 中做什么？</h4><p>Transformer 是一种神经网络架构。它的 Attention 子层负责在词元之间交换信息，前馈网络进一步加工每个位置的表示；它们配合残差连接与归一化，逐层更新表示。</p></article>
        <article><h4>3.理解它有什么帮助？</h4><p>可以把“模型利用上下文”拆成具体计算：Q/K 怎样匹配、权重怎样分配、V 怎样汇合。这样更容易读懂公式和热力图，也为继续学习多头注意力与完整 Transformer 打下基础。</p></article>
      </div>
    </section>
    <section className="help-learning-route" aria-labelledby="help-route-title">
      <h3 id="help-route-title">建议学习路线</h3>
      <p><b>初次学习：</b>Attention 引言 → 理解Q,K,V → Attention 计算 → 动手实验（自由探索或引导任务）→ 理解自测。</p>
      <p><b>进阶学习：</b>多头注意力 → 三种 Attention。</p>
    </section>
    <p>您可以先了解各模块的功能与用途，点击下方模块即可进入对应页面。</p>
    <div className="help-module-list">{MODULE_OVERVIEW.map((module) => <button type="button" className="help-module-card" key={module.id} aria-label={`打开${module.title}`} onClick={() => onNavigate(module.id)}>
      <span className="help-module-title">{module.title}<Icon name="arrow" size={18} /></span>
      <span className="help-module-description">{module.description}</span>
    </button>)}</div>
  </section>;
}
