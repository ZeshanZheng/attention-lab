import { useState } from 'react';
import { Icon } from './Icon.tsx';

const EXAMPLE_STEPS = [
  {
    label: '认识 Q 和 K',
    title: '每个词，怎样描述自己和寻找信息？',
    takeaway: 'K 提供用于匹配的特征，Q 用来寻找相关信息。',
    paragraphs: [
      '我们看一个例子：“我今天买了一本书，上午去了图书馆，然后下午又去了咖啡厅，晚上才开始读它。”这个句子中的“我”，它的身份是什么？是一个人称代词，是句子的主体。我们可以用这个说法帮助理解它的 K。而“我”这个词最关心什么呢？比如“我做了什么”“我去了哪里”，可以用来帮助理解它的 Q。',
      '句子里的每个词都要计算出自己的 Q 和 K，“书”和“它”也一样。从直觉上说，“书”的 K 可以联想到“名词、能被买也能被读的物品”，它的 Q 可以联想到“与哪些人或动作有关”；“它”的 K 可以联想到“代词、指代某个对象”，它的 Q 可以联想到“我代表的是什么东西”。这些问答是比喻，模型中的 Q 和 K 并不是写好的自然语言问题或词性标签。',
      '那么 Q 和 K 到底是怎么计算出来的呢？每个词元在当前层的输入表示 X，分别与模型在训练中学习到的参数矩阵相乘，得到 Q 和 K。靠近输入时，X 来自词元的 Embedding（嵌入）及位置相关信息；在后续层中，X 是前面各层更新后的表示。模型通过大量文本学习这些参数，从而学会提取有助于处理语言的特征。',
    ],
  },
  {
    label: '寻找相关位置',
    title: '“它”拿着自己的 Q，去和各个 K 匹配',
    takeaway: 'Q 与 K 决定匹配得分，再通过缩放和 Softmax 得到关注比例。',
    paragraphs: [
      '接下来，每个词元的 Q 都要与可见位置的 K 做点积运算。可以想象，每个词拿着自己的 Q，去和各个词的 K 碰一碰，看看哪些位置更能提供相关信息；在自注意力中，也可以包含自己的位置。',
      '比如，“它”的 Q 可以比喻成“我指代的是什么东西”。拿它去碰一碰“我”的 K：“我”是人称代词，是做这些事情的主体。在这句话中，它不是“读它”最自然的指代对象，所以我们用“较不匹配、较少关注”来说明这个位置。这里不表示代词永远不能指人，也不表示模型会把这个位置的权重直接设成零。',
      '但是，当“它”的 Q 碰到“书”的 K 时，“书”是一个名词，是一种能被买、被读的物品，与“读它”的上下文很契合。因此，可以用“更匹配、值得投入更多注意力”来解释这两个位置的联系。真正的计算要把点积得分按维度缩放，再经过 Softmax，得到各个位置的权重；匹配程度和权重由实际向量决定。',
    ],
  },
  {
    label: '读取 V 的内容',
    title: '找到了相关位置，它能提供什么信息？',
    takeaway: 'V 携带可供取回的信息，权重决定取回多少。',
    paragraphs: [
      '当“它”对“书”分配了关注，就可以进一步取回“书”的 V。我们可以把 V 理解为这个位置能够提供的内容或信息。不过需要注意，这里的 V 并不是单词最初的向量，而是当前层的输入表示经过另一组学习到的参数矩阵，计算出来的新向量。',
      '比如，“书”在自然语言中可能有不同的含义：可以指成册的著作，也可以出现在书写、书法或“尚书”等表达里。在这个句子里，“买了一本”和“读它”让“成册的著作”成为更自然的解释。模型通过训练学习词语和上下文之间的规律，并通过多层计算形成与上下文有关的表示。',
      '这可以帮助我们想象“书”的位置提供了与阅读对象有关的信息，但 V 本身是一组数字，不能直接读成“成册的著作占 70%、其他词义占多少”的概率表。Attention 根据权重组合各个位置的 V，也不是只选中“书”，再去字典里挑一个词义。',
    ],
  },
  {
    label: '融入上下文',
    title: '让“它”的表示带上来自上下文的信息',
    takeaway: '按权重组合 V，得到聚合向量，为更新当前位置的表示提供信息。',
    paragraphs: [
      '把整个过程串起来：“它”通过自己的 Q 和各个位置的 K 做匹配，在这个直觉例子里，我们希望它更多地关注“书”，再按关注比例取回各个位置的 V。加权汇合后的结果会参与更新“它”的表示，使这个位置融入与“书”有关的上下文信息。',
      '演讲中可以把这种更新形容为“向量朝着成册的著作这个含义产生了一定的偏移”：原来单看“它”不清楚指谁，现在它的表示有机会带上阅读对象的信息。这是帮助理解的比喻，不对应空间里一条固定的“书的词义方向”。模型需要结合多层计算，才有可能在任务中正确处理这种指代关系。',
      '上面举的例子，是为了让大家更直观地理解注意力机制的工作原理。在实际 Transformer 中，Q、K、V 都是数学向量，整个过程由向量运算完成；它们的维度取决于模型配置，并不是固定的 512 维。本网页使用二维向量，把这些计算缩小到可以观察、可以手算的规模。',
      '在自注意力中，序列里的每个词元都会给可见位置分配不同的注意力权重，再按权重汇合信息。不同的关注方式会带来不同的聚合结果，帮助模型利用上下文处理语言。这就是这个例子想说明的 Attention：匹配相关位置，分配关注比例，再组合信息。输出仍然是向量，完整模型还要经过其他环节才能给出最终答案。',
    ],
  },
] as const;

