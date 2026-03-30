/**
 * GLSL Shader Sources
 * 
 * Contains all shader code for the black hole simulation
 * including vertex shaders and fragment shaders
 */

// ─── Fullscreen Quad Vertex Shader ──────────────────────────────────────────

export const QUAD_VERTEX_SHADER = `
attribute vec2 aPos;
varying vec2 vUv;

void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

// ─── Main Black Hole Scene Fragment Shader ─────────────────────────────────

/**
 * Main fragment shader for black hole visualization
 * 
 * Features:
 * - Gravitational lensing via ray tracing
 * - Accretion disk with temperature gradient
 * - Doppler beaming for spinning black holes
 * - Photon ring and shadow
 * - Relativistic jets
 * - Star field background
 */
export const SCENE_FRAGMENT_SHADER = `
precision highp float;

// Uniforms
uniform vec2  uRes;          // Canvas resolution
uniform float uTime;         // Time
uniform vec3  uCamPos;       // Camera position
uniform mat3  uCamRot;       // Camera rotation matrix
uniform float uSpin;         // Black hole spin (0-1)
uniform float uDiskTilt;     // Accretion disk tilt angle
uniform float uDiskBright;   // Disk brightness
uniform float uMass;         // Black hole mass

varying vec2 vUv;

// ─── Noise Functions ───────────────────────────────────────────────────────

// Hash function for noise
float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

// 3D Value noise
float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  return mix(
    mix(
      mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
      mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x),
      f.y
    ),
    mix(
      mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
      mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x),
      f.y
    ),
    f.z
  );
}

// Fractal Brownian Motion
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = p * 2.1 + vec3(1.7, 9.2, 5.4);
    amplitude *= 0.5;
  }
  
  return value;
}

// ─── Star Field ─────────────────────────────────────────────────────────────

vec3 starField(vec3 rayDir) {
  vec3 col = vec3(0.0);
  
  // Milky way band
  float band = exp(-pow(rayDir.y * 5.0, 2.0));
  col += vec3(0.16, 0.14, 0.24) * band * 0.18;
  col += vec3(0.04, 0.03, 0.08) * pow(clamp(1.0 - abs(rayDir.y), 0.0, 1.0), 2.0);
  
  // Individual stars
  for (int i = 0; i < 5; i++) {
    float scale = 90.0 + float(i) * 130.0;
    vec3 gridPos = floor(rayDir * scale);
    float r = hash(gridPos + float(i) * 17.3);
    
    if (r > 0.9988) {
      float brightness = hash(gridPos + vec3(91.3));
      // Star color varies from blue to orange to red
      vec3 starColor = mix(
        vec3(0.7, 0.82, 1.0),
        mix(
          vec3(1.0, 0.95, 0.7),
          vec3(1.0, 0.55, 0.35),
          clamp((brightness - 0.5) * 2.0, 0.0, 1.0)
        ),
        clamp((brightness - 0.3) * 2.0, 0.0, 1.0)
      );
      col += starColor * (brightness * 0.8 + 0.2) * 0.9;
    }
  }
  
  return col;
}

// ─── Accretion Disk ─────────────────────────────────────────────────────────

