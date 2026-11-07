import { openLab, openExperiment, vectorInput } from './open-lab.ts';
import { expect, test } from '@playwright/test';

test('single-head matrix precedes the existing summary and explains Query rows and Key columns', async ({ page }) => {
  await openLab(page);
  await page.getByRole('button', { name: '实验总结', exact: true }).click();
  const matrix = page.locator('.single-head-matrix').getByRole('table');
  await expect(matrix).toBeVisible();
  await expect(matrix.locator('tbody tr')).toHaveCount(8);
  await expect(matrix.locator('tbody td')).toHaveCount(64);
  await expect(matrix.locator('thead th').first()).toHaveText('Query ↓ / Key →');
  await expect(matrix.locator('tbody tr').nth(2).locator('th')).toHaveText('“天”Q3');
  await expect(matrix.locator('thead th').nth(1)).toHaveText('“我”K1');
  await expect(matrix.locator('tbody tr').nth(2).locator('td').first()).toHaveText('Q3 · K1');
  await expect(page.locator('.single-head-matrix .reading-speech')).toContainText('这一行的权重组合各个 V');
  await expect(page.locator('.single-head-matrix .reading-speech')).toContainText('长度保持不变');
  await expect(page.locator('.single-head-matrix .reading-speech')).toContainText('夹角超过 90°');
  const before = await page.locator('#single-head-matrix-title').boundingBox();
  const after = await page.locator('#concept-summary-title').boundingBox();
  expect(before!.y).toBeLessThan(after!.y);
  await expect(page.locator('.concept-summary')).toContainText('输出 x ≈ 0.576×2');
});

