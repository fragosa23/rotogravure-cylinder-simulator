const { test, expect } = require('@playwright/test');

const CONFIG_MODULE_URL = '/src/core/config.js';

test('configuration exposes immutable limits and ordered locking systems', async ({ page }) => {
  await page.goto('/modern.html');

  const result = await page.evaluate(async (url) => {
    const module = await import(url);
    return {
      limits: module.SIMULATOR_LIMITS,
      mechanical: module.MECHANICAL_CONFIG,
      production: module.PRODUCTION_CONFIG,
      lockingSystems: module.LOCKING_SYSTEMS,
      bridge: module.createLegacyConfigBridge()
    };
  }, CONFIG_MODULE_URL);

  expect(result.limits.developmentMinMm).toBe(300);
  expect(result.limits.developmentMaxMm).toBe(800);
  expect(result.mechanical.maxCombinedGapMm).toBe(2.5);
  expect(result.mechanical.healthDamageToleranceMm).toBe(1.1);
  expect(result.mechanical.maxReferenceRpm).toBe(600);
  expect(result.production.registrationToleranceUm).toBe(80);
  expect(result.production.readjustmentMinutes).toBe(10);

  expect(result.lockingSystems).toHaveLength(5);
  expect(result.lockingSystems.map((system) => system.id)).toEqual([0, 1, 2, 3, 4]);
  expect(result.lockingSystems.map((system) => system.resistance)).toEqual([0, 0.55, 0.82, 0.94, 0.995]);
  expect(result.bridge.lockNames).toEqual(result.lockingSystems.map((system) => system.name));
  expect(result.bridge.lockResistance).toEqual(result.lockingSystems.map((system) => system.resistance));
  expect(result.bridge.maxReferenceRpm).toBe(result.mechanical.maxReferenceRpm);
});

test('modern simulator receives the modular configuration bridge', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);

  const config = await page.locator('#simulatorFrame').evaluate((iframe) => iframe.contentWindow?.__ROTOSIM_CONFIG__);

  expect(config.maxGapMm).toBe(2.5);
  expect(config.healthToleranceMm).toBe(1.1);
  expect(config.maxReferenceRpm).toBe(600);
  expect(config.speedMinMpm).toBe(80);
  expect(config.speedMaxMpm).toBe(140);
  expect(config.speedPotentialMpm).toBe(300);
  expect(config.registrationToleranceUm).toBe(80);
  expect(config.readjustmentMinutes).toBe(10);
  expect(config.lockNames[2]).toBe('anilhas de cunha');
  expect(config.lockResistance[4]).toBe(0.995);
});
