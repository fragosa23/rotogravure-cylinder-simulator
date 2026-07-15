export function createProductionAccumulator() {
  return {
    metersLost: 0,
    scrapMeters: 0,
    capacityLostMeters: 0,
    minLost: 0,
    events: 0,
    lastNutOk: true,
    prodMeters: 0
  };
}

export function calculateProductionSnapshot(state, nutDrift, speedFactor, vibration, jobTolerance, config) {
  const wearFreePercent = config.wearFreePercent;
  const registrationToleranceUm = config.registrationToleranceUm;
  const toleranceMultiplier = Math.max(0.01, Number(jobTolerance) || 1);
  const sp = Math.max(0, Number(speedFactor) || 0);
  const vib = Math.max(0, Math.min(100, Number(vibration) || 0));

  const wearSlot = state.slot / 100;
  const wearSeat = state.seat / 100;
  const bearingPlay = state.bal / 100;
  const nutEffectivePercent = Math.max(0, Math.min(100, state.nut + nutDrift));
  const nutEffective = nutEffectivePercent / 100;
  const keyOperator = ((state.keyIn + state.keyOut) / 2) / 100;

  const overSlot = Math.max(0, (state.slot - wearFreePercent) / (100 - wearFreePercent));
  const overSeat = Math.max(0, (state.seat - wearFreePercent) / (100 - wearFreePercent));
  const wearExcess = (overSlot + overSeat) / 2;
  const wearPresent = (wearSlot + wearSeat) / 2;
  const maintenanceBlame = Math.max(bearingPlay, wearExcess);
  const operatorBlame = (keyOperator + nutEffective) / 2;

  const instability = Math.min(1, vib / 100);
  const currentSpeedMpm = state.speed > 0
    ? Math.round(config.speedMaxMpm - (config.speedMaxMpm - config.speedMinMpm) * instability)
    : 0;

  const eccentricityIndex = wearPresent * 0.8 + maintenanceBlame * 0.9 + operatorBlame * 0.9 + nutEffective * 0.6;
  const registrationErrorUm = Math.max(0, Math.round(eccentricityIndex * 140 * (0.4 + 0.6 * sp)));
  const effectiveRegistrationErrorUm = registrationErrorUm / toleranceMultiplier;

  const splashPercent = Math.max(0, Math.min(100, Math.round(
    (operatorBlame * 0.5 + wearPresent * 0.4 + nutEffective * 0.5) * 100 * (0.5 + 0.5 * sp)
  )));

  const scrapPercent = Math.max(0, Math.min(100, Math.round(
    (Math.max(0, effectiveRegistrationErrorUm - registrationToleranceUm) / registrationToleranceUm * 40)
      + splashPercent * 0.8 / toleranceMultiplier
  )));

  const rejected = effectiveRegistrationErrorUm > registrationToleranceUm
    || splashPercent / toleranceMultiplier > 25;

  const correctiveWear = wearPresent <= wearFreePercent / 100
    ? 0
    : wearPresent - wearFreePercent / 100;
  const blameTotal = correctiveWear + maintenanceBlame + operatorBlame;

  let blame = { wear: 0, maintenance: 0, operator: 0 };
  if (blameTotal > 0) {
    const wearPercent = Math.round(correctiveWear / blameTotal * 100);
    const maintenancePercent = Math.round(maintenanceBlame / blameTotal * 100);
    blame = {
      wear: wearPercent,
      maintenance: maintenancePercent,
      operator: Math.max(0, 100 - wearPercent - maintenancePercent)
    };
  }

  return {
    currentSpeedMpm,
    potentialSpeedMpm: config.speedPotentialMpm,
    instability,
    registrationErrorUm,
    effectiveRegistrationErrorUm,
    splashPercent,
    scrapPercent,
    rejected,
    nutEffectivePercent,
    wearPresent,
    correctiveWear,
    maintenanceBlame,
    operatorBlame,
    blame
  };
}

export function advanceProductionAccumulator(accumulator, state, snapshot, deltaTime, config) {
  const next = {
    metersLost: 0,
    scrapMeters: 0,
    capacityLostMeters: 0,
    minLost: 0,
    events: 0,
    lastNutOk: true,
    prodMeters: 0,
    ...accumulator
  };
  const dt = Math.max(0, Number(deltaTime) || 0);

  if (state.speed > 0 && !state.failed) {
    const metersThisFrame = snapshot.currentSpeedMpm / 60 * dt;
    const scrapThisFrame = metersThisFrame * (snapshot.scrapPercent / 100);
    next.prodMeters += metersThisFrame;
    next.scrapMeters += scrapThisFrame;

    const nutNowLoose = snapshot.nutEffectivePercent > 55;
    if (nutNowLoose && next.lastNutOk) {
      next.events += 1;
      next.minLost += config.readjustmentMinutes;
      next.capacityLostMeters += snapshot.currentSpeedMpm * config.readjustmentMinutes;
      next.lastNutOk = false;
    }

    if (snapshot.nutEffectivePercent < 40) next.lastNutOk = true;
  }

  next.scrapMeters = Math.max(0, next.scrapMeters);
  next.capacityLostMeters = Math.max(0, next.capacityLostMeters);
  next.metersLost = next.scrapMeters + next.capacityLostMeters;
  next.minLost = Math.max(0, next.minLost);
  next.events = Math.max(0, Math.round(next.events));
  next.prodMeters = Math.max(0, next.prodMeters);
  return next;
}

export function buildProductionVerdict(state, nutDrift, snapshot, accumulator, config) {
  const anyDefect = (state.slot + state.seat + state.bal + state.keyIn + state.keyOut + state.nut) > 2 || nutDrift > 2;

  if (state.speed === 0) {
    return 'Dá rotação para simular uma tiragem e ver o impacto em metros e tempo.';
  }

  if (!anyDefect) {
    return 'Peças em bom estado e montagem limpa: registo dentro de tolerância, sem refugo. <b>É este o cenário que a manutenção preventiva mantém.</b>';
  }

  const main = Math.max(snapshot.correctiveWear, snapshot.maintenanceBlame, snapshot.operatorBlame);
  let verdict;

  if (main === snapshot.operatorBlame && snapshot.operatorBlame > 0) {
    verdict = 'Perdas dominadas pelo <b style="color:#ffb13f">operador</b> (chaveta/anilhas).';
  } else if (main === snapshot.maintenanceBlame && snapshot.maintenanceBlame > 0) {
    verdict = 'Perdas dominadas pela <b style="color:#4cc2ff">manutenção</b> (rolamentos / desgaste não tratado).';
  } else {
    verdict = 'Perdas dominadas pelo <b style="color:#8a97a6">desgaste</b> do material.';
  }

  if (snapshot.rejected) {
    verdict += ' <br><b style="color:#ff5252">Cliente rejeita o lote</b> — registo/manchas fora de tolerância.';
  }
  if (accumulator.events > 0) {
    verdict += ` <br>Cada desaperto de anilhas custou ~${config.readjustmentMinutes} min de reafinação.`;
  }
  if (snapshot.operatorBlame < 0.2 && (snapshot.maintenanceBlame > 0.5 || snapshot.correctiveWear > 0.4)) {
    verdict += ' <br><i>Mesmo com boa montagem, o desgaste sozinho já gera refugo — só manutenção resolve.</i>';
  }

  return verdict;
}
