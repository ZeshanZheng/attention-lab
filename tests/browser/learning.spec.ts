import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { getLesson } from '../../web/learning/lessons.ts';
import { QUESTION_BANK } from '../../web/learning/assessment.ts';
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

async function answerQuiz(page: Page, correct: boolean) {
  const cards = page.getByTestId('assessment-question');
  await expect(cards).toHaveCount(5);
  const ids: string[] = [];
  for (let index = 0; index < 5; index += 1) {
    const card = cards.nth(index);
    const id = (await card.getAttribute('data-question-id'))!;
    ids.push(id);
    const question = QUESTION_BANK.find((item) => item.id === id)!;
    const choice = correct ? question.correctIndex : (question.correctIndex + 1) % question.options.length;
    await card.getByRole('radio', { name: question.options[choice]!, exact: true }).check();
  }
  return ids;
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
  const firstIds = await answerQuiz(page, false);
  await page.getByRole('button', { name: '提交自测', exact: true }).click();
  await expect(page.getByTestId('assessment-score')).toHaveText('0 / 5');
  await expect(page.getByText(/正确答案：/)).toHaveCount(5);
  await page.getByRole('button', { name: '换一组题，再测一次', exact: true }).click();
  await expect(page.getByRole('heading', { name: '换一组题，看看是否真正理解', exact: true })).toBeFocused();
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
  const secondIds = await answerQuiz(page, true);
  expect(secondIds.every((id) => !firstIds.includes(id))).toBe(true);
  await page.getByRole('button', { name: '提交自测', exact: true }).click();
  await expect(page.getByTestId('assessment-score')).toHaveText('5 / 5');
  await expect(page.getByTestId('first-score')).toHaveText('0 / 5');
  await expect(page.getByTestId('latest-score')).toHaveText('5 / 5');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: '.tools/preview-assessment.png', fullPage: true });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出记录', exact: true }).click();
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(exported.assessmentAttempts.map((record: { score: number; total: number }) => [record.score, record.total])).toEqual([[0, 5], [5, 5]]);
  expect(exported.assessmentAttempts[0].questions.map((question: { id: string }) => question.id)).toEqual(firstIds);
  expect(exported.assessmentAttempts[1].questions.map((question: { id: string }) => question.id)).toEqual(secondIds);
  await page.reload();
  await page.getByRole('button', { name: '理解自测', exact: true }).click();
  await expect(page.getByTestId('first-score')).toHaveText('0 / 5');
  await expect(page.getByTestId('latest-score')).toHaveText('5 / 5');
  const thirdIds = await answerQuiz(page, true);
  expect(thirdIds.every((id) => ![...firstIds, ...secondIds].includes(id))).toBe(true);
});

test('legacy four-question scores survive the upgrade and new five-question scores', async ({ page }) => {
  await page.addInitScript((key) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ version: 1, lessons: [], assessments: [{ submittedAt: '2026-10-07T10:00:00.000Z', answers: [0, 2, 1, 0] }] }));
  }, STORAGE_KEY);
  await page.goto('/');
  await page.getByRole('button', { name: '理解自测', exact: true }).click();
  await expect(page.getByTestId('first-score')).toHaveText('4 / 4');
  await expect(page.getByTestId('latest-score')).toHaveText('4 / 4');
  await answerQuiz(page, true);
  await page.getByRole('button', { name: '提交自测', exact: true }).click();
  await expect(page.getByTestId('first-score')).toHaveText('4 / 4');
  await expect(page.getByTestId('latest-score')).toHaveText('5 / 5');
  await page.reload();
  await page.getByRole('button', { name: '理解自测', exact: true }).click();
  await expect(page.getByTestId('first-score')).toHaveText('4 / 4');
  await expect(page.getByTestId('latest-score')).toHaveText('5 / 5');
});

test('switching unfinished rounds replaces questions, clears answers and remains usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: '理解自测', exact: true }).click();
  const history: string[][] = [];
  for (let round = 0; round < 4; round += 1) {
    const cards = page.getByTestId('assessment-question');
    const ids = await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-question-id')!));
    expect(ids).toHaveLength(5);
    expect(ids.every((id) => !history.slice(-3).flat().includes(id))).toBe(true);
    history.push(ids);
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
    await cards.first().getByRole('radio').first().check();
    await expect(page.getByRole('button', { name: '提交自测', exact: true })).toBeDisabled();
    if (round < 3) await page.getByRole('button', { name: '换一组题', exact: true }).click();
  }
  expect(new Set(history.flat()).size).toBe(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
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
