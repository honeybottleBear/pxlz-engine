import React, { useState } from 'react';
import { useEngine, SceneObject, createObject, ObjectType } from '../contexts/EngineContext';

// ============================================================
// PXLZ ENGINE — Scene Hierarchy Panel
// ============================================================

const TYPE_ICONS: Record<string, string> = {
  box: '⬛', sphere: '⚪', cylinder: '🔵', cone: '🔺', torus: '⭕',
  plane: '▬', capsule: '💊', tetrahedron: '△', octahedron: '◇', icosahedron: '⬡',
  model: '📦', light_point: '💡', light_dir: '☀', light_ambient: '🌤',
  light_spot: '🔦', camera: '📷', empty: '○', audio: '🔊',
};

const TYPE_COLORS: Record<string, string> = {
  light_point: '#D29922', light_dir: '#D29922', light_ambient: '#D29922', light_spot: '#D29922',
  camera: '#58A6FF', audio: '#BC8CFF', model: '#3FB950', empty: '#7D8590',
};

interface TreeItemProps {
  id: string;
  depth: number;
}

function TreeItem({ id, depth }: TreeItemProps) {
  const { state, dispatch } = useEngine();
  const obj = state.objects[id];
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState('');

  if (!obj) return null;

  const isSelected = state.selectedId === id;
  const hasChildren = obj.childIds.length > 0;
  const icon = TYPE_ICONS[obj.type] || '○';
  const color = TYPE_COLORS[obj.type];

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_OBJECT', id });
  };

  const handleDblClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameVal(obj.name);
    setRenaming(true);
  };

  const handleRename = () => {
    if (renameVal.trim()) dispatch({ type: 'RENAME_OBJECT', id, name: renameVal.trim() });
    setRenaming(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'REMOVE_OBJECT', id });
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'DUPLICATE_OBJECT', id });
  };

  const handleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'UPDATE_OBJECT', id, patch: { visible: !obj.visible } });
  };

  return (
    <div>
      <div
        className={`tree-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={handleSelect}
        onDoubleClick={handleDblClick}
      >
        {hasChildren && (
          <span
            style={{ fontSize: 9, color: 'var(--pxlz-text-muted)', cursor: 'pointer', width: 10, flexShrink: 0 }}
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {expanded ? '▾' : '▸'}
          </span>
        )}
        {!hasChildren && <span style={{ width: 10, flexShrink: 0 }} />}
        <span style={{ fontSize: 11, color: color || 'inherit' }}>{icon}</span>
        {renaming ? (
          <input
            className="pxlz-input"
            style={{ fontSize: 11, padding: '1px 4px', height: 18, flex: 1 }}
            value={renameVal}
            autoFocus
            onChange={e => setRenameVal(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false); }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: obj.visible ? 1 : 0.4 }}>
            {obj.name}
          </span>
        )}
        <div style={{ display: 'flex', gap: 2, opacity: 0, transition: 'opacity 0.1s' }} className="tree-actions">
          <button
            style={{ background: 'none', border: 'none', color: 'var(--pxlz-text-muted)', fontSize: 10, padding: '0 2px', cursor: 'pointer' }}
            onClick={handleVisibility}
            title={obj.visible ? 'Hide' : 'Show'}
          >
            {obj.visible ? '👁' : '🚫'}
          </button>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--pxlz-text-muted)', fontSize: 10, padding: '0 2px', cursor: 'pointer' }}
            onClick={handleDuplicate}
            title="Duplicate"
          >⧉</button>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--pxlz-red)', fontSize: 10, padding: '0 2px', cursor: 'pointer' }}
            onClick={handleDelete}
            title="Delete"
          >✕</button>
        </div>
      </div>
      {hasChildren && expanded && obj.childIds.map(cid => (
        <TreeItem key={cid} id={cid} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function SceneHierarchy() {
  const { state, dispatch } = useEngine();

  const handleAddEmpty = () => {
    dispatch({ type: 'ADD_OBJECT', object: createObject('empty', 'Empty') });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="pxlz-section-header">
        <span>Scene</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="pxlz-btn" style={{ padding: '2px 6px', fontSize: 10 }} onClick={() => dispatch({ type: 'TOGGLE_ADD_PRIMITIVE_MODAL' })} title="Add Object">+</button>
          <button className="pxlz-btn" style={{ padding: '2px 6px', fontSize: 10 }} onClick={handleAddEmpty} title="Add Empty">○</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {state.rootIds.length === 0 && (
          <div style={{ padding: '16px 10px', color: 'var(--pxlz-text-muted)', fontSize: 11, textAlign: 'center' }}>
            No objects in scene.<br />
            <span style={{ color: 'var(--pxlz-orange)', cursor: 'pointer' }} onClick={() => dispatch({ type: 'TOGGLE_ADD_PRIMITIVE_MODAL' })}>+ Add Object</span>
          </div>
        )}
        {state.rootIds.map(id => <TreeItem key={id} id={id} depth={0} />)}
      </div>
      <style>{`
        .tree-item:hover .tree-actions { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
