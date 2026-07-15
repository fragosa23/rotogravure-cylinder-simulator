const { test, expect } = require('@playwright/test');

test('embedded simulator navigation updates the outer contextual controls', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);

  const frame = page.frameLocator('#simulatorFrame');
  const cases = [
    { phase: 'assembly', title: 'Montagem', sliders: 0 },
    { phase: 'machine', title: 'Efeito Junker', sliders: 4 },
    { phase: 'clog', title: 'Entupimento', sliders: 5 }
  ];

  for (const item of cases) {
    await frame.locator(`#menu .menuBtn[data-phase="${item.phase}"]`).click();
    await expect(page.locator('#dockTitle')).toHaveText(item.title);
    await expect(page.locator(`[data-phase="${item.phase}"]`).first()).toHaveClass(/active/);
    await expect(page.locator('#controlDock input[type="range"]')).toHaveCount(item.sliders);

    if (item.phase !== 'clog') {
      await frame.locator('#homeBtn').click();
      await expect(frame.locator('#menu')).toBeVisible();
    }
  }
});

test('outer navigation continues to update the embedded simulator', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);

  for (const item of [
    { phase: 'assembly', title: 'Montagem' },
    { phase: 'machine', title: 'Efeito Junker' },
    { phase: 'clog', title: 'Entupimento' }
  ]) {
    await page.locator(`[data-phase="${item.phase}"]`).first().click();
    await expect(page.locator('#dockTitle')).toHaveText(item.title);
  }
});