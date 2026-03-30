// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED BLACK HOLE RENDERING SHADERS
// Scientifically accurate gravitational lensing, accretion disk physics,
// multi-wavelength rendering, and relativistic jet simulations
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// PHYSICAL CONSTANTS (in simulation units)
// ═══════════════════════════════════════════════════════════════════════════

export const RENDER_CONSTANTS = {
  // Speed of light (normalized)
  C: 1.0,
  // Gravitational constant (normalized)  
  G: 1.0,
  // Schwarzschild radius multiplier
  SCHWARZSCHILD_FACTOR: 2.0,
  // Photon sphere (1.5 * Rs)
  PHOTON_SPHERE_FACTOR: 1.5,
  // ISCO for non-rotating BH (3 * Rs)
  ISCO_FACTOR: 3.0,
  // Event horizon (for Schwarzschild, just Rs)
  EVENT_HORIZON_FACTOR: 1.0,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// WAVELENGTH BANDS FOR MULTI-WAVELENGTH RENDERING
// ═══════════════════════════════════════════════════════════════════════════

export type WavelengthBand = 'radio' | 'mm' | 'infrared' | 'visible' | 'uv' | 'xray' | 'gamma';

export interface WavelengthConfig {
  name: WavelengthBand;
  wavelength: number; // in nanometers
  color: [number, number, number];
  emissionTemp: number; // K
  intensity: number;
}

export const WAVELENGTH_CONFIGS: Record<WavelengthBand, WavelengthConfig> = {
  radio: {
    name: 'radio',
    wavelength: 10000000, // 10m = 10000000nm
    color: [0.2, 0.4, 0.8],
    emissionTemp: 1e6,
    intensity: 0.3,
  },
  mm: {
    name: 'mm',
    wavelength: 1000000, // 1mm
    color: [0.3, 0.6, 1.0],
    emissionTemp: 1e7,
    intensity: 0.5,
  },
  infrared: {
    name: 'infrared',
    wavelength: 10000, // 10μm
    color: [0.8, 0.3, 0.2],
    emissionTemp: 1e8,
    intensity: 0.7,
  },
  visible: {
    name: 'visible',
    wavelength: 550, // 550nm (green)
    color: [1.0, 1.0, 1.0],
    emissionTemp: 1e9,
    intensity: 1.0,
  },
  uv: {
    name: 'uv',
    wavelength: 100, // 100nm
    color: [0.6, 0.3, 0.9],
    emissionTemp: 1e10,
    intensity: 0.8,
  },
  xray: {
    name: 'xray',
    wavelength: 1, // 1nm
    color: [0.3, 0.9, 1.0],
    emissionTemp: 1e11,
    intensity: 0.6,
  },
  gamma: {
    name: 'gamma',
    wavelength: 0.001, // 0.001nm
    color: [1.0, 0.5, 0.2],
    emissionTemp: 1e12,
    intensity: 0.4,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ENHANCED VERTEX SHADER - Fullscreen Quad
// ═══════════════════════════════════════════════════════════════════════════

export const ADVANCED_QUAD_VS = `
attribute vec2 aPos;
varying vec2 vUv;
varying vec3 vRayDir;

uniform vec3 uCamPos;
uniform mat3 uCamRot;
uniform float uFov;

void main() {
  vUv = aPos * 0.5 + 0.5;
  
  // Calculate ray direction from camera
  vec2 uv = aPos;
  vec3 rayDirLocal = normalize(vec3(uv * tan(uFov * 0.5), -1.0));
  vRayDir = uCamRot * rayDirLocal;
  
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED FRAGMENT SHADER - Full Physics Black Hole Rendering
// ═══════════════════════════════════════════════════════════════════════════

export const ADVANCED_SCENE_FS = `
precision highp float;

varying vec2 vUv;
varying vec3 vRayDir;

uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform mat3 uCamRot;
uniform float uSpin;        // Kerr spin parameter (0-1)
uniform float uMass;         // Black hole mass (solar masses)
uniform float uDiskTilt;     // Accretion disk tilt angle
uniform float uDiskBright;  // Disk brightness multiplier
uniform float uWavelength;  // Wavelength band (0-6 for radio to gamma)
uniform int uLensSteps;     // Number of geodesic integration steps
uniform int uDiskSamples;   // Accretion disk ray march samples
uniform bool uShow Jets;    // Show relativistic jets
uniform bool uShowDisk;     // Show accretion disk
uniform bool uShowStars;    // Show background stars
uniform bool uDoppler;      // Enable Doppler beaming
uniform bool uGravRedshift; // Enable gravitational redshift

// ─── Constants ────────────────────────────────────────────────────────────────
#define PI 3.14159265359
#define C 1.0                    // Speed of light (normalized)
#define G 1.0                    // Gravitational constant
#define RS 2.0                   // Schwarzschild radius = 2GM/c²

// ─── Noise Functions ──────────────────────────────────────────────────────────
float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  return mix(
    mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
    f.z
  );
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for(int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.01;
    amplitude *= 0.5;
  }
  return value;
}

// ─── Schwarzschild Metric ───────────────────────────────────────────────────
// Proper gravitational acceleration in Schwarzschild spacetime
vec3 schwarzschildAccel(vec3 pos, float rs) {
  float r = length(pos);
  if(r < rs * 1.01) return vec3(0.0);
  
  // Newtonian approximation with relativistic correction
  float r2 = r * r;
  float r3 = r2 * r;
  
  // F = GM/r² * (1 + 3a²/r²) for Schwarzschild (post-Newtonian)
  float factor = -rs * C * C / 2.0; // GM/c² = rs/2
  vec3 radial = normalize(pos);
  
  // Proper acceleration = GM/r² * (1 - Rs/r)^(-1/2)
  float properAccel = rs * 0.5 / (r2 * sqrt(1.0 - rs / r));
  
  return radial * properAccel;
}

// Kerr metric - Lense-Thirring precession (frame dragging)
vec3 kerrFrameDrag(vec3 pos, vec3 vel, float spin, float rs) {
  float r = length(pos);
  if(r < rs * 1.5 || spin < 0.001) return vec3(0.0);
  
  // Angular momentum of black hole
  float J = spin * rs * rs * C / 2.0;
  
  // Lense-Thirring precession rate
  vec3 L = cross(pos, vel);
  float LT = 2.0 * G * J / (C * C * r * r * r);
  
  return cross(vec3(0.0, 1.0, 0.0), vel) * LT;
}

// ─── Geodesic Ray Tracing ───────────────────────────────────────────────────
struct RayResult {
  vec3 emission;
  float redshift;
  bool captured;
  vec3 finalDir;
  float totalDist;
};

RayResult traceGeodesic(vec3 ro, vec3 rd, float rs) {
  RayResult result;
  result.emission = vec3(0.0);
  result.redshift = 1.0;
  result.captured = false;
  result.finalDir = rd;
  result.totalDist = 0.0;
  
  vec3 pos = ro;
  vec3 vel = normalize(rd);
  
  float dt = 0.1;
  float maxDist = 500.0 * rs;
  int maxSteps = uLensSteps;
  
  // Disk plane normal (tilted)
  float tilt = uDiskTilt * PI / 180.0;
  vec3 diskNormal = normalize(vec3(0.0, cos(tilt), sin(tilt)));
  
  float prevHeight = dot(pos, diskNormal);
  
  for(int i = 0; i < 500; i++) {
    if(i >= maxSteps) break;
    
    float r = length(pos);
    
    // Check if captured by event horizon
    if(r < rs * 1.05) {
      result.captured = true;
      break;
    }
    
    // Escaped to infinity
    if(r > maxDist) break;
    
    // Adaptive step size based on distance to BH
    dt = clamp(0.15 * (r - rs) / rs, 0.02, 2.0);
    
    // Calculate acceleration
    vec3 accel = schwarzschildAccel(pos, rs);
    accel += kerrFrameDrag(pos, vel, uSpin, rs);
    
    // Update velocity (4th order Runge-Kutta would be better but this is fast)
    vel = normalize(vel + accel * dt);
    
    // Update position
    vec3 newPos = pos + vel * dt;
    float newHeight = dot(newPos, diskNormal);
    
    // Check disk crossing
    if(uShowDisk && prevHeight * newHeight < 0.0) {
      // Interpolate to disk plane
      float t = -prevHeight / (newHeight - prevHeight);
      vec3 diskPos = pos + vel * dt * t;
      
      // Calculate disk emission
      float diskR = length(diskPos.xz);
      float innerRadius = 3.0 * rs;
      float outerRadius = 15.0 * rs;
      
      if(diskR > innerRadius && diskR < outerRadius) {
        // Orbital velocity (Keplerian)
        float orbitalVel = sqrt(G * uMass / diskR) * 0.5;
        
        // Doppler factor
        float doppler = 1.0;
        if(uDoppler) {
          vec3 orbitalDir = normalize(vec3(-diskPos.z, 0.0, diskPos.x));
          float velAlongRay = dot(orbitalDir, vel);
          doppler = sqrt((1.0 + velAlongRay / C) / (1.0 - velAlongRay / C));
        }
        
        // Gravitational redshift
        float gravRedshift = 1.0;
        if(uGravRedshift) {
          gravRedshift = sqrt(1.0 - rs / diskR);
        }
        
        // Disk temperature (inner = hotter)
        float rNorm = (diskR - innerRadius) / (outerRadius - innerRadius);
        float temp = pow(1.0 - rNorm, 0.25) * 1e9;
        
        // Wavelength-dependent color
        vec3 diskColor = diskTemperatureColor(temp, uWavelength);
        
        // Turbulence
        float angle = atan(diskPos.z, diskPos.x);
        float turbulence = fbm(vec3(angle * 3.0 + uTime * orbitalVel * 2.0, rNorm * 5.0, uTime * 0.1));
        
        // Doppler beaming (approaching side brighter)
        float beaming = 1.0;
        if(uDoppler) {
          vec3 toPos = normalize(diskPos - ro);
          float approach = dot(orbitalDir, toPos);
          beaming = pow(1.0 + approach * 0.5, 3.0);
        }
        
        float intensity = (0.7 + 0.3 * turbulence) * beaming * doppler * gravRedshift;
        result.emission += diskColor * intensity * uDiskBright * dt * 10.0;
      }
    }
    
    prevHeight = newHeight;
    pos = newPos;
    result.totalDist += dt;
    
    if(r > 300.0 * rs) break;
  }
  
  result.finalDir = vel;
  return result;
}

// ─── Blackbody Color from Temperature ───────────────────────────────────────
vec3 diskTemperatureColor(float temp, float wavelength) {
  // Wavelength color mapping
  vec3 wlColor;
  if(wavelength < 0.5) {
    // Radio/MM
    wlColor = vec3(0.3, 0.5, 0.9);
  } else if(wavelength < 1.5) {
    // Infrared
    wlColor = vec3(0.9, 0.4, 0.2);
  } else if(wavelength < 2.5) {
    // Visible
    float t = (wavelength - 1.5);
    wlColor = mix(vec3(1.0, 0.3, 0.1), vec3(1.0, 1.0, 0.8), t);
  } else if(wavelength < 3.5) {
    // UV
    wlColor = vec3(0.7, 0.4, 1.0);
  } else if(wavelength < 4.5) {
    // X-ray
    wlColor = vec3(0.4, 0.9, 1.0);
  } else {
    // Gamma
    wlColor = vec3(1.0, 0.6, 0.3);
  }
  
  // Blackbody intensity (Stefan-Boltzmann)
  float bbIntensity = pow(temp / 1e9, 4.0);
  
  return wlColor * bbIntensity * 2.0;
}

// ─── Starfield ──────────────────────────────────────────────────────────────
vec3 starField(vec3 dir) {
  vec3 col = vec3(0.0);
  
  // Milky way band
  float band = exp(-pow(dir.y * 8.0, 2.0));
  col += vec3(0.12, 0.08, 0.18) * band * 0.15;
  col += vec3(0.03, 0.02, 0.06) * pow(clamp(1.0 - abs(dir.y), 0.0, 1.0), 2.0);
  
  // Stars
  for(int layer = 0; layer < 4; layer++) {
    float scale = 80.0 + float(layer) * 120.0;
    vec3 cell = floor(dir * scale);
    float h = hash(cell + float(layer) * 17.3);
    
    if(h > 0.997) {
      float brightness = hash(cell + 91.3) * 0.8 + 0.2;
      // Star color based on temperature
      vec3 starColor = mix(
        vec3(1.0, 0.9, 0.8),
        mix(vec3(0.8, 0.9, 1.0), vec3(1.0, 0.7, 0.5), brightness),
        hash(cell + 13.7)
      );
      col += starColor * brightness * 0.8;
    }
  }
  
  return col;
}

// ─── Relativistic Jets ──────────────────────────────────────────────────────
vec3 relativisticJets(vec3 pos, vec3 rd, float rs, float spin) {
  if(!uShowJets || spin < 0.1) return vec3(0.0);
  
  vec3 col = vec3(0.0);
  
  // Jet axis (aligned with spin)
  vec3 jetAxis = vec3(0.0, 1.0, 0.0);
  
  // Distance along jet
  float jetDist = dot(pos, jetAxis);
  
  // How close ray is to jet axis
  vec3 perp = pos - jetAxis * jetDist;
  float perpDist = length(perp);
  
  // Jet width increases with distance
  float jetWidth = 0.5 + abs(jetDist) * 0.1;
  
  if(perpDist < jetWidth * 3.0) {
    // Jet intensity (falloff with distance)
    float jetIntensity = exp(-perpDist * perpDist / (jetWidth * jetWidth));
    jetIntensity *= exp(-abs(jetDist) * 0.05);
    
    // Blue-shifted emission (approaching jet)
    if(jetDist > 0.0) {
      // Outflow velocity (relativistic)
      float vJet = 0.9 * spin;
      float doppler = sqrt((1.0 + vJet) / (1.0 - vJet));
      
      // Synchrotron-like color
      vec3 jetColor = mix(
        vec3(0.1, 0.3, 1.0),  // Blue core
        vec3(0.4, 0.6, 1.0),  // Cyan outer
        perpDist / jetWidth
      );
      
      col += jetColor * jetIntensity * spin * 2.0 * doppler;
    }
  }
  
  return col;
}

// ─── Photon Ring (Einstein Ring) ───────────────────────────────────────────
vec3 photonRing(vec3 ro, vec3 rd, float rs) {
  vec3 toBH = -normalize(ro);
  float cosAngle = dot(rd, toBH);
  float angle = acos(clamp(cosAngle, -1.0, 1.0));
  
  float camDist = length(ro);
  
  // Photon sphere at 1.5 Rs
  float photonSphere = atan(1.5 * rs, camDist);
  
  // Einstein ring approximation
  float ring = exp(-pow((angle - photonSphere) / 0.008, 2.0));
  vec3 ringColor = vec3(1.0, 0.9, 0.7) * ring * 5.0;
  
  // Secondary rings
  float ring2 = exp(-pow((angle - photonSphere * 0.92) / 0.015, 2.0));
  ringColor += vec3(0.9, 0.7, 0.4) * ring2 * 1.8;
  
  // Tertiary
  float ring3 = exp(-pow((angle - photonSphere * 0.85) / 0.05, 2.0));
  ringColor += vec3(0.7, 0.4, 0.2) * ring3 * 0.6;
  
  return ringColor;
}

// ─── Main ───────────────────────────────────────────────────────────────────
void main() {
  vec2 uv = (vUv * 2.0 - 1.0);
  uv.x *= uRes.x / uRes.y;
  
  vec3 rd = normalize(vRayDir);
  vec3 ro = uCamPos;
  
  float rs = uMass * RS;
  
  // Trace geodesic
  RayResult trace = traceGeodesic(ro, rd, rs);
  
  vec3 col = vec3(0.0);
  
  if(trace.captured) {
    // Inside event horizon - pure darkness with slight glow at boundary
    col = vec3(0.004, 0.002, 0.008);
  } else {
    // Background stars (lensed)
    if(uShowStars) {
      col = starField(trace.finalDir) * 0.85;
    }
    
    // Gravitational lensing shadow
    vec3 toBH = -normalize(ro);
    float cosAngle = dot(rd, toBH);
    float angle = acos(clamp(cosAngle, -1.0, 1.0));
    float camDist = length(ro);
    float shadow = atan(1.8 * rs, camDist);
    float shadowIntensity = smoothstep(shadow + 0.05, shadow - 0.01, angle);
    col *= 1.0 - shadowIntensity * 0.98;
    
    // Photon ring
    col += photonRing(ro, rd, rs);
  }
  
  // Add disk emission
  col += trace.emission;
  
  // Add relativistic jets
  col += relativisticJets(ro, rd, rs, uSpin);
  
  // Tone mapping (ACES)
  col = col * (2.51 * col + 0.03) / (col * (2.43 * col + 0.59) + 0.14);
  col = clamp(col, 0.0, 1.0);
  
  // Vignette
  float vignette = 1.0 - dot(vUv * 0.28, vUv * 0.28);
  col *= clamp(vignette, 0.0, 1.0);
  
  gl_FragColor = vec4(col, 1.0);
}
`;

// ═══════════════════════════════════════════════════════════════════════════
// SHADER UNIFORMS TYPE
// ═══════════════════════════════════════════════════════════════════════════

export interface RENDER_UNIFORMS {
  uRes: [number, number];
  uTime: number;
  uCamPos: [number, number, number];
  uCamRot: [
    number, number, number,
    number, number, number,
    number, number, number
  ];
  uSpin: number;
  uMass: number;
  uDiskTilt: number;
  uDiskBright: number;
  uWavelength: number;
  uLensSteps: number;
  uDiskSamples: number;
  uShowJets: boolean;
  uShowDisk: boolean;
  uShowStars: boolean;
  uDoppler: boolean;
  uGravRedshift: boolean;
  uFov: number;
}

export const ADVANCED_DEFAULT_UNIFORMS = {
  uRes: [1920, 1080],
  uTime: 0,
  uCamPos: [0, 0, 30],
  uCamRot: [
    1, 0, 0,
    0, 1, 0,
    0, 0, -1
  ],
  uSpin: 0.9,
  uMass: 1.5,
  uDiskTilt: 20,
  uDiskBright: 1.0,
  uWavelength: 2.5, // visible
  uLensSteps: 300,
  uDiskSamples: 64,
  uShowJets: true,
  uShowDisk: true,
  uShowStars: true,
  uDoppler: true,
  uGravRedshift: true,
  uFov: 1.75,
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function wavelengthToFloat(band: WavelengthBand): number {
  const bands: WavelengthBand[] = ['radio', 'mm', 'infrared', 'visible', 'uv', 'xray', 'gamma'];
  return bands.indexOf(band);
}

export function floatToWavelength(value: number): WavelengthBand {
  const bands: WavelengthBand[] = ['radio', 'mm', 'infrared', 'visible', 'uv', 'xray', 'gamma'];
  const idx = Math.round(value);
  return bands[Math.max(0, Math.min(bands.length - 1, idx))];
}

export function createCameraMatrix(yaw: number, pitch: number, roll: number = 0): RENDER_UNIFORMS['uCamRot'] {
  const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
  const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
  const cosR = Math.cos(roll), sinR = Math.sin(roll);
  
  // Forward vector
  const fx = -sinY * cosP;
  const fy = sinP;
  const fz = -cosY * cosP;
  
  // Right vector
  let rx = -fz, ry = 0, rz = fx;
  const rl = Math.hypot(rx, ry, rz) || 1;
  rx /= rl; ry /= rl; rz /= rl;
  
  // Up vector (cross product)
  const ux = ry * fz - rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy - ry * fx;
  
  return [
    rx, ry, rz,
    ux, uy, uz,
    fx, fy, fz
  ];
}

export function calculateISCO(mass: number, spin: number): number {
  // ISCO = 3Rs for Schwarzschild (spin = 0)
  // ISCO = 0.5Rs for maximal Kerr (spin = 1)
  const rs = mass * RENDER_CONSTANTS.SCHWARZSCHILD_FACTOR;
  const iscoFactor = 3.0 - spin * 2.5; // 3 to 0.5
  return rs * iscoFactor;
}

export function calculatePhotonSphere(mass: number): number {
  return mass * RENDER_CONSTANTS.PHOTON_SPHERE_FACTOR * RENDER_CONSTANTS.SCHWARZSCHILD_FACTOR;
}

export function calculateEventHorizon(mass: number, spin: number = 0): number {
  // Schwarzschild: r+ = Rs = 2M
  // Kerr: r+ = M + sqrt(M² - a²)
  const rs = mass * RENDER_CONSTANTS.SCHWARZSCHILD_FACTOR;
  if (spin === 0) return rs;
  
  const a = spin * mass; // spin parameter
  return mass + Math.sqrt(mass * mass - a * a);
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOW SHADER FOR 2D CANVAS
// ═══════════════════════════════════════════════════════════════════════════

export function drawEnhancedGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  intensity: number,
  color: string,
  radius: number
): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * intensity);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.3, color.replace('1)', '0.5)'));
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius * intensity, 0, Math.PI * 2);
  ctx.fill();
}

export function drawAccretionDiskGlow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  tilt: number,
  intensity: number,
  wavelength: WavelengthBand = 'visible'
): void {
  const config = WAVELENGTH_CONFIGS[wavelength];
  const color = `rgba(${Math.round(config.color[0] * 255)}, ${Math.round(config.color[1] * 255)}, ${Math.round(config.color[2] * 255)},`;
  
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(tilt * Math.PI / 180);
  
  // Draw disk as ellipse
  for (let r = innerRadius; r < outerRadius; r += 2) {
    const alpha = (1 - (r - innerRadius) / (outerRadius - innerRadius)) * intensity * 0.3;
    ctx.strokeStyle = `${color} ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  ctx.restore();
}

export default {
  RENDER_CONSTANTS,
  WAVELENGTH_CONFIGS,
  ADVANCED_QUAD_VS,
  ADVANCED_SCENE_FS,
  ADVANCED_DEFAULT_UNIFORMS,
  wavelengthToFloat,
  floatToWavelength,
  createCameraMatrix,
  calculateISCO,
  calculatePhotonSphere,
  calculateEventHorizon,
  drawEnhancedGlow,
  drawAccretionDiskGlow,
};
