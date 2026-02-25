import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useEngine, SceneObject, createObject } from '../contexts/EngineContext';

// ============================================================
// PXLZ ENGINE — Viewport (Three.js + Pixel Filter)
// Pixel filter: render at low resolution, upscale with CSS
// Supports drag-and-drop .gltf/.glb import
// ============================================================

function buildGeometry(type: SceneObject['type']): THREE.BufferGeometry {
  switch (type) {
    case 'box': return new THREE.BoxGeometry(1, 1, 1);
    case 'sphere': return new THREE.SphereGeometry(0.5, 8, 6);
    case 'cylinder': return new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
    case 'cone': return new THREE.ConeGeometry(0.5, 1, 8);
    case 'torus': return new THREE.TorusGeometry(0.5, 0.2, 6, 12);
    case 'plane': return new THREE.PlaneGeometry(1, 1);
    case 'capsule': return new THREE.CapsuleGeometry(0.3, 0.6, 4, 8);
    case 'tetrahedron': return new THREE.TetrahedronGeometry(0.6);
    case 'octahedron': return new THREE.OctahedronGeometry(0.6);
    case 'icosahedron': return new THREE.IcosahedronGeometry(0.6);
    default: return new THREE.BoxGeometry(1, 1, 1);
  }
}

function isLight(type: SceneObject['type']) {
  return type === 'light_point' || type === 'light_dir' || type === 'light_ambient' || type === 'light_spot';
}

function buildLight(obj: SceneObject): THREE.Light {
  const color = new THREE.Color(obj.lightColor);
  switch (obj.type) {
    case 'light_point': {
      const l = new THREE.PointLight(color, obj.lightIntensity, obj.lightRange);
      l.castShadow = obj.castShadow;
      return l;
    }
    case 'light_dir': {
      const l = new THREE.DirectionalLight(color, obj.lightIntensity);
      l.castShadow = obj.castShadow;
      return l;
    }
    case 'light_ambient':
      return new THREE.AmbientLight(color, obj.lightIntensity);
    case 'light_spot': {
      const l = new THREE.SpotLight(color, obj.lightIntensity, obj.lightRange);
      l.castShadow = obj.castShadow;
      return l;
    }
    default:
      return new THREE.AmbientLight(color, obj.lightIntensity);
  }
}

const textureCache = new Map<string, THREE.Texture>();
const texLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();

function getTexture(url: string): THREE.Texture {
  if (!textureCache.has(url)) {
    const tex = texLoader.load(url);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    textureCache.set(url, tex);
  }
  return textureCache.get(url)!;
}

