import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeAttention, createDefaultExperiment, softmax } from '../src/index.ts';
import type { AttentionInput, Matrix } from '../src/index.ts';

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`);
}

function approximateVector(actual: readonly number[], expected: readonly number[]): void {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => approximately(value, expected[index]!));
}

test('default example matches hand-computed scores, weights and vector output', () => {
  const result = computeAttention(createDefaultExperiment().input);
  assert.equal(result.keyDimension, 2);
  assert.equal(result.valueDimension, 2);
  assert.deepEqual(result.dotProducts[0], [[1, 0], [0, 0], [-1, 0]]);
  assert.deepEqual(result.rawScores[0], [1, 0, -1]);
  approximateVector(result.scaledScores[0]!, [Math.SQRT1_2, 0, -Math.SQRT1_2]);
  // Independent, unshifted formula is safe for these deliberately small scores.
  const denominator = Math.exp(Math.SQRT1_2) + 1 + Math.exp(-Math.SQRT1_2);
  const expectedWeights = [Math.exp(Math.SQRT1_2) / denominator, 1 / denominator,
    Math.exp(-Math.SQRT1_2) / denominator];
  approximateVector(result.weights[0]!, expectedWeights);
  approximateVector(result.outputs[0]!, [2 * (expectedWeights[0]! - expectedWeights[2]!),
    2 * expectedWeights[1]!]);
});

test('every query has non-negative normalized weights and a convex output', () => {
  const preset = createDefaultExperiment();
  const result = computeAttention(preset.input);
  for (const weights of result.weights) {
    approximately(weights.reduce((sum, value) => sum + value, 0), 1);
    assert.ok(weights.every((value) => value >= 0 && value <= 1));
  }
  for (const output of result.outputs) {
    output.forEach((value, coordinate) => {
      const coordinates = preset.input.values.map((vector) => vector[coordinate]!);
      assert.ok(value >= Math.min(...coordinates) && value <= Math.max(...coordinates));
    });
  }
});

test('changing only V preserves all scores and weights but changes output as predicted', () => {
  const input = createDefaultExperiment().input;
  const before = computeAttention(input);
  const after = computeAttention({ ...input, values: [[2, 0], [0, 4], [-2, 0]] });
  assert.deepEqual(after.rawScores, before.rawScores);
  assert.deepEqual(after.weights, before.weights);
  approximately(after.outputs[0]![0]!, before.outputs[0]![0]!);
  approximately(after.outputs[0]![1]!, 2 * before.outputs[0]![1]!);
  assert.notDeepEqual(after.outputs, before.outputs);
});

test('increasing one matching key increases its weight and reduces other weights', () => {
  const input = createDefaultExperiment().input;
  const before = computeAttention(input);
  const after = computeAttention({ ...input, keys: [[1, 0], [2, 1], [-1, 0]] });
  assert.ok(after.weights[0]![1]! > before.weights[0]![1]!);
  assert.ok(after.weights[0]![0]! < before.weights[0]![0]!);
  assert.ok(after.weights[0]![2]! < before.weights[0]![2]!);
});

test('equal scores give uniform weights and the arithmetic mean of V', () => {
  const result = computeAttention({ queries: [[0, 0]], keys: [[1, 2], [-2, 3], [0, 4]],
    values: [[3, 0], [0, 6], [-3, 3]] });
  approximateVector(result.weights[0]!, [1 / 3, 1 / 3, 1 / 3]);
  approximateVector(result.outputs[0]!, [0, 3]);
});

test('softmax stays finite for large scores and is invariant to a common offset', () => {
  const weights = softmax([10000, 10001, 9999]);
  approximateVector(weights, softmax([0, 1, -1]));
  approximately(weights.reduce((sum, value) => sum + value, 0), 1);
  assert.ok(weights.every(Number.isFinite));
  assert.deepEqual(softmax([1e300, -1e300]), [1, 0]);
});

test('large finite QK products do not overflow the exponential', () => {
  const result = computeAttention({ queries: [[1e150]], keys: [[1e150], [-1e150]],
    values: [[2], [-2]] });
  assert.deepEqual(result.weights, [[1, 0]]);
  assert.deepEqual(result.outputs, [[2]]);
});

test('causal-shaped mask zeroes future weights and renormalizes visible keys', () => {
  const input = createDefaultExperiment().input;
  const result = computeAttention({ ...input,
    mask: [[true, false, false], [true, true, false], [true, true, true]] });
  assert.deepEqual(result.weights[0], [1, 0, 0]);
  assert.deepEqual(result.outputs[0], input.values[0]);
  assert.equal(result.maskedScores[0]![1], -Infinity);
  assert.equal(result.weights[1]![2], 0);
  approximately(result.weights[1]![0]! + result.weights[1]![1]!, 1);
  approximateVector(result.weights[2]!, computeAttention(input).weights[2]!);
});

test('each output equals the sum of its displayed weighted contributions', () => {
  const result = computeAttention(createDefaultExperiment().input);
  result.outputs.forEach((output, queryIndex) => {
    output.forEach((coordinate, valueIndex) => {
      const sum = result.contributions[queryIndex]!.reduce((total, vector) => total + vector[valueIndex]!, 0);
      approximately(coordinate, sum);
    });
  });
});

test('supports different query/key counts and a V dimension different from Q/K', () => {
  const result = computeAttention({ queries: [[0, 0], [1, 0]], keys: [[1, 0]],
    values: [[4, 5, 6]] });
  assert.deepEqual(result.weights, [[1], [1]]);
  assert.deepEqual(result.outputs, [[4, 5, 6], [4, 5, 6]]);
  assert.equal(result.valueDimension, 3);
});

test('attention does not mutate frozen inputs or retain aliases to input vectors', () => {
  const freezeMatrix = (matrix: Matrix): Matrix => Object.freeze(matrix.map((row) => Object.freeze([...row])));
  const input: AttentionInput = Object.freeze({
    queries: freezeMatrix([[1, 0]]), keys: freezeMatrix([[1, 0], [0, 1]]),
    values: freezeMatrix([[2, 0], [0, 2]]), mask: Object.freeze([Object.freeze([true, true])]),
  });
  const snapshot = JSON.stringify(input);
  const first = computeAttention(input);
  const second = computeAttention(input);
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(input), snapshot);
  assert.notEqual(first.outputs[0], input.values[0]);
  assert.notEqual(first.weights[0], second.weights[0]);
});

test('default presets create independent token vectors and calculation inputs', () => {
  const first = createDefaultExperiment();
  const second = createDefaultExperiment();
  assert.deepEqual(first, second);
  assert.notEqual(first.tokens[0]!.query, second.tokens[0]!.query);
  assert.notEqual(first.input.queries[0], first.tokens[0]!.query);
});

test('rejects empty, ragged, mismatched and non-finite input matrices', () => {
  const input = createDefaultExperiment().input;
  const invalidInputs: AttentionInput[] = [
    { ...input, queries: [] },
    { ...input, keys: [[]] },
    { ...input, values: [] },
    { ...input, queries: [[1, 0], [1]] },
    { ...input, keys: [[1], [0], [-1]] },
    { ...input, values: [[1, 0]] },
    { ...input, queries: [[NaN, 0]] },
    { ...input, queries: [[Infinity, 0]] },
    { ...input, values: [[2, 0], [0, -Infinity], [-2, 0]] },
    { ...input, queries: [new Array<number>(2)] },
    { ...input, queries: new Array<readonly number[]>(1) },
  ];
  for (const invalid of invalidInputs) {
    assert.throws(() => computeAttention(invalid), { name: /^(RangeError|TypeError)$/ });
  }
});

test('rejects malformed masks and rows where every key is hidden', () => {
  const input: AttentionInput = { queries: [[1, 0]], keys: [[1, 0], [0, 1]], values: [[2], [4]] };
  assert.throws(() => computeAttention({ ...input, mask: [] }), /one row per query/);
  assert.throws(() => computeAttention({ ...input, mask: [[true]] }), /one entry per key/);
  assert.throws(() => computeAttention({ ...input, mask: [[false, false]] }), /at least one key visible/);
  assert.throws(() => computeAttention({ ...input, mask: [new Array<boolean>(2)] }), /must be a boolean/);
});

test('rejects numeric overflow explicitly instead of returning NaN or Infinity', () => {
  assert.throws(() => computeAttention({ queries: [[1e308]], keys: [[2]], values: [[1]] }),
    /finite numeric range/);
  assert.throws(() => computeAttention({ queries: [[1e308, 1e308]], keys: [[1, 1]], values: [[1]] }),
    /finite numeric range/);
});

test('rejects invalid softmax scores but permits individual masked positions', () => {
  for (const scores of [[], [NaN], [Infinity], [-Infinity, -Infinity], new Array<number>(2)]) {
    assert.throws(() => softmax(scores));
  }
  approximateVector(softmax([0, -Infinity, 0]), [0.5, 0, 0.5]);
});
