'use client';

import { useCallback, useEffect, useRef } from 'react';
import { createProgram, resizeCanvas } from '@/lib/rendering/webgl';
import { QUAD_VERTEX_SHADER, SCENE_FRAGMENT_SHADER, RAY_VERTEX_SHADER, RAY_FRAGMENT_SHADER } from '@/lib/rendering/shaders';
import { getBasis } from '@/lib/simulation/camera';

export interface BlackHoleViewProps {
  spin: number;
  diskTilt: number;
  diskBright: number;
  mass: number;
  raysPerClick: number;
  camDist: number;
  onCamPosChange?: (pos: [number, number, number]) => void;
  onCamYawChange?: (yaw: number) => void;
  onCamPitchChange?: (pitch: number) => void;
  onCamDistChange?: (dist: number) => void;
}

interface Ray3D {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; age: number;
  trail: { x: number; y: number; z: number }[];
  color: [number, number, number];
}

interface State {
  yaw: number;
  pitch: number;
  camDist: number;
  targetYaw: number;
  targetPitch: number;
  camPos: [number, number, number];
  moveSpeed: number;
  keys: Record<string, boolean>;
  spin: number;
  diskTilt: number;
  diskBright: number;
  mass: number;
  raysPerClick: number;
  pointerDown: boolean;
  mouseInside: boolean;
  lastX: number;
  lastY: number;
  rays: Ray3D[];
}

const STRIDE = 6;

