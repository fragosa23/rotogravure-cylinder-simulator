export function installLockingSystemExperience(doc) {
  if (!doc || doc.getElementById('modularLockingSystemScript')) return;

  const script = doc.createElement('script');
  script.id = 'modularLockingSystemScript';
  script.textContent = `
    (() => {
      try {
        function disposeObject(root) {
          if (!root) return;
          root.traverse((child) => {
            child.geometry?.dispose();
            if (child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((material) => {
                Object.values(material).forEach((value) => value?.isTexture && value.dispose());
                material.dispose();
              });
            }
          });
          root.parent?.remove(root);
        }

        window.__ROTOSIM_LOCKING_VISUALS__?.dispose?.();
        let residual;
        while ((residual = nutGroup.children.find((child) => child.name === 'locking-system-visuals'))) {
          disposeObject(residual);
        }

        const root = new THREE.Group();
        root.name = 'locking-system-visuals';
        root.userData.modular = true;
        root.userData.mechanicalDemoRunning = true;
        nutGroup.add(root);

        const material = (color, metalness = 0.82, roughness = 0.28) =>
          new THREE.MeshStandardMaterial({ color, metalness, roughness });
        const steel = material(0xc3ccd5, 0.88, 0.22);
        const dark = material(0x46515e, 0.82, 0.34);
        const blueA = material(0x5b8bb7, 0.84, 0.25);
        const blueB = material(0x9bc8e9, 0.84, 0.22);

        const doubleNut = new THREE.Group();
        root.add(doubleNut);

        const wedge = new THREE.Group();
        wedge.name = 'nordlock-standard';
        const wedgeA = new THREE.Mesh(washerGeo(shaftR * 1.5, shaftR * 1.07, 0.14), blueA);
        const wedgeB = new THREE.Mesh(washerGeo(shaftR * 1.5, shaftR * 1.07, 0.14), blueB);
        wedge.add(wedgeA, wedgeB);
        for (let i = 0; i < 12; i += 1) {
          const angle = i / 12 * Math.PI * 2;
          const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.28), i % 2 ? blueA : blueB);
          ramp.position.set(0, Math.cos(angle) * shaftR * 1.29, Math.sin(angle) * shaftR * 1.29);
          ramp.rotation.x = angle;
          wedge.add(ramp);
        }
        root.add(wedge);

        const tabWasher = new THREE.Group();
        tabWasher.name = 'tab-washer';
        const tabRing = new THREE.Mesh(washerGeo(shaftR * 1.62, shaftR * 1.07, 0.16), dark);
        const tab = new THREE.Mesh(new THREE.BoxGeometry(0.15, shaftR * 0.82, shaftR * 0.3), steel);
        tab.position.set(0, shaftR * 1.72, 0);
        tabWasher.add(tabRing, tab);
        root.add(tabWasher);

        // Mantém o quarto índice para compatibilidade. O módulo Nord-Lock X-series
        // substitui visualmente este grupo após a instalação.
        const compatibilityGroup = new THREE.Group();
        compatibilityGroup.name = 'obsolete-lock-four';
        compatibilityGroup.visible = false;
        root.add(compatibilityGroup);

        let selected = -1;
        let transition = 1;
        let previousLock = Number(S.lock);
        let active = true;
        let animationFrame = 0;
        let orbitFrame = 0;
        let orbitToken = 0;
        let pinchDistance = 0;

        function lockingTarget() {
          const target = new THREE.Vector3();
          nutA.getWorldPosition(target);
          return target;
        }

        function stopOrbit() {
          orbitToken += 1;
          if (orbitFrame) cancelAnimationFrame(orbitFrame);
          orbitFrame = 0;
          root.userData.orbiting = false;
          root.userData.cameraFree = true;
        }

        function zoomBy(delta) {
          camGoal = null;
          camRad = Math.max(3.4, Math.min(80, camRad + delta));
        }

        function focusLockingArea() {
          const target = lockingTarget();
          camGoal = {
            t: camTheta,
            p: 1.28,
            r: 7.2,
            tx: target.x,
            ty: target.y,
            tz: target.z
          };
        }

        function orbitLockingArea() {
          stopOrbit();
          const token = orbitToken;
          const target = lockingTarget();
          const startTheta = camTheta;
          const start = performance.now();
          const duration = 4200;
          camGoal = null;
          camTarget.copy(target);
          camPhi = 1.28;
          camRad = 7.2;
          root.userData.orbiting = true;
          root.userData.cameraFree = false;

          function tick(now) {
            if (!active || token !== orbitToken) return;
            const cycle = ((now - start) % duration) / duration;
            const wave = (1 - Math.cos(cycle * Math.PI * 2)) / 2;
            camTarget.lerp(target, 0.18);
            camTheta = startTheta + cycle * Math.PI * 2;
            camPhi = 1.18 + Math.sin(cycle * Math.PI * 2) * 0.14;
            camRad = 7.2 - wave * 0.75;
            root.userData.orbitProgress = cycle;
            updateCam();
            orbitFrame = requestAnimationFrame(tick);
          }
          orbitFrame = requestAnimationFrame(tick);
        }

        function installZoomControls() {
          if (document.getElementById('lockingZoomControls')) return;
          const controls = document.createElement('div');
          controls.id = 'lockingZoomControls';
          controls.setAttribute('aria-label', 'Zoom do simulador');
          controls.innerHTML = '<button type="button" data-zoom="in" aria-label="Aproximar">＋</button><button type="button" data-zoom="out" aria-label="Afastar">−</button><button type="button" data-zoom="focus" aria-label="Focar travamento">◎</button>';
          const style = document.createElement('style');
          style.id = 'lockingZoomStyle';
          style.textContent = '#lockingZoomControls{position:fixed;left:14px;top:14px;z-index:75;display:flex;gap:8px;padding:7px;border-radius:15px;background:rgba(7,12,21,.76);border:1px solid rgba(150,175,210,.25);backdrop-filter:blur(14px)}#lockingZoomControls button{width:44px;height:44px;border:1px solid rgba(150,175,210,.25);border-radius:11px;background:rgba(255,255,255,.08);color:#fff;font:700 22px system-ui;cursor:pointer;touch-action:manipulation}#lockingZoomControls button:active{transform:scale(.96);background:rgba(103,185,255,.24)}';
          document.head.appendChild(style);
          document.body.appendChild(controls);
          controls.addEventListener('click', (event) => {
            const action = event.target.closest('button')?.dataset.zoom;
            stopOrbit();
            if (action === 'in') zoomBy(-1.2);
            if (action === 'out') zoomBy(1.2);
            if (action === 'focus') focusLockingArea();
          });
        }

        function installCameraInteraction() {
          const canvas = renderer.domElement;
          canvas.addEventListener('touchstart', (event) => {
            if (event.touches.length === 2) {
              stopOrbit();
              pinchDistance = Math.hypot(
                event.touches[0].clientX - event.touches[1].clientX,
                event.touches[0].clientY - event.touches[1].clientY
              );
            }
          }, { passive: false });
          canvas.addEventListener('touchmove', (event) => {
            if (event.touches.length !== 2 || !pinchDistance) return;
            event.preventDefault();
            const next = Math.hypot(
              event.touches[0].clientX - event.touches[1].clientX,
              event.touches[0].clientY - event.touches[1].clientY
            );
            zoomBy((pinchDistance - next) * 0.025);
            pinchDistance = next;
          }, { passive: false });
          canvas.addEventListener('touchend', () => { pinchDistance = 0; }, { passive: true });
          canvas.addEventListener('pointerdown', stopOrbit, { passive: true });
          canvas.addEventListener('wheel', stopOrbit, { passive: true });
        }

        function setVisibility(lock) {
          nutA.visible = true;
          nutB.visible = lock === 1;
          doubleNut.visible = lock === 1;
          wedge.visible = lock === 2;
          tabWasher.visible = lock === 3;
          compatibilityGroup.visible = false;
        }

        function update() {
          if (!active) return;
          const lock = Number(S.lock);
          if (lock !== selected) {
            previousLock = selected < 0 ? lock : selected;
            selected = lock;
            transition = 0;
            focusLockingArea();
            window.setTimeout(() => {
              if (active && Number(S.lock) === lock && root.userData.cameraFree !== true) orbitLockingArea();
            }, 420);
          }
          transition = Math.min(1, transition + 0.045);
          setVisibility(lock);

          const eased = 1 - Math.pow(1 - transition, 3);
          const baseX = nutA.position.x - 0.34;
          const entryOffset = (1 - eased) * 1.4;
          const demo = (Math.sin(performance.now() * 0.0032) + 1) / 2;
          const demoRotation = (demo - 0.5) * 0.28;
          const demoSeparation = demo * 0.11;

          doubleNut.position.set(baseX + entryOffset, nutA.position.y, nutA.position.z);
          wedge.position.set(baseX + entryOffset, nutA.position.y, nutA.position.z);
          tabWasher.position.set(baseX + entryOffset, nutA.position.y, nutA.position.z);

          // Demonstração mecânica independente da câmara.
          wedgeA.position.x = -0.075 - demoSeparation;
          wedgeB.position.x = 0.075 + demoSeparation;
          wedgeA.rotation.x = 0.04 + demoRotation;
          wedgeB.rotation.x = -0.04 - demoRotation;
          tab.rotation.z = -0.18 - demo * 0.48;
          if (lock === 1) nutB.rotation.x = demoRotation * 0.45;

          root.userData.selectedLock = lock;
          root.userData.transition = transition;
          root.userData.previousLock = previousLock;
          root.userData.demoProgress = demo;
          root.userData.mechanicalDemoRunning = true;
          animationFrame = requestAnimationFrame(update);
        }

        function dispose() {
          active = false;
          stopOrbit();
          if (animationFrame) cancelAnimationFrame(animationFrame);
          document.getElementById('lockingZoomControls')?.remove();
          document.getElementById('lockingZoomStyle')?.remove();
          disposeObject(root);
        }

        installZoomControls();
        installCameraInteraction();
        window.__ROTOSIM_LOCKING_VISUALS__ = {
          root,
          dispose,
          focus: focusLockingArea,
          orbit: orbitLockingArea,
          stopOrbit,
          zoomBy
        };
        update();
      } catch (error) {
        console.error('Falha no módulo de travamento.', error);
      }
    })();
  `;
  doc.body.appendChild(script);
}
