import type { Page } from '@playwright/test';

export async function enterLab(page: Page) {
  await page.getByRole('button', { name: '进入实验室', exact: true }).click();
}

export async function openLab(page: Page) {
  await page.goto('/');
  await enterLab(page);
}
