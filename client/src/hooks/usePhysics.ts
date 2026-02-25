import { useEffect, useRef } from 'react';
import { useEngine } from '../contexts/EngineContext';
import * as THREE from 'three';

// ============================================================
// PXLZ ENGINE — Physics Hook (Rapier3D)
// Runs when isPlaying = true
// ============================================================

export function usePhysics() {
  const { state, dispatch, threeRef, log } = useEngine();
  const rapierRef = useRef<any>(null);
  const worldRef = useRef<any>(null);
  const bodiesRef = useRef<Map<string, any>>(new Map());
  const savedTransformsRef = useRef<Map<string, { position: [number,number,number]; rotation: [number,number,number]; scale: [number,number,number] }>>(new Map());
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!state.isPlaying) {
      // Stop physics — restore saved transforms
      cancelAnimationFrame(animRef.current);
      if (worldRef.current) {
        // Restore transforms
        savedTransformsRef.current.forEach((t, id) => {
          dispatch({ type: 'UPDATE_OBJECT', id, patch: { position: t.position, rotation: t.rotation, scale: t.scale } });
        });
        worldRef.current = null;
        bodiesRef.current.clear();
        savedTransformsRef.current.clear();
      }
      return;
    }

    // Start physics
    let cancelled = false;

    async function startPhysics() {
      try {
        if (!rapierRef.current) {
          const RAPIER = await import('@dimforge/rapier3d-compat');
          await RAPIER.init();
          rapierRef.current = RAPIER;
        }
        const RAPIER = rapierRef.current;
        const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
        worldRef.current = world;

        // Save current transforms
        Object.values(state.objects).forEach(obj => {
          savedTransformsRef.current.set(obj.id, {
            position: [...obj.position] as [number,number,number],
            rotation: [...obj.rotation] as [number,number,number],
            scale: [...obj.scale] as [number,number,number],
          });
        });

        // Create rigid bodies
        Object.values(state.objects).forEach(obj => {
          if (!obj.physics.enabled) return;
          const p = obj.physics;

          let rbDesc;
          if (p.type === 'dynamic') rbDesc = RAPIER.RigidBodyDesc.dynamic();
          else if (p.type === 'kinematic') rbDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
          else rbDesc = RAPIER.RigidBodyDesc.fixed();

          rbDesc.setTranslation(obj.position[0], obj.position[1], obj.position[2]);
          const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(
            THREE.MathUtils.degToRad(obj.rotation[0]),
            THREE.MathUtils.degToRad(obj.rotation[1]),
            THREE.MathUtils.degToRad(obj.rotation[2])
          ));
          rbDesc.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w });

          const rb = world.createRigidBody(rbDesc);

          // Collider
          let colliderDesc;
          const s = obj.scale;
          if (p.shape === 'sphere') {
            colliderDesc = RAPIER.ColliderDesc.ball(0.5 * Math.max(s[0], s[1], s[2]));
          } else if (p.shape === 'capsule') {
            colliderDesc = RAPIER.ColliderDesc.capsule(0.3 * s[1], 0.3 * Math.max(s[0], s[2]));
          } else {
            colliderDesc = RAPIER.ColliderDesc.cuboid(0.5 * s[0], 0.5 * s[1], 0.5 * s[2]);
          }
          colliderDesc.setRestitution(p.restitution);
          colliderDesc.setFriction(p.friction);
          if (p.type === 'dynamic') colliderDesc.setMass(p.mass);

          world.createCollider(colliderDesc, rb);
          bodiesRef.current.set(obj.id, rb);
        });

        log(`Physics started: ${bodiesRef.current.size} bodies`, 'info');

        // Run scripts start()
        state.scripts.forEach(script => {
          try {
            const fn = new Function('THREE', 'scene', 'meshMap', script.code + '\nreturn typeof start !== "undefined" ? start : null;');
            const startFn = fn(THREE, threeRef.current.scene, threeRef.current.meshMap);
            if (startFn) startFn();
          } catch(e) {
            log(`Script start() error: ${e}`, 'error');
          }
        });

        const clock = new THREE.Clock();

        const physicsStep = () => {
          if (cancelled) return;
          animRef.current = requestAnimationFrame(physicsStep);
          const dt = Math.min(clock.getDelta(), 0.05);
          world.step();

          // Sync physics bodies to Three.js meshes
          bodiesRef.current.forEach((rb, id) => {
            const mesh = threeRef.current.meshMap.get(id);
            if (!mesh) return;
            const t = rb.translation();
            const r = rb.rotation();
            mesh.position.set(t.x, t.y, t.z);
            mesh.quaternion.set(r.x, r.y, r.z, r.w);

            // Update engine state (throttled)
            dispatch({
              type: 'UPDATE_OBJECT', id, patch: {
                position: [t.x, t.y, t.z],
                rotation: [
                  THREE.MathUtils.radToDeg(mesh.rotation.x),
                  THREE.MathUtils.radToDeg(mesh.rotation.y),
                  THREE.MathUtils.radToDeg(mesh.rotation.z),
                ],
              }
            });
          });

          // Run scripts update()
          state.scripts.forEach(script => {
            try {
              const fn = new Function('THREE', 'scene', 'meshMap', 'dt', script.code + '\nif(typeof update !== "undefined") update(dt);');
              fn(THREE, threeRef.current.scene, threeRef.current.meshMap, dt);
            } catch(_) {}
          });
        }

        physicsStep();
      } catch(e) {
        log(`Physics init error: ${e}`, 'error');
      }
    }

    startPhysics();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animRef.current);
    };
  }, [state.isPlaying]);
}
