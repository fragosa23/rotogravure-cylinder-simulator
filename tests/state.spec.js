const { test, expect } = require('@playwright/test');

test('simulator state has safe defaults, overrides and reset behaviour', async ({ page }) => {
  await page.goto('/modern.html');

  const result = await page.evaluate(async () => {
    const {
      DEFAULT_SIMULATOR_STATE,
      createSimulatorState,
      resetSimulatorState,
      validateSimulatorState
    } = await import('/src/core/state.js');

    const first = createSimulatorState();
    const second = createSimulatorState({ speed: 120, lock: 3 });
    first.speed = 500;
    second.temporary = true;
    resetSimulatorState(second);

    let typeError = null;
    try {
      resetSimulatorState(null);
    } catch (error) {
      typeError = error.name;
    }

    return {
      defaults: DEFAULT_SIMULATOR_STATE,
      first,
      second,
      validErrors: validateSimulatorState(second),
      invalidErrors: validateSimulatorState({ ...second, health: 140, lock: 8, failed: 'não' }),
      typeError
    };
  });

  expect(result.defaults.health).toBe(100);
  expect(result.defaults.dia).toBe(420);
  expect(result.first.speed).toBe(500);
  expect(result.second.speed).toBe(0);
  expect(result.second.lock).toBe(0);
  expect(result.second.temporary).toBeUndefined();
  expect(result.validErrors).toEqual([]);
  expect(result.invalidErrors).toContain('health deve estar entre 0 e 100.');
  expect(result.invalidErrors).toContain('lock deve estar entre 0 e 4.');
  expect(result.invalidErrors).toContain('failed deve ser booleano.');
  expect(result.typeError).toBe('TypeError');
});
