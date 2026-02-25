import React, { useState, useRef } from 'react';
import { useEngine, SceneObject, ScriptEntry, AudioEntry, createObject } from '../contexts/EngineContext';

// ============================================================
// PXLZ ENGINE — Inspector Panel
// ============================================================

function Vec3Row({ label, values, onChange, step = 0.1 }: {
  label: string;
  values: [number, number, number];
  onChange: (v: [number, number, number]) => void;
  step?: number;
}) {
  const fmt = (n: number) => parseFloat(n.toFixed(3)).toString();
  return (
    <div className="prop-row">
      <span className="prop-label">{label}</span>
      <div className="prop-value vec3-row">
        {(['x', 'y', 'z'] as const).map((axis, i) => (
          <div key={axis} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 8, color: axis === 'x' ? '#ff6b6b' : axis === 'y' ? '#6bff6b' : '#6b9eff', textAlign: 'center', textTransform: 'uppercase' }}>{axis}</span>
            <input
              type="number"
              className="vec3-input"
              value={fmt(values[i])}
              step={step}
              onChange={e => {
                const v = [...values] as [number, number, number];
                v[i] = parseFloat(e.target.value) || 0;
                onChange(v);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid var(--pxlz-border)' }}>
      <div
        style={{ padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--pxlz-bg)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--pxlz-text-muted)', userSelect: 'none' }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ fontSize: 8 }}>{open ? '▾' : '▸'}</span>
        {title}
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}

function TransformSection({ obj }: { obj: SceneObject }) {
  const { dispatch } = useEngine();
  const update = (patch: Partial<SceneObject>) => dispatch({ type: 'UPDATE_OBJECT', id: obj.id, patch });
  return (
    <Section title="Transform">
      <Vec3Row label="Position" values={obj.position} onChange={v => update({ position: v })} />
      <Vec3Row label="Rotation" values={obj.rotation} onChange={v => update({ rotation: v })} step={1} />
      <Vec3Row label="Scale" values={obj.scale} onChange={v => update({ scale: v })} />
    </Section>
  );
}

function MaterialSection({ obj }: { obj: SceneObject }) {
  const { dispatch } = useEngine();
  const update = (patch: Partial<SceneObject>) => dispatch({ type: 'UPDATE_OBJECT', id: obj.id, patch });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    update({ textureUrl: url });
  };

  return (
    <Section title="Material">
      <div className="prop-row">
        <span className="prop-label">Color</span>
        <div className="prop-value" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="color" value={obj.color} onChange={e => update({ color: e.target.value })}
            style={{ width: 28, height: 20, border: '1px solid var(--pxlz-border)', background: 'none', cursor: 'pointer', padding: 0 }} />
          <input className="pxlz-input" value={obj.color} onChange={e => update({ color: e.target.value })} style={{ flex: 1 }} />
        </div>
      </div>
      <div className="prop-row">
        <span className="prop-label">Roughness</span>
        <div className="prop-value" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="range" min={0} max={1} step={0.01} value={obj.roughness} onChange={e => update({ roughness: parseFloat(e.target.value) })}
            style={{ flex: 1, accentColor: 'var(--pxlz-orange)' }} />
          <span style={{ fontSize: 10, color: 'var(--pxlz-text)', minWidth: 28, textAlign: 'right' }}>{obj.roughness.toFixed(2)}</span>
        </div>
      </div>
      <div className="prop-row">
        <span className="prop-label">Metalness</span>
        <div className="prop-value" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="range" min={0} max={1} step={0.01} value={obj.metalness} onChange={e => update({ metalness: parseFloat(e.target.value) })}
            style={{ flex: 1, accentColor: 'var(--pxlz-orange)' }} />
          <span style={{ fontSize: 10, color: 'var(--pxlz-text)', minWidth: 28, textAlign: 'right' }}>{obj.metalness.toFixed(2)}</span>
        </div>
      </div>
      <div className="prop-row">
        <span className="prop-label">Opacity</span>
        <div className="prop-value" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="range" min={0} max={1} step={0.01} value={obj.opacity} onChange={e => update({ opacity: parseFloat(e.target.value) })}
            style={{ flex: 1, accentColor: 'var(--pxlz-orange)' }} />
          <span style={{ fontSize: 10, color: 'var(--pxlz-text)', minWidth: 28, textAlign: 'right' }}>{obj.opacity.toFixed(2)}</span>
        </div>
      </div>
      <div className="prop-row">
        <span className="prop-label">Options</span>
        <div className="prop-value" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={obj.wireframe} onChange={e => update({ wireframe: e.target.checked })} style={{ accentColor: 'var(--pxlz-orange)' }} />
            Wireframe
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={obj.flatShading} onChange={e => update({ flatShading: e.target.checked })} style={{ accentColor: 'var(--pxlz-orange)' }} />
            Flat Shade
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={obj.castShadow} onChange={e => update({ castShadow: e.target.checked })} style={{ accentColor: 'var(--pxlz-orange)' }} />
            Cast Shadow
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={obj.receiveShadow} onChange={e => update({ receiveShadow: e.target.checked })} style={{ accentColor: 'var(--pxlz-orange)' }} />
            Recv Shadow
          </label>
        </div>
      </div>
      <div className="prop-row">
        <span className="prop-label">Texture</span>
        <div className="prop-value" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {obj.textureUrl && (
            <img src={obj.textureUrl} style={{ width: 24, height: 24, imageRendering: 'pixelated', border: '1px solid var(--pxlz-border)' }} />
          )}
          <button className="pxlz-btn" style={{ fontSize: 10 }} onClick={() => fileRef.current?.click()}>
            {obj.textureUrl ? 'Change' : 'Upload'}
          </button>
          {obj.textureUrl && (
            <button className="pxlz-btn" style={{ fontSize: 10, color: 'var(--pxlz-red)' }} onClick={() => update({ textureUrl: null })}>✕</button>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleTextureUpload} />
        </div>
      </div>
    </Section>
  );
}

function LightSection({ obj }: { obj: SceneObject }) {
  const { dispatch } = useEngine();
  const update = (patch: Partial<SceneObject>) => dispatch({ type: 'UPDATE_OBJECT', id: obj.id, patch });
  return (
    <Section title="Light">
      <div className="prop-row">
        <span className="prop-label">Color</span>
        <div className="prop-value" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="color" value={obj.lightColor} onChange={e => update({ lightColor: e.target.value })}
            style={{ width: 28, height: 20, border: '1px solid var(--pxlz-border)', background: 'none', cursor: 'pointer', padding: 0 }} />
          <input className="pxlz-input" value={obj.lightColor} onChange={e => update({ lightColor: e.target.value })} style={{ flex: 1 }} />
        </div>
      </div>
      <div className="prop-row">
        <span className="prop-label">Intensity</span>
        <div className="prop-value" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="range" min={0} max={5} step={0.05} value={obj.lightIntensity} onChange={e => update({ lightIntensity: parseFloat(e.target.value) })}
            style={{ flex: 1, accentColor: 'var(--pxlz-orange)' }} />
          <span style={{ fontSize: 10, color: 'var(--pxlz-text)', minWidth: 28, textAlign: 'right' }}>{obj.lightIntensity.toFixed(2)}</span>
        </div>
      </div>
      {(obj.type === 'light_point' || obj.type === 'light_spot') && (
        <div className="prop-row">
          <span className="prop-label">Range</span>
          <div className="prop-value" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="range" min={0} max={50} step={0.5} value={obj.lightRange} onChange={e => update({ lightRange: parseFloat(e.target.value) })}
              style={{ flex: 1, accentColor: 'var(--pxlz-orange)' }} />
            <span style={{ fontSize: 10, color: 'var(--pxlz-text)', minWidth: 28, textAlign: 'right' }}>{obj.lightRange.toFixed(1)}</span>
          </div>
        </div>
      )}
      <div className="prop-row">
        <span className="prop-label">Shadow</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={obj.castShadow} onChange={e => update({ castShadow: e.target.checked })} style={{ accentColor: 'var(--pxlz-orange)' }} />
          Cast Shadow
        </label>
      </div>
    </Section>
  );
}

function PhysicsSection({ obj }: { obj: SceneObject }) {
  const { dispatch } = useEngine();
  const update = (patch: Partial<SceneObject>) => dispatch({ type: 'UPDATE_OBJECT', id: obj.id, patch });
  const p = obj.physics;
  return (
    <Section title="Physics" defaultOpen={false}>
      <div className="prop-row">
        <span className="prop-label">Enabled</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={p.enabled} onChange={e => update({ physics: { ...p, enabled: e.target.checked } })} style={{ accentColor: 'var(--pxlz-orange)' }} />
          Physics Body
        </label>
      </div>
      {p.enabled && <>
        <div className="prop-row">
          <span className="prop-label">Type</span>
          <select className="pxlz-select prop-value" value={p.type} onChange={e => update({ physics: { ...p, type: e.target.value as any } })}>
            <option value="dynamic">Dynamic</option>
            <option value="static">Static</option>
            <option value="kinematic">Kinematic</option>
          </select>
        </div>
        <div className="prop-row">
          <span className="prop-label">Shape</span>
          <select className="pxlz-select prop-value" value={p.shape} onChange={e => update({ physics: { ...p, shape: e.target.value as any } })}>
            <option value="box">Box</option>
            <option value="sphere">Sphere</option>
            <option value="capsule">Capsule</option>
            <option value="trimesh">Trimesh</option>
          </select>
        </div>
        <div className="prop-row">
          <span className="prop-label">Mass</span>
          <input type="number" className="pxlz-input prop-value" value={p.mass} step={0.1} onChange={e => update({ physics: { ...p, mass: parseFloat(e.target.value) || 0 } })} />
        </div>
        <div className="prop-row">
          <span className="prop-label">Restitution</span>
          <div className="prop-value" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="range" min={0} max={1} step={0.01} value={p.restitution} onChange={e => update({ physics: { ...p, restitution: parseFloat(e.target.value) } })}
              style={{ flex: 1, accentColor: 'var(--pxlz-orange)' }} />
            <span style={{ fontSize: 10, minWidth: 28, textAlign: 'right' }}>{p.restitution.toFixed(2)}</span>
          </div>
        </div>
        <div className="prop-row">
          <span className="prop-label">Friction</span>
          <div className="prop-value" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="range" min={0} max={1} step={0.01} value={p.friction} onChange={e => update({ physics: { ...p, friction: parseFloat(e.target.value) } })}
              style={{ flex: 1, accentColor: 'var(--pxlz-orange)' }} />
            <span style={{ fontSize: 10, minWidth: 28, textAlign: 'right' }}>{p.friction.toFixed(2)}</span>
          </div>
        </div>
      </>}
    </Section>
  );
}

function ScriptsSection({ obj }: { obj: SceneObject }) {
  const { state, dispatch } = useEngine();
  const [showAssign, setShowAssign] = useState(false);

  const handleAssign = (script: ScriptEntry) => {
    dispatch({ type: 'ASSIGN_SCRIPT_TO_OBJECT', objectId: obj.id, script });
    setShowAssign(false);
  };

  return (
    <Section title="Scripts" defaultOpen={false}>
      {obj.scripts.length === 0 && (
        <div style={{ padding: '8px 10px', fontSize: 10, color: 'var(--pxlz-text-muted)' }}>No scripts assigned.</div>
      )}
      {obj.scripts.map(s => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', padding: '4px 10px', gap: 6, borderBottom: '1px solid rgba(48,54,61,0.4)' }}>
          <span style={{ fontSize: 10, flex: 1, color: 'var(--pxlz-blue)' }}>📜 {s.name}</span>
          <button className="pxlz-btn" style={{ fontSize: 9, padding: '1px 6px' }}
            onClick={() => { dispatch({ type: 'SET_ACTIVE_SCRIPT', id: s.id }); dispatch({ type: 'SET_BOTTOM_PANEL', panel: 'assets' }); }}>
            Edit
          </button>
          <button className="pxlz-btn" style={{ fontSize: 9, padding: '1px 6px', color: 'var(--pxlz-red)' }}
            onClick={() => dispatch({ type: 'REMOVE_SCRIPT_FROM_OBJECT', objectId: obj.id, scriptId: s.id })}>
            ✕
          </button>
        </div>
      ))}
      <div style={{ padding: '6px 10px', display: 'flex', gap: 6 }}>
        <button className="pxlz-btn" style={{ fontSize: 10 }} onClick={() => setShowAssign(!showAssign)}>
          + Assign Script
        </button>
        <button className="pxlz-btn" style={{ fontSize: 10 }} onClick={() => {
          const id = Math.random().toString(36).slice(2, 10);
          const script: ScriptEntry = { id, name: `Script_${id.slice(0, 4)}`, code: `// Script: ${id}\n// Called each frame during play\nfunction update(dt) {\n  // this.position.x += dt;\n}\n` };
          dispatch({ type: 'ADD_SCRIPT', script });
          dispatch({ type: 'ASSIGN_SCRIPT_TO_OBJECT', objectId: obj.id, script });
        }}>
          + New Script
        </button>
      </div>
      {showAssign && state.scripts.length > 0 && (
        <div style={{ padding: '0 10px 8px' }}>
          {state.scripts.filter(s => !obj.scripts.find(os => os.id === s.id)).map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
              <span style={{ fontSize: 10, flex: 1, color: 'var(--pxlz-blue)' }}>📜 {s.name}</span>
              <button className="pxlz-btn" style={{ fontSize: 9, padding: '1px 6px' }} onClick={() => handleAssign(s)}>Assign</button>
            </div>
          ))}
          {state.scripts.filter(s => !obj.scripts.find(os => os.id === s.id)).length === 0 && (
            <div style={{ fontSize: 10, color: 'var(--pxlz-text-muted)' }}>All scripts already assigned.</div>
          )}
        </div>
      )}
    </Section>
  );
}

function AudioSection({ obj }: { obj: SceneObject }) {
  const { dispatch } = useEngine();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const audio: AudioEntry = {
      id: Math.random().toString(36).slice(2, 10),
      name: file.name,
      url,
      loop: false,
      autoplay: false,
      volume: 1,
    };
    dispatch({ type: 'UPDATE_OBJECT', id: obj.id, patch: { audios: [...obj.audios, audio] } });
  };

  const updateAudio = (audioId: string, patch: Partial<AudioEntry>) => {
    dispatch({ type: 'UPDATE_OBJECT', id: obj.id, patch: { audios: obj.audios.map(a => a.id === audioId ? { ...a, ...patch } : a) } });
  };

  const removeAudio = (audioId: string) => {
    dispatch({ type: 'UPDATE_OBJECT', id: obj.id, patch: { audios: obj.audios.filter(a => a.id !== audioId) } });
  };

  return (
    <Section title="Audio" defaultOpen={false}>
      {obj.audios.map(audio => (
        <div key={audio.id} style={{ padding: '6px 10px', borderBottom: '1px solid rgba(48,54,61,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 10, flex: 1, color: 'var(--pxlz-purple)' }}>🔊 {audio.name}</span>
            <button className="pxlz-btn" style={{ fontSize: 9, padding: '1px 6px', color: 'var(--pxlz-red)' }} onClick={() => removeAudio(audio.id)}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={audio.loop} onChange={e => updateAudio(audio.id, { loop: e.target.checked })} style={{ accentColor: 'var(--pxlz-orange)' }} />
              Loop
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={audio.autoplay} onChange={e => updateAudio(audio.id, { autoplay: e.target.checked })} style={{ accentColor: 'var(--pxlz-orange)' }} />
              Autoplay
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 9, color: 'var(--pxlz-text-muted)', minWidth: 40 }}>Volume</span>
            <input type="range" min={0} max={1} step={0.01} value={audio.volume} onChange={e => updateAudio(audio.id, { volume: parseFloat(e.target.value) })}
              style={{ flex: 1, accentColor: 'var(--pxlz-orange)' }} />
            <span style={{ fontSize: 9, minWidth: 24, textAlign: 'right' }}>{audio.volume.toFixed(2)}</span>
          </div>
        </div>
      ))}
      <div style={{ padding: '6px 10px' }}>
        <button className="pxlz-btn" style={{ fontSize: 10 }} onClick={() => fileRef.current?.click()}>
          + Upload Audio
        </button>
        <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleAudioUpload} />
      </div>
    </Section>
  );
}

