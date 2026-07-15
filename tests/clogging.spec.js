const { test, expect } = require('@playwright/test');

const MODEL_URL = '/src/simulations/clogging-model.js';

async function evaluateModel(page, input) {
  return page.evaluate(async ({ url, input }) => {
    const model = await import(url);
    return model.calculateCloggingSnapshot(input);
  }, { url: MODEL_URL, input });
}

const standard = {
  rpm: 220,
  viscosity: 13,
  retardantPercent: 9,
  dirtPercent: 0,
  bladePressureBar: 2,
  bladeAngleDeg: 60,
  bladeHeightPercent: 50,
  oscillationEnabled: true,
  standardViscosity: 13,
  currentClogPercent: 0,
  deltaTime: 10
};

test('standard settings keep clogging and scrap low', async ({ page }) => {
  await page.goto('/modern.html');
  const result = await evaluateModel(page, standard);
  expect(result.nextClogPercent).toBeGreaterThanOrEqual(0);
  expect(result.nextClogPercent).toBeLessThan(10);
  expect(result.scrapPercent).toBeLessThanOrEqual(10);
  expect(result.veil).toBe(false);
  expect(result.scratches).toBe(false);
});

test('stops, dirt and poor chemistry increase clogging', async ({ page }) => {
  await page.goto('/modern.html');
  const result = await page.evaluate(async ({ url, standard }) => {
    const model = await import(url);
    const good = model.calculateCloggingSnapshot(standard);
    const badInput = {
      ...standard,
      rpm: 80,
      viscosity: 21,
      retardantPercent: 0,
      dirtPercent: 80,
      currentClogPercent: 20
    };
    const bad = model.calculateCloggingSnapshot(badInput);
    const stopped = model.applyStopDrying(20, bad.dryingRate);
    const washed = model.applyCylinderWash(stopped);
    return { good, bad, stopped, washed };
  }, { url: MODEL_URL, standard });

  expect(result.bad.clogRatePerSecond).toBeGreaterThan(result.good.clogRatePerSecond);
  expect(result.stopped).toBeGreaterThan(20);
  expect(result.washed).toBeLessThan(result.stopped);
});

test('blade and oscillation defects produce veil or scratches', async ({ page }) => {
  await page.goto('/modern.html');
  const result = await page.evaluate(async ({ url, standard }) => {
    const model = await import(url);
    return {
      lowPressure: model.calculateCloggingSnapshot({ ...standard, bladePressureBar: 0.8 }),
      highPressure: model.calculateCloggingSnapshot({ ...standard, bladePressureBar: 3.8 }),
      noOscillation: model.calculateCloggingSnapshot({ ...standard, oscillationEnabled: false, dirtPercent: 50 })
    };
  }, { url: MODEL_URL, standard });

  expect(result.lowPressure.veil).toBe(true);
  expect(result.highPressure.scratches).toBe(true);
  expect(result.noOscillation.veil).toBe(true);
  expect(result.noOscillation.scratches).toBe(true);
});

test('clogging values remain bounded and bridge is installed', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  const frame = page.locator('#simulatorFrame');
  const result = await frame.evaluate((iframe) => {
    const api = iframe.contentWindow?.__ROTOSIM_CLOGGING__;
    const snapshot = api?.calculateCloggingSnapshot({
      rpm: 300,
      viscosity: 30,
      retardantPercent: 0,
      dirtPercent: 100,
      bladePressureBar: 5,
      bladeAngleDeg: 80,
      bladeHeightPercent: 0,
      oscillationEnabled: false,
      standardViscosity: 13,
      currentClogPercent: 99,
      deltaTime: 100
    });
    return { keys: api ? Object.keys(api).sort() : [], snapshot };
  });
  expect(result.keys).toEqual(['applyCylinderWash', 'applyStopDrying', 'calculateCloggingSnapshot', 'calculateDryingRate']);
  expect(result.snapshot.nextClogPercent).toBe(100);
  expect(result.snapshot.scrapPercent).toBe(100);
});
