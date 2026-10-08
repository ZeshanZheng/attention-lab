import { ASSESSMENT } from './lessons.ts';
import type { Question } from './lessons.ts';
import { BEGINNER_EXPLANATIONS } from './explanations.ts';

export const TOPICS = ['matching', 'aggregation', 'normalization', 'invariance', 'interpretation'] as const;
export type AssessmentTopic = typeof TOPICS[number];
export const TOPIC_LABELS: Record<AssessmentTopic, string> = {
  matching: '匹配得分', aggregation: '信息聚合', normalization: '权重分配', invariance: '变化规律', interpretation: '概念边界',
};
export interface AssessmentQuestion extends Question { readonly topic: AssessmentTopic; }
export const ROUND_SIZE = TOPICS.length;

// Preserve the exact original questions for historical answers.
export const LEGACY_QUESTIONS: readonly AssessmentQuestion[] = ASSESSMENT.map((question, index) => ({ ...question, topic: TOPICS[index]! }));
const BASE_QUESTIONS: readonly AssessmentQuestion[] = [
  ...LEGACY_QUESTIONS,
  { id: 'matching-y', topic: 'matching', prompt: 'Q = (0, 1)，K_A = (3, 0)，K_B = (0, 2)。哪个词元的匹配得分更高？',
    options: ['A，因为它的 x 更大', 'B，因为与 Q 的点积是 2', '二者相同'], correctIndex: 1,
    explanation: 'Q 只取出 K 的 y 分量：A 的点积为 0，B 为 2，因此 B 的得分更高。', retryHint: '把两个坐标分别相乘再相加。' },
  { id: 'matching-negative', topic: 'matching', prompt: 'Q = (−1, 0)，K_A = (−2, 1)，K_B = (1, 4)。哪个词元会获得更高权重？',
    options: ['B，因为它的两个坐标都为正', '二者相同', 'A，因为两个点积分别是 2 和 −1'], correctIndex: 2,
    explanation: '负数相乘也可以得到正数。Q·K_A = 2，Q·K_B = −1，经过相同缩放和 Softmax 后 A 的权重更高。', retryHint: '注意负号，坐标更大不代表点积一定更大。' },
  { id: 'matching-tie', topic: 'matching', prompt: '只有两个可见词元，Q = (1, 1)，K_A = (2, 0)，K_B = (0, 2)。权重如何分配？',
    options: ['A 为 100%，B 为 0%', '各为 50%', 'A 为 0%，B 为 100%'], correctIndex: 1,
    explanation: '两个点积都是 2，缩放得分相同，Softmax 给两个词元相同权重。', retryHint: '先比较两个点积是否相同。' },
  { id: 'aggregation-mean', topic: 'aggregation', prompt: '权重是 (0.5, 0.5)，V_A = (2, −2)，V_B = (0, 4)。输出是多少？',
    options: ['(1, 1)', '(2, 2)', '(1, 3)'], correctIndex: 0,
    explanation: 'x = 0.5×2 + 0.5×0 = 1；y = 0.5×(−2) + 0.5×4 = 1。负分量也参与加权求和。', retryHint: '分别计算每个坐标，保留负号。' },
  { id: 'aggregation-identical', topic: 'aggregation', prompt: '三个 V 都是 (−1, 2)，权重为 (0.2, 0.3, 0.5)。输出是多少？',
    options: ['(−3, 6)', '(−1, 2)', '(0, 0)'], correctIndex: 1,
    explanation: '相同 V 乘上总和为 1 的权重，结果仍是这个 V：(0.2+0.3+0.5)×(−1,2) = (−1,2)。', retryHint: '先把三个权重相加。' },
  { id: 'aggregation-cancel', topic: 'aggregation', prompt: '权重是 (0.5, 0.5)，V_A = (2, 0)，V_B = (−2, 0)。输出是多少？',
    options: ['(2, 0)', '(−2, 0)', '(0, 0)'], correctIndex: 2,
    explanation: '两个相反方向的 V 以相同权重相加，x 分量抵消，输出为零向量。这不表示注意力权重为零。', retryHint: '比较两个加权后的 x 分量。' },
  { id: 'normalization-equal', topic: 'normalization', prompt: '三个可见词元的缩放得分都是 5。Softmax 权重是多少？',
    options: ['每个都是 1/3', '每个都是 5', '每个都是 0'], correctIndex: 0,
    explanation: '每个分子都是 exp(5)，分母是 3×exp(5)，因此每个权重都是 1/3。均匀分布不要求得分为零。', retryHint: '相同的三个指数值会怎样归一化？' },
  { id: 'normalization-sum', topic: 'normalization', prompt: '某行 Attention 权重为 (0.2, 0.3, 0.5)。它们为什么能用作分配比例？',
    options: ['因为每个权重都必须大于 0.3', '因为它们是未缩放的点积', '因为权重非负，并且总和为 1'], correctIndex: 2,
    explanation: 'Softmax 把得分转为非负且总和为 1 的权重。这些是对 V 的加权比例，不是原始匹配得分。', retryHint: '检查符号与总和。' },
  { id: 'normalization-mask', topic: 'normalization', prompt: '三个词元的得分相同，用 Mask 屏蔽 B（使它不能被关注），A 和 C 可见。权重是多少？',
    options: ['(1/3, 1/3, 1/3)', '(0.5, 0, 0.5)', '(0, 1, 0)'], correctIndex: 1,
    explanation: '被屏蔽的 B 权重为 0，剩余两个相同得分在可见词元中重新归一化，各占 0.5。', retryHint: '只在允许关注的词元之间分配比例。' },
  { id: 'invariance-value', topic: 'invariance', prompt: '保持 Q、K 不变，只修改一个 V。权重和输出可能怎样变化？',
    options: ['权重一定改变，输出一定不变', '权重和输出都一定不变', '权重不变，输出可能改变'], correctIndex: 2,
    explanation: '权重由 Q、K 决定；输出还包含 V。修改 V 可能改变输出，而不会改变权重。', retryHint: '看看公式里 V 出现在哪一步。' },
  { id: 'invariance-gap', topic: 'invariance', prompt: '两个词元的缩放得分从 (1, 0) 变为 (2, 0)。第一个词元的权重怎样变化？',
    options: ['不变，因为最大得分仍在第一位', '上升，因为相对得分差扩大', '下降，因为 Softmax 总和为 1'], correctIndex: 1,
    explanation: '第一项与第二项的差从 1 增至 2，其指数值的相对比例变大，第一项的权重上升。排序相同不表示比例相同。', retryHint: '比较两项之间的差值。' },
  { id: 'invariance-scale', topic: 'invariance', prompt: '两个词元的缩放得分从 (2, 0) 变为 (1, 0)。权重分配怎样变化？',
    options: ['更接近各占一半，但第一项仍更高', '保持完全相同', '第二项变为 100%'], correctIndex: 0,
    explanation: '差距缩小会使 Softmax 更接近均匀，但大小顺序保持。给所有得分乘同一系数，通常会改变权重。', retryHint: '缩小差距与共同加一个常数不同。' },
  { id: 'interpretation-role', topic: 'interpretation', prompt: '在这个直接编辑 Q/K/V 的实验里，哪项描述正确？',
    options: ['Q/K 用于匹配，V 是被加权聚合的内容', 'V 决定权重，Q/K 只是最后的输出', 'Q、K、V 都直接表示概率'], correctIndex: 0,
    explanation: '先用 Q 与各 K 的点积计算得分，再经 Softmax 得到权重，最后按权重聚合 V。', retryHint: '沿着点积、Softmax、加权求和回想计算顺序。' },
  { id: 'interpretation-output', topic: 'interpretation', prompt: '本实验计算出的二维 Attention 输出代表什么？',
    options: ['模型预测出的下一个词', '各 V 按权重聚合后的向量', '三个词元的原始匹配得分'], correctIndex: 1,
    explanation: '本实验只实现注意力聚合，二维输出是加权 V 的结果。得到下一个词还需要模型中的其他模块。', retryHint: '区分 Attention 输出与完整语言模型输出。' },
  { id: 'interpretation-dot', topic: 'interpretation', prompt: 'Q = (1, 0)，K_A = (2, 0)，K_B = (1, 0)。关于本实验的点积得分，哪项正确？',
    options: ['方向相同，点积必定相等', '点积只能在 −1 到 1 之间', 'A 的点积是 2，B 是 1；点积不是余弦相似度'], correctIndex: 2,
    explanation: '点积同时受方向和长度影响。这里两个 K 方向相同，但长度不同，因此点积不同；不应把它当作归一化的余弦相似度。', retryHint: '直接把坐标相乘相加，不除以向量长度。' },
  { id: 'interpretation-range', topic: 'interpretation', prompt: '只有两个 V：(0, 0) 与 (4, 0)，使用标准 Softmax 权重。输出的 x 分量位于什么范围？',
    options: ['0 到 4 之间', '一定大于 4', '一定小于 0'], correctIndex: 0,
    explanation: '权重非负且和为 1，输出是两个 V 的加权平均，因此 x 不会超出 0 到 4 的范围。', retryHint: '把输出写成 α×0 + (1−α)×4。' },
];
export const QUESTION_BANK: readonly AssessmentQuestion[] = BASE_QUESTIONS.map((question) => ({ ...question,
  explanation: BEGINNER_EXPLANATIONS[question.id]?.join('\n') ?? question.explanation }));

/** One per concept; four variants allow three recent rounds without repeats. */
export function createAssessment(recentRounds: readonly (readonly string[])[] = [], random: () => number = Math.random): AssessmentQuestion[] {
  const seen = new Set(recentRounds.slice(-3).flat());
  const questions = TOPICS.map((topic) => {
    const pool = QUESTION_BANK.filter((question) => question.topic === topic);
    const fresh = pool.filter((question) => !seen.has(question.id));
    const candidates = fresh.length ? fresh : pool;
    return candidates[Math.floor(random() * candidates.length)]!;
  });
  for (let index = questions.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [questions[index], questions[other]] = [questions[other]!, questions[index]!];
  }
  return questions.map((question) => ({ ...question, options: [...question.options] }));
}
export function scoreAnswers(questions: readonly Question[], answers: readonly number[]): number {
  return questions.reduce((score, question, index) => score + Number(answers[index] === question.correctIndex), 0);
}
