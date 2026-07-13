const { test, expect } = require('@playwright/test');

const MODEL_URL = '/src/simulations/production-model.js';
const CONFIG_URL = '/src/core/config.js';

const healthyState = {
  speed: 300,
  keyIn: 0,
  keyOut: 0,
  slot: 0,
  tab: 0,
  seat: 0,
  nut: 0,
  bal: 0,
  lock: 0,
  dia: 420,
  health: 100,
  failed: false
};

test('healthy and stopped production stays within valid limits', async ({ page }) => {
  await page.goto('/modern.html');
  const result = await page.evaluate(async ({ modelUrl, configUrl, state }) => {
    const model = await import(modelUrl);
    const config = (await import(configUrl)).createLegacyConfigBridge();
    const stopped = model.calculateProductionSnapshot({ ...state, speed: 0 }, 0, 0, 0, 1, config);
    const healthy = model.calculateProductionSnapshot(state, 0, 0.5, 0, 1, config);
    return { stopped, healthy };
  }, { modelUrl: MODEL_URL, configUrl: CONFIG_URL, state: healthyState });

  expect(result.stopped.currentSpeedMpm).toBe(0);
  expect(result.stopped.scrapPercent).toBe(0);
  expect(result.stopped.rejected).toBe(false);
  expect(result.healthy.scrapPercent).toBeGreaterThanOrEqual(0);
  expect(result.healthy.scrapPercent).toBeLessThanOrEqual(100);
  expect(result.healthy.splashPercent).toBeGreaterThanOrEqual(0);
  expect(result.healthy.splashPercent).toBeLessThanOrEqual(100);
});

test('worse defects increase losses and tolerant jobs reduce effective rejection', async ({ page }) => {
  await page.goto('/modern.html');
  const result = await page.evaluate(async ({ modelUrl, configUrl, state }) => {
    const model = await import(modelUrl);
    const config = (await import(configUrl)).createLegacyConfigBridge();
    const defective = {
      ...state,
      keyIn: 80,
      keyOut: 60,
      slot: 90,
      seat: 85,
      nut: 70,
      bal: 75
    };
    return {
      healthy: model.calculateProductionSnapshot(state, 0, 0.5, 10, 1, config),
      strict: model.calculateProductionSnapshot(defective, 20, 0.8, 90, 1, config),
      tolerant: model.calculateProductionSnapshot(defective, 20, 0.8, 90, 3, config)
    };
  }, { modelUrl: MODEL_URL, configUrl: CONFIG_URL, state: healthyState });

  expect(result.strict.registrationErrorUm).toBeGreaterThan(result.healthy.registrationErrorUm);
  expect(result.strict.scrapPercent).toBeGreaterThan(result.healthy.scrapPercent);
  expect(result.tolerant.effectiveRegistrationErrorUm).toBeLessThan(result.strict.effectiveRegistrationErrorUm);
  expect(result.tolerant.scrapPercent).toBeLessThanOrEqual(result.strict.scrapPercent);
});

test('accumulator counts a loosening event once and rearms below the reset threshold', async ({ page }) => {
  await page.goto('/modern.html');
  const result = await page.evaluate(async ({ modelUrl, configUrl, state }) => {
    const model = await import(modelUrl);
    const config = (await import(configUrl)).createLegacyConfigBridge();
    let acc = model.createProductionAccumulator();
    const loose = model.calculateProductionSnapshot({ ...state, nut: 60 }, 0, 0.5, 40, 1, config);
    const tight = model.calculateProductionSnapshot({ ...state, nut: 0 }, 0, 0.5, 10, 1, config);

    acc = model.advanceProductionAccumulator(acc, state, loose, 1, config);
    const afterFirst = { ...acc };
    acc = model.advanceProductionAccumulator(acc, state, loose, 1, config);
    const afterSecond = { ...acc };
    acc = model.advanceProductionAccumulator(acc, state, tight, 1, config);
    acc = model.advanceProductionAccumulator(acc, state, loose, 1, config);

    return { afterFirst, afterSecond, afterRearm: acc };
  }, { modelUrl: MODEL_URL, configUrl: CONFIG_URL, state: healthyState });

  expect(result.afterFirst.events).toBe(1);
  expect(result.afterSecond.events).toBe(1);
  expect(result.afterRearm.events).toBe(2);
  expect(result.afterRearm.metersLost).toBeGreaterThanOrEqual(0);
  expect(result.afterRearm.minLost).toBeGreaterThanOrEqual(0);
});

test('modern simulator receives the modular production bridge', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);

  const bridge = await page.locator('#simulatorFrame').evaluate((iframe) => {
    const api = iframe.contentWindow?.__ROTOSIM_PRODUCTION__;
    return api ? Object.keys(api).sort() : [];
  });

  expect(bridge).toEqual([
    'advanceProductionAccumulator',
    'buildProductionVerdict',
    'calculateProductionSnapshot',
    'createProductionAccumulator'
  ]);
});