test('architecture images load, all attention locations are labelled beside the full explanation, and reading preserves free parameters', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openLab(page);
  await openExperiment(page, 'free');
  await (await vectorInput(page, 'A', 'K', 'x')).fill('2');
  const nav = page.getByRole('group', { name: '学习模式' });
  const expectedModes = ['使用说明', 'Attention 引言', '小栗子🌰', '动手实验', '实验总结', '理解自测', '多头注意力', '三种 Attention'];
  await expect(nav.getByRole('button')).toHaveCount(expectedModes.length);
  for (const name of expectedModes) await expect(nav.getByRole('button', { name, exact: true })).toHaveCount(1);
  await nav.getByRole('button', { name: 'Attention 引言', exact: true }).click();
  const qkv = page.locator('.introduction-qkv');
  const calculation = page.getByRole('region', { name: '一次 Attention，按这四步计算', exact: true });
  const architecture = page.locator('.introduction-architecture');
  const orderedSections = await Promise.all([qkv.boundingBox(), calculation.boundingBox(), architecture.boundingBox()]);
  expect(orderedSections[0]!.y + orderedSections[0]!.height).toBeLessThan(orderedSections[1]!.y);
  expect(orderedSections[1]!.y + orderedSections[1]!.height).toBeLessThan(orderedSections[2]!.y);
  await expect(qkv.locator('dt')).toHaveText(['Q · Query · 查询', 'K · Key · 键', 'V · Value · 值']);
  await expect(page.locator('.introduction-next-example')).toContainText('接下来用“书”和“它”的例子');
  const context = page.locator('.architecture-context');
  await expect(context).toHaveJSProperty('open', false);
  await expect(context.locator('p').first()).toBeHidden();
  await context.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(context).toHaveJSProperty('open', true);
  await expect(context.locator('p').first()).toBeVisible();
  const introImage = page.locator('.introduction-architecture img');
  await expect(introImage).toBeVisible();
  expect(await introImage.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const introCaption = page.locator('.introduction-architecture');
  await expect(introCaption).toContainText('Q、K、V 来自同一序列');
  await expect(introCaption.locator('svg text')).toHaveText('Q K V');
  await nav.getByRole('button', { name: '多头注意力', exact: true }).click();
  await expect(page.locator('.mode-pill')).toHaveText('多头注意力');
  await expect(page.getByRole('spinbutton')).toHaveCount(0);
  const matrixImage = page.locator('.multi-head-figure img');
  await expect(matrixImage).toBeVisible();
  expect(await matrixImage.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.advanced-reading:visible')).toContainText('输出投影 Wₒ');
  await expect(page.locator('.advanced-reading:visible')).toContainText('模型并不会提前规定');
  await nav.getByRole('button', { name: '三种 Attention', exact: true }).click();
  const layout = page.locator('.attention-type-layout');
  const speech = layout.locator('.reading-speech');
  const image = page.locator('.attention-type-layout img');
  await expect(page.getByRole('group', { name: '选择架构中的注意力位置' })).toHaveCount(0);
  await expect(page.getByRole('article', { name: '当前注意力类型' })).toHaveCount(0);
  await expect(speech.locator('p')).toHaveCount(5);
  await expect(speech).toContainText('并不表示 Q = K = V');
  await expect(speech).toContainText('不能偷看未来的词');
  await expect(speech).toContainText('在 Softmax 之前把未来位置的得分设为负无穷');
  await expect(speech).toContainText('并不要求每个模型都包含三种模块');
  await expect(speech.getByRole('link', { name: 'Transformer 原论文 §3.1、§3.2.3' })).toBeVisible();
  await expect(layout.locator('ellipse')).toHaveCount(3);
  await expect(layout.locator('.architecture-location-label')).toHaveText(['编码器自注意力', '解码器遮罩自注意力', '编码器—解码器跨注意力']);
  const ringWidths = await layout.locator('ellipse').evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).strokeWidth));
  expect(new Set(ringWidths).size).toBe(1);
  await expect(image).toHaveAttribute('alt', /红圈标出编码器自注意力、解码器遮罩自注意力、编码器—解码器跨注意力/);
  await expect(image).toBeVisible();
  expect(await image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const [figureBounds, speechBounds, comparisonBounds] = await Promise.all([
    layout.locator('figure').boundingBox(), speech.boundingBox(), page.locator('.attention-types-table').boundingBox(),
  ]);
  expect(speechBounds!.x).toBeGreaterThan(figureBounds!.x + figureBounds!.width);
  expect(speechBounds!.y).toBe(figureBounds!.y);
  expect(comparisonBounds!.y).toBeGreaterThan(speechBounds!.y + speechBounds!.height);
  await openExperiment(page, 'free');
  await expect((await vectorInput(page, 'A', 'K', 'x'))).toHaveValue('2');
  await nav.getByRole('button', { name: '三种 Attention', exact: true }).click();
  await expect(speech).toBeVisible();
  await expect(layout.locator('ellipse')).toHaveCount(3);
  await nav.getByRole('button', { name: 'Attention 引言', exact: true }).click();
  await expect(context).toHaveJSProperty('open', true);
  expect(errors).toEqual([]);
});

for (const width of [320, 390]) {
  test(`advanced pages fit ${width}px and preserve unsubmitted quiz answers`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await openLab(page);
    await page.getByRole('button', { name: '理解自测', exact: true }).click();
    const questions = page.getByTestId('assessment-question');
    const ids = await questions.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-question-id')));
    await questions.first().getByRole('radio').first().check();
    for (const name of ['使用说明', 'Attention 引言', '实验总结', '多头注意力', '三种 Attention']) {
      await page.getByRole('group', { name: '学习模式' }).getByRole('button', { name, exact: true }).click();
      await expect(page.getByRole('radio')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      for (const table of await page.locator('.reading-table-scroll:visible').all()) {
        const dimensions = await table.evaluate((node) => ({ scroll: node.scrollWidth, width: node.clientWidth }));
        expect(dimensions.scroll).toBeGreaterThan(dimensions.width);
        await table.evaluate((node) => { node.scrollLeft = node.scrollWidth; });
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      }
    }
    await page.getByRole('button', { name: '理解自测', exact: true }).click();
    expect(await questions.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-question-id')))).toEqual(ids);
    await expect(questions.first().getByRole('radio').first()).toBeChecked();
    await expect(page.getByRole('button', { name: '提交自测', exact: true })).toBeDisabled();
  });
}
