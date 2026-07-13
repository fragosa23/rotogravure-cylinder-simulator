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
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((material) => {
                Object.values(material).forEach((value) => { if (value && value.isTexture) value.dispose(); });
                material.dispose();
              });
            }
          });
          if (root.parent) root.parent.remove(root);
        }

        const previous = nutGroup.getObjectByName('locking-system-visuals');
        if (previous) disposeObject(previous);

        const root = new THREE.Group();
        root.name = 'locking-system-visuals';
        root.userData.modular = true;
        nutGroup.add(root);

        const material = (color, metalness = 0.82, roughness = 0.28) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
        const steel = material(0xc3ccd5, 0.88, 0.22);
        const dark = material(0x46515e, 0.82, 0.34);
        const blueA = material(0x5b8bb7, 0.84, 0.25);
        const blueB = material(0x9bc8e9, 0.84, 0.22);
        const brass = material(0xe1ad3d, 0.72, 0.3);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0xff4f5f });

        const doubleNut = new THREE.Group();
        const doubleNutMarker = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, shaftR * 2.1), markerMat);
        doubleNutMarker.position.set(0, shaftR * 1.36, 0);
        doubleNut.add(doubleNutMarker);
        root.add(doubleNut);

        const wedge = new THREE.Group();
        const wedgeA = new THREE.Mesh(washerGeo(shaftR * 1.5, shaftR * 1.07, 0.14), blueA);
        const wedgeB = new THREE.Mesh(washerGeo(shaftR * 1.5, shaftR * 1.07, 0.14), blueB);
        wedgeA.position.x = -0.075;
        wedgeB.position.x = 0.075;
        wedge.add(wedgeA, wedgeB);
        for (let i = 0; i < 12; i += 1) {
          const a = i / 12 * Math.PI * 2;
          const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.28), i % 2 ? blueA : blueB);
          ramp.position.set(0, Math.cos(a) * shaftR * 1.29, Math.sin(a) * shaftR * 1.29);
          ramp.rotation.x = a;
          wedge.add(ramp);
        }
        root.add(wedge);

        const tabWasher = new THREE.Group();
        const tabRing = new THREE.Mesh(washerGeo(shaftR * 1.62, shaftR * 1.07, 0.16), dark);
        const tab = new THREE.Mesh(new THREE.BoxGeometry(0.15, shaftR * 0.82, shaftR * 0.3), steel);
        tab.position.set(0, shaftR * 1.72, 0);
        tabWasher.add(tabRing, tab);
        root.add(tabWasher);

        const castle = new THREE.Group();
        const castleBody = new THREE.Mesh(washerGeo(shaftR * 1.55, shaftR * 1.07, 0.36), dark);
        castle.add(castleBody);
        for (let i = 0; i < 8; i += 1) {
          const a = i / 8 * Math.PI * 2;
          const crown = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.21, 0.22), steel);
          crown.position.set(0.1, Math.cos(a) * shaftR * 1.38, Math.sin(a) * shaftR * 1.38);
          crown.rotation.x = a;
          castle.add(crown);
        }
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, shaftR * 4, 12), brass);
        pin.rotation.x = Math.PI / 2;
        pin.position.x = 0.13;
        castle.add(pin);
        const legA = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, shaftR * 1.05, 10), brass);
        const legB = legA.clone();
        legA.position.set(0.13, 0, shaftR * 2.15);
        legB.position.copy(legA.position);
        castle.add(legA, legB);
        root.add(castle);

        const reference = new THREE.Group();
        reference.name = 'locking-reference-line';
        const nutMark = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, shaftR * 2.2), markerMat);
        nutMark.position.set(0, shaftR * 1.42, 0);
        const fixedMark = nutMark.clone();
        fixedMark.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        fixedMark.position.x = -0.42;
        reference.add(nutMark, fixedMark);
        root.add(reference);

        let selected = -1;
        let transition = 1;
        let previousLock = Number(S.lock);

        function focusLockingArea() {
          if (typeof camFocusGo === 'function') camFocusGo('anilhas');
        }

        function setVisibility(lock) {
          nutA.visible = true;
          nutB.visible = lock === 1;
          doubleNut.visible = lock === 1;
          wedge.visible = lock === 2;
          tabWasher.visible = lock === 3;
          castle.visible = lock === 4;
          reference.visible = true;
        }

        function update() {
          const lock = Number(S.lock);
          if (lock !== selected) {
            previousLock = selected < 0 ? lock : selected;
            selected = lock;
            transition = 0;
            focusLockingArea();
          }
          transition = Math.min(1, transition + 0.045);
          setVisibility(lock);

          const eased = 1 - Math.pow(1 - transition, 3);
          const baseX = nutA.position.x - 0.34;
          const entryOffset = (1 - eased) * 1.4;
          [doubleNut, wedge, tabWasher].forEach((group) => group.position.set(baseX + entryOffset, nutA.position.y, nutA.position.z));
          castle.position.set(nutA.position.x + 0.02 + entryOffset, nutA.position.y, nutA.position.z);
          reference.position.set(nutA.position.x, nutA.position.y, nutA.position.z);

          const loosen = Math.min(1, Math.max(0, (S.nut + nutDrift) / 100));
          const rotation = loosen * Math.PI * 1.4;
          nutMark.rotation.x = rotation;
          doubleNutMarker.rotation.x = rotation;
          wedgeA.rotation.x = 0.04 + loosen * 0.16;
          wedgeB.rotation.x = -0.04 - loosen * 0.16;
          tab.rotation.z = -0.1 - eased * 0.52 + loosen * 0.04;
          legA.rotation.z = 0.58 + Math.sin(t * 18) * 0.012 * loosen;
          legB.rotation.z = -0.58 - Math.sin(t * 18) * 0.012 * loosen;

          root.userData.selectedLock = lock;
          root.userData.transition = transition;
          root.userData.previousLock = previousLock;
          requestAnimationFrame(update);
        }

        window.__ROTOSIM_LOCKING_VISUALS__ = {
          root,
          dispose: () => disposeObject(root),
          focus: focusLockingArea
        };
        update();
      } catch (error) {
        console.error('Falha no módulo de travamento.', error);
      }
    })();
  `;
  doc.body.appendChild(script);
}
