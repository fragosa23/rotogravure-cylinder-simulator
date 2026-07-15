import { loadSimulator } from './simulator-loader.js';
import { installLockingSystemExperience } from './machine/locking-system.js';
import { installNordLockXSeries } from './machine/nordlock-xseries.js';
import { installCameraAndLighting } from './machine/camera-lighting.js';
import { installTrainingExperience } from './training/training-experience.js';
import { installContextualControls } from './ui/contextual-controls.js';
import { installContextualStyle } from './ui/contextual-style.js';
import { installThemeToggle } from './ui/theme-toggle.js';
import { installLabNavigation } from './ui/lab-navigation.js';
import { installMobilePinchZoom } from './ui/mobile-pinch-zoom.js';

const frame = document.getElementById('simulatorFrame');
const loading = document.getElementById('loading');

installThemeToggle();
installContextualStyle();
installLabNavigation();

try {
  const frameLoaded = new Promise((resolve) => {
    frame.addEventListener('load', () => {
      const doc = frame.contentDocument;
      if (doc && !doc.getElementById('lockingVisualsScript')) {
        const marker = doc.createElement('meta');
        marker.id = 'lockingVisualsScript';
        marker.dataset.replacedBy = 'src/machine/locking-system.js';
        doc.head.appendChild(marker);
      }
      resolve();
    }, { once: true });
  });

  const uiReady = import('../modern-ui.js');
  await loadSimulator(frame);
  await frameLoaded;
  await uiReady;
  installLockingSystemExperience(frame.contentDocument);
  installNordLockXSeries(frame.contentDocument);
  installCameraAndLighting(frame.contentDocument);
  installTrainingExperience(frame.contentDocument);
  installContextualControls(frame);
  installMobilePinchZoom(frame.contentDocument);
} catch (error) {
  loading.classList.add('error');
  loading.innerHTML = `<p>Não foi possível iniciar o simulador.</p><small>${error.message}</small>`;
  console.error('Falha no arranque modular do simulador.', error);
}
