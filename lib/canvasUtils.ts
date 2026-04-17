export function worldToScreen(
  x: number,
  y: number,
  z: number,
  camPos: [number, number, number],
  right: [number, number, number],
  up: [number, number, number],
  fwd: [number, number, number],
  canvasWidth: number,
  canvasHeight: number,
  projScale: number = 0.62
): [number, number] | null {
  const vx = x - camPos[0];
  const vy = y - camPos[1];
  const vz = z - camPos[2];
  
  const px = vx * right[0] + vy * right[1] + vz * right[2];
  const py = vx * up[0] + vy * up[1] + vz * up[2];
  const pz = vx * fwd[0] + vy * fwd[1] + vz * fwd[2];
  
  if (pz <= 0.1) return null;
  
  const sc = canvasHeight * projScale;
  return [px / pz * sc + canvasWidth * 0.5, -py / pz * sc + canvasHeight * 0.5];
}

export function screenToWorld(
  sx: number,
  sy: number,
  canvasWidth: number,
  canvasHeight: number,
  right: [number, number, number],
  up: [number, number, number],
  fwd: [number, number, number],
  projScale: number = 0.62
): [number, number, number] {
  const u = (sx / canvasWidth) * 2 - 1;
  const v = -((sy / canvasHeight) * 2 - 1);
  const aspect = canvasWidth / canvasHeight;
  
  const wx = right[0] * u * aspect + up[0] * v + fwd[0] * -1.75;
  const wy = right[1] * u * aspect + up[1] * v + fwd[1] * -1.75;
  const wz = right[2] * u * aspect + up[2] * v + fwd[2] * -1.75;
  
  const m = Math.hypot(wx, wy, wz) || 1;
  return [wx / m, wy / m, wz / m];
}