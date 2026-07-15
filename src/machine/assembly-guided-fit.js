export function installGuidedAssemblyFit(doc) {
  if (!doc || doc.getElementById('guidedAssemblyFitScript')) return;

  const script = doc.createElement('script');
  script.id = 'guidedAssemblyFitScript';
  script.textContent = `
    (() => {
      try {
        const originalAssemblyTick = assemblyTick;
        const innerStopX = -cylW / 2 - 0.4;
        const outerStopX = cylW / 2 + 0.1;

        ASM_STEPS[1] = 'Etapa 2 de 6 · Alinhar o escatel interior com a ranhura e inserir até ao batente';
        ASM_STEPS[2] = 'Etapa 3 de 6 · Alinhar o escatel exterior com a ranhura e inserir até ao batente';
        ASM_STEPS[3] = 'Etapa 4 de 6 · Só depois do encaixe completo: colocar e apertar o travamento';

        function clamp01(value) {
          return Math.max(0, Math.min(1, value));
        }

        function eased(value) {
          const p = clamp01(value);
          return 1 - Math.pow(1 - p, 3);
        }

        assemblyTick = function guidedAssemblyTick(dt) {
          rotor.rotation.x = 0;
          asm += (asmStep - asm) * Math.min(1, dt * 2.6);

          const stageInner = clamp01(asm);
          const stageOuter = clamp01(asm - 1);
          const stageTighten = clamp01(asm - 2);
          const stageWheels = clamp01(asm - 3);

          // Cada encaixe tem duas fases: primeiro roda até alinhar escatel/ranhura;
          // só depois desliza axialmente até ao batente físico.
          const innerAlign = eased(stageInner * 2);
          const innerInsert = eased(stageInner * 2 - 1);
          const outerAlign = eased(stageOuter * 2);
          const outerInsert = eased(stageOuter * 2 - 1);
          const tighten = eased(stageTighten);
          const wheels = eased(stageWheels);

          const shaftOffset = (1 - innerInsert) * -9;
          const slotDepth = Math.min(0.4, (S.slot / 100) * 0.5);

          shaftSegs.forEach((segment) => {
            segment.position.x = segment.userData.baseX + shaftOffset;
            segment.position.y = 0;
          });
          thread.position.set(cylW / 2 + 1.35 + shaftOffset, 0, 0);
          fixedPiece.position.set(shaftOffset, 0, 0);
          shaftKey.position.set(shaftKey.userData.baseX + shaftOffset, shaftR + 0.05, 0);
          dogGroup.position.set(shaftOffset, 0, 0);

          bushIn.rotation.x = (1 - innerAlign) * 0.72;
          bushIn.position.set(innerStopX + shaftOffset + slotDepth * innerInsert, 0, 0);

          bushOut.rotation.y = Math.PI;
          bushOut.rotation.x = -(1 - outerAlign) * 0.72;
          bushOut.position.set(outerStopX - slotDepth * outerInsert + (1 - outerInsert) * 6, 0, 0);

          // As porcas/anilhas só avançam depois de ambos os escatéis estarem
          // totalmente dentro das respetivas ranhuras.
          const tighteningRotation = tighten * Math.PI * 6;
          nutA.position.set(cylW / 2 + 1.05 + (1 - tighten) * 9, 0, 0);
          nutB.position.set(cylW / 2 + 1.45 + (1 - tighten) * 9.6, 0, 0);
          nutA.rotation.x = -tighteningRotation;
          nutB.rotation.x = -tighteningRotation * 0.86;

          wheelL.position.y = (1 - wheels) * 7;
          wheelR_.position.y = (1 - wheels) * 7;
          cylGroup.position.set(0, 0, 0);
          cylGroup.rotation.set(0, 0, 0);
          shimsOut.forEach((shim) => { shim.visible = false; });
          stressMat.opacity = 0;
          matCylEngraved.emissiveIntensity = 0;
          wearColor(matEscatel, S.tab);
          wearColor(matRanhura, S.slot);

          window.__ROTOSIM_ASSEMBLY_FIT__ = {
            innerAligned: innerAlign > 0.995,
            innerSeated: innerInsert > 0.995,
            outerAligned: outerAlign > 0.995,
            outerSeated: outerInsert > 0.995,
            tighteningStarted: tighten > 0.001,
            tighteningAllowed: innerInsert > 0.995 && outerInsert > 0.995,
            innerProgress: innerInsert,
            outerProgress: outerInsert,
            tightenProgress: tighten
          };
        };

        window.__ROTOSIM_GUIDED_ASSEMBLY__ = {
          originalAssemblyTick,
          restore() { assemblyTick = originalAssemblyTick; }
        };
      } catch (error) {
        console.error('Falha ao instalar o encaixe guiado da montagem.', error);
      }
    })();
  `;
  doc.body.appendChild(script);
}
