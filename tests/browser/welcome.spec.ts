import { expect, test } from '@playwright/test';
import { enterLab } from './open-lab.ts';

test('welcome is a separate first screen, enters help by keyboard, and returns after reload', async ({ page }) => {
  await page.goto('/');
  const welcome = page.getByRole('main', { name: /欢迎您来到\s*注意力实验室！/ });
  await expect(welcome).toBeVisible();
  await expect(welcome.getByRole('heading')).toHaveText('欢迎您来到注意力实验室！');
  await expect(welcome.locator('p')).toHaveText('通过修改向量、观察计算和完成实验，理解 Q、K、V 如何配合，掌握注意力从匹配到信息聚合的过程。');
  await expect(page.getByRole('button')).toHaveCount(1);
  await expect(page.getByRole('banner')).toHaveCount(0);
  await expect(page.getByRole('group', { name: '学习模式' })).toHaveCount(0);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '进入实验室', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  const modes = page.getByRole('group', { name: '学习模式' });
  await expect(modes.getByRole('button', { pressed: true })).toHaveText('使用说明');
  await expect(modes.getByRole('button', { pressed: true })).toBeFocused();
  await expect(page.locator('#help-title')).toHaveText('认识 Attention（注意力机制）');
  await expect(page.locator('.help-page')).not.toContainText('欢迎您来到');
  await expect(page.getByRole('main')).toHaveCount(1);
  await modes.getByRole('button', { name: '自由探索', exact: true }).click();
  await page.getByRole('spinbutton', { name: '词元 A 的 K x', exact: true }).fill('2');
  await page.reload();
  await expect(welcome).toBeVisible();
  await expect(modes).toHaveCount(0);
  await enterLab(page);
  await expect(modes.getByRole('button', { pressed: true })).toHaveText('使用说明');
});

for (const width of [320, 390]) {
  test(`welcome is readable and entry is visible at ${width}px with reduced motion`, async ({ page }) => {
    await page.setViewportSize({ width, height: 640 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const button = page.getByRole('button', { name: '进入实验室', exact: true });
    await expect(button).toBeInViewport();
    await expect(page.getByRole('heading')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await enterLab(page);
    await expect(page.locator('#help-title')).toBeVisible();
  });
}
