import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { ASSESSMENT, getLesson } from '../../web/learning/lessons.ts';
import { STORAGE_KEY } from '../../web/learning/progress.ts';

async function predict(page: Page, lessonId: 'focus' | 'content' | 'competition', answer: number) {
  const lesson = getLesson(lessonId);
  await page.getByRole('radio', { name: lesson.prediction.options[answer]!, exact: true }).check();
  await page.getByRole('button', { name: '记录预测，开始实验', exact: true }).click();
}
async function answerUnderstanding(page: Page, lessonId: 'focus' | 'content' | 'competition', answer: number) {
  const lesson = getLesson(lessonId);
  await page.getByRole('radio', { name: lesson.comprehension.options[answer]!, exact: true }).check();
  await page.getByRole('button', { name: '提交理解题', exact: true }).click();
}

test('all three guided lessons enforce the learning flow, retain first mistakes, export and persist progress', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: '引导实验', exact: true }).click();
  const keyX = page.getByRole('spinbutton', { name: '词元 B 的 K x', exact: true });
  await expect(keyX).toBeDisabled();
  await expect(page.getByRole('button', { name: '记录预测，开始实验', exact: true })).toBeDisabled();
  await predict(page, 'focus', 1);
  await expect(keyX).toBeEnabled();
  await expect(page.getByRole('spinbutton', { name: '词元 B 的 V y', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '观察词元 B', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '保存基线', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '检查实验结果', exact: true }).click();
  await expect(page.getByText(/B 当前的权重是.*还需要超过 60/)).toBeVisible();
  await keyX.fill('2');
  await page.getByRole('button', { name: '检查实验结果', exact: true }).click();
  await expect(keyX).toBeDisabled();
  await expect(page.getByText('用观察修正了首次预测', { exact: true })).toBeVisible();
  await answerUnderstanding(page, 'focus', 0);
  await expect(page.getByText('再想一想', { exact: true })).toBeVisible();
  await expect(page.getByTestId('lesson-progress')).toHaveText('已完成 0 / 3');
  await answerUnderstanding(page, 'focus', 1);
  await expect(page.getByTestId('lesson-progress')).toHaveText('已完成 1 / 3');

  await page.getByRole('button', { name: '下一个实验', exact: true }).click();
  await predict(page, 'content', 1);
  await page.getByRole('spinbutton', { name: '词元 B 的 V y', exact: true }).fill('4');
  await expect(page.getByTestId('weight-0')).toHaveText('57.6%');
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 1.136)');
  await page.getByRole('button', { name: '检查实验结果', exact: true }).click();
  await answerUnderstanding(page, 'content', 0);
  await expect(page.getByTestId('lesson-progress')).toHaveText('已完成 2 / 3');

  await page.getByRole('button', { name: '下一个实验', exact: true }).click();
  await predict(page, 'competition', 2);
  await page.getByRole('spinbutton', { name: '词元 A 的 K x', exact: true }).fill('2');
  await page.getByRole('button', { name: '检查实验结果', exact: true }).click();
  await answerUnderstanding(page, 'competition', 1);
  await expect(page.getByTestId('lesson-progress')).toHaveText('已完成 3 / 3');
  await page.screenshot({ path: '.tools/preview-guided.png', fullPage: true });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出记录', exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const exported = JSON.parse(await readFile(path!, 'utf8'));
  expect(exported.completedLessons).toEqual(['focus', 'content', 'competition']);
  expect(exported.lessonAttempts[0].firstPredictionCorrect).toBe(false);
  expect(exported.lessonAttempts[0].firstComprehensionCorrect).toBe(false);
  expect(exported.lessonAttempts[0].comprehensionAttempts).toBe(2);
  expect(exported.lessonAttempts[0].observation.input.keys[1]).toEqual([2, 1]);

  await page.reload();
  await expect(page.getByTestId('saved-progress')).toHaveText('实验进度 3 / 3');
  await page.getByRole('button', { name: '引导实验', exact: true }).click();
  await expect(page.getByTestId('lesson-progress')).toHaveText('已完成 3 / 3');
  expect(errors).toEqual([]);
});

