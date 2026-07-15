export function installMobilePinchZoom(doc) {
  if (!doc || doc.getElementById('mobilePinchZoomSupport')) return;

  const style = doc.createElement('style');
  style.id = 'mobilePinchZoomSupport';
  style.textContent = `
    #stage canvas,
    canvas {
      touch-action: none !important;
      overscroll-behavior: contain;
    }

    #pinchZoomHint {
      position: fixed;
      left: 50%;
      bottom: 14px;
      z-index: 76;
      transform: translateX(-50%);
      max-width: calc(100vw - 32px);
      padding: 7px 11px;
      border: 1px solid rgba(150,175,210,.24);
      border-radius: 999px;
      background: rgba(7,12,21,.72);
      color: rgba(255,255,255,.82);
      backdrop-filter: blur(12px);
      font: 600 11px/1.2 system-ui, sans-serif;
      pointer-events: none;
      opacity: 0;
      animation: pinchHint 4.5s ease forwards;
    }

    @keyframes pinchHint {
      0%, 12% { opacity: 0; transform: translate(-50%, 8px); }
      22%, 72% { opacity: 1; transform: translate(-50%, 0); }
      100% { opacity: 0; transform: translate(-50%, 0); visibility: hidden; }
    }

    @media (pointer: fine) {
      #pinchZoomHint { display: none; }
    }
  `;
  doc.head.appendChild(style);

  const hint = doc.createElement('div');
  hint.id = 'pinchZoomHint';
  hint.setAttribute('role', 'status');
  hint.textContent = 'Usa dois dedos para aproximar ou afastar';
  doc.body.appendChild(hint);

  const canvas = doc.querySelector('#stage canvas, canvas');
  if (canvas) {
    canvas.style.touchAction = 'none';
    canvas.setAttribute('aria-description', 'Arrasta com um dedo para rodar e usa dois dedos para fazer zoom.');
  }
}
