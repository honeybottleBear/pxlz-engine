import React, { createContext, useContext, useReducer, useRef, useCallback } from 'react';
import * as THREE from 'three';

// ============================================================
// PXLZ ENGINE — Core State Management
// Philosophy: Dark Workstation + Pixel Accent
// ============================================================

export type ObjectType =
  | 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'plane'
  | 'capsule' | 'tetrahedron' | 'octahedron' | 'icosahedron'
  | 'model' | 'light_point' | 'light_dir' | 'light_ambient' | 'light_spot'
  | 'camera' | 'empty' | 'audio';

export type GizmoMode = 'translate' | 'rotate' | 'scale' | 'none';
export type TransformSpace = 'world' | 'local';

export interface ScriptEntry {
  id: string;
  name: string;
  code: string;
}

export interface AudioEntry {
  id: string;
  name: string;
  url: string;
  loop: boolean;
  autoplay: boolean;
  volume: number;
}

export interface PhysicsBody {
  enabled: boolean;
  type: 'dynamic' | 'static' | 'kinematic';
  mass: number;
  restitution: number;
  friction: number;
  shape: 'box' | 'sphere' | 'capsule' | 'trimesh';
}

export interface SceneObject {
  id: string;
  name: string;
  type: ObjectType;
  parentId: string | null;
  childIds: string[];
  visible: boolean;
  locked: boolean;

  // Transform
  position: [number, number, number];
  rotation: [number, number, number]; // Euler in degrees
  scale: [number, number, number];

  // Material
  color: string;
  wireframe: boolean;
  textureUrl: string | null;
  roughness: number;
  metalness: number;
  opacity: number;
  flatShading: boolean;

  // Light specific
  lightIntensity: number;
  lightColor: string;
  lightRange: number;
  castShadow: boolean;
  receiveShadow: boolean;

  // Scripts
  scripts: ScriptEntry[];

  // Physics
  physics: PhysicsBody;

  // Audio
  audios: AudioEntry[];

  // Model
  modelUrl: string | null;
  modelName: string | null;

  // Camera
  fov: number;
}

