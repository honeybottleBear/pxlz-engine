import React, { useState } from 'react';
import { useEngine, GizmoMode } from '../contexts/EngineContext';

// ============================================================
// PXLZ ENGINE — Main Toolbar
// Design: Dark Workstation + Pixel Accent
// ============================================================

function GizmoBtn({ mode, icon, title, shortcut }: { mode: GizmoMode; icon: string; title: string; shortcut: string }) {
  const { state, dispatch } = useEngine();
  return (
    <button
      className={`gizmo-btn ${state.gizmoMode === mode ? 'active' : ''}`}
      title={`${title} (${shortcut})`}
      onClick={() => dispatch({ type: 'SET_GIZMO_MODE', mode })}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
    </button>
  );
}

export default function Toolbar() {
  const { state, dispatch } = useEngine();
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(state.projectName);

  const handleNameSave = () => {
    dispatch({ type: 'SET_PROJECT_NAME', name: nameVal.trim() || 'MyPXLZGame' });
    setEditingName(false);
  };

  return (
    <div style={{
      height: 44,
      background: 'var(--pxlz-panel)',
      borderBottom: '2px solid var(--pxlz-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 10px',
      gap: 4,
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* PXLZ Logo */}
      <div style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 12,
        color: 'var(--pxlz-orange)',
        letterSpacing: '0.05em',
        marginRight: 8,
        userSelect: 'none',
        flexShrink: 0,
        textShadow: '0 0 8px rgba(255,107,53,0.4)',
      }}>
        PXLZ
      </div>

      <div style={{ width: 1, height: 24, background: 'var(--pxlz-border)', marginRight: 4 }} />

      {/* Gizmo tools */}
      <GizmoBtn mode="none" icon="↖" title="Select" shortcut="Q" />
      <GizmoBtn mode="translate" icon="✛" title="Move" shortcut="W" />
      <GizmoBtn mode="rotate" icon="↻" title="Rotate" shortcut="E" />
      <GizmoBtn mode="scale" icon="⤢" title="Scale" shortcut="R" />

      <div style={{ width: 1, height: 24, background: 'var(--pxlz-border)', margin: '0 4px' }} />

      {/* Transform space */}
      <button
        className={`pxlz-btn ${state.transformSpace === 'local' ? 'active' : ''}`}
        title="Toggle World/Local Space"
        onClick={() => dispatch({ type: 'SET_TRANSFORM_SPACE', space: state.transformSpace === 'world' ? 'local' : 'world' })}
        style={{ fontSize: 9, padding: '2px 8px', letterSpacing: '0.05em' }}
      >
        {state.transformSpace === 'world' ? 'WORLD' : 'LOCAL'}
      </button>

      <button
        className={`pxlz-btn ${state.snapEnabled ? 'active' : ''}`}
        title="Toggle Snap to Grid"
        onClick={() => dispatch({ type: 'TOGGLE_SNAP' })}
        style={{ fontSize: 9, padding: '2px 8px', letterSpacing: '0.05em' }}
      >
        SNAP {state.snapEnabled ? `${state.snapValue}` : 'OFF'}
      </button>

      <div style={{ width: 1, height: 24, background: 'var(--pxlz-border)', margin: '0 4px' }} />

      {/* View options */}
      <button
        className={`pxlz-btn ${state.showGrid ? 'active' : ''}`}
        title="Toggle Grid (G)"
        onClick={() => dispatch({ type: 'TOGGLE_GRID' })}
        style={{ fontSize: 9, padding: '2px 8px' }}
      >
        GRID
      </button>
      <button
        className={`pxlz-btn ${state.showWireframe ? 'active' : ''}`}
        title="Toggle Wireframe"
        onClick={() => dispatch({ type: 'TOGGLE_WIREFRAME' })}
        style={{ fontSize: 9, padding: '2px 8px' }}
      >
        WIRE
      </button>

      {/* Pixel filter */}
      <button
        className={`pxlz-btn ${state.pixelFilter ? 'active' : ''}`}
        title="Pixel Filter"
        onClick={() => dispatch({ type: 'TOGGLE_PIXEL_FILTER' })}
        style={{ fontSize: 9, padding: '2px 8px' }}
      >
        PIXEL
      </button>
      {state.pixelFilter && (
        <select
          className="pxlz-select"
          value={state.pixelRatio}
          onChange={e => dispatch({ type: 'SET_PIXEL_RATIO', ratio: parseInt(e.target.value) })}
          style={{ fontSize: 9, padding: '2px 4px', height: 24 }}
          title="Pixel Resolution"
        >
          <option value={2}>2×</option>
          <option value={3}>3×</option>
          <option value={4}>4×</option>
          <option value={6}>6×</option>
          <option value={8}>8×</option>
        </select>
      )}

      <div style={{ flex: 1 }} />

      {/* Project name */}
      {editingName ? (
        <input
          className="pxlz-input"
          value={nameVal}
          autoFocus
          onChange={e => setNameVal(e.target.value)}
          onBlur={handleNameSave}
          onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditingName(false); }}
          style={{ fontSize: 10, maxWidth: 140, height: 24, padding: '2px 6px' }}
        />
      ) : (
        <div
          style={{ fontSize: 10, color: 'var(--pxlz-text-muted)', cursor: 'pointer', padding: '2px 6px', border: '1px solid transparent', borderRadius: 2, transition: 'all 0.1s', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title="Click to rename project"
          onClick={() => { setNameVal(state.projectName); setEditingName(true); }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--pxlz-border)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
        >
          {state.projectName}
        </div>
      )}

      <div style={{ width: 1, height: 24, background: 'var(--pxlz-border)', margin: '0 4px' }} />

      {/* Add object */}
      <button
        className="pxlz-btn"
        style={{ fontSize: 9, padding: '2px 10px' }}
        onClick={() => dispatch({ type: 'TOGGLE_ADD_PRIMITIVE_MODAL' })}
        title="Add Object"
      >
        + Add
      </button>

      <button
        className="pxlz-btn"
        style={{ fontSize: 9, padding: '2px 10px' }}
        onClick={() => dispatch({ type: 'TOGGLE_IMPORT_MODEL_MODAL' })}
        title="Import 3D Model"
      >
        📦 Model
      </button>

      <div style={{ width: 1, height: 24, background: 'var(--pxlz-border)', margin: '0 4px' }} />

      {/* Play / Stop */}
      {!state.isPlaying ? (
        <button
          className="play-btn play"
          onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
          title="Play (P)"
        >
          ▶ Play
        </button>
      ) : (
        <button
          className="play-btn stop"
          onClick={() => dispatch({ type: 'STOP_PLAY' })}
          title="Stop (Esc)"
        >
          ■ Stop
        </button>
      )}

      <div style={{ width: 1, height: 24, background: 'var(--pxlz-border)', margin: '0 4px' }} />

      {/* Export */}
      <button
        className="pxlz-btn-primary"
        style={{ fontSize: 9, padding: '4px 12px', letterSpacing: '0.05em' }}
        onClick={() => dispatch({ type: 'TOGGLE_EXPORT_MODAL' })}
        title="Export Game"
      >
        EXPORT ↗
      </button>
    </div>
  );
}
