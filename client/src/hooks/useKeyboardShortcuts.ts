import { useEffect } from 'react';
import { useEngine } from '../contexts/EngineContext';

// ============================================================
// PXLZ ENGINE — Keyboard Shortcuts
// Q: Select | W: Move | E: Rotate | R: Scale
// Delete/Backspace: Remove selected
// Ctrl+D: Duplicate
// F: Focus on selected (TODO)
// ============================================================

export function useKeyboardShortcuts() {
  const { state, dispatch } = useEngine();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't fire when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('.monaco-editor')) return;

      switch (e.key.toLowerCase()) {
        case 'q':
          dispatch({ type: 'SET_GIZMO_MODE', mode: 'none' });
          break;
        case 'w':
          dispatch({ type: 'SET_GIZMO_MODE', mode: 'translate' });
          break;
        case 'e':
          dispatch({ type: 'SET_GIZMO_MODE', mode: 'rotate' });
          break;
        case 'r':
          dispatch({ type: 'SET_GIZMO_MODE', mode: 'scale' });
          break;
        case 'delete':
        case 'backspace':
          if (state.selectedId) {
            dispatch({ type: 'REMOVE_OBJECT', id: state.selectedId });
          }
          break;
        case 'd':
          if ((e.ctrlKey || e.metaKey) && state.selectedId) {
            e.preventDefault();
            dispatch({ type: 'DUPLICATE_OBJECT', id: state.selectedId });
          }
          break;
        case 'g':
          dispatch({ type: 'TOGGLE_GRID' });
          break;
        case 'p':
          if (!e.ctrlKey && !e.metaKey) {
            dispatch({ type: 'TOGGLE_PLAY' });
          }
          break;
        case 'escape':
          if (state.isPlaying) {
            dispatch({ type: 'STOP_PLAY' });
          }
          dispatch({ type: 'SELECT_OBJECT', id: null });
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.selectedId, state.isPlaying, dispatch]);
}
