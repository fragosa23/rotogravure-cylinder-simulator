const { test, expect } = require('@playwright/test');

for (const viewport of [
  { name:'desktop', width:1440, height:1000 },
  { name:'mobile', width:390, height:844 }
]) {
  test(`${viewport.name} layout keeps controls reachable`, async ({ page }) => {
    await page.setViewportSize({ width:viewport.width, height:viewport.height });
    await page.goto('/modern.html');
    await expect(page.locator('#loading')).toHaveClass(/hidden/);
    await expect(page.locator('#simulatorFrame')).toBeVisible();
    await expect(page.locator('[data-phase="machine"]').first()).toBeVisible();
    await page.locator('[data-phase="machine"]').first().click();

    const frame = page.frameLocator('#simulatorFrame');
    await expect(frame.locator('#panel')).toBeVisible();
    await expect(frame.locator('#trainingExperience')).toBeVisible();

    const viewportResult = await page.evaluate(() => ({
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth
    }));
    expect(viewportResult.bodyWidth).toBeLessThanOrEqual(viewportResult.viewportWidth + 2);

    const actionButtons = frame.locator('#trainingExperience button');
    const count = await actionButtons.count();
    for (let index = 0; index < count; index += 1) {
      const box = await actionButtons.nth(index).boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
}
