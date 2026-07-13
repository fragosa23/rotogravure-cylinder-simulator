export function calculateJunkerState(state, nutDrift = 0, config) {
  const sp = state.speed / config.maxReferenceRpm;
  const diaF = (state.dia - 300) / 500;
  const massF = (0.4 + Math.pow(state.dia / 420, 2)) / 1.4;
  const keyAvg = (state.keyIn + state.keyOut) / 2;
  const keyTilt = Math.abs(state.keyIn - state.keyOut);
  const eKey = (keyAvg / 100) * (0.9 + 0.6 * sp) + (keyTilt / 100) * (0.35 + 0.45 * sp);
  const eSlot = (((state.slot + state.tab) / 2) / 100) * (0.3 + 1.4 * sp * sp);
  const eSeat = (state.seat / 100) * (0.8 + 0.7 * sp);
  const nutEff = Math.min(100, state.nut + nutDrift);
  const eNut = (nutEff / 100) * (0.5 + 2.2 * sp);
  const eBal = (state.bal / 100) * (0.2 + 2.4 * sp * sp) * (0.7 + 0.8 * diaF);
  const ecc = eKey + eSlot + eSeat + eNut + eBal;
  const vib = Math.min(100, ecc * 22 * massF + sp * 8);
  return { ecc, vib, sp, nutEff, massF };
}

export function calculateLooseningRate(state, result, lockResistance) {
  if (result.sp <= 0.05 || state.failed) return 0;
  const play = (((state.slot + state.tab) / 2) / 100) * 0.8
    + ((state.keyIn + state.keyOut) / 2 / 100) * 0.5
    + (Math.abs(state.keyIn - state.keyOut) / 100) * 0.6
    + (state.seat / 100) * 0.3;
  const ramp = 0.12 + 0.88 * (result.nutEff / 100);
  const loosen = ((result.vib / 100) * 3.2 + play * result.sp * 2.6 * result.massF) * ramp;
  return Math.max(0, (1 - lockResistance) * loosen);
}

export function calculateHealthDamageRate(result, toleranceMm) {
  if (result.ecc <= toleranceMm || result.sp <= 0.05) return 0;
  return (result.ecc - toleranceMm) * result.sp * 38 * result.massF;
}
