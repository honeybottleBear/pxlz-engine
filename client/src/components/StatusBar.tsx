import React from 'react';
import { useEngine } from '../contexts/EngineContext';

// ============================================================
// PXLZ ENGINE — Status Bar (bottom of screen)
// ============================================================

export default function StatusBar() {
  const { state } = useEngine();
  const selectedObj = state.selectedId ? state.objects[state.selectedId] : null;

  return (
    <div style={{
      height: 22,
      background: 'var(--pxlz-bg)',
      borderTop: '1px solid var(--pxlz-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 10px',
      gap: 16,
      flexShrink: 0,
      fontSize: 9,
      color: 'var(--pxlz-text-muted)',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <span style={{ color: 'var(--pxlz-orange)', fontFamily: "'Press Start 2P', monospace", fontSize: 7 }}>PXLZ</span>
      <span>Objects: {Object.keys(state.objects).length}</span>
      <span>Scripts: {state.scripts.length}</span>
      {selectedObj && (
        <>
          <span style={{ color: 'var(--pxlz-border)' }}>|</span>
          <span>Selected: <span style={{ color: 'var(--pxlz-orange)' }}>{selectedObj.name}</span></span>
          <span>
            Pos: ({selectedObj.position.map(v => v.toFixed(2)).join(', ')})
          </span>
        </>
      )}
      <div style={{ flex: 1 }} />
      <span>
        Gizmo: <span style={{ color: 'var(--pxlz-text)' }}>{state.gizmoMode.toUpperCase()}</span>
      </span>
      <span>
        Space: <span style={{ color: 'var(--pxlz-text)' }}>{state.transformSpace.toUpperCase()}</span>
      </span>
      {state.isPlaying && (
        <span style={{ color: 'var(--pxlz-green)', animation: 'pulse 1s infinite' }}>● PLAYING</span>
      )}
      {state.pixelFilter && (
        <span style={{ color: 'var(--pxlz-orange)' }}>PIXEL {state.pixelRatio}×</span>
      )}
      <span>Three.js r183</span>
    </div>
  );
}
