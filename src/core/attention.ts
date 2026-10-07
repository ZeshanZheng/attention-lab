/** A row is one vector. Q/K share d_k; V may have a different d_v. */
export type Vector = readonly number[];
export type Matrix = readonly Vector[];
/** true means the key is visible to this query; false means it is masked. */
export type AttentionMask = readonly (readonly boolean[])[];

export interface AttentionInput {
  readonly queries: Matrix;
  readonly keys: Matrix;
  readonly values: Matrix;
  readonly mask?: AttentionMask;
}

export interface AttentionResult {
  readonly keyDimension: number;
  readonly valueDimension: number;
  readonly scaleFactor: number;
  /** [query][key][coordinate]: products whose sum is a raw score. */
  readonly dotProducts: readonly Matrix[];
  readonly rawScores: Matrix;
  readonly scaledScores: Matrix;
  /** Masked scores use -Infinity; the corresponding weights are exactly zero. */
  readonly maskedScores: Matrix;
  readonly weights: Matrix;
  /** [query][key][value coordinate]: weight * V, before the final sum. */
  readonly contributions: readonly Matrix[];
  readonly outputs: Matrix;
}

function validateMatrix(name: string, matrix: Matrix): number {
  if (!Array.isArray(matrix) || matrix.length === 0) {
    throw new RangeError(`${name} must be a non-empty matrix.`);
  }
  const firstRow = matrix[0];
  if (!Array.isArray(firstRow) || firstRow.length === 0) {
    throw new RangeError(`${name} must contain non-empty vectors.`);
  }
  const dimension = firstRow.length;
  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
    const row = matrix[rowIndex];
    if (!Array.isArray(row) || row.length !== dimension) {
      throw new RangeError(`${name}[${rowIndex}] must have ${dimension} coordinates.`);
    }
    for (let coordinate = 0; coordinate < dimension; coordinate += 1) {
      if (!Number.isFinite(row[coordinate])) {
        throw new TypeError(`${name}[${rowIndex}][${coordinate}] must be a finite number.`);
      }
    }
  }
  return dimension;
}

function validateMask(mask: AttentionMask, queryCount: number, keyCount: number): void {
  if (!Array.isArray(mask) || mask.length !== queryCount) {
    throw new RangeError('mask must have one row per query.');
  }
  for (let queryIndex = 0; queryIndex < queryCount; queryIndex += 1) {
    const row = mask[queryIndex];
    if (!Array.isArray(row) || row.length !== keyCount) {
      throw new RangeError(`mask[${queryIndex}] must have one entry per key.`);
    }
    let hasVisibleKey = false;
    for (let keyIndex = 0; keyIndex < keyCount; keyIndex += 1) {
      if (typeof row[keyIndex] !== 'boolean') {
        throw new TypeError(`mask[${queryIndex}][${keyIndex}] must be a boolean.`);
      }
      hasVisibleKey ||= row[keyIndex]!;
    }
    if (!hasVisibleKey) {
      throw new RangeError(`mask[${queryIndex}] must leave at least one key visible.`);
    }
  }
}

function requireFiniteCalculation(value: number, operation: string): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${operation} exceeded finite numeric range; use smaller vector coordinates.`);
  }
  return value;
}

/** Stable softmax: subtract the maximum before exponentiating. -Infinity masks a position. */
export function softmax(scores: Vector): number[] {
  if (!Array.isArray(scores) || scores.length === 0) {
    throw new RangeError('softmax requires at least one score.');
  }
  let maximum = -Infinity;
  for (let index = 0; index < scores.length; index += 1) {
    const score = scores[index]!;
    if (!Number.isFinite(score) && score !== -Infinity) {
      throw new TypeError(`scores[${index}] must be finite or -Infinity.`);
    }
    maximum = Math.max(maximum, score);
  }
  if (maximum === -Infinity) {
    throw new RangeError('softmax requires at least one unmasked, finite score.');
  }
  const exponentials = scores.map((score) => Math.exp(score - maximum));
  const denominator = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / denominator);
}

/**
 * Single-head scaled dot-product attention: softmax(Q K^T / sqrt(d_k)) V.
 * Pure and deterministic; no rounding, input mutation, random seed, or network access.
 * A mask is optional; without one every key is visible to every query.
 */
export function computeAttention(input: AttentionInput): AttentionResult {
  const keyDimension = validateMatrix('queries', input.queries);
  if (validateMatrix('keys', input.keys) !== keyDimension) {
    throw new RangeError('queries and keys must have the same vector dimension.');
  }
  const valueDimension = validateMatrix('values', input.values);
  if (input.keys.length !== input.values.length) {
    throw new RangeError('keys and values must have the same number of rows.');
  }
  if (input.mask !== undefined) {
    validateMask(input.mask, input.queries.length, input.keys.length);
  }

  const divisor = Math.sqrt(keyDimension);
  const dotProducts: number[][][] = [];
  const rawScores: number[][] = [];
  const scaledScores: number[][] = [];
  const maskedScores: number[][] = [];
  const weights: number[][] = [];
  const contributions: number[][][] = [];
  const outputs: number[][] = [];

  for (let queryIndex = 0; queryIndex < input.queries.length; queryIndex += 1) {
    const query = input.queries[queryIndex]!;
    const products = input.keys.map((key) => query.map((value, coordinate) =>
      requireFiniteCalculation(value * key[coordinate]!, 'Dot product')));
    const raw = products.map((terms) => terms.reduce((sum, value) =>
      requireFiniteCalculation(sum + value, 'Dot-product sum'), 0));
    const scaled = raw.map((score) => score / divisor);
    const masked = scaled.map((score, keyIndex) =>
      input.mask?.[queryIndex]?.[keyIndex] === false ? -Infinity : score);
    const rowWeights = softmax(masked);
    const rowContributions = input.values.map((value, keyIndex) =>
      value.map((coordinate) => rowWeights[keyIndex]! * coordinate));
    const output = Array.from({ length: valueDimension }, (_, coordinate) =>
      rowContributions.reduce((sum, vector) =>
        requireFiniteCalculation(sum + vector[coordinate]!, 'Weighted value sum'), 0));

    dotProducts.push(products);
    rawScores.push(raw);
    scaledScores.push(scaled);
    maskedScores.push(masked);
    weights.push(rowWeights);
    contributions.push(rowContributions);
    outputs.push(output);
  }

  return {
    keyDimension,
    valueDimension,
    scaleFactor: 1 / divisor,
    dotProducts,
    rawScores,
    scaledScores,
    maskedScores,
    weights,
    contributions,
    outputs,
  };
}
