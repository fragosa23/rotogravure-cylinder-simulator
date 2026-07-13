const PHASES = {
  assembly: {
    title: 'Montagem',
    subtitle: 'Monta o conjunto passo a passo e observa onde cada peça encaixa.',
    controls: [
      { id: 'asmSlot', label: 'Desgaste da ranhura', unit: '%', help: 'Mais desgaste permite movimento relativo entre veio, escatel e cilindro.' },
      { id: 'asmTab', label: 'Desgaste do escatel', unit: '%', help: 'Um escatel gasto transmite pior o binário e aumenta a folga transversal.' }
    ]
  },
  machine: {
    title: 'Efeito Junker',
    subtitle: 'Altera uma variável e vê em tempo real como muda a vibração, o desaperto e a qualidade.',
    controls: [
      { id: 'speed', label: 'Rotação', unit: 'rpm', help: 'Mais rotação aumenta a energia da vibração e acelera o desaperto quando existe folga.' },
      { id: 'dSlot', label: 'Desgaste da ranhura', unit: '%', help: 'A ranhura gasta cria movimento transversal e alimenta o efeito Junker.' },
      { id: 'dTab', label: 'Desgaste do escatel', unit: '%', help: 'O escatel gasto reduz o encaixe e aumenta a instabilidade do conjunto.' },
      { id: 'dBal', label: 'Folga nos rolamentos', unit: '%', help: 'A folga permite deslocamento do veio e amplia o erro de registo.' }
    ]
  },
  clog: {
    title: 'Entupimento',
    subtitle: 'Ajusta tinta e raclete. A prova de impressão reage enquanto os alvéolos perdem transferência.',
    controls: [
      { id: 'cSpeed', label: 'Rotação', unit: 'rpm', help: 'Mais velocidade reduz o tempo disponível para a tinta secar entre a raclete e o ponto de impressão.' },
      { id: 'cVisc', label: 'Viscosidade', unit: 's', help: 'Tinta mais viscosa transfere pior e tende a secar mais depressa nos alvéolos pequenos.' },
      { id: 'cRet', label: 'Retardador', unit: '%', help: 'O retardador abranda a evaporação. Em excesso, a tinta pode não secar no filme.' },
      { id: 'cBlade', label: 'Pressão da raclete', unit: 'bar', help: 'Pouca pressão deixa véu; pressão excessiva aumenta desgaste e risco de riscos.' },
      { id: 'cAng', label: 'Ângulo da raclete', unit: '°', help: 'Ângulo baixo favorece hidroplanagem; ângulo excessivo torna a raspagem agressiva.' }
    ]
  }
};

function getFrameDocument(frame) {
  return frame?.contentDocument || null;
}

function formatValue(input, unit) {
  const value = Number(input.value);
  const decimals = String(input.step || '').includes('.') ? 1 : 0;
  return `${Number.isFinite(value) ? value.toFixed(decimals) : input.value} ${unit}`.trim();
}

function syncInput(source, target) {
  target.value = source.value;
  target.dispatchEvent(new Event('input', { bubbles: true }));
  target.dispatchEvent(new Event('change', { bubbles: true }));
}

function createControl(doc, definition, legacyInput, explanation, summary) {
  const wrapper = doc.createElement('label');
  wrapper.className = 'context-control';
  wrapper.dataset.controlId = definition.id;

  const head = doc.createElement('span');
  head.className = 'context-control-head';
  const name = doc.createElement('strong');
  name.textContent = definition.label;
  const value = doc.createElement('output');
  value.textContent = formatValue(legacyInput, definition.unit);
  head.append(name, value);

  const input = doc.createElement('input');
  input.type = 'range';
  input.min = legacyInput.min;
  input.max = legacyInput.max;
  input.step = legacyInput.step || '1';
  input.value = legacyInput.value;
  input.setAttribute('aria-label', definition.label);

  const help = doc.createElement('span');
  help.className = 'context-control-help';
  help.textContent = definition.help;

  const update = () => {
    syncInput(input, legacyInput);
    value.textContent = formatValue(input, definition.unit);
    explanation.textContent = definition.help;
    summary.textContent = `${definition.label}: ${value.textContent}`;
  };
  input.addEventListener('input', update);
  input.addEventListener('change', update);
  legacyInput.addEventListener('input', () => {
    input.value = legacyInput.value;
    value.textContent = formatValue(legacyInput, definition.unit);
  });

  wrapper.append(head, input, help);
  return wrapper;
}

function installLegacyMinimalMode(frameDoc) {
  if (frameDoc.getElementById('minimalLegacyMode')) return;
  const style = frameDoc.createElement('style');
  style.id = 'minimalLegacyMode';
  style.textContent = `
    header,#panel,#clogPanel,#hud,.legend,.tags,#regPanel,#camctl,#asmDiaBox,#asmWearBox{display:none!important}
    .wrap{height:100%!important}
    #stage{width:100%!important;min-height:100%!important}
    #status{bottom:18px!important;max-width:min(88vw,720px)!important}
    #asmBar{bottom:18px!important}
    .training-experience,.part-hotspot{display:none!important}
    body{overflow:hidden!important}
  `;
  frameDoc.head.appendChild(style);
}

