import { openLab } from './open-lab.ts';
import { expect, test } from '@playwright/test';

test('sentence example presents one continuous explanation and preserves experiment state', async ({ page }) => {
  await openLab(page);
  const modes = page.getByRole('group', { name: '学习模式' });
  await expect(page.getByRole('region', { name: '小栗子🌰', exact: true })).toHaveCount(0);
  await modes.getByRole('button', { name: '自由探索', exact: true }).click();
  await page.getByRole('button', { name: '编辑词元 B', exact: true }).click();
  await page.getByRole('spinbutton', { name: '词元 B 的 V y', exact: true }).fill('4');
  await page.getByRole('button', { name: '保存基线', exact: true }).click();
  await page.getByRole('spinbutton', { name: '词元 B 的 V y', exact: true }).fill('3');
  await page.getByRole('button', { name: '3 Softmax', exact: true }).click();
  const exampleButton = modes.getByRole('button', { name: '小栗子🌰', exact: true });
  await exampleButton.click();
  await expect(exampleButton).toBeFocused();
  await expect(modes.getByRole('button', { pressed: true })).toHaveText('小栗子🌰');
  await expect(page.locator('.mode-pill')).toHaveText('小栗子🌰');
  await expect(page.getByRole('spinbutton')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '重置实验', exact: true })).toHaveCount(0);
  const explanation = page.getByRole('article', { name: '例子完整讲解' });
  await expect(explanation.getByRole('heading')).toHaveText([
    '每个词，怎样描述自己和寻找信息？',
    '“它”拿着自己的 Q，去和各个 K 匹配',
    '找到了相关位置，它能提供什么信息？',
    '让“它”的表示带上来自上下文的信息',
  ]);
  await expect(page.getByRole('group', { name: '例子讲解步骤' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '上一步', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '下一步', exact: true })).toHaveCount(0);
  await expect(explanation).toContainText('Embedding');
  await expect(explanation).toContainText('我去了哪里');
  await expect(explanation).toContainText('训练中学习到的参数矩阵');
  await expect(page.locator('.example-word-cards')).toHaveCount(0);
  await expect(page.locator('.example-projection')).toBeVisible();
  await expect(explanation).toContainText('缩放，再经过 Softmax');
  await expect(page.locator('.example-book')).toHaveClass(/is-emphasized/);
  await expect(explanation).toContainText('V 本身是一组数字');
  await expect(explanation).not.toContainText('概率表');
  await expect(explanation).toContainText('尚书');
  await expect(explanation).toContainText('512');
  await expect(explanation).toContainText('二维向量');
  await expect(explanation).toContainText('偏移');
  await expect(page.locator('.example-explore')).toBeVisible();
  await expect(page.locator('.example-source a')).toHaveText('Transformer 原论文 §3.2');
  await expect(page.locator('.example-transcript')).toHaveCount(0);
  await expect(page.locator('.example-prose .example-topic > p, .example-closing > p')).toHaveCount(13);
  const takeawayBounds = await page.locator('.example-takeaway').boundingBox();
  const closingBounds = await page.locator('.example-closing').boundingBox();
  expect(takeawayBounds!.y + takeawayBounds!.height).toBeLessThan(closingBounds!.y);
  const articleBounds = await explanation.boundingBox();
  const entryBounds = await page.locator('.example-explore').boundingBox();
  expect(articleBounds!.y + articleBounds!.height).toBeLessThan(entryBounds!.y);
  await page.screenshot({ path: '.tools/preview-sentence-example-desktop.png', fullPage: true });
  await modes.getByRole('button', { name: '实验总结', exact: true }).click();
  await exampleButton.click();
  await expect(explanation).toContainText('V 本身是一组数字');
  await page.getByRole('button', { name: '进入自由探索模块', exact: true }).click();
  await expect(modes.getByRole('button', { pressed: true })).toHaveText('自由探索');
  await expect(page.getByRole('spinbutton', { name: '词元 B 的 V y', exact: true })).toHaveValue('3');
  await expect(page.getByTestId('baseline-output')).toHaveText('(0.872, 1.136)');
  await expect(page.getByRole('button', { name: '3 Softmax', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

for (const width of [320, 390]) {
  test(`sentence example is readable at ${width}px and preserves unfinished assessment answers`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await openLab(page);
    await page.getByRole('button', { name: '理解自测', exact: true }).click();
    const questions = page.getByTestId('assessment-question');
    const ids = await questions.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-question-id')));
    await questions.first().getByRole('radio').first().check();
    await page.getByRole('button', { name: '小栗子🌰', exact: true }).click();
    await expect(page.getByRole('radio')).toHaveCount(0);
    await expect(page.getByRole('article', { name: '例子完整讲解' }).getByRole('heading')).toHaveCount(4);
    await expect(page.locator('.example-step-picker, .example-step-controls')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    const bodySize = await page.locator('.example-prose p').first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
    expect(bodySize).toBeGreaterThanOrEqual(16);
    if (width === 390) {
      await page.screenshot({ path: '.tools/preview-sentence-example-mobile.png', fullPage: true });
    }
    await page.getByRole('button', { name: '理解自测', exact: true }).click();
    expect(await questions.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-question-id')))).toEqual(ids);
    await expect(questions.first().getByRole('radio').first()).toBeChecked();
    await expect(page.getByRole('button', { name: '提交自测', exact: true })).toBeDisabled();
  });
}
