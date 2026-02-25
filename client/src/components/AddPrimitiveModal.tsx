import React from 'react';
import { useEngine, createObject, ObjectType } from '../contexts/EngineContext';

// ============================================================
// PXLZ ENGINE — Add Primitive Modal
// ============================================================

const PRIMITIVES: Array<{ type: ObjectType; label: string; icon: string; color: string }> = [
  { type: 'box', label: 'Box', icon: '⬛', color: '#FF6B35' },
  { type: 'sphere', label: 'Sphere', icon: '⚪', color: '#58A6FF' },
  { type: 'cylinder', label: 'Cylinder', icon: '🔵', color: '#3FB950' },
  { type: 'cone', label: 'Cone', icon: '🔺', color: '#D29922' },
  { type: 'torus', label: 'Torus', icon: '⭕', color: '#BC8CFF' },
  { type: 'plane', label: 'Plane', icon: '▬', color: '#7D8590' },
  { type: 'capsule', label: 'Capsule', icon: '💊', color: '#58A6FF' },
  { type: 'tetrahedron', label: 'Tetra', icon: '△', color: '#E94560' },
  { type: 'octahedron', label: 'Octa', icon: '◇', color: '#FF6B35' },
  { type: 'icosahedron', label: 'Icosa', icon: '⬡', color: '#3FB950' },
];

const LIGHTS: Array<{ type: ObjectType; label: string; icon: string; color: string }> = [
  { type: 'light_point', label: 'Point', icon: '💡', color: '#D29922' },
  { type: 'light_dir', label: 'Directional', icon: '☀', color: '#D29922' },
  { type: 'light_ambient', label: 'Ambient', icon: '🌤', color: '#D29922' },
  { type: 'light_spot', label: 'Spot', icon: '🔦', color: '#D29922' },
];

const OTHERS: Array<{ type: ObjectType; label: string; icon: string; color: string }> = [
  { type: 'empty', label: 'Empty', icon: '○', color: '#7D8590' },
  { type: 'audio', label: 'Audio', icon: '🔊', color: '#BC8CFF' },
];

export default function AddPrimitiveModal() {
  const { state, dispatch } = useEngine();
  if (!state.showAddPrimitiveModal) return null;

  const add = (type: ObjectType, label: string) => {
    const obj = createObject(type, label);
    dispatch({ type: 'ADD_OBJECT', object: obj });
    dispatch({ type: 'TOGGLE_ADD_PRIMITIVE_MODAL' });
  };

  return (
    <div className="pxlz-modal-overlay" onClick={() => dispatch({ type: 'TOGGLE_ADD_PRIMITIVE_MODAL' })}>
      <div className="pxlz-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="pxlz-modal-header">
          <span>Add Object</span>
          <button style={{ background: 'none', border: 'none', color: 'var(--pxlz-text-muted)', cursor: 'pointer', fontSize: 14 }}
            onClick={() => dispatch({ type: 'TOGGLE_ADD_PRIMITIVE_MODAL' })}>✕</button>
        </div>
        <div className="pxlz-modal-body">
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--pxlz-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Primitives</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {PRIMITIVES.map(p => (
                <div key={p.type} className="primitive-card" onClick={() => add(p.type, p.label)}>
                  <span style={{ fontSize: 20, color: p.color }}>{p.icon}</span>
                  <span>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--pxlz-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Lights</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {LIGHTS.map(p => (
                <div key={p.type} className="primitive-card" onClick={() => add(p.type, p.label)}>
                  <span style={{ fontSize: 20, color: p.color }}>{p.icon}</span>
                  <span>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--pxlz-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Other</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {OTHERS.map(p => (
                <div key={p.type} className="primitive-card" onClick={() => add(p.type, p.label)}>
                  <span style={{ fontSize: 20, color: p.color }}>{p.icon}</span>
                  <span>{p.label}</span>
                </div>
              ))}
              <div className="primitive-card" onClick={() => { dispatch({ type: 'TOGGLE_ADD_PRIMITIVE_MODAL' }); dispatch({ type: 'TOGGLE_IMPORT_MODEL_MODAL' }); }}>
                <span style={{ fontSize: 20, color: '#3FB950' }}>📦</span>
                <span>Model</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
