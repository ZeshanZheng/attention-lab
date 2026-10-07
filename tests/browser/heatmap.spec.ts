import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { computeAttention, createDefaultExperiment } from '../../src/index.ts';
import { formatNumber } from '../../web/format.ts';

async function matrixSnapshot(page: Page) {
  return page.getByTestId('attention-heatmap').getByRole('button').evaluateAll((buttons) => buttons.map((button) => ({
    weight: Number(button.getAttribute('data-weight')),
    text: button.textContent,
    color: (button as HTMLButtonElement).style.backgroundColor,
  })));
}

test('all nine heatmap cells show the computed weights and normalize separately for each Query', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const expected = computeAttention(createDefaultExperiment().input);
  await expect(page.getByTestId('attention-heatmap').getByRole('button')).toHaveCount(9);
  for (let row = 0; row < 3; row += 1) {
    const displayed: number[] = [];
    for (let column = 0; column < 3; column += 1) {
      const cell = page.getByTestId(`heatmap-cell-${row}-${column}`);
      await expect(cell).toHaveText(`${formatNumber(expected.weights[row]![column]! * 100, 1)}%`);
      displayed.push(Number(await cell.getAttribute('data-weight')));
    }
    expect(displayed.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 12);
  }
  await expect(page.getByTestId('heatmap-row-0')).toHaveAttribute('data-observed', 'true');
  await page.getByTestId('heatmap-cell-0-1').hover();
  await expect(page.getByTestId('heatmap-detail')).toContainText('A 在关注 B');
  await expect(page.getByTestId('heatmap-current')).toHaveText('28.4%');
  await expect(page.getByTestId('heatmap-baseline')).toHaveText('28.4%');
  await expect(page.getByTestId('heatmap-delta')).toHaveText('未变化');
  await expect(page.getByTestId('heatmap-dot')).toHaveText('0.000');
  await page.locator('.heatmap-card').screenshot({ path: '.tools/preview-heatmap.png' });
  expect(errors).toEqual([]);
});

test('click and keyboard selection synchronize Query, bars and formulas without changing the editing token', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('heatmap-cell-1-2').click();
  await expect(page.getByRole('button', { name: '观察词元 B', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '编辑词元 A', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('heatmap-detail')).toContainText('B 在关注 C');
  const expected = computeAttention(createDefaultExperiment().input);
  for (let column = 0; column < 3; column += 1) await expect(page.getByTestId(`weight-${column}`)).toHaveText(`${formatNumber(expected.weights[1]![column]! * 100, 1)}%`);
  await page.getByTestId('heatmap-cell-2-0').focus();
  await expect(page.getByTestId('heatmap-detail')).toContainText('C 在关注 A');
  await expect(page.getByRole('button', { name: '观察词元 B', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('heatmap-cell-2-0').press('Enter');
  await expect(page.getByRole('button', { name: '观察词元 C', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('heatmap-row-2')).toHaveAttribute('data-observed', 'true');
  await page.getByRole('button', { name: '观察词元 A', exact: true }).click();
  await expect(page.getByTestId('heatmap-detail')).toContainText('A 在关注 A');
  await expect(page.getByTestId('heatmap-row-0')).toHaveAttribute('data-observed', 'true');
});

test('Q and K edits update the appropriate rows, and baselines and restore remain consistent', async ({ page }) => {
  await page.goto('/');
  const original = await matrixSnapshot(page);
  await page.getByRole('button', { name: '编辑词元 B', exact: true }).click();
  await page.getByRole('spinbutton', { name: '词元 B 的 K x', exact: true }).fill('2');
  const input = createDefaultExperiment().input;
  const changed = computeAttention({ ...input, keys: [[1, 0], [2, 1], [-1, 0]] });
  const updated = await matrixSnapshot(page);
  for (let index = 0; index < 9; index += 1) expect(updated[index]!.weight).toBeCloseTo(changed.weights[Math.floor(index / 3)]![index % 3]!, 12);
  expect(updated.slice(3, 6)).toEqual(original.slice(3, 6));
  expect(updated[1]!.color).not.toBe(original[1]!.color);
  await expect(page.getByTestId('heatmap-cell-0-1')).toHaveCSS('background-color', updated[1]!.color);
  await page.getByTestId('heatmap-cell-0-1').hover();
  await expect(page.getByTestId('heatmap-current')).toHaveText('62.0%');
  await expect(page.getByTestId('heatmap-baseline')).toHaveText('28.4%');
  await expect(page.getByTestId('heatmap-delta')).toHaveText('+33.6 个百分点');
  await page.getByRole('button', { name: '保存基线', exact: true }).click();
  await expect(page.getByTestId('heatmap-baseline')).toHaveText('62.0%');
  await expect(page.getByTestId('heatmap-delta')).toHaveText('未变化');
  await page.getByRole('button', { name: '编辑词元 A', exact: true }).click();
  await page.getByRole('spinbutton', { name: '词元 A 的 Q x', exact: true }).fill('0.5');
  const queryChanged = await matrixSnapshot(page);
  expect(queryChanged.slice(3)).toEqual(updated.slice(3));
  expect(queryChanged[0]!.weight).not.toBe(updated[0]!.weight);
  await page.getByRole('button', { name: '恢复基线', exact: true }).click();
  expect(await matrixSnapshot(page)).toEqual(updated);
  await page.getByRole('button', { name: '重置实验', exact: true }).click();
  expect(await matrixSnapshot(page)).toEqual(original);
});

test('editing only V changes output while every heatmap weight and color stays unchanged', async ({ page }) => {
  await page.goto('/');
  const before = await matrixSnapshot(page);
  await page.getByRole('button', { name: '编辑词元 B', exact: true }).click();
  await page.getByRole('spinbutton', { name: '词元 B 的 V y', exact: true }).fill('4');
  expect(await matrixSnapshot(page)).toEqual(before);
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 1.136)');
});

test('mobile inspection preserves guided Query restrictions and fits the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: '引导实验', exact: true }).click();
  await page.getByTestId('heatmap-cell-1-2').click();
  await expect(page.getByTestId('heatmap-detail')).toContainText('B 在关注 C');
  await expect(page.getByTestId('heatmap-row-0')).toHaveAttribute('data-observed', 'true');
  await expect(page.getByRole('button', { name: '观察词元 A', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('spinbutton', { name: '词元 B 的 K x', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.locator('.heatmap-card').screenshot({ path: '.tools/preview-heatmap-mobile.png' });
  await page.getByRole('button', { name: '自由探索', exact: true }).click();
  await page.getByTestId('heatmap-cell-2-1').click();
  await expect(page.getByRole('button', { name: '观察词元 C', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
