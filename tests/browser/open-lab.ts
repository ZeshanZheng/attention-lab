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

export async function expandPanel(page: Page, selector: string) {
  const panel = page.locator(selector);
  if (!await panel.evaluate((node) => (node as HTMLDetailsElement).open)) await panel.locator(':scope > summary').click();
}

export async function vectorInput(page: Page, token: string, kind: string, coordinate: string) {
  const tokenButton = page.getByRole('button', { name: `编辑词元 ${token}`, exact: true });
  if (await tokenButton.count() && await tokenButton.getAttribute('aria-pressed') !== 'true') await tokenButton.click();
  const kindButton = page.getByRole('button', { name: `在坐标图编辑 ${kind}`, exact: true });
  if (await kindButton.count() && await kindButton.getAttribute('aria-pressed') !== 'true') await kindButton.click();
  const input = page.getByRole('spinbutton', { name: `词元 ${token} 的 ${kind} ${coordinate}`, exact: true, includeHidden: true });
  if (!await input.isVisible() && await page.locator('.other-vectors').count()) await expandPanel(page, '.other-vectors');
  return input;
}

export async function calculationStep(page: Page, label: string) {
  await expandPanel(page, '.calculation-disclosure');
  return page.getByRole('button', { name: label, exact: true });
}

export async function comparisonButton(page: Page, label: string) {
  await expandPanel(page, '.comparison-settings');
  return page.getByRole('button', { name: label, exact: true });
}
