const { test, expect } = require('@playwright/test');

test('training experience exposes scenarios, modes and diagnostics', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  const frame = page.frameLocator('#simulatorFrame');
  await expect(frame.locator('#trainingExperience')).toBeVisible();
  await expect(frame.locator('#trainingScenario option')).toHaveCount(9);

  await frame.locator('[data-training-mode="operator"]').dispatchEvent('click');
  await expect(frame.locator('#trainingExperience')).toHaveAttribute('data-mode', 'operator');
  await frame.locator('[data-training-mode="trainer"]').dispatchEvent('click');
  await expect(frame.locator('#trainingExperience')).toHaveAttribute('data-mode', 'trainer');

  await frame.locator('#trainingSymptom').selectOption('véu');
  await expect(frame.locator('#trainingGuidance')).toContainText('raclete');
});

test('assembly and ink scenarios update the real controls', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  const frame = page.frameLocator('#simulatorFrame');

  await frame.locator('#trainingScenario').selectOption('worn-slot');
  await expect(frame.locator('#dSlot')).toHaveValue('80');
  await expect(frame.locator('#dTab')).toHaveValue('75');
  await expect(frame.locator('#lock')).toHaveValue('0');

  await frame.locator('#trainingScenario').selectOption('ink-veil');
  await expect(frame.locator('#cBlade')).toHaveValue('0.8');
  await expect(frame.locator('#cAng')).toHaveValue('42');
});

test('hotspots and comparison are available with usable touch targets', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  const frame = page.frameLocator('#simulatorFrame');
  await expect(frame.locator('.part-hotspot')).toHaveCount(3);
  const box = await frame.locator('.part-hotspot').first().boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
  await frame.locator('#compareLocks').dispatchEvent('click');
  await expect(frame.locator('.lock-comparison')).toBeVisible();
});
