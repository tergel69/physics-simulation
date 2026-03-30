'use client';

import { useEffect, useRef } from 'react';
import { getBasis } from '@/lib/simulation/camera';
import {
  orbitalColor,
  sampleOrbitalPoint,
  HYDROGEN_ATLAS,
} from '@/lib/physics/quantum';

type OrbitalKind = 's' | 'p' | 'd' | 'f' | 'mix' | 'atlas';

interface QuantumViewProps {
  atomZ: number;
  orbitalType: OrbitalKind;
}

function drawQuantumAtlas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  t: number
) {
  const cols = 4;
  const rows = 4;
  const margin = 14;
  const gap = 8;
  const cellW = (canvas.width - margin * 2 - gap * (cols - 1)) / cols;
  const cellH = (canvas.height - margin * 2 - gap * (rows - 1)) / rows;
  const count = Math.min(HYDROGEN_ATLAS.length, cols * rows);

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const bg = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.28,
    10,
    canvas.width * 0.5,
    canvas.height * 0.28,
    Math.max(canvas.width, canvas.height) * 0.7
  );
  bg.addColorStop(0, 'rgba(60, 20, 90, 0.18)');
  bg.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255, 230, 200, 0.96)';
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Hydrogen Wave Function', canvas.width * 0.5, 28);
  ctx.fillStyle = 'rgba(210, 170, 255, 0.78)';
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText('Real hydrogenic orbitals and a coherent superposition', canvas.width * 0.5, 44);

  for (let idx = 0; idx < count; idx++) {
    const spec = HYDROGEN_ATLAS[idx];
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = margin + col * (cellW + gap);
    const y = 56 + row * (cellH + gap);
    const tileW = cellW;
    const tileH = cellH;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, tileW, tileH, 8);
    ctx.fillStyle = 'rgba(10, 8, 18, 0.96)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 200, 120, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, tileW - 2, tileH - 2, 7);
    ctx.clip();

    ctx.globalCompositeOperation = 'lighter';
    const samples = 1000;
    for (let i = 0; i < samples; i++) {
      const pt = sampleOrbitalPoint(1, `${spec.n}${spec.l}${spec.m}` as unknown as OrbitalKind, t) as { x: number; y: number; z: number; psi: number; prob: number; l: number } | null;
      if (!pt) continue;
      const rot = rotatePoint(pt.x, pt.y, pt.z, 0.7 + idx * 0.14, 0.82, 0.22);
      const depth = Math.max(0.18, Math.min(1, 0.92 - rot[2] / 36));
      const px = x + tileW * 0.5 + rot[0] * tileW * 0.15;
      const py = y + tileH * 0.53 - rot[1] * tileH * 0.15;
      ctx.fillStyle = orbitalColor(pt.psi, pt.prob * depth, spec.l);
      const s = 0.85 + pt.prob * 1.15;
      ctx.fillRect(px - s * 0.5, py - s * 0.5, s, s);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
    ctx.fillRect(x, y + tileH - 20, tileW, 20);
    ctx.fillStyle = 'rgba(255, 235, 210, 0.92)';
    ctx.font = '11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(spec.label, x + tileW * 0.5, y + tileH - 6);
    ctx.restore();
  }

  ctx.restore();
}

function rotatePoint(
  x: number,
  y: number,
  z: number,
  yaw: number,
  pitch: number,
  roll: number
): [number, number, number] {
  const cy = Math.cos(yaw),
    sy = Math.sin(yaw);
  const cp = Math.cos(pitch),
    sp = Math.sin(pitch);
  const cr = Math.cos(roll),
    sr = Math.sin(roll);

  let px = x * cy - z * sy;
  let pz = x * sy + z * cy;
  let py = y;

  const py2 = py * cp - pz * sp;
  const pz2 = py * sp + pz * cp;
  py = py2;
  pz = pz2;

  const px2 = px * cr - py * sr;
  const py3 = px * sr + py * cr;
  px = px2;
  py = py3;

  return [px, py, pz];
}