export interface EngineState {
  objects: Record<string, SceneObject>;
  rootIds: string[];
  selectedId: string | null;
  gizmoMode: GizmoMode;
  transformSpace: TransformSpace;
  isPlaying: boolean;
  showGrid: boolean;
  showWireframe: boolean;
  pixelRatio: number;
  pixelFilter: boolean;
  activePanel: 'scene' | 'assets' | 'scripts';
  rightPanel: 'inspector' | 'scripts' | 'physics';
  bottomPanel: 'console' | 'assets' | 'none';
  consoleMessages: Array<{ type: 'log' | 'warn' | 'error' | 'info'; msg: string; time: string }>;
  projectName: string;
  scripts: ScriptEntry[];
  activeScriptId: string | null;
  showExportModal: boolean;
  showAddPrimitiveModal: boolean;
  showImportModelModal: boolean;
  cameraMode: 'perspective' | 'orthographic';
  snapEnabled: boolean;
  snapValue: number;
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function createObject(type: ObjectType, name?: string, partial?: Partial<SceneObject>): SceneObject {
  const id = makeId();
  const base: SceneObject = {
    id,
    name: name || `${type}_${id.slice(0, 4)}`,
    type,
    parentId: null,
    childIds: [],
    visible: true,
    locked: false,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    color: '#4a9eff',
    wireframe: false,
    textureUrl: null,
    roughness: 0.7,
    metalness: 0.1,
    opacity: 1,
    flatShading: true,
    lightIntensity: 1,
    lightColor: '#ffffff',
    lightRange: 10,
    castShadow: true,
    receiveShadow: true,
    scripts: [],
    physics: { enabled: false, type: 'dynamic', mass: 1, restitution: 0.3, friction: 0.5, shape: 'box' },
    audios: [],
    modelUrl: null,
    modelName: null,
    fov: 60,
    ...partial,
  };
  return base;
}

// Default scene
function createDefaultScene(): Pick<EngineState, 'objects' | 'rootIds'> {
  const floor = createObject('plane', 'Floor', {
    position: [0, 0, 0],
    scale: [10, 1, 10],
    color: '#2a2a3a',
    receiveShadow: true,
    physics: { enabled: true, type: 'static', mass: 0, restitution: 0.3, friction: 0.8, shape: 'box' },
  });
  const cube = createObject('box', 'Cube', {
    position: [0, 1, 0],
    color: '#FF6B35',
    castShadow: true,
    receiveShadow: true,
  });
  const dirLight = createObject('light_dir', 'DirectionalLight', {
    position: [5, 10, 5],
    lightColor: '#ffffff',
    lightIntensity: 1.5,
    castShadow: true,
  });
  const ambLight = createObject('light_ambient', 'AmbientLight', {
    lightColor: '#334466',
    lightIntensity: 0.4,
  });

  return {
    objects: {
      [floor.id]: floor,
      [cube.id]: cube,
      [dirLight.id]: dirLight,
      [ambLight.id]: ambLight,
    },
    rootIds: [floor.id, cube.id, dirLight.id, ambLight.id],
  };
}

const defaultScene = createDefaultScene();

const initialState: EngineState = {
  ...defaultScene,
  selectedId: null,
  gizmoMode: 'translate',
  transformSpace: 'world',
  isPlaying: false,
  showGrid: true,
  showWireframe: false,
  pixelRatio: 4,
  pixelFilter: true,
  activePanel: 'scene',
  rightPanel: 'inspector',
  bottomPanel: 'console',
  consoleMessages: [
    { type: 'info', msg: 'PXLZ Engine v1.0.0 initialized', time: new Date().toLocaleTimeString() },
    { type: 'log', msg: 'Scene loaded. 4 objects in scene.', time: new Date().toLocaleTimeString() },
  ],
  projectName: 'MyPXLZGame',
  scripts: [],
  activeScriptId: null,
  showExportModal: false,
  showAddPrimitiveModal: false,
  showImportModelModal: false,
  cameraMode: 'perspective',
  snapEnabled: false,
  snapValue: 0.5,
};

type Action =
  | { type: 'SELECT_OBJECT'; id: string | null }
  | { type: 'ADD_OBJECT'; object: SceneObject }
  | { type: 'REMOVE_OBJECT'; id: string }
  | { type: 'UPDATE_OBJECT'; id: string; patch: Partial<SceneObject> }
  | { type: 'SET_GIZMO_MODE'; mode: GizmoMode }
  | { type: 'SET_TRANSFORM_SPACE'; space: TransformSpace }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'STOP_PLAY' }
  | { type: 'TOGGLE_GRID' }
  | { type: 'TOGGLE_WIREFRAME' }
  | { type: 'SET_PIXEL_RATIO'; ratio: number }
  | { type: 'TOGGLE_PIXEL_FILTER' }
  | { type: 'SET_ACTIVE_PANEL'; panel: EngineState['activePanel'] }
  | { type: 'SET_RIGHT_PANEL'; panel: EngineState['rightPanel'] }
  | { type: 'SET_BOTTOM_PANEL'; panel: EngineState['bottomPanel'] }
  | { type: 'ADD_CONSOLE'; entry: EngineState['consoleMessages'][0] }
  | { type: 'CLEAR_CONSOLE' }
  | { type: 'SET_PROJECT_NAME'; name: string }
  | { type: 'ADD_SCRIPT'; script: ScriptEntry }
  | { type: 'UPDATE_SCRIPT'; id: string; patch: Partial<ScriptEntry> }
  | { type: 'REMOVE_SCRIPT'; id: string }
  | { type: 'SET_ACTIVE_SCRIPT'; id: string | null }
  | { type: 'ASSIGN_SCRIPT_TO_OBJECT'; objectId: string; script: ScriptEntry }
  | { type: 'REMOVE_SCRIPT_FROM_OBJECT'; objectId: string; scriptId: string }
  | { type: 'TOGGLE_EXPORT_MODAL' }
  | { type: 'TOGGLE_ADD_PRIMITIVE_MODAL' }
  | { type: 'TOGGLE_IMPORT_MODEL_MODAL' }
  | { type: 'DUPLICATE_OBJECT'; id: string }
  | { type: 'RENAME_OBJECT'; id: string; name: string }
  | { type: 'TOGGLE_SNAP' }
  | { type: 'SET_SNAP_VALUE'; value: number }
  | { type: 'LOAD_SCENE'; state: Partial<EngineState> };

