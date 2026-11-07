import { openLab, openExperiment, vectorInput, openCalculation, expandPanel } from './open-lab.ts';
import { expect, test } from '@playwright/test';

test('the calculation module explains all four stages and labels the default worked example', async ({ page }) => {
  await openLab(page);
  await openExperiment(page);
  await (await vectorInput(page, 'A', 'Q', 'x')).fill('2');
  await expect(page.getByTestId('weight-0')).toHaveText('76.8%');
  await openCalculation(page);
  await expect(page.locator('.summary-calculation-steps > li')).toHaveCount(4);
  await expect(page.locator('.formula-explanation > h2, .summary-formula')).toHaveCount(0);
  await expect(page.locator('.summary-explanation')).not.toContainText('箭头表示依次计算');
  const fractions = page.locator('.math-fraction');
  await expect(fractions).toHaveCount(2);
  await expect(fractions.locator('.math-power sup')).toHaveText(['zj', 'zl']);
  for (const fraction of await fractions.all()) {
    const numerator = await fraction.locator('.fraction-numerator').boundingBox();
    const denominator = await fraction.locator('.fraction-denominator').boundingBox();
    expect(numerator!.y + numerator!.height).toBeLessThanOrEqual(denominator!.y + 1);
    expect(Math.abs(numerator!.x + numerator!.width / 2 - denominator!.x - denominator!.width / 2)).toBeLessThan(1);
    await expect(fraction.locator('.fraction-denominator')).toHaveCSS('border-top-style', 'solid');
  }
  await expect(page.locator('.summary-explanation')).toContainText('e ≈ 2.718');
  await expect(page.locator('.formula-explanation .beginner-example')).toContainText('默认实验的完整例子');
  await expect(page.locator('.formula-explanation .beginner-example')).toContainText('0.568');
  await expect(page.getByRole('button', { name: '下一步', exact: true })).toHaveCount(0);
  await openExperiment(page);
  await expect((await vectorInput(page, 'A', 'Q', 'x'))).toHaveValue('2');
  await expect(page.getByTestId('weight-0')).toHaveText('76.8%');
});

test('mobile guided experiment locates unlocked input, keeps task visible and checks in place', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLab(page);
  await openExperiment(page, 'guided');
  await page.getByRole('radio', { name: 'B 的权重上升，A 和 C 的权重下降', exact: true }).check();
  await page.getByRole('button', { name: '记录预测，开始实验', exact: true }).click();
  const input = (await vectorInput(page, 'B', 'K', 'x'));
  await expect(input).toBeFocused();
  await expect((await vectorInput(page, 'B', 'V', 'y'))).toBeDisabled();
  const goal = page.getByRole('region', { name: '当前实验目标' });
  await expect(goal).toBeInViewport();
  await expect(goal).toContainText('权重超过 60%');
  const targetBounds = await input.boundingBox();
  const goalBounds = await goal.boundingBox();
  expect(targetBounds!.y).toBeGreaterThanOrEqual(goalBounds!.y + goalBounds!.height);
  await page.screenshot({ path: '.tools/preview-beginner-guided-mobile.png' });
  await input.fill('2');
  await goal.getByRole('button', { name: '检查当前修改' }).click();
  await expect(goal).toHaveCount(0);
  await expect(page.getByTestId('lesson-interaction')).toBeInViewport();
  await expect(page.getByRole('button', { name: '提交理解题' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('integer and decimal adjustments preserve other coordinates and allow typed decimals', async ({ page }) => {
  await openLab(page);
  await openExperiment(page, 'free');
  const step = page.getByRole('combobox', { name: '坐标调整步长' });
  const handle = page.getByTestId('vector-handle-0');
  await expect(step).toHaveValue('1');
  await handle.press('ArrowRight');
  const x = (await vectorInput(page, 'A', 'K', 'x'));
  const y = (await vectorInput(page, 'A', 'K', 'y'));
  await expect(x).toHaveValue('2');
  await y.fill('0.3');
  await handle.press('ArrowRight');
  await expect(x).toHaveValue('3');
  await expect(y).toHaveValue('0.3');
  await step.selectOption('0.1');
  await handle.press('ArrowRight');
  await expect(x).toHaveValue('3.1');
  await expect(y).toHaveValue('0.3');
  await handle.press('Shift+ArrowLeft');
  await expect(x).toHaveValue('2.1');
  await expect(y).toHaveValue('0.3');
  await x.fill('2.25');
  await handle.press('ArrowRight');
  await expect(x).toHaveValue('2.35');
});
