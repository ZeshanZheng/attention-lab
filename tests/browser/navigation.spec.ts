import { enterLab, openLab, openExperiment, vectorInput, openCalculation, comparisonButton } from './open-lab.ts';
import { expect, test } from '@playwright/test';

test('module footers follow navigation order and preserve experiment and unfinished quiz state', async ({ page }) => {
  await openLab(page);
  const modes = page.getByRole('group', { name: '学习模式' });
  const order = await modes.getByRole('button').allTextContents();
  let quizIds: (string | null)[] = [];
  for (let index = 0; index < order.length; index++) {
    const current = order[index]!;
    await expect(modes.getByRole('button', { pressed: true })).toHaveText(current);
    if (current === '动手实验') await (await vectorInput(page, 'A', 'K', 'x')).fill('2');
    if (current === '理解自测') {
      const questions = page.getByTestId('assessment-question');
      quizIds = await questions.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-question-id')));
      await questions.first().getByRole('radio').first().check();
    }
    const next = order[(index + 1) % order.length]!;
    const label = index === order.length - 1 ? '返回使用说明' : `进入${next}模块`;
    const footer = page.getByRole('navigation', { name: '下一模块' });
    await expect(footer).toHaveCount(1);
    if (current === 'Attention 引言') await expect(page.locator('.learning-introduction').getByRole('navigation', { name: '下一模块' })).toBeVisible();
    if (current === '理解Q,K,V') await expect(page.locator('.sentence-example').getByRole('navigation', { name: '下一模块' })).toBeVisible();
    await footer.getByRole('button', { name: label, exact: true }).click();
    await expect(modes.getByRole('button', { pressed: true })).toHaveText(next);
    await expect(modes.getByRole('button', { pressed: true })).toBeFocused();
  }
  await modes.getByRole('button', { name: '理解自测', exact: true }).click();
  const questions = page.getByTestId('assessment-question');
  expect(await questions.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-question-id')))).toEqual(quizIds);
  await expect(questions.first().getByRole('radio').first()).toBeChecked();
  await openExperiment(page, 'free');
  await expect((await vectorInput(page, 'A', 'K', 'x'))).toHaveValue('2');
});

test('reading pages have independent navigation and preserve free vectors and baseline across the calculation module', async ({ page }) => {
  await openLab(page);
  const modes = page.getByRole('group', { name: '学习模式' });
  const expectedModes = ['使用说明', 'Attention 引言', '理解Q,K,V', 'Attention 计算', '动手实验', '实验总结', '理解自测', '多头注意力', '三种 Attention'];
  await expect(modes.getByRole('button')).toHaveCount(expectedModes.length);
  for (const name of expectedModes) await expect(modes.getByRole('button', { name, exact: true })).toHaveCount(1);
  await expect(modes.getByRole('button', { pressed: true })).toHaveText('使用说明');
  await expect(page.locator('#help-title')).toBeVisible();
  await expect(page.getByRole('region', { name: '认识 Attention（注意力机制）', exact: true })).toBeVisible();
  await expect(page.locator('.help-attention-overview')).toContainText('理解它有什么帮助？');
  await expect(page.getByRole('button', { name: '打开动手实验', exact: true })).toBeVisible();
  await expect(page.locator('.help-page .guide-list')).toHaveCount(0);
  await expect(page.getByRole('banner').getByRole('button', { name: '使用说明', exact: true })).toHaveCount(0);
  await expect(page.locator('.free-experiment-scope')).toHaveCount(0);
  await expect(page.getByRole('spinbutton')).toHaveCount(0);
  for (const name of expectedModes.filter((name) => name !== '使用说明')) {
    await page.getByRole('button', { name: `打开${name}`, exact: true }).click();
    await expect(modes.getByRole('button', { pressed: true })).toHaveText(name);
    await expect(page.locator('#help-title')).toBeHidden();
    await modes.getByRole('button', { name: '使用说明', exact: true }).click();
  }
  await page.getByRole('button', { name: '打开动手实验', exact: true }).click();
  await expect(page.locator('#attention-introduction-title')).toBeHidden();
  await expect(page.locator('.free-experiment-scope')).toBeVisible();
  await expect(page.locator('#single-head-matrix-title')).toBeHidden();
  await page.getByRole('button', { name: '编辑词元 B', exact: true }).click();
  await (await vectorInput(page, 'B', 'V', 'y')).fill('4');
  await (await comparisonButton(page, '保存基线')).click();
  await (await vectorInput(page, 'B', 'V', 'y')).fill('3');
  await openCalculation(page);
  await modes.getByRole('button', { name: '使用说明', exact: true }).click();
  await expect(page.locator('section[aria-labelledby="help-title"]')).toBeVisible();
  await expect(modes.getByRole('button', { pressed: true })).toHaveText('使用说明');
  await modes.getByRole('button', { name: 'Attention 引言', exact: true }).click();
  await expect(modes.getByRole('button', { pressed: true })).toHaveText('Attention 引言');
  await expect(modes.getByRole('button', { pressed: true })).toBeFocused();
  await expect(page.locator('#attention-introduction-title')).toBeVisible();
  await expect(page.locator('.free-experiment-scope')).toHaveCount(0);
  await expect(page.getByRole('spinbutton')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '重置实验' })).toHaveCount(0);
  await expect(page.locator('.architecture-attention-note')).toBeVisible();
  await modes.getByRole('button', { name: '实验总结', exact: true }).click();
  await expect(modes.getByRole('button', { pressed: true })).toHaveText('实验总结');
  await expect(page.locator('#single-head-matrix-title')).toBeVisible();
  await expect(page.locator('#attention-introduction-title')).toBeHidden();
  await modes.getByRole('button', { name: '理解Q,K,V', exact: true }).click();
  await expect(page.getByRole('region', { name: '理解Q,K,V', exact: true })).toBeVisible();
  await expect(page.getByRole('spinbutton')).toHaveCount(0);
  await openExperiment(page, 'free');
  await expect((await vectorInput(page, 'B', 'V', 'y'))).toHaveValue('3');
  await expect(page.getByTestId('baseline-output')).toHaveText('(0.872, 1.136)');
  await openCalculation(page);
  await expect(page.locator('.formula-explanation')).toBeVisible();
  await modes.getByRole('button', { name: 'Attention 引言', exact: true }).click();
  await expect(page.locator('.architecture-attention-note')).toBeVisible();
  await page.screenshot({ path: '.tools/preview-navigation-introduction.png', fullPage: true });
});

