function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

export function calculateDryingRate({ viscosity, retardantPercent, standardViscosity }) {
  const visc = Number(viscosity) || 0;
  const ret = Number(retardantPercent) || 0;
  const standard = Number(standardViscosity) || 13;
  const retardantLack = Math.max(0, 9 - ret) / 9;
  const viscosityExcess = Math.max(0, visc - standard) / 9;
  return (0.12 + 0.88 * retardantLack) * (0.5 + 0.5 * viscosityExcess);
}

export function calculateCloggingSnapshot(input) {
  const rpm = Math.max(0, Number(input.rpm) || 0);
  const speedFactor = rpm / 300;
  const viscosity = Number(input.viscosity) || 0;
  const retardantPercent = Number(input.retardantPercent) || 0;
  const dirtPercent = clamp(input.dirtPercent, 0, 100);
  const bladePressureBar = Math.max(0, Number(input.bladePressureBar) || 0);
  const bladeAngleDeg = Number(input.bladeAngleDeg) || 0;
  const bladeHeightPercent = clamp(input.bladeHeightPercent, 0, 100);
  const oscillationEnabled = Boolean(input.oscillationEnabled);
  const standardViscosity = Number(input.standardViscosity) || 13;
  const currentClogPercent = clamp(input.currentClogPercent, 0, 100);
  const deltaTime = Math.max(0, Number(input.deltaTime) || 0);

  const effectiveBladeAngleDeg = bladeAngleDeg - Math.max(0, bladePressureBar - 2.5) * 6;
  const bladeAngleRad = 0.15 + (bladeHeightPercent / 100) * 0.95;
  const dryingWindowFactor = Math.max(0.15, (Math.PI / 2 - bladeAngleRad) / (Math.PI / 2 - 0.625));
  const dryingRate = calculateDryingRate({ viscosity, retardantPercent, standardViscosity });
  const slowFactor = Math.max(0.12, 1.35 - 1.55 * speedFactor);
  const clogRatePerSecond = speedFactor > 0.02
    ? dryingRate * slowFactor * dryingWindowFactor * 1.5 + (dirtPercent / 100) * 0.8
    : 0;
  const nextClogPercent = clamp(currentClogPercent + clogRatePerSecond * deltaTime, 0, 100);

  const mist = !oscillationEnabled && speedFactor > 0.02;
  const veil = bladePressureBar < 1.2 || effectiveBladeAngleDeg < 55 || mist;
  const scratches = bladePressureBar > 3.2 || bladeAngleDeg > 70 || (!oscillationEnabled && dirtPercent > 25);
  const retardantExcess = Math.max(0, retardantPercent - 15);
  const thinning = Math.max(0, (standardViscosity - 1) - viscosity);
  const scrapPercent = clamp(Math.round(
    nextClogPercent * 0.8 + (veil ? 15 : 0) + (scratches ? 20 : 0) + retardantExcess * 0.7 + thinning * 8
  ), 0, 100);

  const severe = nextClogPercent > 45 || scrapPercent > 50;
  const defective = nextClogPercent > 15 || veil || scratches || retardantExcess > 0 || thinning > 0;
  const quality = severe ? 'grave' : defective ? 'com defeitos' : 'perfeita';
  const dryArcOpacity = Math.min(0.85, dryingRate * dryingWindowFactor * (speedFactor > 0.02 ? slowFactor : 0.3) * 1.2);

  return {
    rpm,
    speedFactor,
    dryingRate,
    dryingWindowFactor,
    slowFactor,
    clogRatePerSecond,
    nextClogPercent,
    effectiveBladeAngleDeg,
    mist,
    veil,
    scratches,
    retardantExcess,
    thinning,
    scrapPercent,
    quality,
    dryArcOpacity
  };
}

export function applyStopDrying(currentClogPercent, dryingRate) {
  return clamp((Number(currentClogPercent) || 0) + 5 + Math.max(0, Number(dryingRate) || 0) * 28, 0, 100);
}

export function applyCylinderWash(currentClogPercent) {
  const washed = clamp(currentClogPercent, 0, 100) * 0.08;
  return washed < 2 ? 0 : washed;
}
