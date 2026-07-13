const { test, expect } = require('@playwright/test');

const MODEL_URL = '/src/simulations/junker-model.js';
const CONFIG_URL = '/src/core/config.js';

async function loadModel(page) {
  return page.evaluate(async ({ modelUrl, configUrl }) => {
    const model = await import(modelUrl);
    const configModule = await import(configUrl);
    return {
      calculate: (state, drift = 0) => model.calculateJunkerState(state, drift, configModule.createLegacyConfigBridge()),
      loosen: model.calculateLooseningRate,
      damage: model.calculateHealthDamageRate
    };
  }, { modelUrl: MODEL_URL, configUrl: CONFIG_URL });
}

test('Junker model has zero instability for a stopped undamaged assembly', async ({ page }) => {
  await page.goto('/modern.html');
  const result = await page.evaluate(async ({ modelUrl, configUrl }) => {
    const model = await import(modelUrl);
    const config = (await import(configUrl)).createLegacyConfigBridge();
    return model.calculateJunkerState({ speed:0,keyIn:0,keyOut:0,slot:0,tab:0,seat:0,nut:0,bal:0,dia:420,failed:false }, 0, config);
  }, { modelUrl: MODEL_URL, configUrl: CONFIG_URL });
  expect(result.ecc).toBe(0);
  expect(result.vib).toBe(0);
  expect(result.sp).toBe(0);
});

test('wear and speed increase vibration and locking resistance reduces loosening', async ({ page }) => {
  await page.goto('/modern.html');
  const result = await page.evaluate(async ({ modelUrl, configUrl }) => {
    const model = await import(modelUrl);
    const config = (await import(configUrl)).createLegacyConfigBridge();
    const baseState = { speed:300,keyIn:0,keyOut:0,slot:0,tab:0,seat:0,nut:0,bal:0,dia:420,failed:false };
    const wornState = { ...baseState, slot:70, tab:70, keyIn:40, keyOut:40 };
    const base = model.calculateJunkerState(baseState, 0, config);
    const worn = model.calculateJunkerState(wornState, 0, config);
    return {
      baseVibration: base.vib,
      wornVibration: worn.vib,
      noLock: model.calculateLooseningRate(wornState, worn, 0),
      wedgeLock: model.calculateLooseningRate(wornState, worn, 0.82),
      pinLock: model.calculateLooseningRate(wornState, worn, 0.995)
    };
  }, { modelUrl: MODEL_URL, configUrl: CONFIG_URL });
  expect(result.wornVibration).toBeGreaterThan(result.baseVibration);
  expect(result.noLock).toBeGreaterThan(result.wedgeLock);
  expect(result.wedgeLock).toBeGreaterThan(result.pinLock);
});

test('stopped machine cannot loosen and damage rate respects tolerance', async ({ page }) => {
  await page.goto('/modern.html');
  const result = await page.evaluate(async ({ modelUrl, configUrl }) => {
    const model = await import(modelUrl);
    const config = (await import(configUrl)).createLegacyConfigBridge();
    const state = { speed:0,keyIn:100,keyOut:100,slot:100,tab:100,seat:100,nut:50,bal:100,dia:800,failed:false };
    const stopped = model.calculateJunkerState(state, 0, config);
    return {
      loosening: model.calculateLooseningRate(state, stopped, 0),
      damageBelow: model.calculateHealthDamageRate({ ...stopped, ecc: config.healthToleranceMm }, config.healthToleranceMm),
      damageAbove: model.calculateHealthDamageRate({ ...stopped, sp: 0.5, ecc: config.healthToleranceMm + 1 }, config.healthToleranceMm)
    };
  }, { modelUrl: MODEL_URL, configUrl: CONFIG_URL });
  expect(result.loosening).toBe(0);
  expect(result.damageBelow).toBe(0);
  expect(result.damageAbove).toBeGreaterThan(0);
});

test('modern simulator receives the modular Junker bridge', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  const bridge = await page.locator('#simulatorFrame').evaluate((iframe) => {
    const api = iframe.contentWindow?.__ROTOSIM_JUNKER__;
    return api ? Object.keys(api).sort() : [];
  });
  expect(bridge).toEqual(['calculateHealthDamageRate', 'calculateJunkerState', 'calculateLooseningRate']);
});
