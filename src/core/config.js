export const SIMULATOR_LIMITS = Object.freeze({
  developmentMinMm: 300,
  developmentMaxMm: 800,
  healthMin: 0,
  healthMax: 100,
  lockingSystemMin: 0,
  lockingSystemMax: 4
});

export const MECHANICAL_CONFIG = Object.freeze({
  maxCombinedGapMm: 2.5,
  healthDamageToleranceMm: 1.1,
  maxReferenceRpm: 600,
  wearFreeThresholdPercent: 33
});

export const PRODUCTION_CONFIG = Object.freeze({
  currentSpeedMinMpm: 80,
  currentSpeedMaxMpm: 140,
  potentialSpeedMpm: 300,
  registrationToleranceUm: 80,
  readjustmentMinutes: 10
});

export const LOCKING_SYSTEMS = Object.freeze([
  Object.freeze({ id: 0, key: 'none', name: 'sem travamento', description: 'Uma porca sem bloqueio adicional. A vibração pode reduzir a pré-carga e fazê-la caminhar na rosca.', resistance: 0 }),
  Object.freeze({ id: 1, key: 'double-nut', name: 'contra-porca', description: 'Duas porcas apertadas em oposição. Resiste por pré-carga e atrito, mas não é um bloqueio positivo.', resistance: 0.55 }),
  Object.freeze({ id: 2, key: 'wedge-lock', name: 'anilhas de cunha', description: 'Par de anilhas com rampas. A tentativa de desaperto força a subida das cunhas e aumenta a tensão.', resistance: 0.82 }),
  Object.freeze({ id: 3, key: 'tab-washer', name: 'anilha de patilha', description: 'Patilha dobrada sobre uma face da porca. A rotação fica limitada por contacto mecânico.', resistance: 0.94 }),
  Object.freeze({ id: 4, key: 'castle-pin', name: 'porca castelo + cavilha', description: 'Porca castelo atravessada por cavilha. A porca não consegue avançar ao longo da rosca.', resistance: 0.995 })
]);

export function createLegacyConfigBridge() {
  return {
    maxGapMm: MECHANICAL_CONFIG.maxCombinedGapMm,
    healthToleranceMm: MECHANICAL_CONFIG.healthDamageToleranceMm,
    maxReferenceRpm: MECHANICAL_CONFIG.maxReferenceRpm,
    wearFreePercent: MECHANICAL_CONFIG.wearFreeThresholdPercent,
    speedMinMpm: PRODUCTION_CONFIG.currentSpeedMinMpm,
    speedMaxMpm: PRODUCTION_CONFIG.currentSpeedMaxMpm,
    speedPotentialMpm: PRODUCTION_CONFIG.potentialSpeedMpm,
    registrationToleranceUm: PRODUCTION_CONFIG.registrationToleranceUm,
    readjustmentMinutes: PRODUCTION_CONFIG.readjustmentMinutes,
    lockNames: LOCKING_SYSTEMS.map((system) => system.name),
    lockDescriptions: LOCKING_SYSTEMS.map((system) => system.description),
    lockResistance: LOCKING_SYSTEMS.map((system) => system.resistance)
  };
}
