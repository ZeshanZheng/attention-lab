import { computeAttention, createDefaultExperiment } from '../../src/index.ts';
import type { AttentionInput, AttentionResult } from '../../src/index.ts';
import type { VectorKind } from '../state.ts';
import { formatNumber, formatVector } from '../format.ts';

export type LessonId = 'focus' | 'content' | 'competition';
export interface Question {
  readonly id: string;
  readonly prompt: string;
  readonly options: readonly string[];
  readonly correctIndex: number;
  readonly explanation: string;
  readonly retryHint: string;
}
export interface Lesson {
  readonly id: LessonId;
  readonly number: number;
  readonly title: string;
  readonly subtitle: string;
  readonly task: string;
  readonly kind: VectorKind;
  readonly token: number;
  readonly step: number;
  readonly prediction: Question;
  readonly comprehension: Question;
  readonly hint: string;
  readonly deeperHint: string;
}
export const LESSONS: readonly Lesson[] = [
  {
    id: 'focus', number: 1, title: '改变关注对象', subtitle: 'Q、K 决定关注谁',
    task: '保持 Q、V 和其他 K 不变，只修改 B 的 K，让 A 分给 B 的权重超过 60%。',
    kind: 'keys', token: 1, step: 0,
    prediction: {
      id: 'focus-prediction', prompt: '如果把 B 的 K 从 (0, 1) 改为 (2, 1)，A 关注 A、B、C 的比例会怎样变化？',
      options: ['B 的权重上升，A 和 C 的权重下降', '三个词元的权重都会上升', '权重不变，只有输出发生变化'],
      correctIndex: 0, explanation: 'Q_A = (1, 0)，因此 B 的点积从 0 增至 2。Softmax 将更大的比例分给 B，A、C 的比例随之下降。',
      retryHint: '先比较 Q_A 与 K_B 的点积，再想想所有权重之和。',
    },
    comprehension: {
      id: 'focus-check', prompt: '在这个实验里，为什么增大 K_B 的 y 坐标不会改变 A 的注意力权重？',
      options: ['K 的 y 坐标在任何 Attention 中都无效', 'Q_A 的 y 坐标是 0，点积中的 y 项始终为 0', 'Softmax 会忽略所有 y 坐标'],
      correctIndex: 1, explanation: '点积是 q_x k_x + q_y k_y。本例 q_y = 0，所以 y 项为 0；换一个 Query，结论可能不同。',
      retryHint: '查看点积公式：当前 Query 的第二个坐标是多少？',
    },
    hint: 'Q_A = (1, 0)，点积中的第二项始终为 0。先调整 K_B 的 x。',
    deeperHint: '可以把 K_B 的 x 调到 2，y 保持 1，再检查权重。',
  },
  {
    id: 'content', number: 2, title: '改变传递内容', subtitle: 'V 决定取回什么信息',
    task: '保持所有 Q、K 不变，把 B 的 V 从 (0, 2) 改为 (0, 4)，比较权重和输出。',
    kind: 'values', token: 1, step: 3,
    prediction: {
      id: 'content-prediction', prompt: '只把 B 的 V 从 (0, 2) 改为 (0, 4)，会发生什么？',
      options: ['B 的权重翻倍，输出不变', '所有权重不变，输出的 x 不变、y 翻倍', '所有权重和整个输出都翻倍'],
      correctIndex: 1, explanation: '权重只由 Q、K 计算。默认实验中只有 B 的 V 提供 y 分量，因此把它从 2 改为 4，输出 y 翻倍，x 不变。',
      retryHint: '区分决定权重的 Q/K 与最后被加权的 V。',
    },
    comprehension: {
      id: 'content-check', prompt: '为什么“权重完全相同”不能保证“输出完全相同”？',
      options: ['因为输出还取决于被加权的 V', '因为 Softmax 会随机改变输出', '因为相同权重一定会得到不同输出'],
      correctIndex: 0, explanation: '输出是 Σ α_j V_j。相同 α 配上不同 V，可能得到不同输出；如果 V 也相同，输出才保持相同。',
      retryHint: '在加权求和公式中，除了 α，还出现了什么？',
    },
    hint: '只改 V 不会改变得分。找到 B 的 V y 输入框，保留 V x 为 0。',
    deeperHint: '把 V_B 的 y 输入为 4。关注右侧的权重差值和输出 y 差值。',
  },
  {
    id: 'competition', number: 3, title: '观察权重联动', subtitle: 'Softmax 分配同一份比例',
    task: '只修改 A 的 K，提高它的 x，让 A 的权重达到至少 70%；观察 B、C 的权重是否下降，以及总和是否仍为 1。',
    kind: 'keys', token: 0, step: 2,
    prediction: {
      id: 'competition-prediction', prompt: '只提高 A 的匹配得分时，整组权重会怎样变化？',
      options: ['A 上升，B 和 C 保持原值', '所有权重都上升，总和大于 1', 'A 上升，B 和 C 下降，总和仍为 1'],
      correctIndex: 2, explanation: 'Softmax 的分母包含所有词元的指数得分。A 的得分提高使分母增加，B、C 的权重随之减小，但总和仍为 1。',
      retryHint: '一个指数得分变大后，共同的分母会怎样变化？',
    },
    comprehension: {
      id: 'competition-check', prompt: '如果给所有缩放后的得分同时加上相同常数，Softmax 权重会怎样变化？',
      options: ['全部增大', '保持不变', '变为均匀分布'],
      correctIndex: 1, explanation: '分子和分母都乘上同一个 exp(c)，它会抵消。Softmax 取决于得分的相对差异，而不是共同的平移。',
      retryHint: '把 exp(z_j + c) 写成 exp(z_j) × exp(c)，看看共同因子能否抵消。',
    },
    hint: 'Q_A 的 x 是 1，提高 K_A 的 x 会提高 A 的匹配得分。',
    deeperHint: '把 K_A 的 x 从 1 调到 2，观察三个柱状条和权重之和。',
  },
];

