const { test, expect } = require('@playwright/test');

async function openAssembly(page) {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('[data-technology="rotogravure"]').click();
  await page.locator('#homeScreen [data-phase="assembly"]').click();
}

test('focused lighting adds one overhead and two side spotlights', async ({ page }) => {
  await openAssembly(page);
  const lights = await page.locator('#simulatorFrame').evaluate((iframe) => {
    const root = iframe.contentWindow?.__ROTOSIM_CAMERA_LIGHTING__?.lightingRoot;
    return root?.children.map((light) => ({ name: light.name, type: light.type, intensity: light.intensity })) || [];
  });
  expect(lights).toHaveLength(3);
  expect(lights.map((light) => light.name)).toEqual([
    'cylinder-overhead-spot',
    'left-fitting-spot',
    'washer-side-spot'
  ]);
  expect(lights.every((light) => light.type === 'SpotLight' && light.intensity > 1)).toBe(true);
});

test('locking camera uses a slower demonstration orbit', async ({ page }) => {
  await openAssembly(page);
  const frame = page.frameLocator('#simulatorFrame');
  await frame.locator('.locking-card[data-value="2"]').dispatchEvent('click');
  await page.waitForTimeout(800);
  const state = await page.locator('#simulatorFrame').evaluate((iframe) => {
    const root = iframe.contentWindow?.__ROTOSIM_LOCKING_VISUALS__?.root;
    return {
      duration: root?.userData?.orbitDurationMs,
      slowOrbiting: root?.userData?.slowOrbiting
    };
  });
  expect(state.duration).toBe(10500);
  expect(state.slowOrbiting).toBe(true);
});

test('two-finger gesture zooms and visibly pans horizontally and vertically', async ({ page }) => {
  await openAssembly(page);
  const result = await page.locator('#simulatorFrame').evaluate((iframe) => {
    const win = iframe.contentWindow;
    const canvas = iframe.contentDocument.querySelector('#stage canvas, canvas');
    const api = win?.__ROTOSIM_CAMERA_LIGHTING__;
    const root = win?.__ROTOSIM_LOCKING_VISUALS__?.root;
    const before = api.getState();
    const touch = (x, y) => ({ clientX: x, clientY: y, identifier: x * 10 + y, target: canvas });
    const fire = (type, touches) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'touches', { value: touches });
      canvas.dispatchEvent(event);
      return event;
    };

    const start = fire('touchstart', [touch(80, 100), touch(180, 100)]);
    fire('touchmove', [touch(130, 145), touch(260, 145)]);
    const after = api.getState();

    return {
      prevented: start.defaultPrevented,
      before,
      after,
      pinching: root?.userData?.pinching,
      cameraFree: root?.userData?.cameraFree
    };
  });

  const horizontalMovement = Math.hypot(
    result.after.target.x - result.before.target.x,
    result.after.target.z - result.before.target.z
  );
  const verticalMovement = Math.abs(result.after.target.y - result.before.target.y);

  expect(result.prevented).toBe(true);
  expect(result.pinching).toBe(true);
  expect(result.cameraFree).toBe(true);
  expect(result.after.radius).not.toBe(result.before.radius);
  expect(horizontalMovement).toBeGreaterThan(0.1);
  expect(verticalMovement).toBeGreaterThan(0.1);
  expect(result.after.pinchPanning).toBe(true);
  expect(result.after.pinchPanDistance).toBeGreaterThan(0);
});
