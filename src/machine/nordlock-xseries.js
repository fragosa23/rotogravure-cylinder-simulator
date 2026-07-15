export function installNordLockXSeries(doc) {
  if (!doc || doc.getElementById('nordLockXSeriesScript')) return;

  const script = doc.createElement('script');
  script.id = 'nordLockXSeriesScript';
  script.textContent = `
    (() => {
      try {
        const visuals = window.__ROTOSIM_LOCKING_VISUALS__;
        const root = visuals?.root;
        if (!root || root.getObjectByName('nordlock-x-series')) return;

        const obsoleteGroup = root.getObjectByName('obsolete-lock-four') || root.children[3];
        if (obsoleteGroup) obsoleteGroup.visible = false;

        try {
          lockNames[2] = 'Nord-Lock standard';
          lockNames[4] = 'Nord-Lock X-series';
          lockDescs[2] = 'Par de anilhas de cunha Nord-Lock. As rampas transformam a rotação de desaperto em aumento de tensão.';
          lockDescs[4] = 'Nord-Lock X-series combina efeito de cunha com elasticidade, mantendo pré-carga em juntas sujeitas a vibração e assentamento.';
          lockResist[4] = 0.98;
        } catch (_) {}

        const group = new THREE.Group();
        group.name = 'nordlock-x-series';
        const outer = shaftR * 1.58;
        const inner = shaftR * 1.07;
        const blue = new THREE.MeshStandardMaterial({ color: 0x2d83c5, metalness: 0.86, roughness: 0.24 });
        const steel = new THREE.MeshStandardMaterial({ color: 0xbecbd7, metalness: 0.9, roughness: 0.2 });
        const washerA = new THREE.Mesh(washerGeo(outer, inner, 0.14), blue);
        const washerB = new THREE.Mesh(washerGeo(outer, inner, 0.14), blue.clone());
        group.add(washerA, washerB);

        for (let i = 0; i < 16; i += 1) {
          const angle = i / 16 * Math.PI * 2;
          const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.1, 0.3), i % 2 ? blue : steel);
          ramp.position.set(0, Math.cos(angle) * shaftR * 1.34, Math.sin(angle) * shaftR * 1.34);
          ramp.rotation.x = angle;
          group.add(ramp);
        }

        const spring = new THREE.Mesh(new THREE.TorusGeometry(shaftR * 1.27, 0.055, 10, 48), steel);
        spring.rotation.y = Math.PI / 2;
        group.add(spring);
        root.add(group);

        let active = true;
        let frameId = 0;
        function update() {
          if (!active) return;
          if (obsoleteGroup) obsoleteGroup.visible = false;
          group.visible = Number(S.lock) === 4;
          const baseX = nutA.position.x - 0.34;
          group.position.set(baseX, nutA.position.y, nutA.position.z);

          const demo = (Math.sin(performance.now() * 0.0032) + 1) / 2;
          const rotation = (demo - 0.5) * 0.26;
          const separation = demo * 0.1;
          washerA.position.x = -0.09 - separation;
          washerB.position.x = 0.09 + separation;
          washerA.rotation.x = 0.05 + rotation;
          washerB.rotation.x = -0.05 - rotation;
          spring.scale.set(0.72 + demo * 0.08, 1, 1);
          group.userData.demoProgress = demo;
          group.userData.mechanicalDemoRunning = true;
          frameId = requestAnimationFrame(update);
        }
        update();

        window.__ROTOSIM_NORDLOCK_X__ = {
          group,
          dispose() {
            active = false;
            if (frameId) cancelAnimationFrame(frameId);
            root.remove(group);
            group.traverse((child) => {
              child.geometry?.dispose();
              child.material?.dispose();
            });
          }
        };
      } catch (error) {
        console.error('Falha ao instalar Nord-Lock X-series.', error);
      }
    })();
  `;
  doc.body.appendChild(script);

  const card2 = doc.querySelector('.locking-card[data-value="2"]');
  const card4 = doc.querySelector('.locking-card[data-value="4"]');
  if (card2) {
    card2.querySelector('strong').textContent = 'Nord-Lock standard';
    card2.querySelector('small').textContent = 'Anilhas de cunha com rampas';
  }
  if (card4) {
    card4.querySelector('strong').textContent = 'Nord-Lock X-series';
    card4.querySelector('small').textContent = 'Cunha + efeito elástico';
  }
}
