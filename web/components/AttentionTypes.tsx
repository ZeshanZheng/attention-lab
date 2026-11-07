import { TransformerArchitecture } from './TransformerArchitecture.tsx';

const ATTENTION_TYPES = [
  { id: 'encoder', name: '编码器自注意力', query: '编码器当前层的输入表示', keyValue: '同一条编码器输入序列的表示', visible: '所有源序列位置' },
  { id: 'decoder', name: '解码器遮罩自注意力', query: '解码器当前层的输入表示', keyValue: '同一条解码器输入序列的表示', visible: '当前及更早的输入位置' },
  { id: 'cross', name: '编码器—解码器跨注意力', query: '解码器前一子层的输出表示', keyValue: '编码器的输出表示', visible: '所有源序列位置' },
] as const;

export function AttentionTypes() {
  return <section className="card advanced-reading" aria-labelledby="attention-types-title">
    <h2 id="attention-types-title">原始 Transformer 中的三种 Attention</h2>
    <p className="reading-lead">它们使用相同的注意力计算，区别在于 Q/K/V 的来源，以及哪些位置允许被关注。</p>
    <div className="attention-type-layout"><TransformerArchitecture showAllLocations showHighlightCaption={false} /><div className="reading-speech attention-type-speech">
      <p>原始 Transformer 里有三种 Attention。第一种是编码器自注意力：Q、K、V 都来自编码器当前层的输入序列，每个源词可以看所有源词，按关注比例组合信息。这里的“来自同一个地方”说明它们同源，并不表示 Q = K = V；它们由不同的投影矩阵计算得到。</p>
      <p>第二种是解码器遮罩自注意力：Q、K、V 来自解码器，但要限制对未来位置的访问。每个位置可以看当前及更早的输入位置，不能偷看未来的词。实现时，在 Softmax 之前把未来位置的得分设为负无穷，使这些位置的权重变成零，再对允许访问的位置分配比例。</p>
      <p>第三种是编码器—解码器注意力，也叫跨注意力：Q 来自解码器，K 和 V 来自编码器输出，相当于解码器去读取源句子的记忆。比如机器翻译时，解码器生成译文的某个位置，可以查询原文哪些位置更相关，再取回相应信息。</p>
      <p>可以用两件事区分它们：查询和被读取的信息是否来自同一序列，以及是否需要屏蔽未来位置。这张图对应原始编码器—解码器 Transformer；其他 Transformer 架构可能只采用其中一部分，并不要求每个模型都包含三种模块。</p>
      <p className="reading-source">架构与说明：<a href="https://arxiv.org/html/1706.03762v7" target="_blank" rel="noreferrer">Transformer 原论文 §3.1、§3.2.3</a>。</p>
    </div></div>
    <div className="reading-table-scroll" tabIndex={0} role="region" aria-label="三种 Attention 对照表，可横向滚动"><table className="attention-types-table"><caption>三种 Attention 对照</caption><thead><tr><th scope="col">类型</th><th scope="col">Q 的来源</th><th scope="col">K / V 的来源</th><th scope="col">可读取的位置</th></tr></thead><tbody>{ATTENTION_TYPES.map((item) => <tr key={item.id}><th scope="row">{item.name}</th><td>{item.query}</td><td>{item.keyValue}</td><td>{item.visible}</td></tr>)}</tbody></table></div>
  </section>;
}
