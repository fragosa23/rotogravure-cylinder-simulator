import { loadSimulator } from './simulator-loader.js';
import { installLockingSystemExperience } from './machine/locking-system.js';

const frame = document.getElementById('simulatorFrame');
const loading = document.getElementById('loading');

try {
  const frameLoaded = new Promise((resolve) => frame.addEventListener('load', resolve, { once: true }));
  const uiReady = import('../modern-ui.js');
  await loadSimulator(frame);
  await frameLoaded;
  await uiReady;
  installLockingSystemExperience(frame.contentDocument);
} catch (error) {
  loading.classList.add('error');
  loading.innerHTML = `<p>Não foi possível iniciar o simulador.</p><small>${error.message}</small>`;
  console.error('Falha no arranque modular do simulador.', error);
}
