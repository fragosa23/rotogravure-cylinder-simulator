const { test, expect } = require('@playwright/test');

async function openAssembly(page) {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('[data-technology="rotogravure"]').click();
  await page.locator('#homeScreen [data-phase="assembly"]').click();
}

async function nextAssemblyStep(page) {
  await page.locator('#simulatorFrame').evaluate((iframe) => {
    iframe.contentDocument.getElementById('asmNext')?.click();
  });
  await page.waitForTimeout(2100);
}

test('both escatéis enter their cylinder grooves to the stop before tightening', async ({ page }) => {
  await openAssembly(page);

  await nextAssemblyStep(page);
  const inner = await page.locator('#simulatorFrame').evaluate((iframe) => ({
    state: iframe.contentWindow.__ROTOSIM_ASSEMBLY_FIT__,
    label: iframe.contentDocument.getElementById('asmLabel')?.textContent
  }));
  expect(inner.label).toContain('ranhura');
  expect(inner.label).toContain('batente');
  expect(inner.state.innerAligned).toBe(true);
  expect(inner.state.innerSeated).toBe(true);
  expect(inner.state.outerSeated).toBe(false);
  expect(inner.state.tighteningStarted).toBe(false);

  await nextAssemblyStep(page);
  const outer = await page.locator('#simulatorFrame').evaluate((iframe) => ({
    state: iframe.contentWindow.__ROTOSIM_ASSEMBLY_FIT__,
    label: iframe.contentDocument.getElementById('asmLabel')?.textContent
  }));
  expect(outer.label).toContain('ranhura');
  expect(outer.label).toContain('batente');
  expect(outer.state.innerSeated).toBe(true);
  expect(outer.state.outerAligned).toBe(true);
  expect(outer.state.outerSeated).toBe(true);
  expect(outer.state.tighteningStarted).toBe(false);

  await nextAssemblyStep(page);
  const tightening = await page.locator('#simulatorFrame').evaluate((iframe) => ({
    state: iframe.contentWindow.__ROTOSIM_ASSEMBLY_FIT__,
    label: iframe.contentDocument.getElementById('asmLabel')?.textContent
  }));
  expect(tightening.label).toContain('Só depois');
  expect(tightening.state.innerSeated).toBe(true);
  expect(tightening.state.outerSeated).toBe(true);
  expect(tightening.state.tighteningAllowed).toBe(true);
  expect(tightening.state.tighteningStarted).toBe(true);
});
