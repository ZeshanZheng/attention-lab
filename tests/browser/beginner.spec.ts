import { expect, test } from '@playwright/test';

test('each calculation step teaches its purpose and example follows edited input', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('step-guide')).toContainText('不是百分比');
  await page.getByRole('spinbutton', { name: '词元 A 的 Q x', exact: true }).fill('2');
  await expect(page.getByTestId('beginner-example')).toContainText('2.0 × 1.0 + 0.0 × 0.0 = 2.000');
  await page.getByRole('button', { name: '2 缩放', exact: true }).click();
  await expect(page.getByTestId('step-guide')).toContainText('与词元数量无关');
  await expect(page.getByTestId('beginner-example')).toContainText('2.000 ÷ 1.414… ≈ 1.414');
  await page.getByRole('button', { name: '3 Softmax', exact: true }).click();
  await expect(page.getByTestId('step-guide')).toContainText('e ≈ 2.718');
  await expect(page.getByTestId('beginner-example')).toContainText('76.8%');
  await page.getByRole('button', { name: '4 加权求和', exact: true }).click();
  await expect(page.getByTestId('step-guide')).toContainText('不会改变前面的权重');
  await expect(page.getByTestId('beginner-example')).toContainText('输出 x：');
  await page.getByRole('button', { name: '实验总结', exact: true }).click();
  await page.locator('.concept-summary').screenshot({ path: '.tools/preview-concept-summary.png' });
});

test('mobile guided experiment locates unlocked input, keeps task visible and checks in place', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: '引导实验', exact: true }).click();
  await page.getByRole('radio', { name: 'B 的权重上升，A 和 C 的权重下降', exact: true }).check();
  await page.getByRole('button', { name: '记录预测，开始实验', exact: true }).click();
  const input = page.getByRole('spinbutton', { name: '词元 B 的 K x', exact: true });
  await expect(input).toBeFocused();
  await expect(page.getByRole('spinbutton', { name: '词元 B 的 V y', exact: true })).toBeDisabled();
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
  await page.goto('/');
  const step = page.getByRole('combobox', { name: '坐标调整步长' });
  const handle = page.getByTestId('vector-handle-0');
  await expect(step).toHaveValue('1');
  await handle.press('ArrowRight');
  const x = page.getByRole('spinbutton', { name: '词元 A 的 K x', exact: true });
  const y = page.getByRole('spinbutton', { name: '词元 A 的 K y', exact: true });
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