export default function BlackHoleView({
  spin: initialSpin,
  diskTilt: initialDiskTilt,
  diskBright: initialDiskBright,
  mass: initialMass,
  raysPerClick: initialRaysPerClick,
  camDist: initialCamDist,
  onCamPosChange,
  onCamYawChange,
  onCamPitchChange,
  onCamDistChange,
}: BlackHoleViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const stateRef = useRef<State>({
    yaw: 0.0,
    pitch: 0.0,
    camDist: initialCamDist,
    targetYaw: 0.0,
    targetPitch: 0.0,
    camPos: [0, 0, initialCamDist],
    moveSpeed: 0.5,
    keys: {},
    spin: initialSpin,
    diskTilt: initialDiskTilt,
    diskBright: initialDiskBright,
    mass: initialMass,
    raysPerClick: initialRaysPerClick,
    pointerDown: false,
    mouseInside: false,
    lastX: 0,
    lastY: 0,
    rays: [],
  });

  // Sync props to state
  useEffect(() => {
    const s = stateRef.current;
    s.spin = initialSpin;
    s.diskTilt = initialDiskTilt;
    s.diskBright = initialDiskBright;
    s.mass = initialMass;
    s.raysPerClick = initialRaysPerClick;
  }, [initialSpin, initialDiskTilt, initialDiskBright, initialMass, initialRaysPerClick]);

  const RAY_COLS: [number, number, number][] = [
    [1, 0.9, 0.3],
    [0.9, 0.4, 1],
    [0.3, 0.9, 1],
    [1, 0.5, 0.1],
    [0.4, 1, 0.5],
    [1, 0.4, 0.4],
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false });
    if (!gl) {
      alert('WebGL not supported');
      return;
    }

    const resize = () => {
      const { width, height } = resizeCanvas(canvas);
      gl.viewport(0, 0, width, height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let sceneProg: WebGLProgram;
    let rayProg: WebGLProgram;
    try {
      sceneProg = createProgram(gl, QUAD_VERTEX_SHADER, SCENE_FRAGMENT_SHADER);
      rayProg = createProgram(gl, RAY_VERTEX_SHADER, RAY_FRAGMENT_SHADER);
    } catch (e) {
      console.error(e);
      return;
    }

    const quadBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const rayBuf = gl.createBuffer()!;

    const getCam = () => {
      const { camPos, yaw, pitch } = stateRef.current;
      const { right, up, fwd } = getBasis(yaw, pitch);
      return {
        pos: new Float32Array(camPos),
        rot: new Float32Array([...right, ...up, ...fwd]),
      };
    };

    const projectPoint = (x: number, y: number, z: number): [number, number] | null => {
      const s = stateRef.current;
      const { right, up, fwd } = getBasis(s.yaw, s.pitch);
      const vx = x - s.camPos[0];
      const vy = y - s.camPos[1];
      const vz = z - s.camPos[2];
      const px = vx * right[0] + vy * right[1] + vz * right[2];
      const py = vx * up[0] + vy * up[1] + vz * up[2];
      const pz = vx * fwd[0] + vy * fwd[1] + vz * fwd[2];
      if (pz <= 0.1) return null;
      const sc = canvas.height * 0.62;
      return [px / pz * sc + canvas.width * 0.5, -py / pz * sc + canvas.height * 0.5];
    };

    const stepRays = () => {
      const s = stateRef.current;
      const rs = s.mass * 1.5;
      const MASS3D = s.mass * 4.2;
      const SPD = 5.2;

      for (const r of s.rays) {
        if (r.life <= 0) continue;
        const d2 = r.x * r.x + r.y * r.y + r.z * r.z;
        const d = Math.sqrt(d2);
        if (d < rs * 0.7) {
          r.life = 0;
          continue;
        }
        if (r.age > 0.15) {
          const f = MASS3D / Math.max(d2 * d, 0.2);
          r.vx += -r.x * f;
          r.vy += -r.y * f;
          r.vz += -r.z * f;
          if (s.spin > 0) {
            const fd = s.spin * rs * rs / Math.max(d2, 0.3);
            const nvx = r.vx - r.vz * fd;
            const nvz = r.vz + r.vx * fd;
            r.vx = nvx;
            r.vz = nvz;
          }
        }
        const mag = Math.hypot(r.vx, r.vy, r.vz);
        if (mag > 0) {
          r.vx = (r.vx / mag) * SPD;
          r.vy = (r.vy / mag) * SPD;
          r.vz = (r.vz / mag) * SPD;
        }
        r.x += r.vx;
        r.y += r.vy;
        r.z += r.vz;
        r.life -= 0.0045;
        r.age += 0.016;
        r.trail.push({ x: r.x, y: r.y, z: r.z });
        if (r.trail.length > 120) r.trail.shift();
      }

      s.rays = s.rays.filter(
        r => r.life > 0 && Math.max(Math.abs(r.x), Math.abs(r.y), Math.abs(r.z)) < 700
      );
    };

    const drawRays = () => {
      const { rays } = stateRef.current;
      const data: number[] = [];

      for (const ray of rays) {
        const tl = ray.trail.length;
        if (tl < 2) continue;
        for (let i = 1; i < tl; i++) {
          const alpha = (i / tl) * Math.max(ray.life, 0) * 0.9;
          const p0 = projectPoint(ray.trail[i - 1].x, ray.trail[i - 1].y, ray.trail[i - 1].z);
          const p1 = projectPoint(ray.trail[i].x, ray.trail[i].y, ray.trail[i].z);
          if (!p0 || !p1) continue;
          data.push(p0[0], p0[1], alpha * 0.5, ...ray.color, p1[0], p1[1], alpha, ...ray.color);
        }
      }

      // Geodesic beam toward BH
      {
        const s = stateRef.current;
        const rs = s.mass * 1.5;
        const SPD = 5.2;
        let px = s.camPos[0];
        let py = s.camPos[1];
        let pz = s.camPos[2];
        const dm = Math.hypot(-px, -py, -pz) || 1;
        let vx = (-px / dm) * SPD;
        let vy = (-py / dm) * SPD;
        let vz = (-pz / dm) * SPD;

        for (let i = 0; i < 120; i++) {
          const r2 = px * px + py * py + pz * pz;
          const r = Math.sqrt(r2) || 1;
          if (r < rs * 0.7) break;
          const f = (s.mass * 4.2) / Math.max(r2 * r, 0.2);
          vx += -px * f;
          vy += -py * f;
          vz += -pz * f;
          if (s.spin > 0) {
            const fd = s.spin * rs * rs / Math.max(r2, 0.3);
            const nvx = vx - vz * fd;
            const nvz = vz + vx * fd;
            vx = nvx;
            vz = nvz;
          }
          const vm = Math.hypot(vx, vy, vz) || 1;
          vx = (vx / vm) * SPD;
          vy = (vy / vm) * SPD;
          vz = (vz / vm) * SPD;
          const pp0 = projectPoint(px, py, pz);
          px += vx;
          py += vy;
          pz += vz;
          const pp1 = projectPoint(px, py, pz);
          if (!pp0 || !pp1) continue;
          data.push(pp0[0], pp0[1], 0.39, 1, 0.95, 0.7, pp1[0], pp1[1], 0.65, 1, 0.95, 0.7);
        }
      }

      if (data.length === 0) return;
      const arr = new Float32Array(data);
      gl.useProgram(rayProg);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.bindBuffer(gl.ARRAY_BUFFER, rayBuf);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
      const F = 4;
      const SB = STRIDE * F;
      const aPos = gl.getAttribLocation(rayProg, 'aPos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, SB, 0);
      const aA = gl.getAttribLocation(rayProg, 'aAlpha');
      gl.enableVertexAttribArray(aA);
      gl.vertexAttribPointer(aA, 1, gl.FLOAT, false, SB, 2 * F);
      const aC = gl.getAttribLocation(rayProg, 'aColor');
      gl.enableVertexAttribArray(aC);
      gl.vertexAttribPointer(aC, 3, gl.FLOAT, false, SB, 3 * F);
      gl.uniform2fv(gl.getUniformLocation(rayProg, 'uRes'), [canvas.width, canvas.height]);
      gl.drawArrays(gl.LINES, 0, arr.length / STRIDE);
      gl.disable(gl.BLEND);
    };

    let raf = 0;
    let t = 0;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      t += 0.016;

      const s = stateRef.current;
      const keys = s.keys;

      let mx = 0, my = 0, mz = 0;
      if (keys['KeyW']) mz -= 1;
      if (keys['KeyS']) mz += 1;
      if (keys['KeyA']) mx -= 1;
      if (keys['KeyD']) mx += 1;
      if (keys['KeyE'] || keys['Space']) my += 1;
      if (keys['KeyQ']) my -= 1;

      if (mx || my || mz) {
        const { right, up, fwd } = getBasis(s.yaw, s.pitch);
        const boost = keys['ShiftLeft'] || keys['ShiftRight'] ? 3 : 1;
        const spd = s.moveSpeed * boost * 2.5;
        s.camPos = [
          s.camPos[0] + (right[0] * mx + up[0] * my + fwd[0] * mz) * spd,
          s.camPos[1] + (right[1] * mx + up[1] * my + fwd[1] * mz) * spd,
          s.camPos[2] + (right[2] * mx + up[2] * my + fwd[2] * mz) * spd,
        ];
      }

      s.yaw += (s.targetYaw - s.yaw) * 0.16;
      s.pitch += (s.targetPitch - s.pitch) * 0.16;

      onCamPosChange?.(s.camPos);
      onCamYawChange?.(s.yaw);
      onCamPitchChange?.(s.pitch);

      gl.disable(gl.BLEND);
      gl.useProgram(sceneProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      const aQ = gl.getAttribLocation(sceneProg, 'aPos');
      gl.enableVertexAttribArray(aQ);
      gl.vertexAttribPointer(aQ, 2, gl.FLOAT, false, 0, 0);
      const { pos, rot } = getCam();
      gl.uniform2fv(gl.getUniformLocation(sceneProg, 'uRes'), [canvas.width, canvas.height]);
      gl.uniform1f(gl.getUniformLocation(sceneProg, 'uTime'), t);
      gl.uniform3fv(gl.getUniformLocation(sceneProg, 'uCamPos'), pos);
      gl.uniformMatrix3fv(gl.getUniformLocation(sceneProg, 'uCamRot'), false, rot);
      gl.uniform1f(gl.getUniformLocation(sceneProg, 'uSpin'), s.spin);
      gl.uniform1f(gl.getUniformLocation(sceneProg, 'uDiskTilt'), (s.diskTilt * Math.PI) / 180);
      gl.uniform1f(gl.getUniformLocation(sceneProg, 'uDiskBright'), s.diskBright);
      gl.uniform1f(gl.getUniformLocation(sceneProg, 'uMass'), s.mass);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      stepRays();
      drawRays();
    };

    frame();

    const screenRayDir = (sx: number, sy: number): [number, number, number] => {
      const u = (sx / canvas.width) * 2 - 1;
      const v = -((sy / canvas.height) * 2 - 1);
      const aspect = canvas.width / canvas.height;
      const { right, up, fwd } = getBasis(stateRef.current.yaw, stateRef.current.pitch);
      const wx = right[0] * u * aspect + up[0] * v + fwd[0] * -1.75;
      const wy = right[1] * u * aspect + up[1] * v + fwd[1] * -1.75;
      const wz = right[2] * u * aspect + up[2] * v + fwd[2] * -1.75;
      const m = Math.hypot(wx, wy, wz) || 1;
      return [wx / m, wy / m, wz / m];
    };

    const spawnRays = (dir: [number, number, number]) => {
      const n = stateRef.current.raysPerClick;
      const spread = n > 1 ? 0.13 : 0;
      const spd = 5.2;
      const { right, up } = getBasis(stateRef.current.yaw, stateRef.current.pitch);
      for (let i = 0; i < n; i++) {
        const j = (i - (n - 1) / 2) * spread;
        const jx = dir[0] + right[0] * j + up[0] * j * 0.3;
        const jy = dir[1] + right[1] * j + up[1] * j * 0.3;
        const jz = dir[2] + right[2] * j + up[2] * j * 0.3;
        const jm = Math.hypot(jx, jy, jz) || 1;
        stateRef.current.rays.push({
          x: stateRef.current.camPos[0],
          y: stateRef.current.camPos[1],
          z: stateRef.current.camPos[2],
          vx: (jx / jm) * spd,
          vy: (jy / jm) * spd,
          vz: (jz / jm) * spd,
          life: 1,
          age: 0,
          trail: [{ x: stateRef.current.camPos[0], y: stateRef.current.camPos[1], z: stateRef.current.camPos[2] }],
          color: RAY_COLS[i % RAY_COLS.length],
        });
      }
    };

    const fireAtBH = () => {
      const s = stateRef.current;
      const bm = Math.hypot(-s.camPos[0], -s.camPos[1], -s.camPos[2]) || 1;
      spawnRays([-s.camPos[0] / bm, -s.camPos[1] / bm, -s.camPos[2] / bm]);
    };

    const setDistance = (d: number) => {
      const s = stateRef.current;
      const nd = Math.max(2, Math.min(200, d));
      const delta = nd - s.camDist;
      const { fwd } = getBasis(s.yaw, s.pitch);
      s.camPos = [s.camPos[0] + fwd[0] * delta, s.camPos[1] + fwd[1] * delta, s.camPos[2] + fwd[2] * delta];
      s.camDist = nd;
      onCamDistChange?.(nd);
    };

    const onDown = (e: PointerEvent) => {
      stateRef.current.pointerDown = true;
      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    };

    const onMove = (e: PointerEvent) => {
      if (!stateRef.current.pointerDown) return;
      stateRef.current.targetYaw += (e.clientX - stateRef.current.lastX) * 0.005;
      stateRef.current.targetPitch = Math.max(-1.45, Math.min(1.45, stateRef.current.targetPitch - (e.clientY - stateRef.current.lastY) * 0.005));
      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
    };

    const onEnter = (e: PointerEvent) => {
      stateRef.current.mouseInside = true;
      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
      canvas.style.cursor = 'grab';
    };

    const onLeave = () => {
      stateRef.current.mouseInside = false;
      stateRef.current.pointerDown = false;
      canvas.style.cursor = 'default';
    };

    const onUp = () => {
      stateRef.current.pointerDown = false;
      canvas.style.cursor = 'grab';
    };

    let lastPinch = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) lastPinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        setDistance(stateRef.current.camDist * lastPinch / d);
        lastPinch = d;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setDistance(stateRef.current.camDist + e.deltaY * 0.04);
    };

    const onClick = (e: MouseEvent) => {
      if (Math.abs(e.movementX) + Math.abs(e.movementY) > 4) return;
      const rect = canvas.getBoundingClientRect();
      spawnRays(screenRayDir((e.clientX - rect.left) * canvas.width / rect.width, (e.clientY - rect.top) * canvas.height / rect.height));
    };

    const onKey = (e: KeyboardEvent) => {
      const tracked = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'Space', 'ShiftLeft', 'ShiftRight'];
      if (tracked.includes(e.code)) {
        stateRef.current.keys[e.code] = e.type === 'keydown';
        e.preventDefault();
      }
      if (e.code === 'KeyF' && e.type === 'keydown') {
        fireAtBH();
        e.preventDefault();
      }
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerenter', onEnter);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteProgram(sceneProg);
      gl.deleteProgram(rayProg);
      gl.deleteBuffer(quadBuf);
      gl.deleteBuffer(rayBuf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerenter', onEnter);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [onCamPosChange, onCamYawChange, onCamPitchChange, onCamDistChange]);

  const fireRing = useCallback(() => {
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const r = 10;
      const px = Math.cos(a) * r;
      const pz = Math.sin(a) * r;
      const m = Math.hypot(-px, 0, -pz) || 1;
      stateRef.current.rays.push({
        x: px, y: 0, z: pz,
        vx: (-px / m) * 5.2, vy: 0, vz: (-pz / m) * 5.2,
        life: 1, age: 0, trail: [],
        color: RAY_COLS[i % RAY_COLS.length],
      });
    }
  }, []);

  const fireAtBH = useCallback(() => {
    const s = stateRef.current;
    const bm = Math.hypot(-s.camPos[0], -s.camPos[1], -s.camPos[2]) || 1;
    const d: [number, number, number] = [-s.camPos[0] / bm, -s.camPos[1] / bm, -s.camPos[2] / bm];
    const n2 = s.raysPerClick;
    const sp = 5.2;
    const { right, up } = getBasis(s.yaw, s.pitch);
    for (let i = 0; i < n2; i++) {
      const j = (i - (n2 - 1) / 2) * (n2 > 1 ? 0.1 : 0);
      const jx = d[0] + right[0] * j + up[0] * j * 0.35;
      const jy = d[1] + right[1] * j + up[1] * j * 0.35;
      const jz = d[2] + right[2] * j + up[2] * j * 0.35;
      const jm = Math.hypot(jx, jy, jz) || 1;
      s.rays.push({
        x: s.camPos[0], y: s.camPos[1], z: s.camPos[2],
        vx: (jx / jm) * sp, vy: (jy / jm) * sp, vz: (jz / jm) * sp,
        life: 1, age: 0,
        trail: [{ x: s.camPos[0], y: s.camPos[1], z: s.camPos[2] }],
        color: [1, 0.7, 0.2] as [number, number, number],
      });
    }
  }, []);

  const clearRays = useCallback(() => {
    stateRef.current.rays = [];
  }, []);

  return {
    canvasRef,
    fireRing,
    fireAtBH,
    clearRays,
    getState: () => stateRef.current,
  };
}
