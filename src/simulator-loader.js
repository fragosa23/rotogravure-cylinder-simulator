import { createSimulatorState, validateSimulatorState } from './core/state.js';
import { createLegacyConfigBridge } from './core/config.js';
import { calculateJunkerState, calculateLooseningRate, calculateHealthDamageRate } from './simulations/junker-model.js';
import {
  createProductionAccumulator,
  calculateProductionSnapshot,
  advanceProductionAccumulator,
  buildProductionVerdict
} from './simulations/production-model.js';

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
  if (!source.includes(expected)) throw new Error(`Não foi possível ligar o módulo: ${label}.`);
  return source.replace(expected, replacement);
}

function connectJunkerModel(source) {
  const instabilityPattern = /function instability\(\)\{[\s\S]*?return \{ecc,vib,sp,nutEff,massF\};\n\}/;
  if (!instabilityPattern.test(source)) throw new Error('Não foi possível extrair a função instability.');
  source = source.replace(instabilityPattern, 'function instability(){return window.__ROTOSIM_JUNKER__.calculateJunkerState(S,nutDrift,window.__ROTOSIM_CONFIG__);}');

  const legacyLoosening = `  if(sp>0.05&&!S.failed){
    const play=(((S.slot+S.tab)/2)/100)*0.8 + ((S.keyIn+S.keyOut)/2/100)*0.5 + (Math.abs(S.keyIn-S.keyOut)/100)*0.6 + (S.seat/100)*0.3;
    // Início: o aperto com força segura (rampa baixa, "ainda aguenta"). À medida que cede perde pré-carga e acelera (rampa->1).
    const ramp=0.12 + 0.88*(nutEff/100);
    const loosen=((vib/100)*3.2 + play*sp*2.6*massF)*ramp;   // cilindro mais pesado -> mais força transversal -> desaperta mais depressa
    nutDrift=Math.min(100,nutDrift+(1-lockResist[S.lock])*loosen*dt);
    if(nutDrift>=100) S.failed=true;   // anilhas largaram -> bucha sai do cilindro -> tudo fica pendurado no veio
  }`;
  const modularLoosening = `  if(sp>0.05&&!S.failed){
    const loosenRate=window.__ROTOSIM_JUNKER__.calculateLooseningRate(S,{ecc,vib,sp,nutEff,massF},lockResist[S.lock]);
    nutDrift=Math.min(100,nutDrift+loosenRate*dt);
    if(nutDrift>=100) S.failed=true;
  }`;
  source = replaceRequired(source, legacyLoosening, modularLoosening, 'desaperto Junker');

  const legacyDamage = '  if(ecc>tol&&sp>0.05&&!S.failed){S.health=Math.max(0,S.health-(ecc-tol)*sp*38*massF*dt); if(S.health<=0){S.health=0;S.failed=true;}}';
  const modularDamage = '  if(!S.failed){const damageRate=window.__ROTOSIM_JUNKER__.calculateHealthDamageRate({ecc,vib,sp,nutEff,massF},tol);S.health=Math.max(0,S.health-damageRate*dt);if(S.health<=0){S.health=0;S.failed=true;}}';
  return replaceRequired(source, legacyDamage, modularDamage, 'dano mecânico Junker');
}

