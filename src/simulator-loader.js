import { createSimulatorState, validateSimulatorState } from './core/state.js';
import { createLegacyConfigBridge } from './core/config.js';

const LEGACY_STATE_DECLARATION = 'const S={speed:0,keyIn:0,keyOut:0,slot:0,tab:0,seat:0,nut:0,bal:0,lock:0,dia:420,health:100,failed:false};';
const MODULAR_STATE_DECLARATION = 'const S=window.__ROTOSIM_STATE__;';

const CONFIG_REPLACEMENTS = [
  ['const MAXGAP=2.5;', 'const MAXGAP=window.__ROTOSIM_CONFIG__.maxGapMm;'],
  ["const lockNames=['nenhum','contra-porca','anilha freio','patilha dobrável','cavilha'];", 'const lockNames=window.__ROTOSIM_CONFIG__.lockNames;'],
  ["const lockDescs=['Sem travamento — só aperto por atrito. Vibração desaperta com facilidade.','Segunda porca apertada contra a primeira. Trava por atrito — simples e eficaz.','Anilha de pressão/serrilhada (tipo Nord-Lock). Boa resistência à vibração.','Anilha com patilha dobrada sobre a porca. Travamento mecânico positivo.','Furo + cavilha atravessada. Não depende de atrito — não solta.'];", 'const lockDescs=window.__ROTOSIM_CONFIG__.lockDescriptions;'],
  ['const lockResist=[0,0.55,0.75,0.9,0.98];', 'const lockResist=window.__ROTOSIM_CONFIG__.lockResistance;'],
  ['const WEAR_FREE=33;', 'const WEAR_FREE=window.__ROTOSIM_CONFIG__.wearFreePercent;'],
  ['const SPD_MIN=80, SPD_MAX=140, SPD_POT=300;', 'const SPD_MIN=window.__ROTOSIM_CONFIG__.speedMinMpm, SPD_MAX=window.__ROTOSIM_CONFIG__.speedMaxMpm, SPD_POT=window.__ROTOSIM_CONFIG__.speedPotentialMpm;'],
  ['const REG_TOL=80;', 'const REG_TOL=window.__ROTOSIM_CONFIG__.registrationToleranceUm;'],
  ['const READJ_MIN=10;', 'const READJ_MIN=window.__ROTOSIM_CONFIG__.readjustmentMinutes;'],
  ['const tol=1.1;', 'const tol=window.__ROTOSIM_CONFIG__.healthToleranceMm;']
];

function replaceRequired(source, expected, replacement, label) {
  if (!source.includes(expected)) {
    throw new Error(`Não foi possível ligar a configuração modular: ${label}.`);
  }
  return source.replace(expected, replacement);
}

export async function loadSimulator(frame) {
  const response = await fetch('index.html', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Não foi possível carregar index.html (${response.status})`);

  const state = createSimulatorState();
  const config = createLegacyConfigBridge();
  const validationErrors = validateSimulatorState(state);
  if (validationErrors.length) {
    throw new Error(`Estado inicial inválido: ${validationErrors.join(' ')}`);
  }

  let html = await response.text();
  html = replaceRequired(html, LEGACY_STATE_DECLARATION, MODULAR_STATE_DECLARATION, 'estado global');

  for (const [expected, replacement] of CONFIG_REPLACEMENTS) {
    html = replaceRequired(html, expected, replacement, expected.slice(0, 48));
  }

  html = html.replace(
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js'
  );
  html = html.replace(
    '<head>',
    `<head><base href="./"><script>window.__ROTOSIM_STATE__=${JSON.stringify(state)};window.__ROTOSIM_CONFIG__=${JSON.stringify(config)};<\/script>`
  );

  frame.srcdoc = html;
}