const WORD_CARDS = [
  { word: '我', key: '人称代词，句子的主体', query: '我做了什么？我去了哪里？' },
  { word: '书', key: '名词，能被买、被读的物品', query: '与哪些人或动作有关？' },
  { word: '它', key: '代词，指代某个对象', query: '我代表的是什么东西？' },
] as const;

export function SentenceExample({ onExplore }: { onExplore: () => void }) {
  const [step, setStep] = useState(0);
  const current = EXAMPLE_STEPS[step]!;

  return <section className="sentence-example" aria-labelledby="sentence-example-title">
    <div className="example-heading"><span className="eyebrow">小栗子🌰 · 从句子走进计算</span><h2 id="sentence-example-title">用一个小例子，理解 Attention</h2><p>“晚上才开始读它”——这里的“它”，指的是什么？跟着四步讲解，看看 Q、K、V 怎样联系起来。</p></div>
    <div className="example-sentence" aria-label="例句">
      <p><span className={`example-word example-subject ${step === 0 ? 'is-emphasized' : ''}`}>我</span>今天买了一本<span className={`example-word example-book ${step > 0 ? 'is-emphasized' : ''}`}>书</span>，上午去了图书馆，然后下午又去了咖啡厅，晚上才开始读<span className="example-word example-pronoun is-emphasized">它</span>。</p>
      <div className="example-connection">{step === 0 ? '先认识“我”“书”“它”的 Q 和 K' : step === 1 ? '“它”的 Q → 匹配“书”的 K' : step === 2 ? '关注“书”的位置 → 取回它的 V' : '按权重汇合信息 → 更新“它”的表示'}</div>
    </div>
    <p className="example-scope">这是指代关系的教学示意，未运行真实语言模型，也未计算这句话的实际权重。我们按词语讲解；真实模型使用的词元划分取决于分词器。</p>
    <div className="example-step-picker" role="group" aria-label="例子讲解步骤">
      {EXAMPLE_STEPS.map((item, index) => <button key={item.label} aria-pressed={step === index} onClick={() => setStep(index)}><span>{index + 1}</span>{item.label}</button>)}
    </div>
    <article className="example-explanation" aria-label="当前例子讲解" aria-live="polite">
      <div className="example-step-heading"><span className="eyebrow">第 {step + 1} 步 / 4</span><h3>{current.title}</h3></div>
      <div className="example-prose">{current.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      {step === 0 && <>
        <div className="example-word-cards" aria-label="用自然语言比喻 Q 和 K">{WORD_CARDS.map((item) => <article key={item.word}><h4>“{item.word}”</h4><p><b>K · 用于匹配的特征</b>{item.key}</p><p><b>Q · 查询相关信息</b>{item.query}</p></article>)}</div>
        <div className="example-projection"><p>同一个输入表示 X，经过不同的学习到的变换</p><div><span>Q = X W<sub>Q</sub></span><span>K = X W<sub>K</sub></span><span>V = X W<sub>V</sub></span></div><small>X 是当前层的输入表示；W 是训练中学习到的参数矩阵。Q、K、V 同源，数值通常不同。</small></div>
      </>}
      <p className="example-takeaway"><b>这一步记住：</b>{current.takeaway}</p>
    </article>
    <div className="example-step-controls"><button className="button secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>上一步</button><span>{step + 1} / 4 · 按自己的节奏阅读</span><button className="button primary" disabled={step === EXAMPLE_STEPS.length - 1} onClick={() => setStep(step + 1)}>下一步<Icon name="arrow" size={16} /></button></div>
    <details className="example-transcript"><summary>展开完整讲稿 · 连贯读一遍</summary><div className="example-transcript-body"><p className="example-transcript-intro">依据演讲稿中“书”和“它”这一页整理，保留原来的讲解顺序，将比喻与实际向量计算分开说明。</p>{EXAMPLE_STEPS.map((item, index) => <section key={item.label}><h3>{index + 1}. {item.label}</h3>{item.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</div></details>
    <div className="example-explore"><p>把例子带回实验：改 Q/K 看关注比例，改 V 看聚合内容。</p><button className="button primary" onClick={onExplore}>去自由探索<Icon name="arrow" size={16} /></button></div>
    <p className="example-source">例句与讲解改编自提供的演讲稿对应页。计算原理可参阅 <a href="https://arxiv.org/html/1706.03762v7" target="_blank" rel="noreferrer">Transformer 原论文 §3.2</a>。</p>
  </section>;
}
