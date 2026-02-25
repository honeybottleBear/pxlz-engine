import React, { useEffect, useRef } from 'react';
import { useEngine } from '../contexts/EngineContext';

// ============================================================
// PXLZ ENGINE — Console Panel
// ============================================================

export default function ConsolePanel() {
  const { state, dispatch } = useEngine();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.consoleMessages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="pxlz-section-header">
        <span>Console</span>
        <button className="pxlz-btn" style={{ fontSize: 9, padding: '1px 6px' }} onClick={() => dispatch({ type: 'CLEAR_CONSOLE' })}>
          Clear
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', fontFamily: "'JetBrains Mono', monospace" }}>
        {state.consoleMessages.map((msg, i) => (
          <div key={i} className={`console-line ${msg.type}`}>
            <span style={{ color: 'var(--pxlz-text-muted)', marginRight: 8 }}>[{msg.time}]</span>
            <span style={{ marginRight: 6, fontSize: 9 }}>
              {msg.type === 'error' ? '✕' : msg.type === 'warn' ? '⚠' : msg.type === 'info' ? 'ℹ' : '›'}
            </span>
            {msg.msg}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
