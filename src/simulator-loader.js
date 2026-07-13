import { createSimulatorState, validateSimulatorState } from './core/state.js';

const LEGACY_STATE_DECLARATION = 'const S={speed:0,keyIn:0,keyOut:0,slot:0,tab:0,seat:0,nut:0,bal:0,lock:0,dia:420,health:100,failed:false};';
const MODULAR_STATE_DECLARATION = 'const S=window.__ROTOSIM_STATE__;';

export async function loadSimulator(frame) {
  const response = await fetch('index.html', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Não foi possível carregar index.html (${response.status})`);

  const state = createSimulatorState();
  const validationErrors = validateSimulatorState(state);
  if (validationErrors.length) {
    throw new Error(`Estado inicial inválido: ${validationErrors.join(' ')}`);
  }

  let html = await response.text();
  if (!html.includes(LEGACY_STATE_DECLARATION)) {
    throw new Error('A declaração de estado esperada não foi encontrada em index.html.');
  }

  html = html.replace(
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js'
  );
  html = html.replace(LEGACY_STATE_DECLARATION, MODULAR_STATE_DECLARATION);
  html = html.replace(
    '<head>',
    `<head><base href="./"><script>window.__ROTOSIM_STATE__=${JSON.stringify(state)};<\/script>`
  );

  frame.srcdoc = html;
}
