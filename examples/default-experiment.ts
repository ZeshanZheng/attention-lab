import { computeAttention, createDefaultExperiment } from '../src/index.ts';

const experiment = createDefaultExperiment();
const baseline = computeAttention(experiment.input);
const queryIndex = experiment.selectedQueryIndex;
const changed = computeAttention({
  ...experiment.input,
  values: experiment.input.values.map((value, index) => index === 1 ? [0, 4] : [...value]),
});

console.log(JSON.stringify({
  title: experiment.title,
  note: experiment.note,
  selectedToken: experiment.tokens[queryIndex]!.label,
  before: {
    query: experiment.input.queries[queryIndex],
    dotProducts: baseline.dotProducts[queryIndex],
    rawScores: baseline.rawScores[queryIndex],
    scaledScores: baseline.scaledScores[queryIndex],
    weights: baseline.weights[queryIndex],
    contributions: baseline.contributions[queryIndex],
    output: baseline.outputs[queryIndex],
  },
  change: { token: experiment.tokens[1]!.label, valueBefore: [0, 2], valueAfter: [0, 4] },
  after: {
    weights: changed.weights[queryIndex],
    output: changed.outputs[queryIndex],
  },
}, null, 2));
