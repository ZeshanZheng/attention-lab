import { expect, test } from '@playwright/test';

test('single-head matrix precedes the existing summary and explains Query rows and Key columns', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '实验总结', exact: true }).click();
  const matrix = page.getByRole('table', { name: '点积匹配得分矩阵 · 缩放与 Softmax 之前' });
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
  const before = await page.getByRole('heading', { name: '单头注意力：这张矩阵怎样读？', exact: true }).boundingBox();
  const after = await page.getByRole('heading', { name: '把三个实验串起来：Attention 到底在算什么？', exact: true }).boundingBox();
  expect(before!.y).toBeLessThan(after!.y);
  await expect(page.locator('.concept-summary')).toContainText('输出 x ≈ 0.576×2');
});

test('architecture images load and advanced reading preserves free parameters and selected attention type', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('spinbutton', { name: '词元 A 的 K x', exact: true }).fill('2');
  const nav = page.getByRole('group', { name: '学习模式' });
  await expect(nav.getByRole('button')).toHaveText(['Attention 引言', '自由探索', '小栗子🌰', '实验总结', '引导实验', '理解自测', '多头注意力', '三种 Attention']);
  await nav.getByRole('button', { name: 'Attention 引言', exact: true }).click();
  const introImage = page.locator('.introduction-architecture img');
  await expect(introImage).toBeVisible();
  expect(await introImage.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const introCaption = page.locator('.introduction-architecture');
  await expect(introCaption).toContainText('Q、K、V 来自同一序列');
  await expect(introCaption.locator('svg text')).toHaveText('Q K V');
  await nav.getByRole('button', { name: '多头注意力', exact: true }).click();
  await expect(page.locator('.mode-pill')).toHaveText('多头注意力');
  await expect(page.getByRole('spinbutton')).toHaveCount(0);
  await expect(page.locator('.multi-head-figure img')).toBeVisible();
  expect(await page.locator('.multi-head-figure img').evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.advanced-reading:visible')).toContainText('输出投影 Wₒ');
  await expect(page.locator('.advanced-reading:visible')).toContainText('模型并不会提前规定');
  await nav.getByRole('button', { name: '三种 Attention', exact: true }).click();
  const picker = page.getByRole('group', { name: '选择架构中的注意力位置' });
  const detail = page.getByRole('article', { name: '当前注意力类型' });
  const image = page.locator('.attention-type-layout img');
  await picker.getByRole('button', { name: '2 解码器遮罩自注意力', exact: true }).click();
  await expect(detail).toContainText('当前及更早的输入位置');
  await expect(detail).toContainText('右移一位');
  await expect(image).toHaveAttribute('alt', /红圈标出解码器遮罩自注意力/);
  await picker.getByRole('button', { name: '3 编码器—解码器跨注意力', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(detail).toContainText('Q 来自解码器，K 和 V 来自编码器');
  await expect(image).toHaveAttribute('alt', /红圈标出编码器—解码器跨注意力/);
  await nav.getByRole('button', { name: '自由探索', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: '词元 A 的 K x', exact: true })).toHaveValue('2');
  await nav.getByRole('button', { name: '三种 Attention', exact: true }).click();
  await expect(picker.getByRole('button', { pressed: true })).toHaveText('3编码器—解码器跨注意力');
  expect(errors).toEqual([]);
});

for (const width of [320, 390]) {
  test(`advanced pages fit ${width}px and preserve unsubmitted quiz answers`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: '理解自测', exact: true }).click();
    const questions = page.getByTestId('assessment-question');
    const ids = await questions.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-question-id')));
    await questions.first().getByRole('radio').first().check();
    for (const name of ['Attention 引言', '实验总结', '多头注意力', '三种 Attention']) {
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