test('mode switching preserves free exploration, and guided reset keeps completed learning records', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '编辑词元 C', exact: true }).click();
  await page.getByRole('spinbutton', { name: '词元 C 的 V x', exact: true }).fill('-3');
  await page.getByRole('button', { name: '引导实验', exact: true }).click();
  await predict(page, 'focus', 0);
  await page.getByRole('spinbutton', { name: '词元 B 的 K x', exact: true }).fill('2');
  await page.getByRole('button', { name: '理解自测', exact: true }).click();
  await page.getByRole('button', { name: '回到引导实验', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: '词元 B 的 K x', exact: true })).toHaveValue('2');
  await page.getByRole('button', { name: '检查实验结果', exact: true }).click();
  await answerUnderstanding(page, 'focus', 1);
  await page.getByRole('button', { name: '重置实验', exact: true }).click();
  await expect(page.getByTestId('lesson-progress')).toHaveText('已完成 1 / 3');
  await expect(page.getByRole('spinbutton', { name: '词元 B 的 K x', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '自由探索', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: '词元 C 的 V x', exact: true })).toHaveValue('-3');
  await expect(page.getByRole('spinbutton', { name: '词元 C 的 V x', exact: true })).toBeEnabled();
  await expect(page.getByTestId('saved-progress')).toHaveText('实验进度 1 / 3');
});

test('assessment gives per-question feedback and preserves first score independently of retries', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '理解自测', exact: true }).click();
  await expect(page.getByRole('button', { name: '提交自测', exact: true })).toBeDisabled();
  const wrong = [1, 0, 0, 1];
  for (const [index, question] of ASSESSMENT.entries()) {
    await page.getByRole('group', { name: question.prompt, exact: true }).getByRole('radio', { name: question.options[wrong[index]!]!, exact: true }).check();
  }
  await page.getByRole('button', { name: '提交自测', exact: true }).click();
  await expect(page.getByTestId('assessment-score')).toHaveText('0 / 4');
  await expect(page.getByText(/正确答案：/)).toHaveCount(4);
  await page.getByRole('button', { name: '再做一次自测', exact: true }).click();
  for (const question of ASSESSMENT) {
    await page.getByRole('group', { name: question.prompt, exact: true }).getByRole('radio', { name: question.options[question.correctIndex]!, exact: true }).check();
  }
  await page.getByRole('button', { name: '提交自测', exact: true }).click();
  await expect(page.getByTestId('assessment-score')).toHaveText('4 / 4');
  await expect(page.getByTestId('first-score')).toHaveText('0 / 4');
  await expect(page.getByTestId('latest-score')).toHaveText('4 / 4');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: '.tools/preview-assessment.png', fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: '理解自测', exact: true }).click();
  await expect(page.getByTestId('first-score')).toHaveText('0 / 4');
  await expect(page.getByTestId('latest-score')).toHaveText('4 / 4');
});

test('malformed saved progress recovers without a page error', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript((key) => localStorage.setItem(key, '{not-json'), STORAGE_KEY);
  await page.goto('/');
  await expect(page.getByTestId('saved-progress')).toHaveText('实验进度 0 / 3');
  await expect(page.getByTestId('output-vector')).toContainText('(0.872, 0.568)');
  expect(errors).toEqual([]);
});

test('when local storage is unavailable, learning remains usable and export is offered', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'setItem', { value: () => { throw new DOMException('Storage unavailable', 'QuotaExceededError'); } });
  });
  await page.goto('/');
  await expect(page.getByText('浏览器暂不能保存学习进度；本页仍可学习，离开前可导出记录。', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '引导实验', exact: true }).click();
  await predict(page, 'focus', 0);
  await page.getByRole('spinbutton', { name: '词元 B 的 K x', exact: true }).fill('2');
  await page.getByRole('button', { name: '检查实验结果', exact: true }).click();
  await answerUnderstanding(page, 'focus', 1);
  await expect(page.getByTestId('lesson-progress')).toHaveText('已完成 1 / 3');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出记录', exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('attention-lab-learning.json');
});

test('mobile guided learning and quiz have no horizontal overflow and can complete an experiment', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: '引导实验', exact: true }).click();
  await page.getByRole('button', { name: '实验 2：改变传递内容', exact: true }).click();
  await predict(page, 'content', 1);
  await page.getByRole('spinbutton', { name: '词元 B 的 V y', exact: true }).fill('4');
  await page.getByRole('button', { name: '检查实验结果', exact: true }).click();
  await answerUnderstanding(page, 'content', 0);
  await expect(page.getByTestId('lesson-progress')).toHaveText('已完成 1 / 3');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await page.screenshot({ path: '.tools/preview-guided-mobile.png', fullPage: true });
  await page.getByRole('button', { name: '理解自测', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});
