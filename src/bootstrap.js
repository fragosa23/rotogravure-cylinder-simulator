import { loadSimulator } from './simulator-loader.js';

const frame = document.getElementById('simulatorFrame');
const loading = document.getElementById('loading');

try {
  const uiReady = import('../modern-ui.js');
  await loadSimulator(frame);
  await uiReady;
} catch (error) {
  loading.classList.add('error');
  loading.innerHTML = `<p>Não foi possível iniciar o simulador.</p><small>${error.message}</small>`;
  console.error('Falha no arranque modular do simulador.', error);
}