test('reading pages preserve an in-progress guided lesson, hints and locked parameters', async ({ page }) => {
  await openLab(page);
  await openExperiment(page, 'guided');
  await page.getByRole('radio', { name: 'B 的权重上升，A 和 C 的权重下降', exact: true }).check();
  await page.getByRole('button', { name: '记录预测，开始实验', exact: true }).click();
  await (await vectorInput(page, 'B', 'K', 'x')).fill('2');
  await page.getByRole('button', { name: '给我一点提示' }).click();
  await expect(page.locator('.lesson-hint')).toBeVisible();
  await page.getByRole('button', { name: '实验总结', exact: true }).click();
  await expect(page.getByRole('region', { name: '当前实验目标' })).toHaveCount(0);
  await page.getByRole('group', { name: '学习模式' }).getByRole('button', { name: '使用说明', exact: true }).click();
  await page.getByRole('button', { name: 'Attention 引言', exact: true }).click();
  await page.getByRole('button', { name: '理解Q,K,V', exact: true }).click();
  await page.getByRole('button', { name: '多头注意力', exact: true }).click();
  await page.getByRole('button', { name: '三种 Attention', exact: true }).click();
  await openExperiment(page, 'guided');
  const key = (await vectorInput(page, 'B', 'K', 'x'));
  await expect(key).toHaveValue('2');
  await expect(page.getByRole('group', { name: '学习模式' }).getByRole('button', { name: '动手实验', exact: true })).toBeFocused();
  await expect(page.getByRole('group', { name: '学习模式' })).toBeInViewport({ ratio: 1 });
  await expect((await vectorInput(page, 'B', 'V', 'y'))).toBeDisabled();
  await expect(page.locator('.lesson-hint')).toBeVisible();
  await expect(page.getByRole('button', { name: '记录预测，开始实验' })).toHaveCount(0);
  await page.getByRole('button', { name: '检查当前修改' }).click();
  await expect(page.getByRole('button', { name: '提交理解题' })).toBeVisible();
});

test('mobile reading navigation preserves unfinished quiz questions and selected answers', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLab(page);
  await expect(page.getByRole('group', { name: '学习模式' }).getByRole('button', { pressed: true })).toHaveText('使用说明');
  await expect(page.locator('#help-title')).toBeVisible();
  await page.getByRole('button', { name: 'Attention 引言', exact: true }).click();
  await page.reload();
  await enterLab(page);
  await expect(page.getByRole('group', { name: '学习模式' }).getByRole('button', { pressed: true })).toHaveText('使用说明');
  await expect(page.locator('#help-title')).toBeVisible();
  await page.getByRole('button', { name: '理解自测', exact: true }).click();
  const cards = page.getByTestId('assessment-question');
  const ids = await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-question-id')));
  await cards.first().getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Attention 引言', exact: true }).click();
  await expect(page.getByRole('radio')).toHaveCount(0);
  await page.getByRole('button', { name: '实验总结', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: '.tools/preview-navigation-summary-mobile.png', fullPage: true });
  await page.getByRole('button', { name: '理解自测', exact: true }).click();
  expect(await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-question-id')))).toEqual(ids);
  await expect(cards.first().getByRole('radio').first()).toBeChecked();
  await expect(page.getByRole('button', { name: '提交自测' })).toBeDisabled();
  expect(await page.getByRole('group', { name: '学习模式' }).getByRole('button', { pressed: true }).count()).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
