const ASSEMBLY_SCENARIOS = [
  { id:'clean', name:'Montagem correta', values:{speed:240,dKeyIn:0,dKeyOut:0,dSlot:0,dTab:0,dSeat:0,dNut:0,dBal:0,lock:2} },
  { id:'key-motor', name:'Chaveta mal assente · motor', values:{speed:220,dKeyIn:75,dKeyOut:5,dSlot:10,dTab:10,dSeat:0,dNut:0,dBal:0,lock:1} },
  { id:'worn-slot', name:'Escatel e ranhura gastos', values:{speed:260,dKeyIn:0,dKeyOut:0,dSlot:80,dTab:75,dSeat:20,dNut:0,dBal:10,lock:0} },
  { id:'bearing-play', name:'Folga nos rolamentos', values:{speed:300,dKeyIn:0,dKeyOut:0,dSlot:10,dTab:10,dSeat:0,dNut:0,dBal:80,lock:2} }
];

const INK_SCENARIOS = [
  { id:'ink-standard', name:'Afinação standard', values:{cSpeed:220,cVisc:13,cRet:9,cDirt:0,cBlade:2,cAng:60,cBladeH:50}, oscillation:true },
  { id:'ink-dry', name:'Secagem nos alvéolos', values:{cSpeed:90,cVisc:20,cRet:1,cDirt:20,cBlade:2,cAng:60,cBladeH:15}, oscillation:true },
  { id:'ink-veil', name:'Véu por raclete', values:{cSpeed:220,cVisc:13,cRet:9,cDirt:10,cBlade:0.8,cAng:42,cBladeH:50}, oscillation:true },
  { id:'ink-scratches', name:'Riscos e partículas', values:{cSpeed:220,cVisc:14,cRet:8,cDirt:70,cBlade:3.8,cAng:75,cBladeH:50}, oscillation:false }
];

const DIAGNOSTICS = [
  { symptoms:['vibração','registo'], result:'Verificar chavetas, escatel/ranhura, assentamento das buchas e folga dos rolamentos.' },
  { symptoms:['desaperto'], result:'Comparar pré-carga, tipo de travamento e folga transversal que alimenta o efeito Junker.' },
  { symptoms:['altas-luzes','densidade'], result:'Verificar viscosidade, retardador, velocidade e paragens com tinta no cilindro.' },
  { symptoms:['véu'], result:'Verificar pressão e ângulo efetivo da raclete e confirmar o vai-vem.' },
  { symptoms:['riscos'], result:'Reduzir pressão/ângulo agressivo, filtrar a tinta e inspecionar o fio da lâmina.' }
];

