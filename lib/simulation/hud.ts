/**
 * Performance Monitoring & HUD Module
 * 
 * Provides FPS counter, memory usage tracking,
 * and keyboard shortcuts display
 */

import { BLACK_HOLE_PRESETS, BlackHolePreset } from '../physics/presets';

// Types
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memory: number;
  triangles: number;
  drawCalls: number;
}

export interface KeyboardShortcut {
  key: string;
  description: string;
  category: 'movement' | 'camera' | 'simulation' | 'view';
}

// Keyboard shortcuts configuration
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Movement
  { key: 'W', description: 'Move forward', category: 'movement' },
  { key: 'S', description: 'Move backward', category: 'movement' },
  { key: 'A', description: 'Move left', category: 'movement' },
  { key: 'D', description: 'Move right', category: 'movement' },
  { key: 'Space / E', description: 'Move up', category: 'movement' },
  { key: 'Q', description: 'Move down', category: 'movement' },
  { key: 'Shift', description: 'Boost speed', category: 'movement' },
  
  // Camera
  { key: 'Mouse Drag', description: 'Look around', category: 'camera' },
  { key: 'Scroll Wheel', description: 'Zoom in/out', category: 'camera' },
  { key: 'Click', description: 'Fire photon rays', category: 'camera' },
  { key: 'F', description: 'Fire at black hole', category: 'simulation' },
  
  // Simulation
  { key: 'R', description: 'Reset view', category: 'simulation' },
  { key: 'P', description: 'Pause/Resume', category: 'simulation' },
  { key: '1-4', description: 'Quick presets', category: 'view' },
  { key: 'H', description: 'Toggle HUD', category: 'view' },
  { key: '?', description: 'Show shortcuts', category: 'view' },
];

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
  private frames: number[] = [];
  private lastTime: number = 0;
  private fps: number = 0;
  private frameTime: number = 0;
  private maxFrames: number = 60;
  
  constructor(maxFrames: number = 60) {
    this.maxFrames = maxFrames;
  }
  
  /**
   * Start timing a frame
   */
  startFrame(): void {
    this.lastTime = performance.now();
  }
  
  /**
   * End timing a frame
   */
  endFrame(): void {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.frames.push(delta);
    
    // Keep only last N frames
    if (this.frames.length > this.maxFrames) {
      this.frames.shift();
    }
    
    // Calculate average FPS
    if (this.frames.length > 0) {
      const avgFrameTime = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
      this.frameTime = avgFrameTime;
      this.fps = 1000 / avgFrameTime;
    }
  }
  
  /**
   * Get current FPS
   */
  getFPS(): number {
    return Math.round(this.fps);
  }
  
  /**
   * Get average frame time in ms
   */
  getFrameTime(): number {
    if (this.frames.length === 0) return 0;
    const avg = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
    this.frameTime = avg;
    return avg;
  }
  
  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      fps: this.getFPS(),
      frameTime: this.getFrameTime(),
      memory: this.getMemoryUsage(),
      triangles: 0,
      drawCalls: 0,
    };
  }
  
  /**
   * Get memory usage if available
   */
  getMemoryUsage(): number {
    // @ts-ignore - Performance.memory is non-standard
    const memory = performance.memory;
    if (memory && memory.usedJSHeapSize) {
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
    return 0;
  }
  
  /**
   * Get FPS color based on performance
   */
  getFPSColor(): string {
    if (this.fps >= 55) return '#4ade80'; // Green
    if (this.fps >= 30) return '#facc15'; // Yellow
    if (this.fps >= 15) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }
}

/**
 * Create FPS counter element
 */