vec3 accretionDiskColor(vec3 p, float rs) {
  float r = length(p.xz);
  float phi = atan(p.z, p.x);
  
  // Disk bounds (ISCO to outer edge)
  float rIn = 3.0 * rs;    // Innermost stable circular orbit
  float rOut = 11.0 * rs;  // Outer edge
  
  if (r < rIn || r > rOut) return vec3(0.0);
  
  // Normalized radius
  float r01 = (r - rIn) / (rOut - rIn);
  
  // Keplerian orbital velocity: ω ∝ r^(-3/2)
  float omega = pow(max(r, 0.01), -1.5);
  
  // Rotation animation
  float flow = phi * 6.0 - uTime * uSpin * omega * 55.0;
  
  // Turbulent texture
  vec3 turbPos = vec3(
    cos(flow) * r01 * 4.0,
    sin(flow) * r01 * 4.0,
    uTime * 0.08
  );
  float turb1 = fbm(turbPos * 2.5);
  float turb2 = fbm(turbPos * 4.0 + vec3(3.1, 1.7, 2.4));
  float texture = turb1 * 0.6 + turb2 * 0.4;
  
  // Doppler beaming (approaching side brighter)
  float doppler = 0.25 + 0.75 * pow(max(0.0, sin(phi - uTime * uSpin * 0.3)), 1.6);
  
  // Temperature-based color gradient
  // Inner (hot): blue-white, Middle: yellow/gold, Outer: orange/red
  vec3 white = vec3(1.00, 0.97, 0.88);
  vec3 gold = vec3(1.00, 0.78, 0.22);
  vec3 orange = vec3(0.98, 0.38, 0.04);
  vec3 red = vec3(0.62, 0.04, 0.02);
  
  vec3 base = mix(
    mix(mix(white, gold, smoothstep(0.0, 0.25, r01)), orange, smoothstep(0.2, 0.55, r01)),
    red,
    smoothstep(0.5, 1.0, r01)
  );
  
  // Bright spiral arms
  float spiral = pow(
    max(0.0, noise(vec3(flow * 0.25, r01 * 7.0, uTime * 0.4)) - 0.74),
    2.0
  ) * 5.0;
  base += vec3(1.0, 0.8, 0.3) * spiral;
  
  // Inner rim brightening
  float rim = exp(-pow((r - rIn) / (0.14 * rIn), 2.0));
  base += vec3(1.0, 0.96, 0.82) * rim * 0.9;
  
  // Fade toward outer edge
  base *= mix(1.15, 0.92, smoothstep(0.55, 1.0, r01));
  
  // Vertical thinning
  float verticalFade = exp(-abs(p.y) / (0.08 * rs));
  
  return base * (0.58 + texture * 1.02) * doppler * verticalFade * uDiskBright * 3.1;
}

// ─── Ray Tracing ───────────────────────────────────────────────────────────

// Global variables for geodesic tracing
vec3  g_emission;
vec3  g_finalDirection;
bool  g_captured;

void traceGeodesic(vec3 rayOrigin, vec3 rayDir, float rs) {
  g_emission = vec3(0.0);
  g_captured = false;
  g_finalDirection = rayDir;
  
  // Event horizon
  float eventHorizon = rs * 0.5;
  
  // Disk normal from tilt
  float ct = cos(uDiskTilt);
  float st = sin(uDiskTilt);
  vec3 diskNormal = normalize(vec3(0.0, ct, -st));
  
  vec3 pos = rayOrigin;
  vec3 vel = normalize(rayDir);
  
  float prevDiskDot = dot(pos, diskNormal);
  
  // Ray marching
  for (int i = 0; i < 320; i++) {
    float r = length(pos);
    float r3 = r * r * r;
    
    // Gravitational acceleration (simplified GR)
    float rsR3 = 1.5 * rs / r3;
    vec3 accel = -pos * rsR3;
    
    // Frame dragging for spinning black holes
    if (uSpin > 0.0) {
      float frameDrag = uSpin * rs * rs / (r3 * r + 0.001);
      vec3 tangent = normalize(cross(pos, vec3(0.0, 1.0, 0.0)));
      accel += tangent * frameDrag * 0.7;
    }
    
    // Adaptive step size
    float step = clamp(0.2 * (r - rs) / max(r, 0.001), 0.03, 2.2);
    
    // Update velocity and position
    vel = normalize(vel + accel * step);
    pos = pos + vel * step;
    
    r = length(pos);
    
    // Check if captured
    if (r < eventHorizon) {
      g_captured = true;
      return;
    }
    
    // Check disk crossing
    float curDiskDot = dot(pos, diskNormal);
    if (prevDiskDot * curDiskDot < 0.0) {
      float t2 = -prevDiskDot / (curDiskDot - prevDiskDot);
      vec3 hitPoint = pos + vel * (step * (t2 - 1.0));
      
      // Transform to disk local coordinates
      vec3 hitPointLocal = vec3(
        hitPoint.x,
        dot(hitPoint, vec3(0.0, ct, st)),
        dot(hitPoint, vec3(0.0, -st, ct))
      );
      hitPointLocal.y = 0.0; // Project to disk plane
      
      vec3 diskEmission = accretionDiskColor(hitPointLocal, rs);
      float visibility = 1.0 - length(g_emission) * 0.8;
      g_emission += diskEmission * max(visibility, 0.0);
    }
    
    prevDiskDot = curDiskDot;
    
    // Escape conditions
    if (r > 120.0 * rs && dot(pos, vel) > 0.0) break;
    if (r > 300.0 * rs) break;
  }
  
  g_finalDirection = vel;
}

