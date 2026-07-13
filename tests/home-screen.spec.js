const { test, expect } = require('@playwright/test');

test('opens on ObaniA LAB landing screen without an active simulation', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await expect(page.locator('#homeScreen')).toBeVisible();
  await expect(page.locator('.brand strong')).toHaveText('ObaniA LAB');
  await expect(page.locator('#homeScreen h1')).toContainText('laboratório para formação e experiências');
  await expect(page.locator('.phase-nav button.active')).toHaveCount(0);
});

test('choosing a simulation closes the home screen and opens matching controls', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('#homeScreen [data-phase="assembly"]').click();
  await expect(page.locator('body')).not.toHaveClass(/home-active/);
  await expect(page.locator('#dockTitle')).toHaveText('Montagem');
  await expect(page.locator('#controlDock input[type="range"]')).toHaveCount(0);
});

test('camera commands stay collapsed until the camera icon is opened', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('#homeScreen [data-phase="machine"]').click();
  const frame = page.frameLocator('#simulatorFrame');
  const toggle = frame.locator('#lockingZoomControls .camera-toggle');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(frame.locator('#lockingZoomControls .camera-actions')).not.toHaveClass(/open/);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(frame.locator('#lockingZoomControls .camera-actions')).toHaveClass(/open/);
});
