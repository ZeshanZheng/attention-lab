import { expect, test } from '@playwright/test';
import { openLab, openExperiment, vectorInput, expandPanel, comparisonButton, calculationStep } from './open-lab.ts';
import { getLesson } from '../../web/learning/lessons.ts';

test('the two-column experiment starts with essentials and expanded calculations retain the same live values', async ({ page }) => {
  await openLab(page);
  await openExperiment(page);
  await expect(page.locator('.experiment-grid > section')).toHaveCount(2);
  await expect(page.getByRole('spinbutton')).toHaveCount(2);
  for (const selector of ['.calculation-disclosure', '.calculation-explanation', '.heatmap-disclosure', '.comparison-settings', '.output-visualization', '.free-experiment-scope']) {
    await expect(page.locator(selector)).toHaveJSProperty('open', false);
  }
  for (const selector of ['.calculation-card', '.output-plane', '.heatmap-card']) await expect(page.locator(selector)).toBeHidden();
  const [editor, results, calculation] = await Promise.all([
    page.locator('.editor-card').boundingBox(), page.locator('.results-card').boundingBox(), page.locator('.calculation-disclosure').boundingBox(),
  ]);
  expect(results!.x).toBeGreaterThan(editor!.x + editor!.width);
  expect(results!.y).toBe(editor!.y);
  expect(calculation!.y).toBeGreaterThan(Math.max(editor!.y + editor!.height, results!.y + results!.height));
  await (await vectorInput(page, 'B', 'V', 'y')).fill('4');
  await expect(page.getByTestId('weight-1')).toHaveText('28.4%');
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 1.136)');
  const calculationSummary = page.locator('.calculation-disclosure > summary');
  await calculationSummary.focus();
  await page.keyboard.press('Enter');
  await (await calculationStep(page, '4 加权求和')).click();
  await expect(page.getByTestId('beginner-example')).toBeVisible();
  await expect(page.getByTestId('step-guide')).toBeHidden();
  await expect(page.getByTestId('beginner-example')).toContainText('(0.872, 1.136)');
  await expandPanel(page, '.calculation-explanation');
  await expect(page.getByTestId('step-guide')).toBeVisible();
  await expect(page.locator('.calculation-row')).toHaveCount(3);
  await calculationSummary.click();
  await expect(page.locator('.calculation-card')).toBeHidden();
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 1.136)');
  await (await comparisonButton(page, '保存基线')).click();
  await (await vectorInput(page, 'B', 'V', 'y')).fill('3');
  await (await comparisonButton(page, '恢复基线')).click();
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 1.136)');
  await expandPanel(page, '.output-visualization');
  await expect(page.locator('.output-plane')).toBeVisible();
  await expandPanel(page, '.heatmap-disclosure');
  await expect(page.getByTestId('heatmap-cell-0-1')).toHaveText('28.4%');
  await expandPanel(page, '.calculation-disclosure');
  await expect(page.getByRole('button', { name: '4 加权求和', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('mobile guided work shows only the target, keeps other vectors locked and highlights the actual output change', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLab(page);
  await openExperiment(page, 'guided');
  await expect(page.locator('.vector-visualization')).toHaveJSProperty('open', false);
  await page.getByRole('button', { name: '实验 2：改变传递内容', exact: true }).click();
  await expect(page.getByRole('group', { name: '学习模式' })).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole('spinbutton')).toHaveCount(2);
  await expect(page.locator('.target-vector-label')).toHaveText('词元 B · V（值）');
  await expect(page.locator('.other-vectors')).toHaveJSProperty('open', false);
  const lesson = getLesson('content');
  await page.getByRole('radio', { name: lesson.prediction.options[1]!, exact: true }).check();
  await page.getByRole('button', { name: '记录预测，开始实验', exact: true }).click();
  const input = page.getByRole('spinbutton', { name: '词元 B 的 V y', exact: true });
  await input.fill('4');
  await expect(page.locator('.output-section')).toHaveAttribute('data-result-focus', 'true');
  await expect(page.getByTestId('insight')).toHaveText('注意力权重没有变化，输出的 y 分量变大了。');
  await expect(page.getByTestId('weight-1')).toHaveText('28.4%');
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 1.136)');
  await expandPanel(page, '.other-vectors');
  for (const control of await page.locator('.other-vectors input').all()) await expect(control).toBeDisabled();
  await page.locator('.other-vectors > summary').click();
  await expect(page.getByRole('spinbutton')).toHaveCount(2);
  await page.getByRole('button', { name: '检查当前修改', exact: true }).click();
  await expect(input).toBeDisabled();
  await page.getByRole('radio', { name: lesson.comprehension.options[0]!, exact: true }).check();
  await page.getByRole('button', { name: '提交理解题', exact: true }).click();
  await expect(page.getByTestId('lesson-progress')).toHaveText('已完成 1 / 3');
  const [editor, results] = await Promise.all([page.locator('.editor-card').boundingBox(), page.locator('.results-card').boundingBox()]);
  expect(results!.y).toBeGreaterThan(editor!.y + editor!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