function connectProductionModel(source) {
  source = replaceRequired(
    source,
    'let acc={metersLost:0, minLost:0, events:0, lastNutOk:true, prodMeters:0};',
    'let acc=window.__ROTOSIM_PRODUCTION__.createProductionAccumulator();',
    'acumulador de produção'
  );
  source = replaceRequired(
    source,
    "A.btnZero.addEventListener('click',()=>{acc={metersLost:0,minLost:0,events:0,lastNutOk:true,prodMeters:0};});",
    "A.btnZero.addEventListener('click',()=>{acc=window.__ROTOSIM_PRODUCTION__.createProductionAccumulator();});",
    'reset do acumulador de produção'
  );

  const productionPattern = /function updateAnalysis\(sp, vib, dt\)\{[\s\S]*?\n\}\n\n\/\/ ---- Colour proof/;
  if (!productionPattern.test(source)) throw new Error('Não foi possível extrair updateAnalysis.');

  const replacement = `function updateAnalysis(sp, vib, dt){
  const snapshot=window.__ROTOSIM_PRODUCTION__.calculateProductionSnapshot(S,nutDrift,sp,vib,jobTol(),window.__ROTOSIM_CONFIG__);
  acc=window.__ROTOSIM_PRODUCTION__.advanceProductionAccumulator(acc,S,snapshot,dt,window.__ROTOSIM_CONFIG__);

  A.spdVal.textContent=snapshot.currentSpeedMpm+' / '+snapshot.potentialSpeedMpm+' m/min';
  A.spdBar.style.width=Math.round(snapshot.currentSpeedMpm/snapshot.potentialSpeedMpm*100)+'%';
  A.spdBar.style.background=snapshot.currentSpeedMpm>=120?'#46d39a':snapshot.currentSpeedMpm>=100?'#ffb13f':'#ff5252';
  A.spdNote.textContent=S.speed===0?'Parada.':(snapshot.instability>0.4?'Instabilidade obriga a abrandar — capacidade perdida.':'A produzir perto do máximo possível desta máquina.');

  A.regVal.textContent=snapshot.registrationErrorUm+' µm';
  A.regVal.style.color=snapshot.effectiveRegistrationErrorUm>REG_TOL?'#ff5252':snapshot.effectiveRegistrationErrorUm>REG_TOL*0.6?'#ffb13f':'#cdd8e4';
  A.splVal.textContent=snapshot.splashPercent+' %';
  A.splVal.style.color=snapshot.splashPercent>25?'#ff5252':snapshot.splashPercent>12?'#ffb13f':'#cdd8e4';
  A.scrapVal.textContent=snapshot.scrapPercent+' %';
  A.scrapVal.style.color=snapshot.scrapPercent>20?'#ff5252':snapshot.scrapPercent>8?'#ffb13f':'#cdd8e4';
  A.clientVal.textContent=snapshot.rejected?'REJEITA':'OK';
  A.clientVal.style.color=snapshot.rejected?'#ff5252':'#46d39a';

  A.mLost.textContent=fmtNum(acc.metersLost)+' m';
  A.tLost.textContent=Math.round(acc.minLost)+' min';
  A.nEvents.textContent=acc.events+'×';
  A.bWear.style.width=snapshot.blame.wear+'%';
  A.bMaint.style.width=snapshot.blame.maintenance+'%';
  A.bOper.style.width=snapshot.blame.operator+'%';
  A.pctWear.textContent=snapshot.blame.wear+'%';
  A.pctMaint.textContent=snapshot.blame.maintenance+'%';
  A.pctOper.textContent=snapshot.blame.operator+'%';
  A.verdict.innerHTML=window.__ROTOSIM_PRODUCTION__.buildProductionVerdict(S,nutDrift,snapshot,acc,window.__ROTOSIM_CONFIG__);
  drawRegistration(snapshot.registrationErrorUm,sp,vib);
}

// ---- Colour proof`;

  return source.replace(productionPattern, replacement);
}

export async function loadSimulator(frame) {
  const response = await fetch('index.html', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Não foi possível carregar index.html (${response.status})`);

  const state = createSimulatorState();
  const config = createLegacyConfigBridge();
  const validationErrors = validateSimulatorState(state);
  if (validationErrors.length) throw new Error(`Estado inicial inválido: ${validationErrors.join(' ')}`);

  let html = await response.text();
  html = replaceRequired(html, LEGACY_STATE_DECLARATION, MODULAR_STATE_DECLARATION, 'estado global');
  for (const [expected, replacement] of CONFIG_REPLACEMENTS) html = replaceRequired(html, expected, replacement, expected.slice(0, 48));
  html = connectJunkerModel(html);
  html = connectProductionModel(html);
  html = html.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js');

  const junkerBridge = `{
    calculateJunkerState:${calculateJunkerState.toString()},
    calculateLooseningRate:${calculateLooseningRate.toString()},
    calculateHealthDamageRate:${calculateHealthDamageRate.toString()}
  }`;
  const productionBridge = `{
    createProductionAccumulator:${createProductionAccumulator.toString()},
    calculateProductionSnapshot:${calculateProductionSnapshot.toString()},
    advanceProductionAccumulator:${advanceProductionAccumulator.toString()},
    buildProductionVerdict:${buildProductionVerdict.toString()}
  }`;

  html = html.replace('<head>', `<head><base href="./"><script>window.__ROTOSIM_STATE__=${JSON.stringify(state)};window.__ROTOSIM_CONFIG__=${JSON.stringify(config)};window.__ROTOSIM_JUNKER__=${junkerBridge};window.__ROTOSIM_PRODUCTION__=${productionBridge};<\/script>`);
  frame.srcdoc = html;
}
