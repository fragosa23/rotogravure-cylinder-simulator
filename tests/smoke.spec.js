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

  const revision = await page.locator('#simulatorFrame').evaluate((iframe) => iframe.contentWindow?.THREE?.REVISION);
  expect(revision).toBe('160');

  const initialState = await page.locator('#simulatorFrame').evaluate((iframe) => iframe.contentWindow?.__ROTOSIM_STATE__);
  expect(initialState).toEqual({ speed:0,keyIn:0,keyOut:0,slot:0,tab:0,seat:0,nut:0,bal:0,lock:0,dia:420,health:100,failed:false });

  const stateModuleResult = await page.evaluate(async () => {
    const { createSimulatorState, resetSimulatorState, validateSimulatorState } = await import('/src/core/state.js');
    const state = createSimulatorState({ speed: 120, lock: 3 });
    const beforeReset = { ...state };
    resetSimulatorState(state);
    return { beforeReset, afterReset: state, errors: validateSimulatorState(state), invalidErrors: validateSimulatorState({ ...state, health: 140, lock: 8 }) };
  });

  expect(stateModuleResult.beforeReset.speed).toBe(120);
  expect(stateModuleResult.beforeReset.lock).toBe(3);
  expect(stateModuleResult.afterReset.speed).toBe(0);
  expect(stateModuleResult.afterReset.health).toBe(100);
  expect(stateModuleResult.errors).toEqual([]);
  expect(stateModuleResult.invalidErrors).toContain('health deve estar entre 0 e 100.');
  expect(stateModuleResult.invalidErrors).toContain('lock deve estar entre 0 e 4.');

  for (const phase of ['assembly', 'machine', 'clog']) {
    await page.locator(`[data-phase="${phase}"]`).first().click();
    await expect(page.locator(`[data-phase="${phase}"]`).first()).toHaveClass(/active/);
  }

  await page.locator('[data-phase="machine"]').first().click();
  await expect(frame.locator('#panel')).toBeVisible();
  await expect(frame.locator('#lockingCards .locking-card')).toHaveCount(5);

  for (let value = 0; value < 5; value += 1) {
    const card = frame.locator(`.locking-card[data-value="${value}"]`);
    await expect(card).toBeVisible();
    const box = await card.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await card.dispatchEvent('click');
    await expect(card).toHaveClass(/active/);
    await expect(frame.locator('#lock')).toHaveValue(String(value));
  }

  const liveState = await page.locator('#simulatorFrame').evaluate((iframe) => iframe.contentWindow?.__ROTOSIM_STATE__);
  expect(liveState.lock).toBe(4);

  const visualInstalled = await page.locator('#simulatorFrame').evaluate((iframe) => {
    const win = iframe.contentWindow;
    return Boolean(win?.__ROTOSIM_LOCKING_VISUALS__?.root);
  });
  expect(visualInstalled).toBe(true);

  await expect(frame.locator('.range-number')).not.toHaveCount(0);
  expect(errors, errors.join('\n')).toEqual([]);
});
