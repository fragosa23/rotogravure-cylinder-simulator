import { createSimulatorState, validateSimulatorState } from './core/state.js';
import { createLegacyConfigBridge } from './core/config.js';
import { calculateJunkerState, calculateLooseningRate, calculateHealthDamageRate } from './simulations/junker-model.js';
import {
  createProductionAccumulator,
  calculateProductionSnapshot,
  advanceProductionAccumulator,
  buildProductionVerdict
} from './simulations/production-model.js';
import {
  calculateDryingRate,
  calculateCloggingSnapshot,
  applyStopDrying,
  applyCylinderWash
} from './simulations/clogging-model.js';

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
  source = replaceRequired(source, 'let acc={metersLost:0, minLost:0, events:0, lastNutOk:true, prodMeters:0};', 'let acc=window.__ROTOSIM_PRODUCTION__.createProductionAccumulator();', 'acumulador de produção');
  source = replaceRequired(source, "A.btnZero.addEventListener('click',()=>{acc={metersLost:0,minLost:0,events:0,lastNutOk:true,prodMeters:0};});", "A.btnZero.addEventListener('click',()=>{acc=window.__ROTOSIM_PRODUCTION__.createProductionAccumulator();});", 'reset do acumulador de produção');

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
  A.bWear.style.width=snapshot.blame.wear+'%'; A.bMaint.style.width=snapshot.blame.maintenance+'%'; A.bOper.style.width=snapshot.blame.operator+'%';
  A.pctWear.textContent=snapshot.blame.wear+'%'; A.pctMaint.textContent=snapshot.blame.maintenance+'%'; A.pctOper.textContent=snapshot.blame.operator+'%';
  A.verdict.innerHTML=window.__ROTOSIM_PRODUCTION__.buildProductionVerdict(S,nutDrift,snapshot,acc,window.__ROTOSIM_CONFIG__);
  drawRegistration(snapshot.registrationErrorUm,sp,vib);
}

// ---- Colour proof`;
  return source.replace(productionPattern, replacement);
}

