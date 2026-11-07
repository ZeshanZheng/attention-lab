import { openLab, openExperiment, vectorInput, comparisonButton, expandPanel } from './open-lab.ts';
import { expect, test } from '@playwright/test';

test('default experiment renders correct results without browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openLab(page);
  await openExperiment(page, 'free');
  await expect(page).toHaveTitle('Attention Lab · 注意力实验室');
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 0.568)');
  await expect(page.getByTestId('weight-0')).toHaveText('57.6%');
  await expect(page.getByTestId('weight-1')).toHaveText('28.4%');
  await expect(page.getByTestId('weight-2')).toHaveText('14.0%');
  await expect(page.getByRole('button', { name: '观察词元 A', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: '.tools/preview-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('editing only B value doubles output y without changing attention weights', async ({ page }) => {
  await openLab(page);
  await openExperiment(page, 'free');
  await page.getByRole('button', { name: '编辑词元 B', exact: true }).click();
  await (await vectorInput(page, 'B', 'V', 'y')).fill('4');
  await expect(page.getByRole('group', { name: 'V 二维向量编辑器', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '观察词元 A', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 1.136)');
  await expect(page.getByTestId('baseline-output')).toHaveText('(0.872, 0.568)');
  await expect(page.getByTestId('weight-0')).toHaveText('57.6%');
  await expect(page.getByTestId('weight-delta-0')).toHaveText('与基线相同');
  await expect(page.getByTestId('output-delta-y')).toHaveText('+0.568');
  await expect(page.getByTestId('insight')).toContainText('权重没变，输出变了');

});

test('saving and restoring a baseline keeps the snapshot independent, reset returns defaults', async ({ page }) => {
  await openLab(page);
  await openExperiment(page, 'free');
  await page.getByRole('button', { name: '编辑词元 B', exact: true }).click();
  const valueY = (await vectorInput(page, 'B', 'V', 'y'));
  await valueY.fill('4');
  await (await comparisonButton(page, '保存基线')).click();
  await expect(page.getByTestId('baseline-output')).toHaveText('(0.872, 1.136)');
  await valueY.fill('1');
  await expect(page.getByTestId('baseline-output')).toHaveText('(0.872, 1.136)');
  await (await comparisonButton(page, '恢复基线')).click();
  await expect(valueY).toHaveValue('4');
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 1.136)');
  await page.getByRole('button', { name: '重置实验', exact: true }).click();
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 0.568)');
  await expect(page.getByTestId('baseline-output')).toHaveText('(0.872, 0.568)');
  await expect(page.getByRole('button', { name: '编辑词元 A', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('dragging and keyboard adjustment update K while keeping the observed Query fixed', async ({ page }) => {
  await openLab(page);
  await openExperiment(page, 'free');
  const plane = page.getByRole('group', { name: 'K 二维向量编辑器', exact: true });
  const handle = page.getByTestId('vector-handle-1');
  await handle.scrollIntoViewIfNeeded();
  const bounds = await plane.boundingBox();
  expect(bounds).not.toBeNull();
  const handleBounds = await handle.boundingBox();
  expect(handleBounds).not.toBeNull();
  await page.mouse.move(handleBounds!.x + handleBounds!.width / 2, handleBounds!.y + handleBounds!.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + bounds!.width * 186 / 280, bounds!.y + bounds!.height * 117 / 280, { steps: 8 });
  await page.mouse.up();
  await expect((await vectorInput(page, 'B', 'K', 'x'))).toHaveValue('2');
  await expect(page.getByRole('button', { name: '观察词元 A', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('weight-1')).toHaveText('62.0%');
  await page.getByRole('combobox', { name: '坐标调整步长' }).selectOption('0.1');
  await handle.press('ArrowRight');
  await expect((await vectorInput(page, 'B', 'K', 'x'))).toHaveValue('2.1');
});

test('comparison controls stay visible inside results and output remains inline at narrow widths', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await openLab(page);
  await openExperiment(page);
  const comparison = page.locator('.results-card .comparison-settings');
  await expect(comparison.getByRole('heading', { name: '对比设置' })).toBeVisible();
  await expect(comparison.locator('summary')).toHaveCount(0);
  await expect(comparison.getByRole('button', { name: '保存基线' })).toBeEnabled();
  await expect(comparison.getByRole('button', { name: '恢复基线' })).toBeDisabled();
  for (const token of ['A', 'B', 'C']) {
    await (await vectorInput(page, token, 'V', 'x')).fill('-5');
    await (await vectorInput(page, token, 'V', 'y')).fill('-5');
  }
  await expect(page.getByTestId('output-vector')).toContainText('(-5.000, -5.000)');
  const [heading, value] = await Promise.all([page.locator('.output-heading h3').boundingBox(), page.getByTestId('output-vector').boundingBox()]);
  expect(Math.abs(heading!.y + heading!.height / 2 - value!.y - value!.height / 2)).toBeLessThan(3);
  expect(value!.x).toBeGreaterThanOrEqual(heading!.x + heading!.width);
  expect(value!.x + value!.width).toBeLessThanOrEqual(320);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await expect(page.getByText('自由探索操作说明', { exact: true })).toHaveCount(0);
  await expect(page.locator('.calculation-disclosure')).toHaveCount(0);
});

test('changing the observed query updates current and baseline results consistently', async ({ page }) => {
  await openLab(page);
  await openExperiment(page, 'free');
  await page.getByRole('button', { name: '观察词元 B', exact: true }).click();
  await expect(page.getByTestId('output-vector')).toContainText('(0.000, 1.007)');
  await expect(page.getByTestId('baseline-output')).toHaveText('(0.000, 1.007)');
  await expect(page.getByTestId('weight-1')).toHaveText('50.3%');
  await page.getByRole('button', { name: '观察词元 C', exact: true }).click();
  await expect(page.getByTestId('output-vector')).toContainText('(-0.872, 0.568)');
});

test('invalid numeric input is explained and cannot change the calculation', async ({ page }) => {
  await openLab(page);
  await openExperiment(page, 'free');
  const input = (await vectorInput(page, 'A', 'Q', 'x'));
  await input.fill('6');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('alert')).toHaveText('请输入 −5 到 5');
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 0.568)');
  await page.getByRole('button', { name: '观察词元 A', exact: true }).click();
  await expect(input).toHaveValue('1');
});

test('mobile help page opens from navigation and returns to the existing experiment', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLab(page);
  await openExperiment(page, 'free');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  await page.getByRole('button', { name: '编辑词元 B', exact: true }).click();
  await (await vectorInput(page, 'B', 'V', 'y')).fill('4');
  await page.getByRole('group', { name: '学习模式' }).getByRole('button', { name: '使用说明', exact: true }).click();
  await expect(page.locator('section[aria-labelledby="help-title"]')).toBeVisible();
  await expect(page.getByRole('group', { name: '学习模式' }).getByRole('button', { pressed: true })).toHaveText('使用说明');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByRole('button', { name: '打开动手实验', exact: true }).click();
  await expect((await vectorInput(page, 'B', 'V', 'y'))).toHaveValue('4');
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 1.136)');
  await page.screenshot({ path: '.tools/preview-mobile.png', fullPage: true });
});
