const { test, expect } = require('@playwright/test');

test('mobile simulator reserves two-finger gestures for camera zoom', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);

  await page.locator('[data-lab="rotogravure"]').click();
  await page.locator('[data-phase="machine"]').first().click();

  const frame = page.frameLocator('#simulatorFrame');
  const canvas = frame.locator('#stage canvas, canvas').first();
  await expect(canvas).toBeVisible();

  const touchAction = await canvas.evaluate((element) => getComputedStyle(element).touchAction);
  expect(touchAction).toBe('none');

  await expect(frame.locator('#pinchZoomHint')).toContainText('dois dedos');
});
