import React, { useState } from 'react';
import { useEngine, createObject } from '../contexts/EngineContext';

// ============================================================
// PXLZ ENGINE — Welcome Splash
// Shown on first load, provides quick-start templates
// ============================================================

const TEMPLATES = [
  {
    id: 'empty',
    name: 'Empty Scene',
    icon: '○',
    desc: 'Start from scratch',
    color: '#7D8590',
  },
  {
    id: 'platformer',
    name: 'Platformer',
    icon: '🎮',
    desc: 'Platform + player cube + physics',
    color: '#FF6B35',
  },
  {
    id: 'sandbox',
    name: 'Sandbox',
    icon: '⬛',
    desc: 'Grid of cubes to play with',
    color: '#3FB950',
  },
  {
    id: 'lighting',
    name: 'Lighting Demo',
    icon: '💡',
    desc: 'Multiple lights + spheres',
    color: '#D29922',
  },
];

interface Props {
  onClose: () => void;
}

export default function WelcomeSplash({ onClose }: Props) {
  const { dispatch } = useEngine();

  const handleTemplate = (id: string) => {
    if (id === 'platformer') {
      // Add platform + player
      const platform = createObject('box', 'Platform', {
        position: [0, -0.5, 0],
        scale: [10, 0.5, 4],
        color: '#2a4a2a',
        physics: { enabled: true, type: 'static', mass: 0, restitution: 0.1, friction: 0.8, shape: 'box' },
      });
      const player = createObject('box', 'Player', {
        position: [0, 1.5, 0],
        scale: [0.8, 0.8, 0.8],
        color: '#FF6B35',
        physics: { enabled: true, type: 'dynamic', mass: 1, restitution: 0.1, friction: 0.5, shape: 'box' },
      });
      const wall1 = createObject('box', 'Wall_L', {
        position: [-5.25, 0.5, 0],
        scale: [0.5, 2, 4],
        color: '#3a3a4a',
        physics: { enabled: true, type: 'static', mass: 0, restitution: 0.2, friction: 0.5, shape: 'box' },
      });
      const wall2 = createObject('box', 'Wall_R', {
        position: [5.25, 0.5, 0],
        scale: [0.5, 2, 4],
        color: '#3a3a4a',
        physics: { enabled: true, type: 'static', mass: 0, restitution: 0.2, friction: 0.5, shape: 'box' },
      });
      dispatch({ type: 'ADD_OBJECT', object: platform });
      dispatch({ type: 'ADD_OBJECT', object: player });
      dispatch({ type: 'ADD_OBJECT', object: wall1 });
      dispatch({ type: 'ADD_OBJECT', object: wall2 });
    } else if (id === 'sandbox') {
      const colors = ['#FF6B35', '#58A6FF', '#3FB950', '#D29922', '#BC8CFF', '#E94560'];
      for (let x = -2; x <= 2; x++) {
        for (let z = -2; z <= 2; z++) {
          const cube = createObject('box', `Cube_${x}_${z}`, {
            position: [x * 1.2, 0.5, z * 1.2],
            scale: [0.9, 0.9, 0.9],
            color: colors[Math.floor(Math.random() * colors.length)],
            physics: { enabled: true, type: 'dynamic', mass: 1, restitution: 0.3, friction: 0.5, shape: 'box' },
          });
          dispatch({ type: 'ADD_OBJECT', object: cube });
        }
      }
    } else if (id === 'lighting') {
      const sphereColors = ['#FF6B35', '#58A6FF', '#3FB950', '#D29922', '#BC8CFF'];
      sphereColors.forEach((color, i) => {
        const sphere = createObject('sphere', `Sphere_${i}`, {
          position: [(i - 2) * 2, 0.5, 0],
          color,
          roughness: i * 0.25,
          metalness: 1 - i * 0.25,
        });
        dispatch({ type: 'ADD_OBJECT', object: sphere });
      });
      const pointLight = createObject('light_point', 'PointLight_1', {
        position: [-3, 3, 2],
        lightColor: '#FF6B35',
        lightIntensity: 2,
        lightRange: 15,
      });
      const pointLight2 = createObject('light_point', 'PointLight_2', {
        position: [3, 3, -2],
        lightColor: '#58A6FF',
        lightIntensity: 2,
        lightRange: 15,
      });
      dispatch({ type: 'ADD_OBJECT', object: pointLight });
      dispatch({ type: 'ADD_OBJECT', object: pointLight2 });
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(13,17,23,0.92)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <div style={{
        background: 'var(--pxlz-panel)',
        border: '1px solid var(--pxlz-border)',
        borderRadius: 2,
        width: 520,
        maxWidth: '95vw',
        boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', textAlign: 'center', borderBottom: '1px solid var(--pxlz-border)' }}>
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 28,
            color: 'var(--pxlz-orange)',
            letterSpacing: '0.1em',
            marginBottom: 8,
            textShadow: '0 0 20px rgba(255,107,53,0.5)',
          }}>
            PXLZ
          </div>
          <div style={{ fontSize: 11, color: 'var(--pxlz-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Web-Based 3D Game Engine
          </div>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 12 }}>
            {['Three.js', 'Monaco', 'Rapier3D', 'Pixel Filter'].map(tag => (
              <span key={tag} className="pxlz-badge" style={{ color: 'var(--pxlz-orange)', borderColor: 'rgba(255,107,53,0.3)', fontSize: 8 }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div style={{ padding: '16px 24px' }}>
          <div style={{ fontSize: 10, color: 'var(--pxlz-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Start with a template
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TEMPLATES.map(t => (
              <div
                key={t.id}
                onClick={() => handleTemplate(t.id)}
                style={{
                  padding: '12px',
                  background: 'var(--pxlz-bg)',
                  border: '1px solid var(--pxlz-border)',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = t.color;
                  (e.currentTarget as HTMLElement).style.background = `rgba(${t.color === '#FF6B35' ? '255,107,53' : t.color === '#3FB950' ? '63,185,80' : t.color === '#D29922' ? '210,153,34' : '88,166,255'},0.05)`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--pxlz-border)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--pxlz-bg)';
                }}
              >
                <span style={{ fontSize: 24, flexShrink: 0 }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pxlz-text)', marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontSize: 9, color: 'var(--pxlz-text-muted)' }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={{ padding: '0 24px 16px' }}>
          <div style={{ fontSize: 10, color: 'var(--pxlz-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Features</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[
              '✛ Transform Gizmos (Move/Rotate/Scale)',
              '📜 JS Script Editor (Monaco)',
              '📦 glTF / GLB Model Import',
              '🖼 Image Texture Upload',
              '⚡ Rapier3D Physics',
              '🔊 Audio Support',
              '🎮 Pixel Filter (Retro Look)',
              '↗ HTML5 Game Export',
            ].map(f => (
              <div key={f} style={{ fontSize: 9, color: 'var(--pxlz-text-muted)', padding: '2px 0' }}>{f}</div>
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--pxlz-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--pxlz-text-muted)' }}>
            Keyboard: W/E/R/Q · Del · Ctrl+D · P · G
          </div>
          <button className="pxlz-btn-primary" onClick={() => handleTemplate('empty')} style={{ fontSize: 10 }}>
            Open Editor →
          </button>
        </div>
      </div>
    </div>
  );
}
