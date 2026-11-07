import type { Page } from '@playwright/test';

export async function enterLab(page: Page) {
  await page.getByRole('button', { name: '进入实验室', exact: true }).click();
}

export async function openLab(page: Page) {
  await page.goto('/');
  await enterLab(page);
}

export async function openExperiment(page: Page, mode: 'free' | 'guided' = 'free') {
  const navigation = page.getByRole('group', { name: '学习模式' });
  if (await navigation.getByRole('button', { name: '动手实验', exact: true, pressed: true }).count() === 0) {
    await navigation.getByRole('button', { name: '动手实验', exact: true }).click();
  }
  const choice = page.getByRole('group', { name: '实验方式' }).getByRole('button', { name: mode === 'free' ? '自由探索' : '引导任务', exact: true });
  if (await choice.getAttribute('aria-pressed') !== 'true') await choice.click();
}