function reducer(state: EngineState, action: Action): EngineState {
  switch (action.type) {
    case 'SELECT_OBJECT':
      return { ...state, selectedId: action.id };

    case 'ADD_OBJECT': {
      const obj = action.object;
      const newObjects = { ...state.objects, [obj.id]: obj };
      const newRootIds = obj.parentId ? state.rootIds : [...state.rootIds, obj.id];
      if (obj.parentId && state.objects[obj.parentId]) {
        newObjects[obj.parentId] = {
          ...newObjects[obj.parentId],
          childIds: [...newObjects[obj.parentId].childIds, obj.id],
        };
      }
      return { ...state, objects: newObjects, rootIds: newRootIds, selectedId: obj.id };
    }

    case 'REMOVE_OBJECT': {
      const { id } = action;
      const obj = state.objects[id];
      if (!obj) return state;
      const newObjects = { ...state.objects };
      // Remove from parent
      if (obj.parentId && newObjects[obj.parentId]) {
        newObjects[obj.parentId] = {
          ...newObjects[obj.parentId],
          childIds: newObjects[obj.parentId].childIds.filter(c => c !== id),
        };
      }
      // Recursively remove children
      const toRemove = [id];
      const collectChildren = (oid: string) => {
        const o = newObjects[oid];
        if (o) { o.childIds.forEach(c => { toRemove.push(c); collectChildren(c); }); }
      };
      collectChildren(id);
      toRemove.forEach(rid => delete newObjects[rid]);
      return {
        ...state,
        objects: newObjects,
        rootIds: state.rootIds.filter(r => !toRemove.includes(r)),
        selectedId: state.selectedId && toRemove.includes(state.selectedId) ? null : state.selectedId,
      };
    }

    case 'UPDATE_OBJECT': {
      const obj = state.objects[action.id];
      if (!obj) return state;
      return {
        ...state,
        objects: { ...state.objects, [action.id]: { ...obj, ...action.patch } },
      };
    }

    case 'DUPLICATE_OBJECT': {
      const obj = state.objects[action.id];
      if (!obj) return state;
      const newObj = { ...obj, id: makeId(), name: obj.name + '_copy', position: [obj.position[0] + 1, obj.position[1], obj.position[2]] as [number, number, number], childIds: [] };
      return reducer(state, { type: 'ADD_OBJECT', object: newObj });
    }

    case 'RENAME_OBJECT': {
      return reducer(state, { type: 'UPDATE_OBJECT', id: action.id, patch: { name: action.name } });
    }

    case 'SET_GIZMO_MODE': return { ...state, gizmoMode: action.mode };
    case 'SET_TRANSFORM_SPACE': return { ...state, transformSpace: action.space };
    case 'TOGGLE_PLAY': return { ...state, isPlaying: !state.isPlaying };
    case 'STOP_PLAY': return { ...state, isPlaying: false };
    case 'TOGGLE_GRID': return { ...state, showGrid: !state.showGrid };
    case 'TOGGLE_WIREFRAME': return { ...state, showWireframe: !state.showWireframe };
    case 'SET_PIXEL_RATIO': return { ...state, pixelRatio: action.ratio };
    case 'TOGGLE_PIXEL_FILTER': return { ...state, pixelFilter: !state.pixelFilter };
    case 'SET_ACTIVE_PANEL': return { ...state, activePanel: action.panel };
    case 'SET_RIGHT_PANEL': return { ...state, rightPanel: action.panel };
    case 'SET_BOTTOM_PANEL': return { ...state, bottomPanel: action.panel };
    case 'ADD_CONSOLE':
      return { ...state, consoleMessages: [...state.consoleMessages.slice(-199), action.entry] };
    case 'CLEAR_CONSOLE': return { ...state, consoleMessages: [] };
    case 'SET_PROJECT_NAME': return { ...state, projectName: action.name };

    case 'ADD_SCRIPT':
      return { ...state, scripts: [...state.scripts, action.script], activeScriptId: action.script.id };
    case 'UPDATE_SCRIPT':
      return { ...state, scripts: state.scripts.map(s => s.id === action.id ? { ...s, ...action.patch } : s) };
    case 'REMOVE_SCRIPT':
      return { ...state, scripts: state.scripts.filter(s => s.id !== action.id), activeScriptId: state.activeScriptId === action.id ? null : state.activeScriptId };
    case 'SET_ACTIVE_SCRIPT': return { ...state, activeScriptId: action.id };

    case 'ASSIGN_SCRIPT_TO_OBJECT': {
      const obj = state.objects[action.objectId];
      if (!obj) return state;
      if (obj.scripts.find(s => s.id === action.script.id)) return state;
      return reducer(state, { type: 'UPDATE_OBJECT', id: action.objectId, patch: { scripts: [...obj.scripts, action.script] } });
    }
    case 'REMOVE_SCRIPT_FROM_OBJECT': {
      const obj = state.objects[action.objectId];
      if (!obj) return state;
      return reducer(state, { type: 'UPDATE_OBJECT', id: action.objectId, patch: { scripts: obj.scripts.filter(s => s.id !== action.scriptId) } });
    }

    case 'TOGGLE_EXPORT_MODAL': return { ...state, showExportModal: !state.showExportModal };
    case 'TOGGLE_ADD_PRIMITIVE_MODAL': return { ...state, showAddPrimitiveModal: !state.showAddPrimitiveModal };
    case 'TOGGLE_IMPORT_MODEL_MODAL': return { ...state, showImportModelModal: !state.showImportModelModal };
    case 'TOGGLE_SNAP': return { ...state, snapEnabled: !state.snapEnabled };
    case 'SET_SNAP_VALUE': return { ...state, snapValue: action.value };
    case 'LOAD_SCENE': return { ...state, ...action.state };

    default: return state;
  }
}

interface EngineContextValue {
  state: EngineState;
  dispatch: React.Dispatch<Action>;
  threeRef: React.MutableRefObject<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    meshMap: Map<string, THREE.Object3D>;
  }>;
  log: (msg: string, type?: 'log' | 'warn' | 'error' | 'info') => void;
}

const EngineContext = createContext<EngineContextValue | null>(null);

export function EngineProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const threeRef = useRef<EngineContextValue['threeRef']['current']>({
    scene: null,
    camera: null,
    renderer: null,
    meshMap: new Map(),
  });

  const log = useCallback((msg: string, type: 'log' | 'warn' | 'error' | 'info' = 'log') => {
    dispatch({
      type: 'ADD_CONSOLE',
      entry: { type, msg, time: new Date().toLocaleTimeString() },
    });
  }, []);

  return (
    <EngineContext.Provider value={{ state, dispatch, threeRef, log }}>
      {children}
    </EngineContext.Provider>
  );
}

export function useEngine() {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error('useEngine must be used within EngineProvider');
  return ctx;
}
