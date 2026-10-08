import { useState } from 'react';
import { TransformerArchitecture } from './TransformerArchitecture.tsx';
import type { AttentionLocation } from './TransformerArchitecture.tsx';

const ATTENTION_TYPES = [
  { id: 'encoder', name: '编码器自注意力', english: 'Encoder Self-Attention', query: '编码器当前层的输入表示', keyValue: '同一条编码器输入序列的表示', visible: '所有源序列位置', description: '每个源词都可以从源序列的各个位置取回信息，为自己的表示补充上下文。Q、K、V 来自同一序列的表示，经过不同的投影计算得到。' },
  { id: 'decoder', name: '解码器遮罩自注意力', english: 'Decoder Masked Self-Attention', query: '解码器当前层的输入表示', keyValue: '同一条解码器输入序列的表示', visible: '当前及更早的输入位置', description: '每个位置只能读取当前及更早的输入位置，未来位置被因果遮罩屏蔽。原始训练流程把解码器输入右移一位，因此当前位置的输入是已经知道的词，不会提前看到正在预测的目标词。' },
  { id: 'cross', name: '编码器—解码器跨注意力', english: 'Encoder–Decoder Attention', query: '解码器前一子层的输出表示', keyValue: '编码器的输出表示', visible: '所有源序列位置', description: '解码器带着自己的查询，去读取编码器提供的源序列信息。Q 来自解码器，K 和 V 来自编码器输出，连接了两条序列。' },
] as const;

export function AttentionTypes() {
  const [selected, setSelected] = useState<AttentionLocation>('encoder');
  const current = ATTENTION_TYPES.find((item) => item.id === selected)!;
  return <section className="card advanced-reading" aria-labelledby="attention-types-title">
    <span className="eyebrow">进阶阅读 · Q/K/V 来自哪里，能读取哪些位置</span>
    <h2 id="attention-types-title">原始 Transformer 中的三种 Attention</h2>
    <p className="reading-lead">它们使用相同的注意力计算，区别在于 Q/K/V 的来源，以及哪些位置允许被关注。</p>
    <div className="attention-type-picker" role="group" aria-label="选择架构中的注意力位置">{ATTENTION_TYPES.map((item, index) => <button key={item.id} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}><span>{index + 1}</span>{item.name}</button>)}</div>
    <div className="attention-type-layout"><TransformerArchitecture location={selected} /><article className="attention-type-detail" aria-label="当前注意力类型" aria-live="polite"><h3>{current.name}</h3><p className="type-english">{current.english}</p><dl><div><dt>Q 从哪里来？</dt><dd>{current.query}</dd></div><div><dt>K、V 从哪里来？</dt><dd>{current.keyValue}</dd></div><div><dt>可以读取哪里？</dt><dd>{current.visible}</dd></div></dl><p>{current.description}</p></article></div>
    <div className="reading-table-scroll" tabIndex={0} role="region" aria-label="三种 Attention 对照表，可横向滚动"><table className="attention-types-table"><caption>三种 Attention 对照</caption><thead><tr><th scope="col">类型</th><th scope="col">Q 的来源</th><th scope="col">K / V 的来源</th><th scope="col">可读取的位置</th></tr></thead><tbody>{ATTENTION_TYPES.map((item) => <tr key={item.id}><th scope="row">{item.name}</th><td>{item.query}</td><td>{item.keyValue}</td><td>{item.visible}</td></tr>)}</tbody></table></div>
    <div className="reading-speech"><h3>沿着架构图读一遍</h3>
      <p>原始 Transformer 里有三种 Attention。第一种是编码器自注意力：Q、K、V 都来自编码器当前层的输入序列，每个源词可以看所有源词，按关注比例组合信息。这里的“来自同一个地方”说明它们同源，并不表示 Q = K = V；它们由不同的投影矩阵计算得到。</p>
      <p>第二种是解码器遮罩自注意力：Q、K、V 来自解码器，但要限制对未来位置的访问。每个位置可以看当前及更早的输入位置，不能偷看未来。实现时，在 Softmax 之前把未来位置的得分设为负无穷，使这些位置的权重变成零，再对允许访问的位置分配比例。</p>
      <p>第三种是编码器—解码器注意力，也叫跨注意力：Q 来自解码器，K 和 V 来自编码器输出，相当于解码器去读取源句子的记忆。比如机器翻译时，解码器生成译文的某个位置，可以查询原文哪些位置更相关，再取回相应信息。</p>
      <p>可以用两件事区分它们：查询和被读取的信息是否来自同一序列，以及是否需要屏蔽未来位置。这张图对应原始编码器—解码器 Transformer；其他 Transformer 架构可能只采用其中一部分，并不是每个模型都包含三种模块。</p>
    </div>
    <p className="reading-source">架构与说明：<a href="https://arxiv.org/html/1706.03762v7" target="_blank" rel="noreferrer">Transformer 原论文 §3.1、§3.2.3</a>。</p>
  </section>;
}
