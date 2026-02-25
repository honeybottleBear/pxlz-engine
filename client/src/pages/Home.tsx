import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EngineProvider, useEngine } from '../contexts/EngineContext';
import Viewport from '../components/Viewport';
import SceneHierarchy from '../components/SceneHierarchy';
import Inspector from '../components/Inspector';
import ScriptEditor from '../components/ScriptEditor';
import ConsolePanel from '../components/ConsolePanel';
import Toolbar from '../components/Toolbar';
import AddPrimitiveModal from '../components/AddPrimitiveModal';
import ImportModelModal from '../components/ImportModelModal';
import ExportModal from '../components/ExportModal';
import { usePhysics } from '../hooks/usePhysics';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import WelcomeSplash from '../components/WelcomeSplash';
import StatusBar from '../components/StatusBar';

// ============================================================
// PXLZ ENGINE — Main Layout
// Three-column: Left (scene/assets) | Center (viewport) | Right (inspector)
// Bottom: Console / Script Editor
// ============================================================

function EngineLayout() {
  usePhysics();
  useKeyboardShortcuts();

  const { state, dispatch } = useEngine();
  const [showWelcome, setShowWelcome] = useState(true);

  // Panel sizes
  const [leftWidth, setLeftWidth] = useState(220);
  const [rightWidth, setRightWidth] = useState(260);
  const [bottomHeight, setBottomHeight] = useState(160);

  // Resize state
  const draggingLeft = useRef(false);
  const draggingRight = useRef(false);
  const draggingBottom = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startVal = useRef(0);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (draggingLeft.current) {
      const delta = e.clientX - startX.current;
      setLeftWidth(Math.max(160, Math.min(400, startVal.current + delta)));
    }
    if (draggingRight.current) {
      const delta = startX.current - e.clientX;
      setRightWidth(Math.max(200, Math.min(500, startVal.current + delta)));
    }
    if (draggingBottom.current) {
      const delta = startY.current - e.clientY;
      setBottomHeight(Math.max(80, Math.min(500, startVal.current + delta)));
    }
  }, []);

  const onMouseUp = useCallback(() => {
    draggingLeft.current = false;
    draggingRight.current = false;
    draggingBottom.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const startLeftResize = (e: React.MouseEvent) => {
    draggingLeft.current = true;
    startX.current = e.clientX;
    startVal.current = leftWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const startRightResize = (e: React.MouseEvent) => {
    draggingRight.current = true;
    startX.current = e.clientX;
    startVal.current = rightWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const startBottomResize = (e: React.MouseEvent) => {
    draggingBottom.current = true;
    startY.current = e.clientY;
    startVal.current = bottomHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const showBottom = state.bottomPanel !== 'none';

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--pxlz-bg)', fontFamily: "'JetBrains Mono', monospace", position: 'relative' }}>
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, minWidth: 0 }}>

        {/* Left Panel — Scene Hierarchy */}
        <div style={{ width: leftWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--pxlz-panel)', borderRight: '1px solid var(--pxlz-border)' }}>
          {/* Left panel tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--pxlz-border)', background: 'var(--pxlz-bg)', flexShrink: 0 }}>
            {(['scene', 'assets'] as const).map(tab => (
              <div
                key={tab}
                className={`pxlz-tab ${state.activePanel === tab ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_ACTIVE_PANEL', panel: tab })}
              >
                {tab === 'scene' ? 'Scene' : 'Assets'}
              </div>
            ))}
          </div>

          {state.activePanel === 'scene' && <SceneHierarchy />}
          {state.activePanel === 'assets' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div className="pxlz-section-header"><span>Assets</span></div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div className="primitive-card" onClick={() => dispatch({ type: 'TOGGLE_IMPORT_MODEL_MODAL' })}>
                    <span style={{ fontSize: 18, color: '#3FB950' }}>📦</span>
                    <span>Import Model</span>
                  </div>
                  <div className="primitive-card" onClick={() => dispatch({ type: 'TOGGLE_ADD_PRIMITIVE_MODAL' })}>
                    <span style={{ fontSize: 18, color: '#FF6B35' }}>⬛</span>
                    <span>Primitives</span>
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 10, color: 'var(--pxlz-text-muted)' }}>
                  Drag & drop .gltf/.glb files to import models
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 10, color: 'var(--pxlz-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scene Objects ({Object.keys(state.objects).length})</div>
                  {Object.values(state.objects).map(obj => (
                    <div key={obj.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 10, color: 'var(--pxlz-text-muted)' }}>
                      <span style={{ width: 12 }}>
                        {obj.type === 'model' ? '📦' : obj.type.startsWith('light') ? '💡' : '⬛'}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{obj.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Left resize handle */}
        <div className="resize-handle" onMouseDown={startLeftResize} />

        {/* Center — Viewport + Bottom Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Viewport */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <Viewport />

            {/* Play mode overlay */}
            {state.isPlaying && (
              <div style={{
                position: 'absolute',
                top: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(63, 185, 80, 0.15)',
                border: '1px solid var(--pxlz-green)',
                color: 'var(--pxlz-green)',
                padding: '3px 12px',
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                borderRadius: 2,
                pointerEvents: 'none',
              }}>
                ▶ PLAYING
              </div>
            )}

            {/* Viewport info overlay */}
            <div style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              fontSize: 9,
              color: 'rgba(125,133,144,0.8)',
              fontFamily: "'JetBrains Mono', monospace",
              pointerEvents: 'none',
              lineHeight: 1.6,
            }}>
              <div>LMB: Select | RMB+Drag: Orbit | Scroll: Zoom</div>
              <div>W/E/R: Move/Rotate/Scale | Q: Select</div>
              {state.pixelFilter && <div style={{ color: 'var(--pxlz-orange)' }}>PIXEL {state.pixelRatio}x</div>}
            </div>
          </div>

          {/* Bottom resize handle */}
          {showBottom && <div className="resize-handle-h" onMouseDown={startBottomResize} />}

          {/* Bottom Panel */}
          {showBottom && (
            <div style={{ height: bottomHeight, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--pxlz-panel)', borderTop: '1px solid var(--pxlz-border)' }}>
              {/* Bottom tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--pxlz-border)', background: 'var(--pxlz-bg)', flexShrink: 0, alignItems: 'center' }}>
                {(['console', 'assets'] as const).map(tab => (
                  <div
                    key={tab}
                    className={`pxlz-tab ${state.bottomPanel === tab ? 'active' : ''}`}
                    onClick={() => dispatch({ type: 'SET_BOTTOM_PANEL', panel: tab })}
                  >
                    {tab === 'console' ? 'Console' : 'Scripts'}
                  </div>
                ))}
                <div style={{ flex: 1 }} />
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--pxlz-text-muted)', cursor: 'pointer', fontSize: 12, padding: '0 8px' }}
                  onClick={() => dispatch({ type: 'SET_BOTTOM_PANEL', panel: 'none' })}
                  title="Close panel"
                >✕</button>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {state.bottomPanel === 'console' && <ConsolePanel />}
                {state.bottomPanel === 'assets' && <ScriptEditor />}
              </div>
            </div>
          )}

          {/* Show bottom panel button when hidden */}
          {!showBottom && (
            <div style={{ height: 24, background: 'var(--pxlz-bg)', borderTop: '1px solid var(--pxlz-border)', display: 'flex', alignItems: 'center', padding: '0 8px', gap: 8, flexShrink: 0 }}>
              <button className="pxlz-tab" onClick={() => dispatch({ type: 'SET_BOTTOM_PANEL', panel: 'console' })}>Console</button>
              <button className="pxlz-tab" onClick={() => dispatch({ type: 'SET_BOTTOM_PANEL', panel: 'assets' })}>Scripts</button>
            </div>
          )}
        </div>

        {/* Right resize handle */}
        <div className="resize-handle" onMouseDown={startRightResize} />

        {/* Right Panel — Inspector */}
        <div style={{ width: rightWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--pxlz-panel)', borderLeft: '1px solid var(--pxlz-border)' }}>
          {/* Right panel tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--pxlz-border)', background: 'var(--pxlz-bg)', flexShrink: 0 }}>
            {(['inspector', 'scripts', 'physics'] as const).map(tab => (
              <div
                key={tab}
                className={`pxlz-tab ${state.rightPanel === tab ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_RIGHT_PANEL', panel: tab })}
              >
                {tab === 'inspector' ? 'Inspector' : tab === 'scripts' ? 'Scripts' : 'Physics'}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {state.rightPanel === 'inspector' && <Inspector />}
            {state.rightPanel === 'scripts' && (
              <div style={{ height: '100%', overflow: 'hidden' }}>
                <ScriptEditor />
              </div>
            )}
            {state.rightPanel === 'physics' && <PhysicsPanel />}
          </div>
        </div>
      </div>

      {/* Welcome Splash */}
      {showWelcome && <WelcomeSplash onClose={() => setShowWelcome(false)} />}

      {/* Status Bar */}
      <StatusBar />

      {/* Modals */}
      <AddPrimitiveModal />
      <ImportModelModal />
      <ExportModal />
    </div>
  );
}

function PhysicsPanel() {
  const { state, dispatch } = useEngine();
  const physicsObjects = Object.values(state.objects).filter(o => o.physics.enabled);

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="pxlz-section-header">
        <span>Physics World</span>
      </div>
      <div style={{ padding: '10px' }}>
        <div style={{ fontSize: 10, color: 'var(--pxlz-text-muted)', marginBottom: 8 }}>
          Gravity: (0, -9.81, 0)
        </div>
        <div style={{ fontSize: 10, color: 'var(--pxlz-text-muted)', marginBottom: 12 }}>
          Physics Bodies: {physicsObjects.length}
        </div>
        {physicsObjects.length === 0 ? (
          <div style={{ fontSize: 10, color: 'var(--pxlz-text-muted)', textAlign: 'center', padding: '16px 0' }}>
            No physics bodies.<br />
            Select an object and enable physics in the Inspector.
          </div>
        ) : (
          physicsObjects.map(obj => (
            <div key={obj.id} style={{ padding: '6px 8px', background: 'var(--pxlz-bg)', border: '1px solid var(--pxlz-border)', marginBottom: 4, borderRadius: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 600 }}>{obj.name}</span>
                <span className="pxlz-badge" style={{
                  color: obj.physics.type === 'dynamic' ? 'var(--pxlz-orange)' : obj.physics.type === 'static' ? 'var(--pxlz-blue)' : 'var(--pxlz-purple)',
                  borderColor: obj.physics.type === 'dynamic' ? 'var(--pxlz-orange)' : obj.physics.type === 'static' ? 'var(--pxlz-blue)' : 'var(--pxlz-purple)',
                  fontSize: 8,
                }}>
                  {obj.physics.type}
                </span>
              </div>
              <div style={{ fontSize: 9, color: 'var(--pxlz-text-muted)', marginTop: 2 }}>
                Shape: {obj.physics.shape} | Mass: {obj.physics.mass}
              </div>
            </div>
          ))
        )}
        <div style={{ marginTop: 12, padding: '8px', background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: 2, fontSize: 9, color: 'var(--pxlz-text-muted)' }}>
          Press <span style={{ color: 'var(--pxlz-green)' }}>▶ Play</span> to simulate physics. Transforms are restored on stop.
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <EngineProvider>
      <EngineLayout />
    </EngineProvider>
  );
}
