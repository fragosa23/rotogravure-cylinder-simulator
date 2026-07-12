const { test, expect } = require('@playwright/test');

test('modern simulator loads and exposes all modules and locking systems', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await expect(page.locator('#simulatorFrame')).toBeVisible();

  const frame = page.frameLocator('#simulatorFrame');
  await expect(frame.locator('#menu')).toBeVisible();

  for (const phase of ['assembly', 'machine', 'clog']) {
    await page.locator(`[data-phase="${phase}"]`).first().click();
    await expect(page.locator(`[data-phase="${phase}"]`).first()).toHaveClass(/active/);
  }

  await page.locator('[data-phase="machine"]').first().click();
  await expect(frame.locator('#panel')).toBeVisible();
  await expect(frame.locator('#lockingCards .locking-card')).toHaveCount(5);

  for (let value = 0; value < 5; value += 1) {
    const card = frame.locator(`.locking-card[data-value="${value}"]`);
    await card.click();
    await expect(card).toHaveClass(/active/);
    await expect(frame.locator('#lock')).toHaveValue(String(value));
  }

  const visualInstalled = await page.locator('#simulatorFrame').evaluate((iframe) => {
    const win = iframe.contentWindow;
    return Boolean(win && win.document.getElementById('lockingVisualsScript'));
  });
  expect(visualInstalled).toBe(true);

  await expect(frame.locator('.range-number')).not.toHaveCount(0);
  expect(errors, errors.join('\n')).toEqual([]);
});