export default function QuantumView({ atomZ, orbitalType }: QuantumViewProps) {
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

    const state = {
      camPos: [0, 0, 72] as [number, number, number],
      yaw: 0.2,
      pitch: -0.1,
      targetYaw: 0.2,
      targetPitch: -0.1,
      moveSpeed: 0.5,
      keys: {} as Record<string, boolean>,
      mouseInside: false,
      pointerDown: false,
      lastX: 0,
      lastY: 0,
    };

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
        const spd = state.moveSpeed * boost * 4;
        state.camPos = [
          state.camPos[0] + (right[0] * mx + up[0] * my + fwd[0] * mz) * spd,
          state.camPos[1] + (right[1] * mx + up[1] * my + fwd[1] * mz) * spd,
          state.camPos[2] + (right[2] * mx + up[2] * my + fwd[2] * mz) * spd,
        ];
      }

      // Background
      ctx.fillStyle = '#030408';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Atlas mode
      if (orbitalType === 'atlas') {
        drawQuantumAtlas(ctx, canvas, t);
        return;
      }

      const Z = Math.max(1, Math.min(10, atomZ));

      // Auto-rotate slowly when idle
      if (!state.mouseInside) state.targetYaw += 0.0014;

      // Nucleus
      const cx = canvas.width * 0.5;
      const cy = canvas.height * 0.5;
      const nucPr = project3D(0, 0, 0);
      if (nucPr) {
        for (let g = 3; g >= 0; g--) {
          const r = 6 + g * 4;
          const glow = ctx.createRadialGradient(nucPr[0], nucPr[1], 0, nucPr[0], nucPr[1], r);
          glow.addColorStop(0, `rgba(220,180,255,${0.18 - g * 0.04})`);
          glow.addColorStop(1, 'rgba(120,40,255,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(nucPr[0], nucPr[1], r, 0, Math.PI * 2);
          ctx.fill();
        }
        const nGrad = ctx.createRadialGradient(nucPr[0] - 2, nucPr[1] - 2, 0, nucPr[0], nucPr[1], 7);
        nGrad.addColorStop(0, '#f0e0ff');
        nGrad.addColorStop(0.5, '#c070ff');
        nGrad.addColorStop(1, '#6010aa');
        ctx.fillStyle = nGrad;
        ctx.beginPath();
        ctx.arc(nucPr[0], nucPr[1], 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sample wavefunction and render probability cloud
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const nPoints = 12000;
      for (let i = 0; i < nPoints; i++) {
        const pt = sampleOrbitalPoint(Z, orbitalType, t);
        if (!pt) continue;
        const pr = project3D(pt.x, pt.y, pt.z);
        if (!pr) continue;
        const depth = Math.max(0.12, Math.min(1, 0.9 - pr[2] / 200));
        ctx.fillStyle = orbitalColor(pt.psi, pt.prob * depth, pt.l);
        const sz = 0.9 + pt.prob * 1.1;
        ctx.fillRect(pr[0] - sz * 0.5, pr[1] - sz * 0.5, sz, sz);
      }
      ctx.restore();

      // Legend
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.roundRect(14, 14, 200, 62, 6);
      ctx.fill();
      ctx.fillStyle = '#c8a8ff';
      ctx.font = 'bold 13px "Courier New",monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Hydrogen Wave Function', 22, 34);
      ctx.fillStyle = '#8878aa';
      ctx.font = '11px "Courier New",monospace';
      ctx.fillText(`state: ${orbitalType === 'mix' ? 'superposition' : orbitalType}`, 22, 50);
      ctx.fillText('ψ sign maps to colour', 22, 66);
      ctx.restore();

      // Phase legend
      ctx.save();
      const lx = canvas.width - 140;
      const ly = 14;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(lx, ly, 126, 48, 5);
      ctx.fill();
      ctx.fillStyle = 'rgba(160,100,255,0.8)';
      ctx.fillRect(lx + 10, ly + 10, 10, 10);
      ctx.fillStyle = 'rgba(255,80,200,0.8)';
      ctx.fillRect(lx + 10, ly + 28, 10, 10);
      ctx.fillStyle = '#aaa';
      ctx.font = '10px "Courier New",monospace';
      ctx.textAlign = 'left';
      ctx.fillText('ψ > 0 (positive)', lx + 26, ly + 20);
      ctx.fillText('ψ < 0 (negative)', lx + 26, ly + 38);
      ctx.restore();
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
  }, [atomZ, orbitalType]);

  return <canvas ref={canvasRef} style={{ width: '100%', aspectRatio: '16/10', display: 'block', borderRadius: 8, border: '1px solid #1a1a1a', background: '#030408' }} />;
}
