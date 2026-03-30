'use client';

import { useEffect, useRef } from 'react';
import { getBasis } from '@/lib/simulation/camera';
import { SOLAR_SYSTEM, orbitalPosition } from '@/lib/physics/orbital';

interface SolarSystemViewProps {
  showLabels: boolean;
  camPos?: [number, number, number];
  onCamPosChange?: (pos: [number, number, number]) => void;
  onCamYawChange?: (yaw: number) => void;
  onCamPitchChange?: (pitch: number) => void;
}

interface PlanetState {
  pos: [number, number, number];
  vel: [number, number, number];
  trail: { x: number; y: number; z: number }[];
}

function lightenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, Math.round(r * factor))},${Math.min(255, Math.round(g * factor))},${Math.min(255, Math.round(b * factor))})`;
}

export default function SolarSystemView({
  showLabels,
  onCamPosChange,
  onCamYawChange,
  onCamPitchChange,
}: SolarSystemViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * Math.min(devicePixelRatio, 2));
      canvas.height = Math.round(r.height * Math.min(devicePixelRatio, 2));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Initialize camera state
    const state = {
      camPos: [0, 80, 380] as [number, number, number],
      yaw: 0,
      pitch: -0.22,
      targetYaw: 0,
      targetPitch: -0.22,
      moveSpeed: 0.5,
      keys: {} as Record<string, boolean>,
      mouseInside: false,
      pointerDown: false,
      lastX: 0,
      lastY: 0,
    };

    // Initialize planet states
    const planetState: PlanetState[] = SOLAR_SYSTEM.map((p) => {
      const pos = orbitalPosition(p, 0) as unknown as [number, number, number];
      const dt = 0.1;
      const pos2 = orbitalPosition(p, dt) as unknown as [number, number, number];
      const vel: [number, number, number] = [
        (pos2[0] - pos[0]) / dt,
        (pos2[1] - pos[1]) / dt,
        (pos2[2] - pos[2]) / dt,
      ];
      return { pos, vel, trail: [] };
    });

    // Starfield
    let seed2 = 0xdeadbeef;
    const rng2 = () => {
      seed2 = (seed2 * 1664525 + 1013904223) >>> 0;
      return (seed2 >>> 0) / 0x100000000;
    };
    const starfield = Array.from({ length: 220 }, () => {
      const theta = Math.acos(1 - 2 * rng2());
      const phi = 2 * Math.PI * rng2();
      const r = 2800 + rng2() * 3200;
      return {
        x: Math.sin(theta) * Math.cos(phi) * r,
        y: Math.cos(theta) * r * 0.8,
        z: Math.sin(theta) * Math.sin(phi) * r,
        size: 0.5 + rng2() * 1.4,
        alpha: 0.15 + rng2() * 0.55,
      };
    });

    const project3D = (x: number, y: number, z: number): [number, number, number] | null => {
      const { right, up, fwd } = getBasis(state.yaw, state.pitch);
      const vx = x - state.camPos[0];
      const vy = y - state.camPos[1];
      const vz = z - state.camPos[2];
      const px = vx * right[0] + vy * right[1] + vz * right[2];
      const py = vx * up[0] + vy * up[1] + vz * up[2];
      const pz = vx * fwd[0] + vy * fwd[1] + vz * fwd[2];
      if (pz <= 0.1) return null;
      const sc = canvas.height * 0.7;
      return [px / pz * sc + canvas.width * 0.5, -py / pz * sc + canvas.height * 0.5, pz];
    };

    const onDown = (e: PointerEvent) => {
      state.pointerDown = true;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    };

    const onMove = (e: PointerEvent) => {
      state.targetYaw += (e.clientX - state.lastX) * 0.005;
      state.targetPitch = Math.max(-1.45, Math.min(1.45, state.targetPitch - (e.clientY - state.lastY) * 0.005));
      state.lastX = e.clientX;
      state.lastY = e.clientY;
    };

    const onEnter = (e: PointerEvent) => {
      state.mouseInside = true;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      canvas.style.cursor = 'grab';
    };

    const onLeave = () => {
      state.mouseInside = false;
      state.pointerDown = false;
      canvas.style.cursor = 'default';
    };

    const onUp = () => {
      state.pointerDown = false;
      canvas.style.cursor = 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { fwd } = getBasis(state.yaw, state.pitch);
      state.camPos = [
        state.camPos[0] + fwd[0] * e.deltaY * 0.6,
        state.camPos[1] + fwd[1] * e.deltaY * 0.6,
        state.camPos[2] + fwd[2] * e.deltaY * 0.6,
      ];
    };

    const onKey = (e: KeyboardEvent) => {
      const tracked = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'Space', 'ShiftLeft', 'ShiftRight'];
      if (tracked.includes(e.code)) {
        state.keys[e.code] = e.type === 'keydown';
        e.preventDefault();
      }
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerenter', onEnter);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

    let raf = 0;
    let t = 0;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      t += 0.016;

      // Camera movement
      state.yaw += (state.targetYaw - state.yaw) * 0.16;
      state.pitch += (state.targetPitch - state.pitch) * 0.16;

      const keys = state.keys;
      let mx = 0, my = 0, mz = 0;
      if (keys['KeyW']) mz -= 1;
      if (keys['KeyS']) mz += 1;
      if (keys['KeyA']) mx -= 1;
      if (keys['KeyD']) mx += 1;
      if (keys['KeyE'] || keys['Space']) my += 1;
      if (keys['KeyQ']) my -= 1;

      if (mx || my || mz) {
        const { right, up, fwd } = getBasis(state.yaw, state.pitch);
        const boost = keys['ShiftLeft'] || keys['ShiftRight'] ? 3 : 1;
        const spd = state.moveSpeed * boost * 12;
        state.camPos = [
          state.camPos[0] + (right[0] * mx + up[0] * my + fwd[0] * mz) * spd,
          state.camPos[1] + (right[1] * mx + up[1] * my + fwd[1] * mz) * spd,
          state.camPos[2] + (right[2] * mx + up[2] * my + fwd[2] * mz) * spd,
        ];
      }

      // Report camera changes
      onCamPosChange?.(state.camPos);
      onCamYawChange?.(state.yaw);
      onCamPitchChange?.(state.pitch);

      // Background
      ctx.fillStyle = '#030408';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      for (const star of starfield) {
        const pr = project3D(star.x, star.y, star.z);
        if (!pr) continue;
        const tw = 0.7 + 0.3 * Math.sin(t * 0.8 + star.x * 0.002);
        ctx.fillStyle = `rgba(230,225,255,${star.alpha * tw})`;
        ctx.beginPath();
        ctx.arc(pr[0], pr[1], star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update planet positions via Kepler
      for (let i = 0; i < SOLAR_SYSTEM.length; i++) {
        const pos = orbitalPosition(SOLAR_SYSTEM[i], t * 8) as unknown as [number, number, number];
        planetState[i].pos = pos;
        if (i > 0) {
          planetState[i].trail.push({ x: pos[0], y: pos[1], z: pos[2] });
          if (planetState[i].trail.length > 320) planetState[i].trail.shift();
        }
      }

      // Gravity warp: depressed y based on Sun's potential
      const warpY = (x: number, z: number) => {
        const r = Math.sqrt(x * x + z * z);
        return -200 / (1 + r / 60);
      };

      // Draw spacetime grid
      ctx.save();
      const gridN = 18;
      const gridSize = 520;
      for (let i = -gridN; i <= gridN; i++) {
        const xLine = (i / gridN) * gridSize;
        const steps = 48;
        for (let pass = 0; pass < 2; pass++) {
          for (let si = 1; si <= steps; si++) {
            const t0 = ((si - 1) / steps) * 2 - 1;
            const t1 = (si / steps) * 2 - 1;
            let xa: number, za: number, xb: number, zb: number;
            if (pass === 0) {
              xa = xLine;
              za = t0 * gridSize;
              xb = xLine;
              zb = t1 * gridSize;
            } else {
              xa = t0 * gridSize;
              za = xLine;
              xb = t1 * gridSize;
              zb = xLine;
            }
            const ya = warpY(xa, za);
            const yb = warpY(xb, zb);
            const pa = project3D(xa, ya, za);
            const pb = project3D(xb, yb, zb);
            if (!pa || !pb) continue;
            const warp = Math.abs(ya) / 200;
            const r = Math.round(12 + warp * 100);
            const g = Math.round(14 + warp * 30);
            const b2 = Math.round(22 + warp * 15);
            ctx.strokeStyle = `rgb(${r},${g},${b2})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(pa[0], pa[1]);
            ctx.lineTo(pb[0], pb[1]);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // Orbit trails
      for (let i = 0; i < SOLAR_SYSTEM.length; i++) {
        const st = planetState[i];
        if (st.trail.length < 2) continue;
        for (let ti = 1; ti < st.trail.length; ti++) {
          const pr0 = project3D(st.trail[ti - 1].x, st.trail[ti - 1].y, st.trail[ti - 1].z);
          const pr1 = project3D(st.trail[ti].x, st.trail[ti].y, st.trail[ti].z);
          if (!pr0 || !pr1) continue;
          const alpha = (ti / st.trail.length) * 0.35;
          ctx.beginPath();
          ctx.moveTo(pr0[0], pr0[1]);
          ctx.lineTo(pr1[0], pr1[1]);
          ctx.strokeStyle = SOLAR_SYSTEM[i].color + Math.round(alpha * 255).toString(16).padStart(2, '0');
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Depth sorted draw list
      interface DrawItem {
        p: typeof SOLAR_SYSTEM[number];
        st: PlanetState;
        pr: [number, number, number];
      }
      const drawList: DrawItem[] = [];
      for (let i = 0; i < SOLAR_SYSTEM.length; i++) {
        const pos = planetState[i].pos;
        const pr = project3D(pos[0], pos[1], pos[2]);
        if (pr) drawList.push({ p: SOLAR_SYSTEM[i], st: planetState[i], pr });
      }
      drawList.sort((a, b) => b.pr[2] - a.pr[2]);

      // Sun glow
      const sunPr = project3D(0, 0, 0);
      if (sunPr) {
        for (let g = 3; g >= 0; g--) {
          const glow = ctx.createRadialGradient(sunPr[0], sunPr[1], 0, sunPr[0], sunPr[1], 60 * (g + 1));
          glow.addColorStop(0, `rgba(255,230,160,${0.12 - g * 0.025})`);
          glow.addColorStop(1, 'rgba(255,140,30,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(sunPr[0], sunPr[1], 60 * (g + 1), 0, Math.PI * 2);
          ctx.fill();
        }
        const sunGrad = ctx.createRadialGradient(sunPr[0] - 5, sunPr[1] - 5, 0, sunPr[0], sunPr[1], 22);
        sunGrad.addColorStop(0, '#fff8e8');
        sunGrad.addColorStop(0.4, '#ffcc44');
        sunGrad.addColorStop(1, '#ff8800');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunPr[0], sunPr[1], 22, 0, Math.PI * 2);
        ctx.fill();
        if (showLabels) {
          ctx.fillStyle = 'rgba(255,200,100,0.9)';
          ctx.font = 'bold 11px "Courier New",monospace';
          ctx.textAlign = 'center';
          ctx.fillText('Sun', sunPr[0], sunPr[1] - 28);
        }
      }

      // Draw planets
      for (const item of drawList) {
        const { p, pr } = item;
        const sz = Math.max(2, p.size * (800 / pr[2]));

        // Rings (Saturn)
        if (p.rings && pr) {
          ctx.save();
          ctx.translate(pr[0], pr[1]);
          ctx.rotate(-0.35);
          ctx.strokeStyle = p.rings.color;
          ctx.lineWidth = Math.max(1.5, sz * 0.18);
          ctx.beginPath();
          ctx.ellipse(0, 0, sz * p.rings.outer, sz * p.rings.outer * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = p.rings.color.replace('0.55', '0.28');
          ctx.lineWidth = Math.max(1, sz * 0.10);
          ctx.beginPath();
          ctx.ellipse(0, 0, sz * p.rings.inner, sz * p.rings.inner * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Planet body
        const pg = ctx.createRadialGradient(pr[0] - sz * 0.25, pr[1] - sz * 0.25, 0, pr[0], pr[1], sz);
        pg.addColorStop(0, lightenColor(p.color, 1.4));
        pg.addColorStop(0.6, p.color);
        pg.addColorStop(1, '#0a0a10');
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(pr[0], pr[1], sz, 0, Math.PI * 2);
        ctx.fill();

        // Earth atmosphere
        if (p.name === 'Earth') {
          ctx.strokeStyle = 'rgba(100,160,255,0.28)';
          ctx.lineWidth = sz * 0.35;
          ctx.beginPath();
          ctx.arc(pr[0], pr[1], sz * 1.18, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Moons
        if (p.moons) {
          for (const moon of p.moons) {
            const angle = ((t * 8) / moon.period) * Math.PI * 2;
            const mx2 = item.st.pos[0] + Math.cos(angle) * moon.a;
            const mz2 = item.st.pos[2] + Math.sin(angle) * moon.a;
            const my2 = item.st.pos[1];
            const mpr = project3D(mx2, my2, mz2);
            if (!mpr) continue;
            const ms = Math.max(1, moon.size * (800 / mpr[2]));
            ctx.fillStyle = moon.color;
            ctx.beginPath();
            ctx.arc(mpr[0], mpr[1], ms, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Label
        if (showLabels) {
          ctx.fillStyle = p.color + 'cc';
          ctx.font = `${Math.max(9, Math.min(13, sz * 0.9))}px "Courier New",monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(p.name, pr[0], pr[1] - sz - 5);
        }
      }
    };

    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerenter', onEnter);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [showLabels, onCamPosChange, onCamYawChange, onCamPitchChange]);

  return <canvas ref={canvasRef} style={{ width: '100%', aspectRatio: '16/10', display: 'block', borderRadius: 8, border: '1px solid #1a1a1a', background: '#030408' }} />;
}