export function installTrainingExperience(doc) {
  if (!doc || doc.getElementById('trainingExperience')) return;
  const win = doc.defaultView;
  const panel = doc.createElement('section');
  panel.id = 'trainingExperience';
  panel.className = 'training-experience';
  panel.innerHTML = `
    <header><strong>Centro de formação</strong><div><button type="button" data-training-mode="operator">Operador</button><button type="button" data-training-mode="trainer">Formador</button></div></header>
    <div class="training-grid"><label>Cenário técnico<select id="trainingScenario"><option value="">Escolher…</option></select></label><label>Diagnóstico<select id="trainingSymptom"><option value="">Sintoma…</option>${DIAGNOSTICS.map((d)=>`<option value="${d.symptoms[0]}">${d.symptoms.join(' / ')}</option>`).join('')}</select></label></div>
    <p id="trainingGuidance">Seleciona um cenário ou um sintoma.</p>
    <div class="training-actions"><button type="button" id="compareLocks">Comparar travamentos</button><button type="button" id="closeTraining">Fechar</button></div>`;
  doc.body.appendChild(panel);

  const style = doc.createElement('style');
  style.textContent = `.training-experience{position:fixed;left:18px;bottom:18px;z-index:80;width:min(390px,calc(100vw - 36px));padding:14px;border:1px solid rgba(125,160,210,.28);border-radius:16px;background:rgba(8,14,27,.94);box-shadow:0 16px 50px rgba(0,0,0,.35);font:13px Inter,sans-serif;color:#dce7f4}.training-experience header,.training-actions{display:flex;align-items:center;justify-content:space-between;gap:10px}.training-experience button,.training-experience select{min-height:44px;border:1px solid rgba(125,160,210,.28);border-radius:10px;background:#121d31;color:#eaf2ff;padding:8px}.training-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.training-grid label{display:grid;gap:5px}.training-experience[data-mode="operator"] #trainingGuidance{font-size:15px}.training-experience[data-mode="trainer"]{width:min(480px,calc(100vw - 36px))}.training-experience.hidden{display:none}.part-hotspot{position:fixed;z-index:70;min-width:44px;min-height:44px;border-radius:50%;border:1px solid #78b8ff;background:#0d2440;color:#fff}.lock-comparison{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.lock-comparison>div{padding:9px;border:1px solid rgba(125,160,210,.25);border-radius:10px}@media(max-width:760px){.training-grid{grid-template-columns:1fr}.training-experience{left:8px;bottom:8px;width:calc(100vw - 16px)}.part-hotspot{display:none}}`;
  doc.head.appendChild(style);

  const scenarios = [...ASSEMBLY_SCENARIOS, ...INK_SCENARIOS];
  const scenarioSelect = panel.querySelector('#trainingScenario');
  const guidance = panel.querySelector('#trainingGuidance');
  scenarios.forEach((scenario) => { const option=doc.createElement('option'); option.value=scenario.id; option.textContent=scenario.name; scenarioSelect.appendChild(option); });

  function setRange(id, value) {
    const input = doc.getElementById(id);
    if (!input) return;
    input.value = String(value);
    input.dispatchEvent(new win.Event('input', { bubbles:true }));
    input.dispatchEvent(new win.Event('change', { bubbles:true }));
  }

  function setCameraFocus(value) {
    const select = doc.getElementById('camFocus');
    if (!select) return;
    select.value = value;
    select.dispatchEvent(new win.Event('change', { bubbles:true }));
  }

  function applyScenario(id) {
    const scenario = scenarios.find((item) => item.id === id);
    if (!scenario) return;
    Object.entries(scenario.values).forEach(([key, value]) => setRange(key, value));
    if ('oscillation' in scenario) {
      const tag = doc.getElementById('cOscTag');
      const isOn = tag?.textContent?.trim() === 'ligado';
      if (isOn !== scenario.oscillation) doc.getElementById('cOsc')?.click();
    }
    guidance.textContent = `${scenario.name} aplicado. Observa os indicadores e a evolução temporal.`;
    panel.dataset.lastScenario = id;
  }

  scenarioSelect.addEventListener('change', () => applyScenario(scenarioSelect.value));
  panel.querySelector('#trainingSymptom').addEventListener('change', (event) => { const item=DIAGNOSTICS.find((diag)=>diag.symptoms.includes(event.target.value)); guidance.textContent=item?.result||'Seleciona um sintoma.'; });
  panel.querySelectorAll('[data-training-mode]').forEach((button)=>button.addEventListener('click',()=>{panel.dataset.mode=button.dataset.trainingMode;guidance.textContent=button.dataset.trainingMode==='operator'?'Modo Operador: foco em ações imediatas e parâmetros.':'Modo Formador: usa cenários para questionar, comparar e explicar causas.';}));
  panel.querySelector('#closeTraining').addEventListener('click',()=>panel.classList.add('hidden'));
  panel.querySelector('#compareLocks').addEventListener('click',()=>{let comparison=panel.querySelector('.lock-comparison');if(comparison){comparison.remove();return;}comparison=doc.createElement('div');comparison.className='lock-comparison';comparison.innerHTML='<div><b>Sem travamento</b><br>Referência: resistência 0%</div><div><b>Cavilha</b><br>Travamento positivo: resistência 99,5%</div>';panel.appendChild(comparison);});

  [{label:'Encaixe interior',focus:'encaixeIn',left:'39%',top:'47%'},{label:'Travamento',focus:'anilhas',left:'57%',top:'49%'},{label:'Roda de apoio',focus:'rodaDir',left:'70%',top:'61%'}].forEach((spot)=>{const button=doc.createElement('button');button.type='button';button.className='part-hotspot';button.textContent='•';button.title=spot.label;button.setAttribute('aria-label',spot.label);button.style.left=spot.left;button.style.top=spot.top;button.addEventListener('click',()=>{setCameraFocus(spot.focus);guidance.textContent=`${spot.label} selecionado.`;});doc.body.appendChild(button);});

  win.__ROTOSIM_TRAINING__ = { applyScenario, scenarios, diagnostics:DIAGNOSTICS, panel, setCameraFocus };
}
