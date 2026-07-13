export const DEFAULT_SIMULATOR_STATE = Object.freeze({
  speed: 0,
  keyIn: 0,
  keyOut: 0,
  slot: 0,
  tab: 0,
  seat: 0,
  nut: 0,
  bal: 0,
  lock: 0,
  dia: 420,
  health: 100,
  failed: false
});

export function createSimulatorState(overrides = {}) {
  return {
    ...DEFAULT_SIMULATOR_STATE,
    ...overrides
  };
}

export function resetSimulatorState(state) {
  if (!state || typeof state !== 'object') {
    throw new TypeError('O estado do simulador tem de ser um objeto.');
  }

  for (const key of Object.keys(state)) {
    if (!(key in DEFAULT_SIMULATOR_STATE)) delete state[key];
  }

  Object.assign(state, DEFAULT_SIMULATOR_STATE);
  return state;
}

export function validateSimulatorState(state) {
  const numericKeys = ['speed', 'keyIn', 'keyOut', 'slot', 'tab', 'seat', 'nut', 'bal', 'lock', 'dia', 'health'];
  const errors = [];

  if (!state || typeof state !== 'object') return ['Estado inexistente ou inválido.'];

  for (const key of numericKeys) {
    if (!Number.isFinite(state[key])) errors.push(`${key} deve ser numérico.`);
  }

  if (typeof state.failed !== 'boolean') errors.push('failed deve ser booleano.');
  if (state.health < 0 || state.health > 100) errors.push('health deve estar entre 0 e 100.');
  if (state.lock < 0 || state.lock > 4) errors.push('lock deve estar entre 0 e 4.');
  if (state.dia < 300 || state.dia > 800) errors.push('dia deve estar entre 300 e 800 mm de desenvolvimento.');

  return errors;
}
