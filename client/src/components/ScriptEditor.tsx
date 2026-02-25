import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useEngine, ScriptEntry } from '../contexts/EngineContext';

// ============================================================
// PXLZ ENGINE — Script Editor (Monaco + JS Syntax Highlighting)
// ============================================================

const DEFAULT_SCRIPT = `// PXLZ Script
// Available globals: scene, objects, physics, input, audio, time
// 
// Lifecycle functions:
//   start()   - called once when game starts
//   update(dt) - called every frame (dt = delta time in seconds)
//   onCollide(other) - called on physics collision

function start() {
  // Initialize your object here
  console.log("Script started!");
}

function update(dt) {
  // Called every frame
  // Example: rotate the object
  // this.rotation.y += dt * 45; // 45 degrees per second
}

function onCollide(other) {
  // Called when this object collides with another
  // console.log("Collided with:", other.name);
}
`;

export default function ScriptEditor() {
  const { state, dispatch } = useEngine();
  const [newScriptName, setNewScriptName] = useState('');

  const activeScript = state.scripts.find(s => s.id === state.activeScriptId) || null;

  const handleCodeChange = (value: string | undefined) => {
    if (!activeScript || value === undefined) return;
    dispatch({ type: 'UPDATE_SCRIPT', id: activeScript.id, patch: { code: value } });
  };

  const handleNewScript = () => {
    const name = newScriptName.trim() || `Script_${Math.random().toString(36).slice(2, 6)}`;
    const id = Math.random().toString(36).slice(2, 10);
    dispatch({ type: 'ADD_SCRIPT', script: { id, name, code: DEFAULT_SCRIPT } });
    setNewScriptName('');
  };

  const handleRename = (id: string, name: string) => {
    dispatch({ type: 'UPDATE_SCRIPT', id, patch: { name } });
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Script list sidebar */}
      <div style={{ width: 180, borderRight: '1px solid var(--pxlz-border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div className="pxlz-section-header">
          <span>Scripts</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {state.scripts.length === 0 && (
            <div style={{ padding: '12px 10px', fontSize: 10, color: 'var(--pxlz-text-muted)', textAlign: 'center' }}>
              No scripts yet.
            </div>
          )}
          {state.scripts.map(s => (
            <div
              key={s.id}
              className={`tree-item ${state.activeScriptId === s.id ? 'selected' : ''}`}
              onClick={() => dispatch({ type: 'SET_ACTIVE_SCRIPT', id: s.id })}
              style={{ justifyContent: 'space-between' }}
            >
              <span style={{ fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                📜 {s.name}
              </span>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--pxlz-red)', fontSize: 10, padding: '0 2px', cursor: 'pointer', flexShrink: 0 }}
                onClick={e => { e.stopPropagation(); dispatch({ type: 'REMOVE_SCRIPT', id: s.id }); }}
                title="Delete script"
              >✕</button>
            </div>
          ))}
        </div>
        <div style={{ padding: '6px 8px', borderTop: '1px solid var(--pxlz-border)', display: 'flex', gap: 4 }}>
          <input
            className="pxlz-input"
            placeholder="Script name..."
            value={newScriptName}
            onChange={e => setNewScriptName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleNewScript(); }}
            style={{ fontSize: 10, flex: 1 }}
          />
          <button className="pxlz-btn-primary" style={{ fontSize: 10, padding: '2px 8px' }} onClick={handleNewScript}>+</button>
        </div>
      </div>

      {/* Editor area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeScript ? (
          <>
            <div style={{ padding: '4px 10px', borderBottom: '1px solid var(--pxlz-border)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--pxlz-bg)' }}>
              <input
                className="pxlz-input"
                value={activeScript.name}
                onChange={e => handleRename(activeScript.id, e.target.value)}
                style={{ fontSize: 11, fontWeight: 600, maxWidth: 200 }}
              />
              <span style={{ fontSize: 10, color: 'var(--pxlz-text-muted)' }}>JavaScript</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 9, color: 'var(--pxlz-text-muted)' }}>Ctrl+S to save</span>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Editor
                height="100%"
                language="javascript"
                value={activeScript.code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  renderLineHighlight: 'line',
                  cursorStyle: 'line',
                  wordWrap: 'on',
                  tabSize: 2,
                  automaticLayout: true,
                  padding: { top: 8, bottom: 8 },
                  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                }}
              />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--pxlz-text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📜</div>
            <div style={{ fontSize: 12, marginBottom: 6 }}>No script selected</div>
            <div style={{ fontSize: 10 }}>Create or select a script from the list</div>
            <button className="pxlz-btn-primary" style={{ marginTop: 16, fontSize: 11 }} onClick={handleNewScript}>
              + New Script
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
