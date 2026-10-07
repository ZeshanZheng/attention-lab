import type { AttentionInput } from '../core/attention.ts';

export interface TeachingToken {
  readonly id: string;
  readonly label: string;
  readonly query: readonly [number, number];
  readonly key: readonly [number, number];
  readonly value: readonly [number, number];
}

export interface DefaultExperiment {
  readonly title: string;
  readonly note: string;
  readonly selectedQueryIndex: number;
  readonly tokens: readonly TeachingToken[];
  readonly input: AttentionInput;
}

/** Fresh vectors on each call keep reset/baseline states independent. */
export function createDefaultExperiment(): DefaultExperiment {
  const tokens: TeachingToken[] = [
    { id: 'a', label: '词元 A', query: [1, 0], key: [1, 0], value: [2, 0] },
    { id: 'b', label: '词元 B', query: [0, 1], key: [0, 1], value: [0, 2] },
    { id: 'c', label: '词元 C', query: [-1, 0], key: [-1, 0], value: [-2, 0] },
  ];
  return {
    title: '三个词元的二维 Attention 实验',
    note: '人为设置的教学向量，直接编辑 Q/K/V；输出为聚合向量，不是下一词预测。',
    selectedQueryIndex: 0,
    tokens,
    input: {
      queries: tokens.map((token) => [...token.query]),
      keys: tokens.map((token) => [...token.key]),
      values: tokens.map((token) => [...token.value]),
    },
  };
}
