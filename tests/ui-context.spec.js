const { test, expect } = require('@playwright/test');

test('starts in dark mode and toggles to light mode', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#themeToggle')).toHaveAttribute('aria-label', 'Mudar para modo claro');

  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#themeToggle')).toHaveAttribute('aria-label', 'Mudar para modo escuro');
});

test('assembly hides sliders and carries locking choice into Junker', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);

  await page.locator('[data-phase="assembly"]').first().click();
  await expect(page.locator('#dockTitle')).toHaveText('Montagem');
  await expect(page.locator('#controlDock .context-control')).toHaveCount(0);
  await expect(page.locator('#controlDock .dock-lock-options button')).toHaveCount(5);
  await expect(page.locator('#advancedToggle')).toBeHidden();

  const wedge = page.locator('#controlDock .dock-lock-options button[data-value="2"]');
  await wedge.click();
  const assemblyLock = await page.locator('#simulatorFrame').evaluate((iframe) => iframe.contentWindow?.__ROTOSIM_STATE__?.lock);
  expect(assemblyLock).toBe(2);

  await page.locator('[data-phase="machine"]').first().click();
  await expect(page.locator('#dockTitle')).toHaveText('Efeito Junker');
  await expect(page.locator('#controlDock .context-control')).not.toHaveCount(0);
  await expect(page.locator('#controlDock .dock-lock-options button[data-value="2"]')).toHaveClass(/active/);
  await expect(page.locator('#advancedToggle')).toBeVisible();

  await page.locator('#controlDock .dock-lock-options button[data-value="4"]').click();
  const junkerLock = await page.locator('#simulatorFrame').evaluate((iframe) => iframe.contentWindow?.__ROTOSIM_STATE__?.lock);
  expect(junkerLock).toBe(4);
});
