import { expect, test } from '@playwright/test';

test('default experiment renders correct results without browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
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
  await page.goto('/');
  await page.getByRole('button', { name: '编辑词元 B', exact: true }).click();
  await page.getByRole('spinbutton', { name: '词元 B 的 V y', exact: true }).fill('4');
  await expect(page.getByRole('group', { name: 'V 二维向量编辑器', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '观察词元 A', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 1.136)');
  await expect(page.getByTestId('baseline-output')).toHaveText('(0.872, 0.568)');
  await expect(page.getByTestId('weight-0')).toHaveText('57.6%');
  await expect(page.getByTestId('weight-delta-0')).toHaveText('与基线相同');
  await expect(page.getByTestId('output-delta-y')).toHaveText('+0.568');
  await expect(page.getByTestId('insight')).toContainText('权重没变，输出变了');
  await page.getByRole('button', { name: '4 加权求和', exact: true }).click();
  await expect(page.getByText('最终输出向量', { exact: true })).toBeVisible();
  await expect(page.getByText('(0.000, 1.136)', { exact: true })).toBeVisible();
});

test('saving and restoring a baseline keeps the snapshot independent, reset returns defaults', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '编辑词元 B', exact: true }).click();
  const valueY = page.getByRole('spinbutton', { name: '词元 B 的 V y', exact: true });
  await valueY.fill('4');
  await page.getByRole('button', { name: '保存基线', exact: true }).click();
  await expect(page.getByTestId('baseline-output')).toHaveText('(0.872, 1.136)');
  await valueY.fill('1');
  await expect(page.getByTestId('baseline-output')).toHaveText('(0.872, 1.136)');
  await page.getByRole('button', { name: '恢复基线', exact: true }).click();
  await expect(valueY).toHaveValue('4');
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 1.136)');
  await page.getByRole('button', { name: '重置实验', exact: true }).click();
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 0.568)');
  await expect(page.getByTestId('baseline-output')).toHaveText('(0.872, 0.568)');
  await expect(page.getByRole('button', { name: '编辑词元 A', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('dragging and keyboard adjustment update K while keeping the observed Query fixed', async ({ page }) => {
  await page.goto('/');
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
  await expect(page.getByRole('spinbutton', { name: '词元 B 的 K x', exact: true })).toHaveValue('2');
  await expect(page.getByRole('button', { name: '观察词元 A', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('weight-1')).toHaveText('62.0%');
  await page.getByRole('combobox', { name: '坐标调整步长' }).selectOption('0.1');
  await handle.press('ArrowRight');
  await expect(page.getByRole('spinbutton', { name: '词元 B 的 K x', exact: true })).toHaveValue('2.1');
});

test('all calculation steps, navigation and automatic playback work', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-08T08:00:00Z') });
  await page.goto('/');
  await page.clock.pauseAt(new Date('2026-10-08T08:01:00Z'));
  await page.clock.fastForward(60_000);
  await expect(page.getByRole('button', { name: '1 点积', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '上一步', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await expect(page.getByText('让得分保持合适的尺度', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '3 Softmax', exact: true }).click();
  await expect(page.getByTestId('weight-sum')).toHaveText('1.000');
  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await expect(page.getByRole('button', { name: '下一步', exact: true })).toBeDisabled();
  await expect(page.getByRole('combobox', { name: '每步停留时间' })).toHaveValue('10');
  await page.getByRole('combobox', { name: '每步停留时间' }).selectOption('5');
  await page.getByRole('button', { name: '自动演示', exact: true }).click();
  await expect(page.getByText('向量之间，有多匹配？', { exact: true })).toBeVisible();
  await page.clock.fastForward(4999);
  await expect(page.getByRole('button', { name: '1 点积', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.clock.fastForward(1);
  await expect(page.getByText('让得分保持合适的尺度', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  await expect(page.getByRole('button', { name: '自动演示', exact: true })).toBeVisible();
  await page.clock.fastForward(20_000);
  await expect(page.getByRole('button', { name: '2 缩放', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('changing the observed query updates current and baseline results consistently', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '观察词元 B', exact: true }).click();
  await expect(page.getByTestId('output-vector')).toContainText('(0.000, 1.007)');
  await expect(page.getByTestId('baseline-output')).toHaveText('(0.000, 1.007)');
  await expect(page.getByTestId('weight-1')).toHaveText('50.3%');
  await page.getByRole('button', { name: '观察词元 C', exact: true }).click();
  await expect(page.getByTestId('output-vector')).toContainText('(-0.872, 0.568)');
});

test('invalid numeric input is explained and cannot change the calculation', async ({ page }) => {
  await page.goto('/');
  const input = page.getByRole('spinbutton', { name: '词元 A 的 Q x', exact: true });
  await input.fill('6');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('alert')).toHaveText('请输入 −5 到 5');
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 0.568)');
  await page.getByRole('button', { name: '观察词元 A', exact: true }).click();
  await expect(input).toHaveValue('1');
});

test('mobile layout fits the screen, remains interactive, and help closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  await page.getByRole('button', { name: '使用说明', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '编辑词元 B', exact: true }).click();
  await page.getByRole('spinbutton', { name: '词元 B 的 V y', exact: true }).fill('4');
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 1.136)');
  await page.screenshot({ path: '.tools/preview-mobile.png', fullPage: true });
});
