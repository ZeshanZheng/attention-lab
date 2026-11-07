import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openLab, openExperiment, vectorInput } from './open-lab.ts';
import { QUESTION_BANK } from '../../web/learning/assessment.ts';
import { getLesson } from '../../web/learning/lessons.ts';
import { STORAGE_KEY } from '../../web/learning/progress.ts';

async function answerRound(page: Page, wrongIds?: readonly string[]) {
  const cards = page.getByTestId('assessment-question');
  const ids: string[] = [];
  for (const card of await cards.all()) {
    const id = (await card.getAttribute('data-question-id'))!;
    const question = QUESTION_BANK.find((item) => item.id === id)!;
    ids.push(id);
    const correct = wrongIds !== undefined && !wrongIds.includes(id);
    await card.getByRole('radio').nth(correct ? question.correctIndex : (question.correctIndex + 1) % question.options.length).check();
  }
  await page.getByRole('button', { name: '提交自测', exact: true }).click();
  return ids;
}

test('wrong answers open the matching task, resume existing work and preserve the submitted round', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => .3; });
  await page.setViewportSize({ width: 390, height: 844 });
  await openLab(page);
  await openExperiment(page);
  await (await vectorInput(page, 'C', 'V', 'x')).fill('-3');
  await openExperiment(page, 'guided');
  await page.getByRole('button', { name: '实验 2：改变传递内容', exact: true }).click();
  const content = getLesson('content');
  await page.getByRole('radio', { name: content.prediction.options[1]!, exact: true }).check();
  await page.getByRole('button', { name: '记录预测，开始实验', exact: true }).click();
  await (await vectorInput(page, 'B', 'V', 'y')).fill('3');
  await page.getByRole('button', { name: '给我一点提示', exact: true }).click();
  const navigation = page.getByRole('group', { name: '学习模式' });
  await navigation.getByRole('button', { name: '理解自测', exact: true }).click();
  await expect(page.locator('.assessment-review')).toHaveCount(0);
  const ids = await answerRound(page);
  expect(ids).toContain('invariance-value');
  await expect(page.locator('.assessment-review')).toHaveCount(5);
  await expect(page.getByTestId('assessment-score')).toHaveText('0 / 5');
  await page.getByTestId('assessment-review-invariance-value').click();
  await expect(navigation.getByRole('button', { pressed: true })).toHaveText('动手实验');
  await expect(navigation).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole('heading', { name: '实验 2：改变传递内容', exact: true })).toBeVisible();
  await expect((await vectorInput(page, 'B', 'V', 'y'))).toHaveValue('3');
  await expect((await vectorInput(page, 'B', 'V', 'y'))).toBeEnabled();
  await expect(page.locator('.lesson-hint')).toBeVisible();
  await (await vectorInput(page, 'B', 'V', 'y')).fill('4');
  await expect(page.getByTestId('matching-score-1')).toHaveText('0.000');
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 1.136)');
  await page.getByRole('button', { name: '检查当前修改', exact: true }).click();
  await page.getByRole('radio', { name: content.comprehension.options[0]!, exact: true }).check();
  await page.getByRole('button', { name: '提交理解题', exact: true }).click();
  await expect(page.getByTestId('saved-progress')).toHaveText('实验进度 1 / 3');
  await navigation.getByRole('button', { name: '理解自测', exact: true }).click();
  expect(await page.getByTestId('assessment-question').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-question-id')))).toEqual(ids);
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(5);
  await expect(page.getByTestId('assessment-score')).toHaveText('0 / 5');
  await page.getByTestId('assessment-review-matching-y').click();
  await expect(page.getByRole('heading', { name: '实验 1：改变关注对象', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '记录预测，开始实验', exact: true })).toBeDisabled();
  await expect((await vectorInput(page, 'B', 'K', 'x'))).toBeDisabled();
  await navigation.getByRole('button', { name: '理解自测', exact: true }).click();
  await page.getByTestId('assessment-review-normalization-equal').click();
  await expect(page.getByRole('heading', { name: '实验 3：观察权重联动', exact: true })).toBeVisible();
  await navigation.getByRole('button', { name: '理解自测', exact: true }).click();
  await expect(page.getByTestId('first-score')).toHaveText('0 / 5');
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  expect(saved.assessments).toHaveLength(1);
  await openExperiment(page, 'free');
  await expect((await vectorInput(page, 'C', 'V', 'x'))).toHaveValue('-3');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('only incorrect answers offer review and mask questions lead to the relevant explanation', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => .99; });
  await openLab(page);
  const navigation = page.getByRole('group', { name: '学习模式' });
  await navigation.getByRole('button', { name: '理解自测', exact: true }).click();
  const ids = await answerRound(page, ['normalization-mask']);
  expect(ids).toContain('normalization-mask');
  await expect(page.getByTestId('assessment-score')).toHaveText('4 / 5');
  await expect(page.locator('.assessment-review')).toHaveCount(1);
  await page.getByTestId('assessment-review-normalization-mask').click();
  await expect(navigation.getByRole('button', { pressed: true })).toHaveText('三种 Attention');
  await expect(page.locator('.attention-type-speech')).toContainText('在 Softmax 之前把未来位置的得分设为负无穷');
  await navigation.getByRole('button', { name: '理解自测', exact: true }).click();
  expect(await page.getByTestId('assessment-question').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-question-id')))).toEqual(ids);
  await expect(page.getByTestId('assessment-score')).toHaveText('4 / 5');
  await page.getByRole('button', { name: '换一组题，再测一次', exact: true }).click();
  await expect(page.locator('.assessment-review')).toHaveCount(0);
  await answerRound(page, []);
  await expect(page.getByTestId('assessment-score')).toHaveText('5 / 5');
  await expect(page.locator('.assessment-review')).toHaveCount(0);
});
