export function installCameraAndLighting(doc) {
  if (!doc || doc.getElementById('cameraLightingExperienceScript')) return;

  const script = doc.createElement('script');
  script.id = 'cameraLightingExperienceScript';
  script.textContent = `
    (() => {
      try {
        const canvas = renderer?.domElement || document.querySelector('#stage canvas, canvas');
        const locking = window.__ROTOSIM_LOCKING_VISUALS__;
        if (!canvas || !locking) return;

        let pinchDistance = 0;
        let pinchMidX = 0;
        let pinchMidY = 0;
        let slowOrbitFrame = 0;
        let slowOrbitToken = 0;
        let lastLock = Number(S.lock);
        let active = true;

        function distance(touches) {
          return Math.hypot(
            touches[0].clientX - touches[1].clientX,
            touches[0].clientY - touches[1].clientY
          );
        }

        function midpoint(touches) {
          return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
          };
        }

        function panCameraByPixels(dx, dy) {
          const rect = canvas.getBoundingClientRect();
          const fwd = new THREE.Vector3().subVectors(camTarget, camera.position).normalize();
          const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
          const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
          const worldPerPixel = (2 * camRad * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))) / Math.max(1, rect.height);
          const sensitivity = 1.35;
          camTarget.addScaledVector(right, -dx * worldPerPixel * sensitivity);
          camTarget.addScaledVector(up, dy * worldPerPixel * sensitivity);
          camGoal = null;
          updateCam();
        }

        function stopSlowOrbit() {
          slowOrbitToken += 1;
          if (slowOrbitFrame) cancelAnimationFrame(slowOrbitFrame);
          slowOrbitFrame = 0;
          locking.stopOrbit?.();
          locking.root.userData.slowOrbiting = false;
          locking.root.userData.cameraFree = true;
        }

        function startSlowOrbit() {
          stopSlowOrbit();
          const token = slowOrbitToken;
          const target = new THREE.Vector3();
          nutA.getWorldPosition(target);
          const startTheta = camTheta;
          const start = performance.now();
          const duration = 10500;
          camGoal = null;
          camTarget.copy(target);
          camPhi = 1.28;
          camRad = 7.4;
          locking.root.userData.slowOrbiting = true;
          locking.root.userData.cameraFree = false;
          locking.root.userData.orbitDurationMs = duration;

          function tick(now) {
            if (!active || token !== slowOrbitToken) return;
            const cycle = ((now - start) % duration) / duration;
            const wave = (1 - Math.cos(cycle * Math.PI * 2)) / 2;
            camTarget.lerp(target, 0.1);
            camTheta = startTheta + cycle * Math.PI * 2;
            camPhi = 1.23 + Math.sin(cycle * Math.PI * 2) * 0.1;
            camRad = 7.5 - wave * 0.55;
            updateCam();
            locking.root.userData.slowOrbitProgress = cycle;
            slowOrbitFrame = requestAnimationFrame(tick);
          }
          slowOrbitFrame = requestAnimationFrame(tick);
        }

        function interceptPinch(event) {
          if (event.touches?.length !== 2) return;
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }

        canvas.addEventListener('touchstart', (event) => {
          if (event.touches.length !== 2) return;
          interceptPinch(event);
          stopSlowOrbit();
          pinchDistance = distance(event.touches);
          const mid = midpoint(event.touches);
          pinchMidX = mid.x;
          pinchMidY = mid.y;
          locking.root.userData.pinching = true;
          locking.root.userData.pinchPanning = true;
          locking.root.userData.pinchPanDistance = 0;
        }, { passive: false, capture: true });

        canvas.addEventListener('touchmove', (event) => {
          if (event.touches.length !== 2 || !pinchDistance) return;
          interceptPinch(event);
          const nextDistance = distance(event.touches);
          const nextMid = midpoint(event.touches);
          const dx = nextMid.x - pinchMidX;
          const dy = nextMid.y - pinchMidY;

          locking.zoomBy?.((pinchDistance - nextDistance) * 0.018);
          if (Math.abs(dx) > 0.25 || Math.abs(dy) > 0.25) panCameraByPixels(dx, dy);

          pinchDistance = nextDistance;
          pinchMidX = nextMid.x;
          pinchMidY = nextMid.y;
          locking.root.userData.pinchPanDistance += Math.hypot(dx, dy);
        }, { passive: false, capture: true });

        canvas.addEventListener('touchend', (event) => {
          if (event.touches.length < 2) {
            pinchDistance = 0;
            pinchMidX = 0;
            pinchMidY = 0;
            locking.root.userData.pinching = false;
            locking.root.userData.pinchPanning = false;
          }
        }, { passive: true, capture: true });

        canvas.addEventListener('pointerdown', stopSlowOrbit, { passive: true, capture: true });
        canvas.addEventListener('wheel', stopSlowOrbit, { passive: true, capture: true });

        const lightingRoot = new THREE.Group();
        lightingRoot.name = 'training-focused-lighting';

        const centerTarget = new THREE.Object3D();
        centerTarget.position.set(0, 0.2, 0);
        scene.add(centerTarget);

        const center = new THREE.SpotLight(0xffffff, 2.25, 34, Math.PI / 5.2, 0.48, 1.35);
        center.name = 'cylinder-overhead-spot';
        center.position.set(0, 10.5, 2.2);
        center.target = centerTarget;

        const leftTarget = new THREE.Object3D();
        leftTarget.position.set(-4.6, 0.4, 0);
        scene.add(leftTarget);
        const left = new THREE.SpotLight(0xdcecff, 1.65, 27, Math.PI / 5, 0.5, 1.4);
        left.name = 'left-fitting-spot';
        left.position.set(-8.5, 5.8, 5.2);
        left.target = leftTarget;

        const rightTarget = new THREE.Object3D();
        rightTarget.position.set(4.8, 0.4, 0);
        scene.add(rightTarget);
        const right = new THREE.SpotLight(0xfff1d6, 1.85, 27, Math.PI / 5, 0.5, 1.4);
        right.name = 'washer-side-spot';
        right.position.set(8.8, 5.6, 5.4);
        right.target = rightTarget;

        [center, left, right].forEach((light) => {
          light.castShadow = false;
          lightingRoot.add(light);
        });
        scene.add(lightingRoot);

        const originalOrbit = locking.orbit;
        locking.orbit = startSlowOrbit;

        function monitorSelection() {
          if (!active) return;
          const lock = Number(S.lock);
          if (lock !== lastLock) {
            lastLock = lock;
            window.setTimeout(() => {
              if (!active || Number(S.lock) !== lock || locking.root.userData.cameraFree) return;
              locking.stopOrbit?.();
              startSlowOrbit();
            }, 520);
          }
          requestAnimationFrame(monitorSelection);
        }
        monitorSelection();

        window.__ROTOSIM_CAMERA_LIGHTING__ = {
          lightingRoot,
          startSlowOrbit,
          stopSlowOrbit,
          panCameraByPixels,
          getState() {
            return {
              radius: camRad,
              target: { x: camTarget.x, y: camTarget.y, z: camTarget.z },
              pinching: Boolean(locking.root.userData.pinching),
              pinchPanning: Boolean(locking.root.userData.pinchPanning),
              pinchPanDistance: locking.root.userData.pinchPanDistance || 0
            };
          },
          dispose() {
            active = false;
            stopSlowOrbit();
            locking.orbit = originalOrbit;
            scene.remove(lightingRoot, centerTarget, leftTarget, rightTarget);
            lightingRoot.traverse((child) => child.dispose?.());
          }
        };
      } catch (error) {
        console.error('Falha ao instalar câmara e iluminação de formação.', error);
      }
    })();
  `;
  doc.body.appendChild(script);
}