export default function Viewport() {
  const { state, dispatch, threeRef, log } = useEngine();
  const mountRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<OrbitControls | null>(null);
  const transformRef = useRef<TransformControls | null>(null);
  const animFrameRef = useRef<number>(0);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Build or update a Three.js object from engine state
  const syncObject = useCallback((obj: SceneObject, scene: THREE.Scene, meshMap: Map<string, THREE.Object3D>) => {
    let mesh = meshMap.get(obj.id);

    if (!mesh) {
      if (isLight(obj.type)) {
        const light = buildLight(obj);
        light.userData.pxlzId = obj.id;
        scene.add(light);
        meshMap.set(obj.id, light);
        if (obj.type === 'light_point') {
          const helper = new THREE.PointLightHelper(light as THREE.PointLight, 0.3);
          scene.add(helper);
          (light as any).__helper = helper;
        } else if (obj.type === 'light_dir') {
          const helper = new THREE.DirectionalLightHelper(light as THREE.DirectionalLight, 0.5);
          scene.add(helper);
          (light as any).__helper = helper;
        }
        mesh = light;
      } else if (obj.type === 'empty' || obj.type === 'audio') {
        const group = new THREE.Group();
        group.userData.pxlzId = obj.id;
        scene.add(group);
        meshMap.set(obj.id, group);
        mesh = group;
      } else if (obj.type === 'model' && obj.modelUrl) {
        const placeholder = new THREE.Group();
        placeholder.userData.pxlzId = obj.id;
        scene.add(placeholder);
        meshMap.set(obj.id, placeholder);
        mesh = placeholder;
        gltfLoader.load(obj.modelUrl, (gltf) => {
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = child as THREE.Mesh;
              if (obj.flatShading && m.material) {
                const mat = m.material as THREE.MeshStandardMaterial;
                mat.flatShading = true;
                mat.needsUpdate = true;
              }
              m.castShadow = obj.castShadow;
              m.receiveShadow = obj.receiveShadow;
            }
          });
          placeholder.add(gltf.scene);
          log(`Model loaded: ${obj.name}`, 'info');
        }, undefined, (err) => {
          log(`Failed to load model: ${err}`, 'error');
        });
      } else {
        const geo = buildGeometry(obj.type);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(obj.color),
          wireframe: obj.wireframe,
          roughness: obj.roughness,
          metalness: obj.metalness,
          transparent: obj.opacity < 1,
          opacity: obj.opacity,
          flatShading: obj.flatShading,
        });
        if (obj.textureUrl) {
          mat.map = getTexture(obj.textureUrl);
        }
        const m = new THREE.Mesh(geo, mat);
        m.userData.pxlzId = obj.id;
        m.castShadow = obj.castShadow;
        m.receiveShadow = obj.receiveShadow;
        scene.add(m);
        meshMap.set(obj.id, m);
        mesh = m;
      }
    } else {
      // Update existing
      if (isLight(obj.type)) {
        const light = mesh as THREE.Light;
        light.color.set(obj.lightColor);
        light.intensity = obj.lightIntensity;
        if ((light as THREE.PointLight).distance !== undefined) {
          (light as THREE.PointLight).distance = obj.lightRange;
        }
        if ((mesh as any).__helper) (mesh as any).__helper.update();
      } else if ((mesh as THREE.Mesh).isMesh) {
        const m = mesh as THREE.Mesh;
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.color.set(obj.color);
        mat.wireframe = obj.wireframe;
        mat.roughness = obj.roughness;
        mat.metalness = obj.metalness;
        mat.transparent = obj.opacity < 1;
        mat.opacity = obj.opacity;
        mat.flatShading = obj.flatShading;
        mat.needsUpdate = true;
        if (obj.textureUrl) {
          mat.map = getTexture(obj.textureUrl);
          mat.needsUpdate = true;
        } else if (mat.map) {
          mat.map = null;
          mat.needsUpdate = true;
        }
        m.castShadow = obj.castShadow;
        m.receiveShadow = obj.receiveShadow;
      }
    }

    if (mesh) {
      mesh.visible = obj.visible;
      mesh.position.set(...obj.position);
      mesh.rotation.set(
        THREE.MathUtils.degToRad(obj.rotation[0]),
        THREE.MathUtils.degToRad(obj.rotation[1]),
        THREE.MathUtils.degToRad(obj.rotation[2])
      );
      mesh.scale.set(...obj.scale);
    }
  }, [log]);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(W, H);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.imageRendering = 'pixelated';
    renderer.domElement.style.display = 'block';
    mount.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0D1117');
    scene.fog = new THREE.Fog('#0D1117', 40, 100);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.set(5, 5, 8);
    camera.lookAt(0, 0, 0);

    // Grid
    const grid = new THREE.GridHelper(30, 30, '#30363D', '#1C2128');
    scene.add(grid);
    gridRef.current = grid;

    // Orbit controls
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;
    orbit.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    orbitRef.current = orbit;

    // Transform controls
    const transform = new TransformControls(camera, renderer.domElement);
    transform.addEventListener('dragging-changed', (e) => {
      orbit.enabled = !e.value;
    });
    transform.addEventListener('objectChange', () => {
      const obj = transform.object;
      if (!obj) return;
      const id = obj.userData.pxlzId;
      if (!id) return;
      dispatch({
        type: 'UPDATE_OBJECT',
        id,
        patch: {
          position: [obj.position.x, obj.position.y, obj.position.z],
          rotation: [
            THREE.MathUtils.radToDeg(obj.rotation.x),
            THREE.MathUtils.radToDeg(obj.rotation.y),
            THREE.MathUtils.radToDeg(obj.rotation.z),
          ],
          scale: [obj.scale.x, obj.scale.y, obj.scale.z],
        },
      });
    });
    transformRef.current = transform;

    // Store refs
    threeRef.current.scene = scene;
    threeRef.current.camera = camera;
    threeRef.current.renderer = renderer;

    // Raycaster for selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let mouseDownPos = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      mouseDownPos = { x: e.clientX, y: e.clientY };
    };

    const onClick = (e: MouseEvent) => {
      // Only select if mouse didn't move much (not a drag)
      const dx = Math.abs(e.clientX - mouseDownPos.x);
      const dy = Math.abs(e.clientY - mouseDownPos.y);
      if (dx > 5 || dy > 5) return;
      if (transform.dragging) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const meshes: THREE.Object3D[] = [];
      threeRef.current.meshMap.forEach((m) => {
        if ((m as THREE.Mesh).isMesh) meshes.push(m);
      });
      const hits = raycaster.intersectObjects(meshes, true);
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.userData.pxlzId) obj = obj.parent;
        if (obj?.userData.pxlzId) {
          dispatch({ type: 'SELECT_OBJECT', id: obj.userData.pxlzId });
        }
      } else {
        dispatch({ type: 'SELECT_OBJECT', id: null });
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('click', onClick);

    // Resize observer
    const resizeObs = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObs.observe(mount);

    // Animate
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      orbit.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObs.disconnect();
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      threeRef.current.scene = null;
      threeRef.current.camera = null;
      threeRef.current.renderer = null;
      threeRef.current.meshMap.clear();
    };
  }, []);

  // Sync objects to Three.js scene
  useEffect(() => {
    const { scene, meshMap } = threeRef.current;
    if (!scene) return;

    const currentIds = new Set(Object.keys(state.objects));
    meshMap.forEach((mesh, id) => {
      if (!currentIds.has(id)) {
        scene.remove(mesh);
        if ((mesh as any).__helper) scene.remove((mesh as any).__helper);
        meshMap.delete(id);
      }
    });
    Object.values(state.objects).forEach(obj => syncObject(obj, scene, meshMap));
  }, [state.objects, syncObject]);

  // Grid visibility
  useEffect(() => {
    if (gridRef.current) gridRef.current.visible = state.showGrid;
  }, [state.showGrid]);

  // Pixel filter
  useEffect(() => {
    const { renderer } = threeRef.current;
    if (!renderer || !mountRef.current) return;
    const mount = mountRef.current;
    const W = mount.clientWidth;
    const H = mount.clientHeight;
    if (state.pixelFilter) {
      const ratio = 1 / state.pixelRatio;
      renderer.setSize(Math.floor(W * ratio), Math.floor(H * ratio), false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.imageRendering = 'pixelated';
    } else {
      renderer.setSize(W, H, false);
      renderer.domElement.style.imageRendering = 'auto';
    }
  }, [state.pixelFilter, state.pixelRatio]);

  // Transform gizmo mode + selected object
  useEffect(() => {
    const transform = transformRef.current;
    const { meshMap } = threeRef.current;
    if (!transform) return;
    if (state.selectedId && state.gizmoMode !== 'none') {
      const mesh = meshMap.get(state.selectedId);
      if (mesh) {
        transform.attach(mesh);
        transform.setMode(state.gizmoMode);
        transform.space = state.transformSpace;
      } else {
        transform.detach();
      }
    } else {
      transform.detach();
    }
  }, [state.selectedId, state.gizmoMode, state.transformSpace]);

  // Drag and drop model import
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.name.match(/\.(gltf|glb)$/i)) {
      log('Only .gltf and .glb files are supported', 'error');
      return;
    }
    const url = URL.createObjectURL(file);
    const obj = createObject('model', file.name.replace(/\.(gltf|glb)$/i, ''), {
      modelUrl: url,
      modelName: file.name,
    });
    dispatch({ type: 'ADD_OBJECT', object: obj });
    log(`Model dropped: ${file.name}`, 'info');
  };

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#0D1117' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,107,53,0.08)',
          border: '2px dashed var(--pxlz-orange)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ textAlign: 'center', color: 'var(--pxlz-orange)', fontFamily: "'JetBrains Mono', monospace" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            <div style={{ fontSize: 12 }}>Drop .gltf or .glb to import</div>
          </div>
        </div>
      )}
    </div>
  );
}