// ─── Main ───────────────────────────────────────────────────────────────────

void main() {
  // Normalized device coordinates
  vec2 uv = (vUv * 2.0 - 1.0);
  uv.x *= uRes.x / uRes.y;
  
  // Ray direction in world space
  vec3 rayDirLocal = normalize(vec3(uv, -1.75));
  vec3 rayDir = normalize(uCamRot * rayDirLocal);
  vec3 rayOrigin = uCamPos;
  
  // Black hole radius
  float rs = uMass * 1.5;
  
  // Trace the ray
  traceGeodesic(rayOrigin, rayDir, rs);
  
  vec3 col = vec3(0.0);
  
  if (g_captured) {
    // Inside event horizon - dark
    col = vec3(0.006, 0.002, 0.010);
  } else {
    // Background stars with gravitational lensing
    col = starField(g_finalDirection) * 0.85;
    
    // Calculate angle to black hole center
    vec3 toBlackHole = -normalize(rayOrigin);
    float cosAngle = dot(rayDir, toBlackHole);
    float separationAngle = acos(clamp(cosAngle, -1.0, 1.0));
    
    float camDist = length(rayOrigin);
    float shadowAngle = atan(2.6 * rs, camDist);
    
    // Main shadow
    float shadow = smoothstep(shadowAngle + 0.04, shadowAngle - 0.008, separationAngle);
    col *= 1.0 - shadow * 0.97;
    
    // Photon ring (1.5 Rs)
    float photonRing = exp(-pow((separationAngle - shadowAngle) / 0.007, 2.0));
    col += vec3(1.0, 0.88, 0.55) * photonRing * 4.0;
    
    // Secondary ring
    float ring2 = exp(-pow((separationAngle - shadowAngle * 0.92) / 0.012, 2.0));
    col += vec3(0.8, 0.6, 0.3) * ring2 * 1.5;
    
    // Inner glow
    float innerGlow = exp(-pow((separationAngle - shadowAngle * 0.86) / 0.045, 2.0)) * 0.5;
    col += vec3(0.7, 0.3, 0.05) * innerGlow;
    
    // Outer glow
    float outerGlow = exp(-pow((separationAngle - shadowAngle * 1.2) / 0.08, 2.0)) * 0.25;
    col += vec3(0.45, 0.1, 0.6) * outerGlow;
    
    // Far halo
    float halo = exp(-pow((separationAngle - shadowAngle * 1.45) / 0.16, 2.0)) * 0.22;
    col += vec3(0.12, 0.04, 0.22) * halo;
  }
  
  // Add disk emission
  col += g_emission;
  
  // Relativistic jets
  {
    float jetAngle = abs(dot(rayDir, vec3(0.0, 1.0, 0.0)));
    float jet = pow(max(0.0, 1.0 - (1.0 - jetAngle) * 22.0), 2.0) *
                exp(-length(rayOrigin) * 0.025) * uSpin;
    col += vec3(0.1, 0.25, 1.0) * jet * 0.5;
  }
  
  // Tone mapping (ACES approximation)
  col = col * (2.51 * col + 0.03) / (col * (2.43 * col + 0.59) + 0.14);
  col = clamp(col, 0.0, 1.0);
  
  // Vignette
  float vignette = 1.0 - dot(uv * 0.28, uv * 0.28);
  col *= clamp(vignette, 0.0, 1.0);
  
  gl_FragColor = vec4(col, 1.0);
}
`;

// ─── Ray Overlay Shaders ───────────────────────────────────────────────────

export const RAY_VERTEX_SHADER = `
attribute vec2  aPos;
attribute float aAlpha;
attribute vec3  aColor;

varying float vAlpha;
varying vec3  vColor;

uniform vec2 uRes;

void main() {
  vec2 n = aPos / uRes * 2.0 - 1.0;
  n.y = -n.y;
  gl_Position = vec4(n, 0.0, 1.0);
  vAlpha = aAlpha;
  vColor = aColor;
}
`;

export const RAY_FRAGMENT_SHADER = `
precision mediump float;

varying float vAlpha;
varying vec3  vColor;

void main() {
  gl_FragColor = vec4(vColor, vAlpha);
}
`;
