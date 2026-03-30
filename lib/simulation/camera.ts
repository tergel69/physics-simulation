// ═══════════════════════════════════════════════════════════════════════════
// CAMERA SYSTEM
// Handles camera movement, rotation, and basis calculation for 3D scenes
// ═══════════════════════════════════════════════════════════════════════════

export interface CameraState {
  yaw: number;
  pitch: number;
  roll: number;
  camPos: [number, number, number];
  targetYaw: number;
  targetPitch: number;
  targetRoll: number;
  camDist: number;
  moveSpeed: number;
  fov: number;
}

export interface CameraBasis {
  right: [number, number, number];
  up: [number, number, number];
  fwd: [number, number, number];
}

export interface CameraUniforms {
  pos: Float32Array;
  rot: Float32Array;
  fov: number;
}

// Default camera state
export function createDefaultCameraState(): CameraState {
  return {
    yaw: 0,
    pitch: 0,
    roll: 0,
    camPos: [0, 0, 30],
    targetYaw: 0,
    targetPitch: 0,
    targetRoll: 0,
    camDist: 30,
    moveSpeed: 0.5,
    fov: 1.75,
  };
}

// Calculate camera basis vectors from euler angles
export function getBasis(yaw: number, pitch: number, roll: number = 0): CameraBasis {
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosR = Math.cos(roll);
  const sinR = Math.sin(roll);

  // Forward vector
  const fx = -sinY * cosP;
  const fy = sinP;
  const fz = -cosY * cosP;

  // Right vector (perpendicular to forward, in horizontal plane initially)
  let rx = -fz;
  let ry = 0;
  let rz = fx;
  const rl = Math.hypot(rx, ry, rz) || 1;
  rx /= rl;
  ry /= rl;
  rz /= rl;

  // Apply roll to right vector
  const rx2 = rx * cosR - ry * sinR;
  const ry2 = rx * sinR + ry * cosR;
  rx = rx2;
  ry = ry2;

  // Up vector (cross product of right and forward)
  const ux = ry * fz - rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy - ry * fx;

  return {
    right: [rx, ry, rz],
    up: [ux, uy, uz],
    fwd: [fx, fy, fz],
  };
}

// Get camera uniforms for shaders
export function getCameraUniforms(state: CameraState): CameraUniforms {
  const { right, up, fwd } = getBasis(state.yaw, state.pitch, state.roll);
  
  return {
    pos: new Float32Array(state.camPos),
    rot: new Float32Array([
      right[0], right[1], right[2],
      up[0], up[1], up[2],
      fwd[0], fwd[1], fwd[2],
    ]),
    fov: state.fov,
  };
}

// Project a 3D point to 2D screen coordinates
export function projectPoint(
  x: number,
  y: number,
  z: number,
  state: CameraState,
  canvas: { width: number; height: number }
): [number, number] | null {
  const basis = getBasis(state.yaw, state.pitch, state.roll);
  const { right, up, fwd } = basis;

  const vx = x - state.camPos[0];
  const vy = y - state.camPos[1];
  const vz = z - state.camPos[2];

  const px = vx * right[0] + vy * right[1] + vz * right[2];
  const py = vx * up[0] + vy * up[1] + vz * up[2];
  const pz = vx * fwd[0] + vy * fwd[1] + vz * fwd[2];

  if (pz <= 0.1) return null;

  const sc = canvas.height * state.fov;
  return [
    px / pz * sc + canvas.width / 2,
    -py / pz * sc + canvas.height / 2,
  ];
}

// Move camera forward by a delta distance
export function moveForward(state: CameraState, delta: number): void {
  const basis = getBasis(state.yaw, state.pitch, state.roll);
  const { fwd } = basis;

  state.camPos = [
    state.camPos[0] + fwd[0] * delta,
    state.camPos[1] + fwd[1] * delta,
    state.camPos[2] + fwd[2] * delta,
  ];
  state.camDist = Math.max(2, Math.min(200, state.camDist + delta));
}

