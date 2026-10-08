import { expect, test } from '@playwright/test';

test('sentence example explains four stages, exposes the full speech and preserves reading and experiment state', async ({ page }) => {
  await page.goto('/');
  const modes = page.getByRole('group', { name: '学习模式' });
  await expect(page.getByRole('heading', { name: '用一个小例子，理解 Attention', exact: true })).toHaveCount(0);
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
  const stages = page.getByRole('group', { name: '例子讲解步骤' });
  const explanation = page.getByRole('article', { name: '当前例子讲解' });
  await expect(explanation).toContainText('Embedding');
  await expect(explanation).toContainText('训练中学习到的参数矩阵');
  await expect(page.getByRole('button', { name: '上一步', exact: true })).toBeDisabled();
  await expect(page.getByRole('heading', { name: '1. 认识 Q 和 K', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await expect(explanation).toContainText('缩放，再经过 Softmax');
  await expect(page.locator('.example-book')).toHaveClass(/is-emphasized/);
  await expect(stages.getByRole('button', { pressed: true })).toHaveText('2寻找相关位置');
  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await expect(explanation).toContainText('概率表');
  await expect(explanation).toContainText('尚书');
  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await expect(explanation).toContainText('512');
  await expect(explanation).toContainText('二维向量');
  await expect(explanation).toContainText('偏移');
  await expect(page.getByRole('button', { name: '下一步', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '上一步', exact: true }).click();
  await stages.getByRole('button', { name: '1 认识 Q 和 K', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(stages.getByRole('button', { pressed: true })).toHaveText('1认识 Q 和 K');
  await page.locator('.example-transcript summary').click();
  const transcript = page.locator('.example-transcript-body');
  await expect(transcript.getByRole('heading')).toHaveCount(4);
  for (const phrase of ['我去了哪里', 'Embedding', '尚书', '偏移', '二维向量', '概率表']) {
    await expect(transcript).toContainText(phrase);
  }
  await stages.getByRole('button', { name: '3 读取 V 的内容', exact: true }).click();
  await page.screenshot({ path: '.tools/preview-sentence-example-desktop.png', fullPage: true });
  await modes.getByRole('button', { name: '实验总结', exact: true }).click();
  await exampleButton.click();
  await expect(stages.getByRole('button', { pressed: true })).toHaveText('3读取 V 的内容');
  await expect(page.locator('.example-transcript')).toHaveAttribute('open', '');
  await page.getByRole('button', { name: '去自由探索', exact: true }).click();
  await expect(modes.getByRole('button', { pressed: true })).toHaveText('自由探索');
  await expect(page.getByRole('spinbutton', { name: '词元 B 的 V y', exact: true })).toHaveValue('3');
  await expect(page.getByTestId('baseline-output')).toHaveText('(0.872, 1.136)');
  await expect(page.getByRole('button', { name: '3 Softmax', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

for (const width of [320, 390]) {
  test(`sentence example is readable at ${width}px and preserves unfinished assessment answers`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: '理解自测', exact: true }).click();
    const questions = page.getByTestId('assessment-question');
    const ids = await questions.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-question-id')));
    await questions.first().getByRole('radio').first().check();
    await page.getByRole('button', { name: '小栗子🌰', exact: true }).click();
    await expect(page.getByRole('radio')).toHaveCount(0);
    const stages = page.getByRole('group', { name: '例子讲解步骤' });
    for (const button of await stages.getByRole('button').all()) {
      await button.click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
    await page.locator('.example-transcript summary').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    const bodySize = await page.locator('.example-transcript-body section p').first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
    expect(bodySize).toBeGreaterThanOrEqual(16);
    if (width === 390) {
      await page.locator('.example-transcript summary').click();
      await stages.getByRole('button').first().click();
      await page.screenshot({ path: '.tools/preview-sentence-example-mobile.png', fullPage: true });
    }
    await page.getByRole('button', { name: '理解自测', exact: true }).click();
    expect(await questions.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-question-id')))).toEqual(ids);
    await expect(questions.first().getByRole('radio').first()).toBeChecked();
    await expect(page.getByRole('button', { name: '提交自测', exact: true })).toBeDisabled();
  });
}