export function installContextualControls(frame) {
  const host = document.getElementById('controlDock');
  const title = document.getElementById('dockTitle');
  const subtitle = document.getElementById('dockSubtitle');
  const explanation = document.getElementById('causeExplanation');
  const summary = document.getElementById('liveSummary');
  const advancedButton = document.getElementById('advancedToggle');
  const whyButton = document.getElementById('whyButton');
  if (!host || !title || !subtitle || !explanation || !summary) return;

  let currentPhase = 'machine';

  function render(phase) {
    const frameDoc = getFrameDocument(frame);
    const config = PHASES[phase];
    if (!frameDoc || !config) return;
    currentPhase = phase;
    installLegacyMinimalMode(frameDoc);
    host.replaceChildren();
    title.textContent = config.title;
    subtitle.textContent = config.subtitle;
    explanation.textContent = 'Move um controlo para ver a relação causa → efeito.';
    summary.textContent = 'Simulação pronta';

    config.controls.forEach((definition) => {
      const legacyInput = frameDoc.getElementById(definition.id);
      if (legacyInput) host.appendChild(createControl(document, definition, legacyInput, explanation, summary));
    });

    if (phase === 'machine') {
      const lockCards = frameDoc.getElementById('lockingCards');
      if (lockCards) {
        const section = document.createElement('section');
        section.className = 'lock-picker';
        section.innerHTML = '<div class="dock-section-title"><strong>Travamento</strong><span>Escolhe e compara</span></div>';
        const options = document.createElement('div');
        options.className = 'dock-lock-options';
        [...lockCards.querySelectorAll('.locking-card')].forEach((legacyCard) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.dataset.value = legacyCard.dataset.value;
          button.innerHTML = `<strong>${legacyCard.querySelector('strong')?.textContent || ''}</strong><small>${legacyCard.querySelector('small')?.textContent || ''}</small>`;
          button.addEventListener('click', () => {
            legacyCard.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            options.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button));
            explanation.textContent = frameDoc.getElementById('lockDesc')?.textContent || 'Sistema de travamento selecionado.';
            summary.textContent = `Travamento: ${button.querySelector('strong').textContent}`;
          });
          options.appendChild(button);
        });
        section.appendChild(options);
        host.appendChild(section);
      }
    }
  }

  document.querySelectorAll('[data-phase]').forEach((button) => button.addEventListener('click', () => {
    window.setTimeout(() => render(button.dataset.phase), 120);
  }));

  advancedButton?.addEventListener('click', () => {
    const frameDoc = getFrameDocument(frame);
    if (!frameDoc) return;
    const panel = currentPhase === 'clog' ? frameDoc.getElementById('clogPanel') : frameDoc.getElementById('panel');
    if (!panel) return;
    const visible = panel.style.getPropertyValue('display') === 'block';
    panel.style.setProperty('display', visible ? 'none' : 'block', 'important');
    panel.style.setProperty('position', 'absolute', 'important');
    panel.style.setProperty('right', '0', 'important');
    panel.style.setProperty('top', '0', 'important');
    panel.style.setProperty('height', '100%', 'important');
    advancedButton.setAttribute('aria-pressed', String(!visible));
    advancedButton.textContent = visible ? 'Parâmetros avançados' : 'Fechar avançados';
  });

  whyButton?.addEventListener('click', () => {
    const frameDoc = getFrameDocument(frame);
    if (!frameDoc) return;
    const state = frame.contentWindow?.__ROTOSIM_STATE__;
    if (currentPhase === 'machine' && state) {
      const causes = [];
      if (state.speed > 0) causes.push(`a rotação está em ${state.speed} rpm`);
      if (state.slot > 20) causes.push(`a ranhura tem ${state.slot}% de desgaste`);
      if (state.tab > 20) causes.push(`o escatel tem ${state.tab}% de desgaste`);
      if (state.bal > 20) causes.push(`os rolamentos apresentam ${state.bal}% de folga`);
      explanation.textContent = causes.length ? `O estado atual resulta porque ${causes.join(', ')}. Estas causas somam movimento transversal, reduzem a pré-carga e aceleram o desaperto.` : 'O conjunto está próximo da condição de referência, sem causas mecânicas relevantes.';
    } else if (currentPhase === 'clog') {
      const values = ['cSpeed','cVisc','cRet','cBlade','cAng'].map((id) => frameDoc.getElementById(id)?.value);
      explanation.textContent = `Neste momento: ${values[0]} rpm, viscosidade ${values[1]} s, retardador ${values[2]}%, pressão ${values[3]} bar e ângulo ${values[4]}°. O entupimento aumenta quando a tinta seca antes da transferência ou a raclete trabalha fora da janela adequada.`;
    } else {
      explanation.textContent = 'A montagem correta elimina folgas antes do arranque. O objetivo é observar onde nasce cada movimento relativo.';
    }
  });

  render('machine');
}