// Set absolute distance from target
export function setDistance(state: CameraState, distance: number): void {
  const currentDistance = state.camDist;
  const newDistance = Math.max(2, Math.min(200, distance));
  const delta = newDistance - currentDistance;
  moveForward(state, delta);
}

// Move camera using WASD-like controls
export function moveCamera(
  state: CameraState,
  mx: number,
  my: number,
  mz: number,
  boost: number = 1
): void {
  if (mx === 0 && my === 0 && mz === 0) return;

  const basis = getBasis(state.yaw, state.pitch, state.roll);
  const { right, up, fwd } = basis;

  const speed = state.moveSpeed * boost * 2.5;

  state.camPos = [
    state.camPos[0] + (right[0] * mx + up[0] * my + fwd[0] * mz) * speed,
    state.camPos[1] + (right[1] * mx + up[1] * my + fwd[1] * mz) * speed,
    state.camPos[2] + (right[2] * mx + up[2] * my + fwd[2] * mz) * speed,
  ];
}

// Apply smooth camera rotation
export function updateCameraRotation(
  state: CameraState,
  smoothing: number = 0.16
): void {
  state.yaw += (state.targetYaw - state.yaw) * smoothing;
  state.pitch += (state.targetPitch - state.pitch) * smoothing;
  state.roll += (state.targetRoll - state.roll) * smoothing;
}

// Get screen ray direction for a point on screen
export function getScreenRayDirection(
  screenX: number,
  screenY: number,
  canvas: { width: number; height: number },
  state: CameraState
): [number, number, number] {
  const u = screenX / canvas.width * 2 - 1;
  const v = -((screenY / canvas.height) * 2 - 1);
  const aspect = canvas.width / canvas.height;

  const basis = getBasis(state.yaw, state.pitch, state.roll);
  const { right, up, fwd } = basis;

  const wx = right[0] * u * aspect + up[0] * v + fwd[0] * -state.fov;
  const wy = right[1] * u * aspect + up[1] * v + fwd[1] * -state.fov;
  const wz = right[2] * u * aspect + up[2] * v + fwd[2] * -state.fov;

  const m = Math.hypot(wx, wy, wz) || 1;
  return [wx / m, wy / m, wz / m];
}

// Calculate camera distance to a point
export function distanceToPoint(
  state: CameraState,
  x: number,
  y: number,
  z: number
): number {
  const dx = x - state.camPos[0];
  const dy = y - state.camPos[1];
  const dz = z - state.camPos[2];
  return Math.hypot(dx, dy, dz);
}

// Calculate direction to a point from camera
export function directionToPoint(
  state: CameraState,
  x: number,
  y: number,
  z: number
): [number, number, number] {
  const dx = x - state.camPos[0];
  const dy = y - state.camPos[1];
  const dz = z - state.camPos[2];
  const d = Math.hypot(dx, dy, dz) || 1;
  return [dx / d, dy / d, dz / d];
}

// Clamp pitch to avoid gimbal lock
export function clampPitch(pitch: number, min: number = -1.45, max: number = 1.45): number {
  return Math.max(min, Math.min(max, pitch));
}

// Reset camera to default position
export function resetCamera(state: CameraState, position?: [number, number, number]): void {
  if (position) {
    state.camPos = position;
  } else {
    state.camPos = [0, 0, state.camDist];
  }
  state.yaw = 0;
  state.pitch = 0;
  state.roll = 0;
  state.targetYaw = 0;
  state.targetPitch = 0;
  state.targetRoll = 0;
}

export default {
  createDefaultCameraState,
  getBasis,
  getCameraUniforms,
  projectPoint,
  moveForward,
  setDistance,
  moveCamera,
  updateCameraRotation,
  getScreenRayDirection,
  distanceToPoint,
  directionToPoint,
  clampPitch,
  resetCamera,
};