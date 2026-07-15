const { test, expect } = require('@playwright/test');

async function openRotogravureLessons(page) {
  await page.locator('[data-technology="rotogravure"]').click();
  await expect(page.locator('body')).toHaveClass(/lessons-active/);
  await expect(page.locator('#homeScreen')).toBeVisible();
}

test('opens on ObaniA LAB simulator catalog without an active technology', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await expect(page.locator('body')).toHaveClass(/catalog-active/);
  await expect(page.locator('#catalogScreen')).toBeVisible();
  await expect(page.locator('.brand strong')).toHaveText('ObaniA LAB');
  await expect(page.locator('#catalogScreen h1')).toHaveText('Escolhe o simulador.');
  await expect(page.locator('[data-technology="rotogravure"]')).toContainText('ROTOGRAVURA');
  await expect(page.locator('.phase-nav')).toBeHidden();
  await expect(page.locator('.phase-nav button.active')).toHaveCount(0);
});

test('rotogravure opens its lesson menu before any simulation', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await openRotogravureLessons(page);
  await expect(page.locator('#homeScreen h1')).toHaveText('Escolhe uma lição.');
  await expect(page.locator('#homeScreen [data-phase]')).toHaveCount(3);
  await expect(page.locator('.workspace')).toHaveAttribute('aria-hidden', 'true');
});

test('choosing a lesson opens controls and integrated top navigation', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await openRotogravureLessons(page);
  await page.locator('#homeScreen [data-phase="assembly"]').click();
  await expect(page.locator('body')).toHaveClass(/simulation-active/);
  await expect(page.locator('#dockTitle')).toHaveText('Montagem');
  await expect(page.locator('#controlDock input[type="range"]')).toHaveCount(0);
  await expect(page.locator('#lessonTopNavigation')).toBeVisible();
  await expect(page.locator('#backToLessons')).toHaveText('← Lições');
  await expect(page.locator('#lessonProgress')).toHaveText('Lição 1 de 3');
});

test('brand returns from lessons or a simulation to the simulator catalog', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await openRotogravureLessons(page);
  await page.locator('#brandHome').click();
  await expect(page.locator('body')).toHaveClass(/catalog-active/);
  await expect(page.locator('#catalogScreen')).toBeVisible();

  await openRotogravureLessons(page);
  await page.locator('#homeScreen [data-phase="machine"]').click();
  await page.locator('#brandHome').click();
  await expect(page.locator('body')).toHaveClass(/catalog-active/);
  await expect(page.locator('#lessonTopNavigation')).toBeHidden();
});

test('camera commands stay collapsed until the camera icon is opened', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await openRotogravureLessons(page);
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