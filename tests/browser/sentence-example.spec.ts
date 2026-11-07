import { openLab, openExperiment, vectorInput, openCalculation, comparisonButton } from './open-lab.ts';
import { expect, test } from '@playwright/test';

test('sentence example presents one continuous explanation and preserves experiment state', async ({ page }) => {
  await openLab(page);
  const modes = page.getByRole('group', { name: '学习模式' });
  await expect(page.getByRole('region', { name: '理解Q,K,V', exact: true })).toHaveCount(0);
  await openExperiment(page, 'free');
  await page.getByRole('button', { name: '编辑词元 B', exact: true }).click();
  await (await vectorInput(page, 'B', 'V', 'y')).fill('4');
  await (await comparisonButton(page, '保存基线')).click();
  await (await vectorInput(page, 'B', 'V', 'y')).fill('3');
  await openCalculation(page);
  const exampleButton = modes.getByRole('button', { name: '理解Q,K,V', exact: true });
  await exampleButton.click();
  await expect(exampleButton).toBeFocused();
  await expect(modes.getByRole('button', { pressed: true })).toHaveText('理解Q,K,V');
  await expect(page.locator('.mode-pill')).toHaveText('理解Q,K,V');
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
  await expect(page.locator('.example-takeaway')).toHaveCount(0);
  await expect(page.locator('.example-scope')).toHaveText('这只是指代关系的教学示意，并未运行真实语言模型；真实模型使用的词元划分取决于分词器。');
  const articleBounds = await explanation.boundingBox();
  const sourceBounds = await page.locator('.example-source').boundingBox();
  const entryBounds = await page.locator('.example-explore').boundingBox();
  expect(articleBounds!.y + articleBounds!.height).toBeLessThan(sourceBounds!.y);
  expect(sourceBounds!.y + sourceBounds!.height).toBeLessThan(entryBounds!.y);
  await expect(page.locator('.example-explore').getByRole('button', { name: '进入Attention 计算模块', exact: true })).toBeVisible();
  await page.screenshot({ path: '.tools/preview-sentence-example-desktop.png', fullPage: true });
  await modes.getByRole('button', { name: '实验总结', exact: true }).click();
  await exampleButton.click();
  await expect(explanation).toContainText('V 本身是一组数字');
  await page.getByRole('button', { name: '进入Attention 计算模块', exact: true }).click();
  await expect(modes.getByRole('button', { pressed: true })).toHaveText('Attention 计算');
  await page.getByRole('button', { name: '进入动手实验模块', exact: true }).click();
  await expect((await vectorInput(page, 'B', 'V', 'y'))).toHaveValue('3');
  await expect(page.getByTestId('baseline-output')).toHaveText('(0.872, 1.136)');
  await openCalculation(page);
  await expect(page.locator('.formula-explanation')).toBeVisible();
});

for (const width of [320, 390]) {
  test(`sentence example is readable at ${width}px and preserves unfinished assessment answers`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await openLab(page);
    await page.getByRole('button', { name: '理解自测', exact: true }).click();
    const questions = page.getByTestId('assessment-question');
    const ids = await questions.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-question-id')));
    await questions.first().getByRole('radio').first().check();
    await page.getByRole('button', { name: '理解Q,K,V', exact: true }).click();
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
