(() => {
  const frame = document.getElementById('simulatorFrame');
  const loading = document.getElementById('loading');
  const title = document.getElementById('moduleTitle');
  const description = document.getElementById('moduleDescription');
  const toolbarTitle = document.getElementById('toolbarTitle');
  const largeTextButton = document.getElementById('largeText');
  const fullscreenButton = document.getElementById('fullscreen');

  const modules = {
    assembly: {
      title: 'Montagem do cilindro',
      toolbar: 'Sequência de montagem',
      description: 'Segue a montagem do veio, buchas, escatel, anilhas e rodas. Observa como o desgaste altera o encaixe antes de a máquina arrancar.'
    },
    machine: {
      title: 'Efeito Junker',
      toolbar: 'Vibração e auto-desaperto',
      description: 'Testa defeitos de montagem e desgaste. Compara os sistemas de travamento e acompanha a vibração, o desaperto e o impacto na produção.'
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
      short: 'Apenas aperto por atrito',
      mechanism: 'Sem bloqueio adicional. É a referência para observar o auto-desaperto.'
    },
    {
      value: 1,
      name: 'Contra-porca',
      short: 'Duas porcas em oposição',
      mechanism: 'A segunda porca aumenta a resistência por pré-carga e atrito entre as roscas.'
    },
    {
      value: 2,
      name: 'Anilha de freio',
      short: 'Travamento por atrito',
      mechanism: 'A anilha acrescenta resistência ao movimento, mas continua dependente do contacto e da pré-carga.'
    },
    {
      value: 3,
      name: 'Patilha dobrável',
      short: 'Bloqueio mecânico',
      mechanism: 'A patilha dobrada encosta à face da porca e limita fisicamente a rotação.'
    },
    {
      value: 4,
      name: 'Cavilha',
      short: 'Travamento positivo',
      mechanism: 'A cavilha atravessa o conjunto e impede a porca de avançar, independentemente do atrito.'
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

    const cards = doc.createElement('div');
    cards.id = 'lockingCards';
    cards.className = 'locking-cards';

    const summary = doc.createElement('div');
    summary.className = 'locking-summary';

    function updateSelection(value) {
      const selected = lockingSystems.find((system) => system.value === Number(value)) || lockingSystems[0];
      cards.querySelectorAll('.locking-card').forEach((card) => {
        card.classList.toggle('active', Number(card.dataset.value) === selected.value);
      });
      summary.innerHTML = `<b>${selected.name}</b><br>${selected.mechanism}`;
    }

    lockingSystems.forEach((system) => {
      const card = doc.createElement('button');
      card.type = 'button';
      card.className = 'locking-card';
      card.dataset.value = String(system.value);
      card.innerHTML = `<i aria-hidden="true"></i><strong>${system.name}</strong><small>${system.short}</small>`;
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

  function improveAccessibility(doc) {
    doc.documentElement.lang = 'pt-PT';

    doc.querySelectorAll('input[type="range"]').forEach((input) => {
      if (!input.getAttribute('aria-label')) {
        const label = input.closest('.ctrl')?.querySelector('.name')?.textContent?.trim();
        if (label) input.setAttribute('aria-label', label);
      }
    });

    const status = doc.getElementById('status');
    if (status) {
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
    }
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
    if (!doc) return;

    installEmbeddedTheme(doc);
    installLockingCards(doc);
    improveAccessibility(doc);

    doc.getElementById('homeBtn')?.addEventListener('click', () => setActivePhase(null));
    loading.classList.add('hidden');
  });
})();