export function getLesson(id: LessonId): Lesson { return LESSONS.find((lesson) => lesson.id === id)!; }
export function createLessonInput(): AttentionInput { return createDefaultExperiment().input; }

export interface GoalEvaluation { readonly met: boolean; readonly feedback: string; readonly explanation: string; }

/** Evaluate the original teaching baseline, never a learner-overwritten baseline. */
export function evaluateGoal(id: LessonId, input: AttentionInput): GoalEvaluation {
  const baseInput = createLessonInput();
  const lesson = getLesson(id);
  const controlled = (['queries', 'keys', 'values'] as const).every((kind) =>
    input[kind].length === 3 && input[kind].every((row, token) => row.length === 2 && row.every((value, coordinate) =>
      Number.isFinite(value) && Math.abs(value) <= 5 && (kind === lesson.kind && token === lesson.token || value === baseInput[kind][token]![coordinate]))));
  if (!controlled || input.mask !== undefined) return { met: false, feedback: '请保留其他向量不变，重新开始这个实验。', explanation: '每次只改变指定向量，才能把结果变化归因到这次修改。' };
  const baseline = computeAttention(baseInput);
  const current = computeAttention(input);
  const weights = current.weights[0]!;
  const baseWeights = baseline.weights[0]!;
  if (id === 'focus') {
    const met = weights[1]! > 0.6;
    return { met, feedback: met ? '目标达成：B 的权重超过了 60%。' : `B 当前的权重是 ${formatNumber(weights[1]! * 100, 1)}%，还需要超过 60%。`,
      explanation: `B 的匹配得分从 0 变为 ${formatNumber(current.rawScores[0]![1]!)}，权重从 ${formatNumber(baseWeights[1]! * 100, 1)}% 变为 ${formatNumber(weights[1]! * 100, 1)}%。A、C 的权重分别变为 ${formatNumber(weights[0]! * 100, 1)}% 和 ${formatNumber(weights[2]! * 100, 1)}%。` };
  }
  if (id === 'content') {
    const unchanged = weights.every((weight, index) => Math.abs(weight - baseWeights[index]!) < 1e-10);
    const output = current.outputs[0]!;
    const baseOutput = baseline.outputs[0]!;
    const met = Math.abs(input.values[1]![0]!) < 1e-10 && Math.abs(input.values[1]![1]! - 4) < 1e-10
      && unchanged && Math.abs(output[0]! - baseOutput[0]!) < 1e-10 && Math.abs(output[1]! - 2 * baseOutput[1]!) < 1e-10;
    return { met, feedback: met ? '目标达成：权重不变，输出的 y 分量翻倍。' : '请把 B 的 V 设为 (0, 4)，保留所有 Q、K，随后比较输出。',
      explanation: `输出从 ${formatVector(baseOutput)} 变为 ${formatVector(output)}。B 对 y 的贡献从 ${formatNumber(baseline.contributions[0]![1]![1]!)} 变为 ${formatNumber(current.contributions[0]![1]![1]!)}。${unchanged ? '所有权重保持相同。' : '当前权重发生了变化。'}` };
  }
  const met = input.keys[0]![0]! > 1 && weights[0]! >= 0.7 && weights[1]! < baseWeights[1]!
    && weights[2]! < baseWeights[2]! && Math.abs(weights.reduce((sum, weight) => sum + weight, 0) - 1) < 1e-10;
  return { met, feedback: met ? '目标达成：A 达到至少 70%，B、C 下降，总和仍为 1。' : `A 当前的权重是 ${formatNumber(weights[0]! * 100, 1)}%，目标是至少 70%。`,
    explanation: `A、B、C 的权重从 ${baseWeights.map((weight) => `${formatNumber(weight * 100, 1)}%`).join(' / ')} 变为 ${weights.map((weight) => `${formatNumber(weight * 100, 1)}%`).join(' / ')}。三个权重之和为 ${formatNumber(weights.reduce((sum, weight) => sum + weight, 0))}。` };
}