const LIGHT_TYPES = ['light_point', 'light_dir', 'light_ambient', 'light_spot'];

export default function Inspector() {
  const { state, dispatch } = useEngine();
  const obj = state.selectedId ? state.objects[state.selectedId] : null;

  if (!obj) {
    return (
      <div style={{ padding: 16, color: 'var(--pxlz-text-muted)', fontSize: 11, textAlign: 'center' }}>
        <div style={{ marginBottom: 8, fontSize: 24 }}>○</div>
        Select an object to inspect
      </div>
    );
  }

  const isLightObj = LIGHT_TYPES.includes(obj.type);
  const isMesh = !isLightObj && obj.type !== 'empty' && obj.type !== 'audio';

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--pxlz-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <input
            className="pxlz-input"
            value={obj.name}
            onChange={e => dispatch({ type: 'RENAME_OBJECT', id: obj.id, name: e.target.value })}
            style={{ fontWeight: 700, fontSize: 12 }}
          />
        </div>
        <span className="pxlz-badge" style={{ color: 'var(--pxlz-orange)', borderColor: 'var(--pxlz-orange)', fontSize: 8 }}>
          {obj.type.toUpperCase()}
        </span>
      </div>

      <TransformSection obj={obj} />
      {isMesh && <MaterialSection obj={obj} />}
      {isLightObj && <LightSection obj={obj} />}
      <PhysicsSection obj={obj} />
      <ScriptsSection obj={obj} />
      <AudioSection obj={obj} />
    </div>
  );
}
