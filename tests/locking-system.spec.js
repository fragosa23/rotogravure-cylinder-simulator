const { test, expect } = require('@playwright/test');

test('modular locking visuals replace the previous visual root without reference tape', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  const result = await page.locator('#simulatorFrame').evaluate((iframe) => {
    const root = iframe.contentWindow?.__ROTOSIM_LOCKING_VISUALS__?.root;
    return {
      exists: Boolean(root),
      modular: root?.userData?.modular,
      roots: root?.parent?.children?.filter((child) => child.name === 'locking-system-visuals').length,
      hasReferenceTape: Boolean(root?.getObjectByName('locking-reference-line')),
      demoRunning: root?.userData?.mechanicalDemoRunning
    };
  });
  expect(result.exists).toBe(true);
  expect(result.modular).toBe(true);
  expect(result.roots).toBe(1);
  expect(result.hasReferenceTape).toBe(false);
  expect(result.demoRunning).toBe(true);
});

test('all locking systems expose usable cards and trigger distinct transitions', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('[data-phase="machine"]').first().click();
  const frame = page.frameLocator('#simulatorFrame');

  for (let value = 0; value < 5; value += 1) {
    const card = frame.locator(`.locking-card[data-value="${value}"]`);
    await expect(card).toBeVisible();
    const box = await card.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await card.dispatchEvent('click');
    await expect(frame.locator('#lock')).toHaveValue(String(value));
    await page.waitForTimeout(120);
    const selected = await page.locator('#simulatorFrame').evaluate((iframe) => {
      const root = iframe.contentWindow?.__ROTOSIM_LOCKING_VISUALS__?.root;
      return { lock: root?.userData?.selectedLock, transition: root?.userData?.transition };
    });
    expect(selected.lock).toBe(value);
    expect(selected.transition).toBeGreaterThan(0);
  }
});

test('camera orbit loops until interaction while mechanical demonstration continues', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  const frame = page.frameLocator('#simulatorFrame');
  await frame.locator('.locking-card[data-value="2"]').dispatchEvent('click');
  await page.waitForTimeout(800);

  const before = await page.locator('#simulatorFrame').evaluate((iframe) => {
    const root = iframe.contentWindow?.__ROTOSIM_LOCKING_VISUALS__?.root;
    return {
      orbiting: root?.userData?.orbiting,
      demo: root?.userData?.demoProgress,
      demoRunning: root?.userData?.mechanicalDemoRunning
    };
  });
  expect(before.orbiting).toBe(true);
  expect(before.demoRunning).toBe(true);

  await page.locator('#simulatorFrame').evaluate((iframe) => {
    const api = iframe.contentWindow?.__ROTOSIM_LOCKING_VISUALS__;
    api?.stopOrbit?.();
  });
  await page.waitForTimeout(250);

  const after = await page.locator('#simulatorFrame').evaluate((iframe) => {
    const root = iframe.contentWindow?.__ROTOSIM_LOCKING_VISUALS__?.root;
    return {
      orbiting: root?.userData?.orbiting,
      cameraFree: root?.userData?.cameraFree,
      demo: root?.userData?.demoProgress,
      demoRunning: root?.userData?.mechanicalDemoRunning
    };
  });
  expect(after.orbiting).toBe(false);
  expect(after.cameraFree).toBe(true);
  expect(after.demoRunning).toBe(true);
  expect(after.demo).not.toBe(before.demo);
});

test('locking visual resources can be disposed without leaving the root attached', async ({ page }) => {
  await page.goto('/modern.html');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  const result = await page.locator('#simulatorFrame').evaluate((iframe) => {
    const api = iframe.contentWindow?.__ROTOSIM_LOCKING_VISUALS__;
    const parent = api?.root?.parent;
    api?.dispose();
    return {
      stillAttached: parent?.children?.includes(api?.root),
      rootCount: parent?.children?.filter((child) => child.name === 'locking-system-visuals').length,
      zoomControls: Boolean(iframe.contentDocument?.getElementById('lockingZoomControls'))
    };
  });
  expect(result.stillAttached).toBe(false);
  expect(result.rootCount).toBe(0);
  expect(result.zoomControls).toBe(false);
});
