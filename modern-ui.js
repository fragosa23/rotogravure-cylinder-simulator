(() => {
  const frame = document.getElementById('simulatorFrame');
  const loading = document.getElementById('loading');
  const title = document.getElementById('moduleTitle');
  const description = document.getElementById('moduleDescription');
  const toolbarTitle = document.getElementById('toolbarTitle');
  const largeTextButton = document.getElementById('largeText');
  const fullscreenButton = document.getElementById('fullscreen');
  const liveIndicator = document.querySelector('.live-indicator');

  const modules = {
    assembly: {
      title: 'Montagem do cilindro',
      toolbar: 'Sequência de montagem',
      description: 'Segue a montagem do veio, buchas, escatel, sistemas de travamento e rodas. Observa como o desgaste altera o encaixe antes de a máquina arrancar.'
    },
    machine: {
      title: 'Efeito Junker',
      toolbar: 'Vibração e auto-desaperto',
      description: 'Testa defeitos de montagem e desgaste. Compara sistemas de travamento reais e acompanha a vibração, o desaperto e o impacto na produção.'
    },
    clog: {
      title: 'Entupimento dos alvéolos',
      toolbar: 'Tinta, raclete e impressão',
      description: 'Ajusta velocidade, viscosidade, retardador, filtragem e raclete. Repara como as altas-luzes começam a falhar antes das restantes áreas.'
    }
  };

  const lockingSystems = [
    {
      value: 0,
      name: 'Sem travamento',
      short: 'Uma porca, apenas atrito',
      badge: 'Referência',
      mechanism: 'Não existe bloqueio adicional. A porca pode perder pré-carga e caminhar para fora na rosca quando a vibração transversal aumenta.'
    },
    {
      value: 1,
      name: 'Contra-porca',
      short: 'Duas porcas em oposição',
      badge: 'Atrito reforçado',
      mechanism: 'A segunda porca é apertada contra a primeira. Aumenta a resistência por pré-carga e atrito, mas não constitui um bloqueio mecânico positivo.'
    },
    {
      value: 2,
      name: 'Anilhas de cunha',
      short: 'Par de anilhas com rampas',
      badge: 'Cunha',
      mechanism: 'As rampas entre as duas anilhas fazem o conjunto tentar aumentar a tensão quando a porca roda no sentido de desaperto.'
    },
    {
      value: 3,
      name: 'Anilha de patilha',
      short: 'Patilha dobrada na porca',
      badge: 'Bloqueio mecânico',
      mechanism: 'A patilha dobra sobre uma face da porca e limita fisicamente a rotação. A animação mostra a patilha apoiada no sextavado.'
    },
    {
      value: 4,
      name: 'Porca castelo + cavilha',
      short: 'Pino transversal no veio',
      badge: 'Travamento positivo',
      mechanism: 'A cavilha atravessa a porca castelo e o veio. A porca pode vibrar, mas não consegue avançar ao longo da rosca.'
    }
  ];

  function setActivePhase(phase) {
    const info = modules[phase];
    if (!info) return;

    title.textContent = info.title;
    description.textContent = info.description;
    toolbarTitle.textContent = info.toolbar;

    document.querySelectorAll('[data-phase]').forEach((button) => {
      button.classList.toggle('active', button.dataset.phase === phase);
    });
  }

  function openPhase(phase) {
    const doc = frame.contentDocument;
    if (!doc) return;

    const phaseButton = doc.querySelector(`#menu .menuBtn[data-phase="${phase}"]`);
    if (phaseButton) {
      phaseButton.click();
      setActivePhase(phase);
    }
  }

  function installEmbeddedTheme(doc) {
    if (!doc.getElementById('modernEmbeddedTheme')) {
      const link = doc.createElement('link');
      link.id = 'modernEmbeddedTheme';
      link.rel = 'stylesheet';
      link.href = 'embedded-ui.css';
      doc.head.appendChild(link);
    }

    if (!doc.querySelector('link[href*="fonts.googleapis.com"]')) {
      const font = doc.createElement('link');
      font.rel = 'stylesheet';
      font.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
      doc.head.appendChild(font);
    }
  }

  function installLockingCards(doc) {
    const slider = doc.getElementById('lock');
    if (!slider || doc.getElementById('lockingCards')) return;

    const control = slider.closest('.ctrl');
    if (!control) return;

    slider.classList.add('legacy-lock-slider');

    const cards = doc.createElement('div');
    cards.id = 'lockingCards';
    cards.className = 'locking-cards';
    cards.setAttribute('role', 'radiogroup');
    cards.setAttribute('aria-label', 'Sistema de travamento');

    const summary = doc.createElement('div');
    summary.className = 'locking-summary';

    function updateSelection(value) {
      const selected = lockingSystems.find((system) => system.value === Number(value)) || lockingSystems[0];
      cards.querySelectorAll('.locking-card').forEach((card) => {
        const active = Number(card.dataset.value) === selected.value;
        card.classList.toggle('active', active);
        card.setAttribute('aria-checked', String(active));
      });
      summary.replaceChildren();
      const heading = doc.createElement('b');
      heading.textContent = selected.name;
      const badge = doc.createElement('span');
      badge.className = 'locking-badge';
      badge.textContent = selected.badge;
      const text = doc.createElement('p');
      text.textContent = selected.mechanism;
      summary.append(heading, badge, text);
    }

    lockingSystems.forEach((system) => {
      const card = doc.createElement('button');
      card.type = 'button';
      card.className = 'locking-card';
      card.dataset.value = String(system.value);
      card.setAttribute('role', 'radio');
      card.setAttribute('aria-checked', 'false');

      const icon = doc.createElement('i');
      icon.className = `lock-icon lock-icon-${system.value}`;
      icon.setAttribute('aria-hidden', 'true');
      const name = doc.createElement('strong');
      name.textContent = system.name;
      const short = doc.createElement('small');
      short.textContent = system.short;
      card.append(icon, name, short);

      card.addEventListener('click', () => {
        slider.value = String(system.value);
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
        updateSelection(system.value);
      });
      cards.appendChild(card);
    });

    slider.insertAdjacentElement('afterend', cards);
    cards.insertAdjacentElement('afterend', summary);
    slider.addEventListener('input', () => updateSelection(slider.value));
    updateSelection(slider.value);
  }

  function installNumericRangeInputs(doc) {
    const importantIds = new Set(['speed', 'dia', 'dKeyIn', 'dKeyOut', 'dSlot', 'dTab', 'dSeat', 'dNut', 'dBal', 'cSpeed', 'cVisc', 'cRet', 'cDirt', 'cBlade', 'cAng']);

    importantIds.forEach((id) => {
      const range = doc.getElementById(id);
      if (!range || range.dataset.numericEnhanced) return;
      range.dataset.numericEnhanced = 'true';

      const row = doc.createElement('div');
      row.className = 'range-input-row';
      const number = doc.createElement('input');
      number.type = 'number';
      number.className = 'range-number';
      number.min = range.min;
      number.max = range.max;
      number.step = range.step || '1';
      number.value = range.value;
      number.setAttribute('aria-label', `${range.getAttribute('aria-label') || id} — valor numérico`);

      const syncNumber = () => { number.value = range.value; };
      const syncRange = () => {
        const min = Number(range.min);
        const max = Number(range.max);
        const raw = Number(number.value);
        if (!Number.isFinite(raw)) return;
        range.value = String(Math.min(max, Math.max(min, raw)));
        range.dispatchEvent(new Event('input', { bubbles: true }));
      };

      range.addEventListener('input', syncNumber);
      number.addEventListener('input', syncRange);
      number.addEventListener('change', syncRange);
      range.insertAdjacentElement('afterend', row);
      row.appendChild(number);
    });
  }

  function improveAccessibility(doc) {
    doc.documentElement.lang = 'pt-PT';

    doc.querySelectorAll('input[type="range"]').forEach((input) => {
      if (!input.getAttribute('aria-label')) {
        const label = input.closest('.ctrl')?.querySelector('.name')?.textContent?.trim();
        if (label) input.setAttribute('aria-label', label);
      }
    });

    doc.querySelectorAll('button').forEach((button) => {
      if (!button.type) button.type = 'button';
    });

    const status = doc.getElementById('status');
    if (status) {
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
    }
  }

  function installLockingVisuals(doc) {
    if (doc.getElementById('lockingVisualsScript')) return;

    const script = doc.createElement('script');
    script.id = 'lockingVisualsScript';
    script.textContent = `
      (() => {
        try {
          lockNames[0] = 'sem travamento';
          lockNames[1] = 'contra-porca';
          lockNames[2] = 'anilhas de cunha';
          lockNames[3] = 'anilha de patilha';
          lockNames[4] = 'porca castelo + cavilha';

          lockDescs[0] = 'Uma porca sem bloqueio adicional. A vibração pode reduzir a pré-carga e fazê-la caminhar na rosca.';
          lockDescs[1] = 'Duas porcas apertadas em oposição. Resiste por pré-carga e atrito, mas não é um bloqueio positivo.';
          lockDescs[2] = 'Par de anilhas com rampas. A tentativa de desaperto força a subida das cunhas e aumenta a tensão.';
          lockDescs[3] = 'Patilha dobrada sobre uma face da porca. A rotação fica limitada por contacto mecânico.';
          lockDescs[4] = 'Porca castelo atravessada por cavilha. A porca não consegue avançar ao longo da rosca.';
          lockResist[0] = 0;
          lockResist[1] = 0.55;
          lockResist[2] = 0.82;
          lockResist[3] = 0.94;
          lockResist[4] = 0.995;

          const visualRoot = new THREE.Group();
          visualRoot.name = 'locking-system-visuals';
          nutGroup.add(visualRoot);

          const steel = new THREE.MeshStandardMaterial({ color: 0xb8c4cf, metalness: 0.86, roughness: 0.25 });
          const darkSteel = new THREE.MeshStandardMaterial({ color: 0x48515d, metalness: 0.8, roughness: 0.36 });
          const wedgeMatA = new THREE.MeshStandardMaterial({ color: 0x7198bd, metalness: 0.82, roughness: 0.28 });
          const wedgeMatB = new THREE.MeshStandardMaterial({ color: 0x9bc4e4, metalness: 0.82, roughness: 0.24 });
          const pinMat = new THREE.MeshStandardMaterial({ color: 0xe3b54a, metalness: 0.72, roughness: 0.3 });

          const wedgeGroup = new THREE.Group();
          const wedgeA = new THREE.Mesh(washerGeo(shaftR * 1.48, shaftR * 1.07, 0.13), wedgeMatA);
          const wedgeB = new THREE.Mesh(washerGeo(shaftR * 1.48, shaftR * 1.07, 0.13), wedgeMatB);
          wedgeA.position.x = -0.08;
          wedgeB.position.x = 0.08;
          wedgeA.rotation.x = 0.08;
          wedgeB.rotation.x = -0.08;
          wedgeGroup.add(wedgeA, wedgeB);
          for (let i = 0; i < 8; i++) {
            const a = i / 8 * Math.PI * 2;
            const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.34), i % 2 ? wedgeMatA : wedgeMatB);
            tooth.position.set(0, Math.cos(a) * shaftR * 1.27, Math.sin(a) * shaftR * 1.27);
            tooth.rotation.x = a;
            wedgeGroup.add(tooth);
          }
          visualRoot.add(wedgeGroup);

          const tabGroup = new THREE.Group();
          const tabWasher = new THREE.Mesh(washerGeo(shaftR * 1.62, shaftR * 1.07, 0.16), darkSteel);
          const tab = new THREE.Mesh(new THREE.BoxGeometry(0.16, shaftR * 0.58, shaftR * 0.28), steel);
          tab.position.set(0, shaftR * 1.65, 0);
          tab.rotation.z = -0.58;
          tabGroup.add(tabWasher, tab);
          visualRoot.add(tabGroup);

          const castleGroup = new THREE.Group();
          const castleRing = new THREE.Mesh(washerGeo(shaftR * 1.52, shaftR * 1.07, 0.34), darkSteel);
          castleGroup.add(castleRing);
          for (let i = 0; i < 6; i++) {
            const a = i / 6 * Math.PI * 2;
            const crown = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.24), steel);
            crown.position.set(0.08, Math.cos(a) * shaftR * 1.35, Math.sin(a) * shaftR * 1.35);
            crown.rotation.x = a;
            castleGroup.add(crown);
          }
          const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, shaftR * 3.8, 12), pinMat);
          pin.rotation.x = Math.PI / 2;
          pin.position.x = 0.12;
          castleGroup.add(pin);
          const pinLegA = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, shaftR * 0.9, 10), pinMat);
          const pinLegB = pinLegA.clone();
          pinLegA.rotation.z = 0.55;
          pinLegB.rotation.z = -0.55;
          pinLegA.position.set(0.12, 0, shaftR * 2.05);
          pinLegB.position.set(0.12, 0, shaftR * 2.05);
          castleGroup.add(pinLegA, pinLegB);
          visualRoot.add(castleGroup);

          function syncVisuals() {
            const lock = Number(S.lock);
            nutA.visible = true;
            nutB.visible = lock === 1;
            wedgeGroup.visible = lock === 2;
            tabGroup.visible = lock === 3;
            castleGroup.visible = lock === 4;

            const baseX = nutA.position.x - 0.34;
            wedgeGroup.position.set(baseX, nutA.position.y, nutA.position.z);
            tabGroup.position.set(baseX, nutA.position.y, nutA.position.z);
            castleGroup.position.set(nutA.position.x + 0.02, nutA.position.y, nutA.position.z);

            const loosen = Math.min(1, (S.nut + nutDrift) / 100);
            wedgeA.rotation.x = 0.08 + loosen * 0.08;
            wedgeB.rotation.x = -0.08 - loosen * 0.08;
            tab.rotation.z = -0.58 + loosen * 0.08;
            pinLegA.rotation.z = 0.55 + Math.sin(t * 18) * 0.015 * loosen;
            pinLegB.rotation.z = -0.55 - Math.sin(t * 18) * 0.015 * loosen;

            requestAnimationFrame(syncVisuals);
          }

          syncVisuals();
        } catch (error) {
          console.error('Falha ao instalar os modelos visuais de travamento.', error);
        }
      })();
    `;
    doc.body.appendChild(script);
  }

  function monitorEmbeddedErrors(win) {
    let hasError = false;
    win.addEventListener('error', (event) => {
      hasError = true;
      liveIndicator.classList.add('error');
      liveIndicator.innerHTML = '<i></i> Erro na simulação';
      console.error('Erro no simulador incorporado:', event.error || event.message);
    });
    win.addEventListener('unhandledrejection', (event) => {
      hasError = true;
      liveIndicator.classList.add('error');
      liveIndicator.innerHTML = '<i></i> Erro na simulação';
      console.error('Promessa rejeitada no simulador:', event.reason);
    });
    window.setTimeout(() => {
      if (!hasError) {
        liveIndicator.classList.remove('error');
        liveIndicator.innerHTML = '<i></i> Simulação funcional';
      }
    }, 1200);
  }

  document.querySelectorAll('[data-phase]').forEach((button) => {
    button.addEventListener('click', () => openPhase(button.dataset.phase));
  });

  largeTextButton.addEventListener('click', () => {
    const enabled = document.body.classList.toggle('large-text');
    largeTextButton.setAttribute('aria-pressed', String(enabled));
    const doc = frame.contentDocument;
    if (doc) doc.body.classList.toggle('large-text', enabled);
  });

  fullscreenButton.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn('Não foi possível ativar o modo de ecrã inteiro.', error);
    }
  });

  frame.addEventListener('load', () => {
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    if (!doc || !win) return;

    improveAccessibility(doc);
    installEmbeddedTheme(doc);
    installLockingCards(doc);
    installNumericRangeInputs(doc);
    installLockingVisuals(doc);
    monitorEmbeddedErrors(win);

    doc.getElementById('homeBtn')?.addEventListener('click', () => {
      title.textContent = 'Escolhe um módulo';
      description.textContent = 'Explora a montagem do cilindro, o auto-desaperto causado por vibração e os defeitos ligados à tinta e à raclete.';
      toolbarTitle.textContent = 'Visão geral';
      document.querySelectorAll('[data-phase]').forEach((button) => button.classList.remove('active'));
    });

    loading.classList.add('hidden');
  });
})();