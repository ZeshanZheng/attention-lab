export function formatNumber(value: number, digits = 3): string {
  const normalized = Math.abs(value) < 0.5 * 10 ** -digits ? 0 : value;
  return normalized.toFixed(digits);
}

export function formatVector(vector: readonly number[], digits = 3): string {
  return `(${vector.map((value) => formatNumber(value, digits)).join(', ')})`;
}

export function formatDelta(value: number, digits = 3): string {
  if (Math.abs(value) < 0.5 * 10 ** -digits) return '未变化';
  return `${value > 0 ? '+' : ''}${formatNumber(value, digits)}`;
}

export const TOKEN_NAMES = ['A', 'B', 'C'] as const;
export const TOKEN_COLORS = ['#7560df', '#159b8e', '#dc9340'] as const;
