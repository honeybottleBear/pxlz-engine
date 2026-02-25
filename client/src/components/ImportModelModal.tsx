import React, { useRef, useState } from 'react';
import { useEngine, createObject } from '../contexts/EngineContext';

// ============================================================
// PXLZ ENGINE — Import Model Modal (glTF / glb)
// ============================================================

export default function ImportModelModal() {
  const { state, dispatch, log } = useEngine();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  if (!state.showImportModelModal) return null;

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(gltf|glb)$/i)) {
      log('Only .gltf and .glb files are supported', 'error');
      return;
    }
    const url = URL.createObjectURL(file);
    setFileName(file.name);
    setFileUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = () => {
    if (!fileUrl || !fileName) return;
    const obj = createObject('model', fileName.replace(/\.(gltf|glb)$/i, ''), {
      modelUrl: fileUrl,
      modelName: fileName,
    });
    dispatch({ type: 'ADD_OBJECT', object: obj });
    dispatch({ type: 'TOGGLE_IMPORT_MODEL_MODAL' });
    log(`Model imported: ${fileName}`, 'info');
    setFileName(null);
    setFileUrl(null);
  };

  return (
    <div className="pxlz-modal-overlay" onClick={() => dispatch({ type: 'TOGGLE_IMPORT_MODEL_MODAL' })}>
      <div className="pxlz-modal" onClick={e => e.stopPropagation()}>
        <div className="pxlz-modal-header">
          <span>Import 3D Model</span>
          <button style={{ background: 'none', border: 'none', color: 'var(--pxlz-text-muted)', cursor: 'pointer', fontSize: 14 }}
            onClick={() => dispatch({ type: 'TOGGLE_IMPORT_MODEL_MODAL' })}>✕</button>
        </div>
        <div className="pxlz-modal-body">
          <div
            className={`drop-zone-active`}
            style={{
              border: `2px dashed ${dragging ? 'var(--pxlz-orange)' : 'var(--pxlz-border)'}`,
              borderRadius: 2,
              padding: '32px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'rgba(255,107,53,0.05)' : 'var(--pxlz-bg)',
              transition: 'all 0.1s',
            }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            {fileName ? (
              <div>
                <div style={{ fontSize: 12, color: 'var(--pxlz-green)', marginBottom: 4 }}>✓ {fileName}</div>
                <div style={{ fontSize: 10, color: 'var(--pxlz-text-muted)' }}>Click to change file</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: 'var(--pxlz-text)', marginBottom: 4 }}>Drop .gltf or .glb file here</div>
                <div style={{ fontSize: 10, color: 'var(--pxlz-text-muted)' }}>or click to browse</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".gltf,.glb" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
          <div style={{ marginTop: 12, fontSize: 10, color: 'var(--pxlz-text-muted)' }}>
            Supported formats: <strong style={{ color: 'var(--pxlz-orange)' }}>glTF 2.0</strong>, <strong style={{ color: 'var(--pxlz-orange)' }}>GLB</strong> (binary glTF)
          </div>
        </div>
        <div className="pxlz-modal-footer">
          <button className="pxlz-btn" onClick={() => dispatch({ type: 'TOGGLE_IMPORT_MODEL_MODAL' })}>Cancel</button>
          <button className="pxlz-btn-primary" onClick={handleImport} disabled={!fileUrl} style={{ opacity: fileUrl ? 1 : 0.5 }}>
            Import Model
          </button>
        </div>
      </div>
    </div>
  );
}
