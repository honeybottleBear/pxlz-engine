import React, { useState } from 'react';
import { useEngine } from '../contexts/EngineContext';

// ============================================================
// PXLZ ENGINE — Export Modal
// Generates a standalone HTML5 game bundle
// ============================================================

function generateHTML(state: any): string {
  const objects = JSON.stringify(state.objects, null, 2);
  const scripts = JSON.stringify(state.scripts, null, 2);
  const projectName = state.projectName;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName} — PXLZ Game</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0D1117; overflow: hidden; }
    canvas { display: block; width: 100vw; height: 100vh; image-rendering: pixelated; }
    #loading { position: fixed; inset: 0; background: #0D1117; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #FF6B35; font-family: monospace; z-index: 999; }
    #loading h1 { font-size: 24px; margin-bottom: 8px; }
    #loading p { font-size: 12px; color: #7D8590; }
  </style>
</head>
<body>
  <div id="loading">
    <h1>PXLZ</h1>
    <p>Loading ${projectName}...</p>
  </div>
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
    }
  }
  </script>
  <script type="module">
    import * as THREE from 'three';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

    const OBJECTS = ${objects};
    const SCRIPTS = ${scripts};
    const PIXEL_RATIO = ${state.pixelRatio};
    const PIXEL_FILTER = ${state.pixelFilter};

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0D1117');
    scene.fog = new THREE.Fog('#0D1117', 30, 80);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 8);
    camera.lookAt(0, 0, 0);

    function resize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      if (PIXEL_FILTER) {
        renderer.setSize(Math.floor(window.innerWidth / PIXEL_RATIO), Math.floor(window.innerHeight / PIXEL_RATIO), false);
        renderer.domElement.style.width = '100vw';
        renderer.domElement.style.height = '100vh';
        renderer.domElement.style.imageRendering = 'pixelated';
      } else {
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    }
    window.addEventListener('resize', resize);
    resize();

    // Build geometry
    function buildGeo(type) {
      switch(type) {
        case 'box': return new THREE.BoxGeometry(1,1,1);
        case 'sphere': return new THREE.SphereGeometry(0.5,8,6);
        case 'cylinder': return new THREE.CylinderGeometry(0.5,0.5,1,8);
        case 'cone': return new THREE.ConeGeometry(0.5,1,8);
        case 'torus': return new THREE.TorusGeometry(0.5,0.2,6,12);
        case 'plane': return new THREE.PlaneGeometry(1,1);
        case 'capsule': return new THREE.CapsuleGeometry(0.3,0.6,4,8);
        case 'tetrahedron': return new THREE.TetrahedronGeometry(0.6);
        case 'octahedron': return new THREE.OctahedronGeometry(0.6);
        case 'icosahedron': return new THREE.IcosahedronGeometry(0.6);
        default: return new THREE.BoxGeometry(1,1,1);
      }
    }

    const LIGHT_TYPES = ['light_point','light_dir','light_ambient','light_spot'];
    const meshMap = new Map();
    const scriptInstances = new Map();
    const texLoader = new THREE.TextureLoader();
    const gltfLoader = new GLTFLoader();

    // Build scene
    Object.values(OBJECTS).forEach(obj => {
      let mesh;
      if (LIGHT_TYPES.includes(obj.type)) {
        const color = new THREE.Color(obj.lightColor);
        if (obj.type === 'light_point') mesh = new THREE.PointLight(color, obj.lightIntensity, obj.lightRange);
        else if (obj.type === 'light_dir') mesh = new THREE.DirectionalLight(color, obj.lightIntensity);
        else if (obj.type === 'light_ambient') mesh = new THREE.AmbientLight(color, obj.lightIntensity);
        else mesh = new THREE.SpotLight(color, obj.lightIntensity, obj.lightRange);
        if (mesh.castShadow !== undefined) mesh.castShadow = obj.castShadow;
      } else if (obj.type === 'model' && obj.modelUrl) {
        mesh = new THREE.Group();
        gltfLoader.load(obj.modelUrl, gltf => { mesh.add(gltf.scene); });
      } else if (obj.type === 'empty' || obj.type === 'audio') {
        mesh = new THREE.Group();
      } else {
        const geo = buildGeo(obj.type);
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
          const tex = texLoader.load(obj.textureUrl);
          tex.magFilter = THREE.NearestFilter;
          tex.minFilter = THREE.NearestFilter;
          mat.map = tex;
        }
        mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = obj.castShadow;
        mesh.receiveShadow = obj.receiveShadow;
      }
      mesh.visible = obj.visible;
      mesh.position.set(...obj.position);
      mesh.rotation.set(
        THREE.MathUtils.degToRad(obj.rotation[0]),
        THREE.MathUtils.degToRad(obj.rotation[1]),
        THREE.MathUtils.degToRad(obj.rotation[2])
      );
      mesh.scale.set(...obj.scale);
      mesh.userData.pxlzId = obj.id;
      mesh.userData.pxlzObj = obj;
      scene.add(mesh);
      meshMap.set(obj.id, mesh);
    });

    // Compile and run scripts
    SCRIPTS.forEach(script => {
      try {
        const fn = new Function('THREE', 'scene', 'meshMap', script.code + '\\nreturn { start, update: typeof update !== "undefined" ? update : null, onCollide: typeof onCollide !== "undefined" ? onCollide : null };');
        const instance = fn(THREE, scene, meshMap);
        scriptInstances.set(script.id, instance);
        if (instance.start) instance.start();
      } catch(e) {
        console.error('Script error:', e);
      }
    });

    // Audio
    Object.values(OBJECTS).forEach(obj => {
      if (obj.audios && obj.audios.length > 0) {
        obj.audios.forEach(audio => {
          if (audio.autoplay) {
            const a = new Audio(audio.url);
            a.loop = audio.loop;
            a.volume = audio.volume;
            a.play().catch(() => {});
          }
        });
      }
    });

    document.getElementById('loading').style.display = 'none';

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const dt = clock.getDelta();
      scriptInstances.forEach(inst => {
        if (inst.update) {
          try { inst.update(dt); } catch(e) { console.error(e); }
        }
      });
      renderer.render(scene, camera);
    }
    animate();
  </script>
