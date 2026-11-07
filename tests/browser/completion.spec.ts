import { expect, test } from '@playwright/test';
import { enterLab } from './open-lab.ts';
import { QUESTION_BANK } from '../../web/learning/assessment.ts';
import { STORAGE_KEY } from '../../web/learning/progress.ts';

test('the last module opens a standalone completion screen and returns to welcome without losing saved scores', async ({ page }) => {
  await page.goto('/');
  const background = await page.locator('.welcome-screen').evaluate((node) => getComputedStyle(node).backgroundImage);
  await enterLab(page);
  const navigation = page.getByRole('group', { name: '学习模式' });
  await navigation.getByRole('button', { name: '理解自测', exact: true }).click();
  for (const card of await page.getByTestId('assessment-question').all()) {
    const id = await card.getAttribute('data-question-id');
    const question = QUESTION_BANK.find((item) => item.id === id)!;
    await card.getByRole('radio').nth(question.correctIndex).check();
  }
  await page.getByRole('button', { name: '提交自测', exact: true }).click();
  await expect(page.getByTestId('assessment-score')).toHaveText('5 / 5');
  const saved = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  await navigation.getByRole('button', { name: '三种 Attention', exact: true }).click();
  const finish = page.getByRole('navigation', { name: '下一模块' }).getByRole('button', { name: '进入结束页', exact: true });
  await expect(page.getByRole('button', { name: '返回使用说明', exact: true })).toHaveCount(0);
  await finish.click();
  const completion = page.getByRole('main', { name: '恭喜您已经完成了实验！', exact: true });
  await expect(completion).toBeVisible();
  await expect(completion.getByRole('heading')).toBeFocused();
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('banner')).toHaveCount(0);
  await expect(navigation).toHaveCount(0);
  await expect(page.getByRole('button')).toHaveCount(1);
  expect(await completion.evaluate((node) => getComputedStyle(node).backgroundImage)).toBe(background);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('.completion-fireworks')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.completion-fireworks')).toHaveCSS('pointer-events', 'none');
  await expect(page.locator('.firework')).toHaveCount(6);
  await expect(page.locator('.firework-spark').first()).toHaveCSS('animation-name', 'firework-bloom');
  await expect(page.locator('.firework-spark').first()).toHaveCSS('animation-iteration-count', '1');
  const back = page.getByRole('button', { name: '回到开始界面', exact: true });
  await expect(back).toHaveCSS('background-color', 'rgb(36, 109, 227)');
  await page.keyboard.press('Tab');
  await expect(back).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: '欢迎您来到注意力实验室！', exact: true })).toBeVisible();
  await expect(page.locator('.completion-fireworks')).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(saved);
  await enterLab(page);
  await expect(navigation.getByRole('button', { pressed: true })).toHaveText('使用说明');
  await navigation.getByRole('button', { name: '理解自测', exact: true }).click();
  await expect(page.getByTestId('first-score')).toHaveText('5 / 5');
  await expect(page.getByTestId('latest-score')).toHaveText('5 / 5');
});

for (const width of [320, 390]) {
  test(`completion fits ${width}px, respects reduced motion and returns to the initial welcome screen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 640 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await enterLab(page);
    await page.getByRole('group', { name: '学习模式' }).getByRole('button', { name: '三种 Attention', exact: true }).click();
    await page.getByRole('button', { name: '进入结束页', exact: true }).click();
    const heading = page.getByRole('heading', { name: '恭喜您已经完成了实验！', exact: true });
    const back = page.getByRole('button', { name: '回到开始界面', exact: true });
    await expect(heading).toBeInViewport();
    await expect(back).toBeInViewport();
    await expect(page.locator('.completion-fireworks')).toBeHidden();
    await expect(page.locator('.firework-spark').first()).toHaveCSS('animation-name', 'none');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await back.click();
    await expect(page.getByRole('button', { name: '进入实验室', exact: true })).toBeVisible();
    await expect(page.getByRole('group', { name: '学习模式' })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('button', { name: '进入实验室', exact: true })).toBeVisible();
    await expect(heading).toHaveCount(0);
  });
}