function connectCloggingModel(source) {
  const dryingPattern = /function dryingRate\(\)\{[\s\S]*?\n\}/;
  if (!dryingPattern.test(source)) throw new Error('Não foi possível extrair dryingRate.');
  source = source.replace(dryingPattern, "function dryingRate(){return window.__ROTOSIM_CLOGGING__.calculateDryingRate({viscosity:+cEl.cVisc.value,retardantPercent:+cEl.cRet.value,standardViscosity:INKTYPES[inkType].viscStd});}");
  source = replaceRequired(source, "cEl.cStop.addEventListener('click',()=>{CG.clog=Math.min(100,CG.clog+5+dryingRate()*28); CG.stops++;});", "cEl.cStop.addEventListener('click',()=>{CG.clog=window.__ROTOSIM_CLOGGING__.applyStopDrying(CG.clog,dryingRate());CG.stops++;});", 'paragem com tinta');
  source = replaceRequired(source, "cEl.cClean.addEventListener('click',()=>{CG.clog=CG.clog*0.08; if(CG.clog<2)CG.clog=0; CG.stops=0;});", "cEl.cClean.addEventListener('click',()=>{CG.clog=window.__ROTOSIM_CLOGGING__.applyCylinderWash(CG.clog);CG.stops=0;});", 'lavagem do cilindro');

  const clogPattern = /function clogTick\(dt\)\{[\s\S]*?\n\}\nfunction resetMachineParts/;
  if (!clogPattern.test(source)) throw new Error('Não foi possível extrair clogTick.');
  const replacement = `function clogTick(dt){
  const rpm=+cEl.cSpeed.value, visc=+cEl.cVisc.value, ret=+cEl.cRet.value, dirt=+cEl.cDirt.value, blade=+cEl.cBlade.value, ang=+cEl.cAng.value;
  cEl.cSpVal.textContent=rpm;
  const rpmRad=(rpm/60)*Math.PI*2; angle+=rpmRad*dt; rotor.rotation.x=angle;
  if(pressorSpin)pressorSpin.rotation.x=-angle*(cylR()/pressorR);
  filmTex.offset.y-=cylR()*rpmRad*0.3*dt;
  const snapshot=window.__ROTOSIM_CLOGGING__.calculateCloggingSnapshot({rpm,viscosity:visc,retardantPercent:ret,dirtPercent:dirt,bladePressureBar:blade,bladeAngleDeg:ang,bladeHeightPercent:+cEl.cBladeH.value,oscillationEnabled:CG.osc,standardViscosity:INKTYPES[inkType].viscStd,currentClogPercent:CG.clog,deltaTime:dt});
  CG.clog=snapshot.nextClogPercent;
  if(bladeGrp){bladeGrp.rotation.x=(60-snapshot.effectiveBladeAngleDeg)*Math.PI/180*0.8;bladeGrp.position.x=(CG.osc&&snapshot.speedFactor>0.02)?Math.sin(t*2.2)*0.35:0;}
  if(dryArcMat)dryArcMat.opacity=snapshot.dryArcOpacity;
  cEl.cBladeNote.textContent=blade>3.2?'Pressão a mais ('+blade.toFixed(1)+' bar): desgasta a lâmina, risca o crómio e deita a lâmina — o véu volta pior.':blade<1.2?'Pressão a menos ('+blade.toFixed(1)+' bar): a lâmina não rapa — véu de tinta em todo o fundo.':ang<45?'Ângulo baixo: a lâmina vai deitada, hidroplana — véu de tinta no fundo.':ang>70?'Ângulo alto: rapa agressivo — riscos, vibração e desgaste do fio/crómio.':snapshot.effectiveBladeAngleDeg<55?'A pressão está a deitar a lâmina (ângulo efetivo '+Math.round(snapshot.effectiveBladeAngleDeg)+'°) — hidroplana e deixa véu.':snapshot.mist?'Sem vai-vem: o desgaste concentra-se e as partículas ficam presas — nevoeiro de cor.':'Afinação correta (55–65° · 1,5–2,5 bar · vai-vem ligado): rapa o excesso e deixa a tinta só nos alvéolos.';
  paintClog(CG.clog); drawClogPreview(CG.clog,snapshot.veil,snapshot.scratches,Math.min(1,Math.max(0,12-visc)/2));
  cEl.cClogVal.textContent=Math.round(CG.clog)+'% '+INKS[inkSel].n; cEl.cClogVal.className='val'+(CG.clog>=50?' bad':CG.clog>=20?' warn':'');
  cEl.cClogBar.style.width=CG.clog+'%'; cEl.cClogBar.style.background=CG.clog>50?'#ff5252':CG.clog>20?'#ffb13f':'#46d39a';
  cEl.cScrap.textContent=snapshot.scrapPercent+' %'; cEl.cScrap.style.color=snapshot.scrapPercent>30?'#ff5252':snapshot.scrapPercent>10?'#ffb13f':'#cdd8e4';
  cEl.cQual.textContent=snapshot.quality; cEl.cQual.style.color=snapshot.quality==='grave'?'#ff5252':snapshot.quality==='com defeitos'?'#ffb13f':'#46d39a';
  const causes=[];
  if(ret<7)causes.push('retardador abaixo do standard (~9%)'); if(visc>INKTYPES[inkType].viscStd+1.5)causes.push('viscosidade alta'); if(snapshot.thinning>0)causes.push('tinta demasiado diluída'); if(dirt>40)causes.push('tinta suja / sem filtragem'); if(snapshot.speedFactor>0.02&&snapshot.speedFactor<0.55)causes.push('velocidade abaixo do standard'); if(snapshot.veil)causes.push('véu'); if(snapshot.scratches)causes.push('riscos'); if(!CG.osc)causes.push('vai-vem desligado'); if(CG.stops>0)causes.push(CG.stops+'× paragem c/ tinta a secar'); if(snapshot.retardantExcess>0)causes.push('retardador em excesso');
  let verdict=rpm===0&&CG.clog===0?'Dá rotação e observa a janela de secagem entre a lâmina e o ponto de impressão.':causes.length?'Causas ativas: <b>'+causes.join(' · ')+'</b>.':'Parâmetros standard — impressão limpa, alvéolos abertos.';
  if(CG.clog>45)verdict+=' <br><b style="color:#ff5252">Impressão comprometida</b> — parar e lavar o cilindro.'; else if(CG.clog>2)verdict+=' <br>As <b>altas-luzes do '+INKS[inkSel].n+'</b> são as primeiras a falhar.';
  cEl.cVerdict.innerHTML=verdict;
  const st=rpm===0?'— parado —':CG.clog>45?'alvéolos entupidos — falhas graves':CG.clog>15?'células a entupir — altas-luzes a falhar':'a imprimir — células abertas';
  const col=rpm===0?'var(--ink-dim)':CG.clog>45?'var(--bad)':CG.clog>15?'var(--warn)':'var(--ok)';
  E.status.textContent=st; E.status.style.color=col; E.status.style.borderColor='var(--line)'; cEl.cSpState.textContent=rpm===0?'parado':'a imprimir';
}
function resetMachineParts`;
  return source.replace(clogPattern, replacement);
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
  html = connectCloggingModel(html);
  html = html.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js');

  const junkerBridge = `{calculateJunkerState:${calculateJunkerState.toString()},calculateLooseningRate:${calculateLooseningRate.toString()},calculateHealthDamageRate:${calculateHealthDamageRate.toString()}}`;
  const productionBridge = `{createProductionAccumulator:${createProductionAccumulator.toString()},calculateProductionSnapshot:${calculateProductionSnapshot.toString()},advanceProductionAccumulator:${advanceProductionAccumulator.toString()},buildProductionVerdict:${buildProductionVerdict.toString()}}`;
  const cloggingBridge = `(()=>{const clamp=${((value,min,max)=>Math.max(min,Math.min(max,Number(value)||0))).toString()};const calculateDryingRate=${calculateDryingRate.toString()};const calculateCloggingSnapshot=${calculateCloggingSnapshot.toString()};const applyStopDrying=${applyStopDrying.toString()};const applyCylinderWash=${applyCylinderWash.toString()};return{calculateDryingRate,calculateCloggingSnapshot,applyStopDrying,applyCylinderWash};})()`;
  html = html.replace('<head>', `<head><base href="./"><script>window.__ROTOSIM_STATE__=${JSON.stringify(state)};window.__ROTOSIM_CONFIG__=${JSON.stringify(config)};window.__ROTOSIM_JUNKER__=${junkerBridge};window.__ROTOSIM_PRODUCTION__=${productionBridge};window.__ROTOSIM_CLOGGING__=${cloggingBridge};<\/script>`);
  frame.srcdoc = html;
}