</body>
</html>`;
}

export default function ExportModal() {
  const { state, dispatch, log } = useEngine();
  const [platform, setPlatform] = useState<'html5' | 'zip'>('html5');
  const [exporting, setExporting] = useState(false);

  if (!state.showExportModal) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      const html = generateHTML(state);
      if (platform === 'html5') {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.projectName}.html`;
        a.click();
        URL.revokeObjectURL(url);
        log(`Exported as HTML5: ${state.projectName}.html`, 'info');
      } else {
        // ZIP export: HTML + scene JSON
        const sceneJson = JSON.stringify({ objects: state.objects, scripts: state.scripts, projectName: state.projectName }, null, 2);
        // Simple multi-file download
        const htmlBlob = new Blob([html], { type: 'text/html' });
        const jsonBlob = new Blob([sceneJson], { type: 'application/json' });
        const htmlUrl = URL.createObjectURL(htmlBlob);
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const a1 = document.createElement('a');
        a1.href = htmlUrl; a1.download = `${state.projectName}/index.html`; a1.click();
        setTimeout(() => {
          const a2 = document.createElement('a');
          a2.href = jsonUrl; a2.download = `${state.projectName}/scene.json`; a2.click();
          URL.revokeObjectURL(htmlUrl);
          URL.revokeObjectURL(jsonUrl);
        }, 500);
        log(`Exported as ZIP package: ${state.projectName}`, 'info');
      }
    } catch (e) {
      log(`Export failed: ${e}`, 'error');
    }
    setExporting(false);
    dispatch({ type: 'TOGGLE_EXPORT_MODAL' });
  };

  return (
    <div className="pxlz-modal-overlay" onClick={() => dispatch({ type: 'TOGGLE_EXPORT_MODAL' })}>
      <div className="pxlz-modal" onClick={e => e.stopPropagation()}>
        <div className="pxlz-modal-header">
          <span>Export Game</span>
          <button style={{ background: 'none', border: 'none', color: 'var(--pxlz-text-muted)', cursor: 'pointer', fontSize: 14 }}
            onClick={() => dispatch({ type: 'TOGGLE_EXPORT_MODAL' })}>✕</button>
        </div>
        <div className="pxlz-modal-body">
          <div style={{ marginBottom: 16 }}>
            <div className="pxlz-label" style={{ marginBottom: 8 }}>Project Name</div>
            <input
              className="pxlz-input"
              value={state.projectName}
              onChange={e => dispatch({ type: 'SET_PROJECT_NAME', name: e.target.value })}
              style={{ fontSize: 12 }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="pxlz-label" style={{ marginBottom: 8 }}>Export Platform</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { id: 'html5' as const, label: 'HTML5', icon: '🌐', desc: 'Single .html file, runs in any browser' },
                { id: 'zip' as const, label: 'Web Package', icon: '📦', desc: 'HTML + scene JSON files' },
              ].map(p => (
                <div
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  style={{
                    padding: '12px',
                    border: `1px solid ${platform === p.id ? 'var(--pxlz-orange)' : 'var(--pxlz-border)'}`,
                    background: platform === p.id ? 'rgba(255,107,53,0.1)' : 'var(--pxlz-bg)',
                    cursor: 'pointer',
                    borderRadius: 2,
                    transition: 'all 0.1s',
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{p.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: platform === p.id ? 'var(--pxlz-orange)' : 'var(--pxlz-text)', marginBottom: 2 }}>{p.label}</div>
                  <div style={{ fontSize: 9, color: 'var(--pxlz-text-muted)' }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '10px', background: 'var(--pxlz-bg)', border: '1px solid var(--pxlz-border)', borderRadius: 2, fontSize: 10, color: 'var(--pxlz-text-muted)' }}>
            <div style={{ color: 'var(--pxlz-text)', marginBottom: 4, fontWeight: 600 }}>Export Summary</div>
            <div>Objects: {Object.keys(state.objects).length}</div>
            <div>Scripts: {state.scripts.length}</div>
            <div>Pixel Filter: {state.pixelFilter ? `On (${state.pixelRatio}x downscale)` : 'Off'}</div>
          </div>
        </div>
        <div className="pxlz-modal-footer">
          <button className="pxlz-btn" onClick={() => dispatch({ type: 'TOGGLE_EXPORT_MODAL' })}>Cancel</button>
          <button className="pxlz-btn-primary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : `Export ${platform === 'html5' ? 'HTML5' : 'Package'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