export interface Observation {
  readonly input: AttentionInput;
  readonly weights: readonly number[];
  readonly output: readonly number[];
  readonly explanation: string;
}
export function createObservation(input: AttentionInput, result: AttentionResult, explanation: string): Observation {
  return { input: { queries: input.queries.map((row) => [...row]), keys: input.keys.map((row) => [...row]), values: input.values.map((row) => [...row]) },
    weights: [...result.weights[0]!], output: [...result.outputs[0]!], explanation };
}

export const ASSESSMENT: readonly Question[] = [
  { id: 'matching', prompt: 'Q = (1, 0)，K_A = (2, 2)，K_B = (0, 3)。哪个词元会获得更高权重？',
    options: ['A，因为它与 Q 的点积更大', 'B，因为 K_B 的 y 更大', '二者相同'], correctIndex: 0,
    explanation: '两个点积分别为 2 和 0；同样的缩放不会改变大小顺序，所以 A 获得更高权重。', retryHint: '先分别算两个点积。' },
  { id: 'aggregation', prompt: '权重是 (0.25, 0.75)，V_A = (4, 0)，V_B = (0, 4)。输出是多少？',
    options: ['(3, 1)', '(4, 4)', '(1, 3)'], correctIndex: 2,
    explanation: '0.25 × (4, 0) + 0.75 × (0, 4) = (1, 3)。权重是比例，V 是被聚合的内容。', retryHint: '分别计算 x 和 y 分量。' },
  { id: 'uniform', prompt: '没有 Mask，Q = (0, 0)，有三个有限的 K。注意力权重会怎样分配？',
    options: ['全部为 0', '每个都是 1/3', '只关注第一个词元'], correctIndex: 1,
    explanation: '三个点积都为 0，缩放后仍相同，Softmax 给出均匀分布。', retryHint: '零向量与任意 K 的点积是多少？' },
  { id: 'translation', prompt: '缩放得分从 (1, 0, −1) 变为 (6, 5, 4)，Softmax 权重会怎样变化？',
    options: ['保持相同', '每个权重都增加 5', '变为 (1/3, 1/3, 1/3)'], correctIndex: 0,
    explanation: '每个得分都加了 5，相对差异不变；分子和分母的共同指数因子抵消。', retryHint: '比较两组得分的差值。' },
];

export function scoreAssessment(answers: readonly number[]): number {
  return ASSESSMENT.reduce((score, question, index) => score + Number(answers[index] === question.correctIndex), 0);
}