export function createFPSCounter(performanceMonitor: PerformanceMonitor): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'fps-counter';
  container.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid #333;
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #4ade80;
    z-index: 1000;
    pointer-events: none;
  `;
  return container;
}

/**
 * Create keyboard shortcuts overlay
 */
export function createShortcutsOverlay(): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'shortcuts-overlay';
  container.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(10, 10, 15, 0.95);
    border: 1px solid #444;
    border-radius: 12px;
    padding: 20px 30px;
    font-family: 'Courier New', monospace;
    color: #ddd;
    z-index: 2000;
    max-width: 400px;
    display: none;
    box-shadow: 0 10px 40px rgba(0,0,0,0.8);
  `;
  
  // Header
  const header = document.createElement('h2');
  header.textContent = '⌨️ Keyboard Shortcuts';
  header.style.cssText = `
    margin: 0 0 15px 0;
    font-size: 18px;
    color: #f59e0b;
    text-align: center;
    border-bottom: 1px solid #333;
    padding-bottom: 10px;
  `;
  container.appendChild(header);
  
  // Group shortcuts by category
  const categories = ['movement', 'camera', 'simulation', 'view'];
  const categoryLabels: Record<string, string> = {
    movement: '🎮 Movement',
    camera: '📷 Camera',
    simulation: '🔬 Simulation',
    view: '👁️ View',
  };
  
  for (const category of categories) {
    const shortcuts = KEYBOARD_SHORTCUTS.filter(s => s.category === category);
    if (shortcuts.length === 0) continue;
    
    const categoryDiv = document.createElement('div');
    categoryDiv.style.cssText = 'margin-bottom: 12px;';
    
    const categoryLabel = document.createElement('div');
    categoryLabel.textContent = categoryLabels[category];
    categoryLabel.style.cssText = `
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    `;
    categoryDiv.appendChild(categoryLabel);
    
    for (const shortcut of shortcuts) {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 3px 0;
      `;
      
      const key = document.createElement('kbd');
      key.textContent = shortcut.key;
      key.style.cssText = `
        background: #222;
        border: 1px solid #444;
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 11px;
        color: #fbbf24;
        min-width: 30px;
        text-align: center;
      `;
      
      const desc = document.createElement('span');
      desc.textContent = shortcut.description;
      desc.style.cssText = `
        font-size: 12px;
        color: #aaa;
      `;
      
      row.appendChild(key);
      row.appendChild(desc);
      categoryDiv.appendChild(row);
    }
    
    container.appendChild(categoryDiv);
  }
  
  // Close hint
  const closeHint = document.createElement('div');
  closeHint.textContent = 'Press ? or ESC to close';
  closeHint.style.cssText = `
    text-align: center;
    font-size: 11px;
    color: #666;
    margin-top: 15px;
    padding-top: 10px;
    border-top: 1px solid #333;
  `;
  container.appendChild(closeHint);
  
  return container;
}

/**
 * Create preset selector UI
 */
export function createPresetSelector(
  presets: BlackHolePreset[],
  onSelect: (preset: BlackHolePreset) => void
): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'preset-selector';
  container.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(10, 10, 15, 0.9);
    border: 1px solid #333;
    border-radius: 8px;
    padding: 12px;
    font-family: 'Courier New', monospace;
    z-index: 1000;
    min-width: 200px;
  `;
  
  // Title
  const title = document.createElement('div');
  title.textContent = '🌌 Black Hole Presets';
  title.style.cssText = `
    font-size: 12px;
    color: #f59e0b;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #333;
    font-weight: bold;
  `;
  container.appendChild(title);
  
  // Preset buttons
  for (const preset of presets) {
    const button = document.createElement('button');
    button.textContent = preset.name;
    button.title = preset.description;
    button.style.cssText = `
      display: block;
      width: 100%;
      padding: 8px 12px;
      margin-bottom: 4px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 4px;
      color: ${preset.color};
      font-family: 'Courier New', monospace;
      font-size: 11px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
    `;
    
    button.onmouseenter = () => {
      button.style.background = '#2a2a2a';
      button.style.borderColor = preset.color;
    };
    
    button.onmouseleave = () => {
      button.style.background = '#1a1a1a';
      button.style.borderColor = '#333';
    };
    
    button.onclick = () => {
      onSelect(preset);
    };
    
    container.appendChild(button);
  }
  
  return container;
}

/**
 * Create HUD panel with black hole info
 */
export function createHUDPanel(): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'hud-panel';
  container.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid #333;
    border-radius: 6px;
    padding: 10px 14px;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    color: #888;
    z-index: 1000;
    pointer-events: none;
    min-width: 180px;
  `;
  
  return container;
}

/**
 * Update HUD with black hole data
 */
export function updateHUD(
  container: HTMLElement,
  preset: BlackHolePreset,
  camera: { pos: [number, number, number]; yaw: number; pitch: number }
): void {
  const Rs = (preset.mass * 2.95).toFixed(1); // Schwarzschild radius in km
  const isco = (calculateISCO(preset.mass, preset.spin)).toFixed(2);
  
  container.innerHTML = `
    <div style="color: ${preset.color}; margin-bottom: 8px; font-weight: bold;">
      ${preset.name}
    </div>
    <div style="display: grid; grid-template-columns: auto auto; gap: 3px 10px;">
      <span>Mass:</span><span style="color: #fbbf24;">${formatMass(preset.mass)}</span>
      <span>Spin:</span><span style="color: #60a5fa;">${(preset.spin * 100).toFixed(0)}%</span>
      <span>Rs:</span><span style="color: #f97316;">${Rs} km</span>
      <span>ISCO:</span><span style="color: #4ade80;">${isco} Rs</span>
      <span>Distance:</span><span style="color: #c084fc;">${formatDistance(preset.distance)}</span>
    </div>
    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #333;">
      <span>Camera: </span>
      <span style="color: #fff;">${camera.pos[0].toFixed(0)}, ${camera.pos[1].toFixed(0)}, ${camera.pos[2].toFixed(0)}</span>
    </div>
  `;
}

// Import helper functions
function calculateISCO(mass: number, spin: number): number {
  const Rs = 2 * mass;
  const minISCO = 0.5 * Rs;
  const maxISCO = 3 * Rs;
  return maxISCO - spin * (maxISCO - minISCO);
}

function formatMass(mass: number): string {
  if (mass >= 1e9) return `${(mass / 1e9).toFixed(1)}B M☉`;
  if (mass >= 1e6) return `${(mass / 1e6).toFixed(1)}M M☉`;
  if (mass >= 1e3) return `${(mass / 1e3).toFixed(1)}K M☉`;
  return `${mass.toFixed(1)} M☉`;
}

function formatDistance(lightYears: number): string {
  if (lightYears >= 1e9) return `${(lightYears / 1e9).toFixed(1)}B ly`;
  if (lightYears >= 1e6) return `${(lightYears / 1e6).toFixed(1)}M ly`;
  if (lightYears >= 1e3) return `${(lightYears / 1e3).toFixed(1)}K ly`;
  return `${lightYears.toFixed(0)} ly`;
}
