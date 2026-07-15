const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
});

test('machine speed is presented in metres per minute and all mechanical controls are available', async ({ page }) => {
  await page.locator('[data-phase="machine"]').first().click();
  await expect(page.locator('[data-control-id="speed"] output')).toContainText('m/min');
  for (const id of ['dKeyIn','dKeyOut','dSlot','dTab','dSeat','dNut','dBal']) {
    await expect(page.locator(`[data-control-id="${id}"]`)).toBeVisible();
  }
  const outer = page.locator('[data-control-id="speed"] input');
  await outer.fill('126');
  const internal = await page.locator('#simulatorFrame').evaluate(iframe => Number(iframe.contentDocument.getElementById('speed').value));
  expect(internal).toBeCloseTo(300, 0);
});

test('locking systems are collapsed and castle pin is replaced by Nord-Lock X-series', async ({ page }) => {
  await page.locator('[data-phase="assembly"]').first().click();
  const accordion = page.locator('.lock-accordion');
  await expect(accordion).toBeVisible();
  await expect(accordion).not.toHaveAttribute('open', '');
  await accordion.locator('summary').click();
  await expect(page.locator('.dock-lock-options button[data-value="4"]')).toContainText('Nord-Lock X-series');
  await page.locator('.dock-lock-options button[data-value="4"]').click();
  const result = await page.locator('#simulatorFrame').evaluate(iframe => {
    const doc = iframe.contentDocument;
    const root = iframe.contentWindow.__ROTOSIM_LOCKING_VISUALS__.root;
    return {
      value: doc.getElementById('lock').value,
      xSeries: Boolean(root.getObjectByName('nordlock-x-series')),
      obsoleteVisible: root.children[3]?.visible
    };
  });
  expect(result.value).toBe('4');
  expect(result.xSeries).toBe(true);
  expect(result.obsoleteVisible).toBe(false);
});

test('clogging module shows a live print sample and speed in metres per minute', async ({ page }) => {
  await page.locator('[data-phase="clog"]').first().click();
  await expect(page.locator('.print-sample canvas')).toBeVisible();
  await expect(page.locator('[data-control-id="cSpeed"] output')).toContainText('m/min');
  const canvasHasPixels = await page.locator('.print-sample canvas').evaluate(canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, Math.min(20, canvas.width), Math.min(20, canvas.height)).data;
    return [...data].some(value => value !== 0);
  });
  expect(canvasHasPixels).toBe(true);
});
