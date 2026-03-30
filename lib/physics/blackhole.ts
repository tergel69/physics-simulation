/**
 * Black Hole Physics Module
 * 
 * Implements scientifically accurate black hole physics including:
 * - Schwarzschild metric for non-spinning black holes
 * - Kerr metric approximation for spinning black holes
 * - Gravitational lensing
 * - Accretion disk physics
 * - Relativistic ray tracing
 */

import { BLACKHOLE_CONSTANTS } from './constants';

// Types
export interface BlackHoleParams {
  /** Mass in solar masses */
  mass: number;
  /** Spin parameter (0 = non-spinning, 1 = maximally spinning) */
  spin: number;
  /** Charge (typically negligible, included for completeness) */
  charge: number;
}

export interface GeodesicResult {
  /** Whether the ray was captured by the black hole */
  captured: boolean;
  /** Final direction after gravitational lensing */
  finalDirection: [number, number, number];
  /** Emission from accretion disk crossings */
  emission: [number, number, number];
  /** Impact parameter (closest approach in Schwarzschild radii) */
  impactParameter: number;
}

/**
 * Calculate the Schwarzschild radius for a given mass
 * Rs = 2GM/c²
 * 
 * @param massSolarMasses - Mass in solar masses
 * @returns Schwarzschild radius in meters
 */
export function schwarzschildRadius(massSolarMasses: number): number {
  return massSolarMasses * BLACKHOLE_CONSTANTS.Rs_solar_mass * 1000; // km to m
}

/**
 * Calculate the Schwarzschild radius in scene units
 * Uses normalized units where c = G = 1 for simplicity
 * 
 * @param mass - Mass in solar masses
 * @returns Schwarzschild radius in scene units
 */
export function schwarzschildRadiusScene(mass: number): number {
  // Using the proper formula: Rs = 2M (in geometric units)
  // The factor 1.5 in the original code was an approximation
  return 2.0 * mass;
}

/**
 * Calculate the photon sphere radius
 * For a Schwarzschild black hole, photons orbit at 1.5 Rs
 * 
 * @param mass - Mass in solar masses
 * @returns Photon sphere radius in scene units
 */
export function photonSphereRadius(mass: number): number {
  const Rs = schwarzschildRadiusScene(mass);
  return BLACKHOLE_CONSTANTS.photon_sphere_factor * Rs;
}

/**
 * Calculate the Innermost Stable Circular Orbit (ISCO)
 * For non-spinning (Schwarzschild): 3 Rs
 * For maximally spinning (Kerr): 0.5 Rs
 * 
 * @param spin - Spin parameter (0-1)
 * @param mass - Mass in solar masses
 * @returns ISCO radius in scene units
 */
export function iscoRadius(spin: number, mass: number): number {
  const Rs = schwarzschildRadiusScene(mass);
  // Interpolate between Schwarzschild (3 Rs) and Kerr max (0.5 Rs)
  const factor = BLACKHOLE_CONSTANTS.isco_factor - spin * 
    (BLACKHOLE_CONSTANTS.isco_factor - BLACKHOLE_CONSTANTS.isco_kerr_max);
  return factor * Rs;
}

/**
 * Calculate gravitational acceleration at a given distance
 * Uses Newtonian approximation: a = GM/r²
 * 
 * @param r - Distance from black hole center
 * @param mass - Mass in solar masses
 * @returns Gravitational acceleration (normalized units)
 */
export function gravitationalAcceleration(r: number, mass: number): number {
  if (r < 0.01) return 0; // Avoid singularity
  return mass / (r * r);
}

/**
 * Calculate the Lense-Thirring precession frequency
 * (frame dragging effect for spinning black holes)
 * 
 * @param spin - Spin parameter (0-1)
 * @param r - Distance from black hole
 * @param mass - Mass in solar masses
 * @returns Precession frequency
 */
export function lenseThirringFrequency(spin: number, r: number, mass: number): number {
  if (r < 0.01) return 0;
  // Ω = 2Ja⁻³ (simplified)
  const J = spin * mass * mass; // Angular momentum (normalized)
  return 2 * J / Math.pow(r, 3);
}

/**
 * Calculate the Doppler factor for relativistic beaming
 * D = 1/γ(1 - β cos θ)
 * 
 * @param velocity - Velocity as fraction of c
 * @param angleToObserver - Angle to observer in radians
 * @returns Doppler factor
 */
export function dopplerFactor(velocity: number, angleToObserver: number): number {
  const beta = Math.min(velocity, 0.999); // Cap at c
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  return 1 / (gamma * (1 - beta * Math.cos(angleToObserver)));
}

/**
 * Calculate relativistic beaming intensity
 * I_observed = I_emitted * D³
 * 
 * @param doppler - Doppler factor
 * @returns Intensity multiplier
 */
export function beamingIntensity(doppler: number): number {
  return Math.pow(doppler, 3);
}

/**
 * Calculate gravitational redshift factor
 * For Schwarzschild: z = 1/√(1 - Rs/r) - 1
 * 
 * @param r - Distance from black hole
 * @param Rs - Schwarzschild radius
 * @returns Redshift factor (z)
 */
export function gravitationalRedshift(r: number, Rs: number): number {
  if (r <= Rs) return Infinity; // Inside event horizon
  return 1 / Math.sqrt(1 - Rs / r) - 1;
}

/**
 * Calculate the impact parameter for a ray that just misses the photon sphere
 * b = Rs * √3 for Schwarzschild
 * 
 * @param mass - Mass in solar masses
 * @returns Critical impact parameter
 */
export function criticalImpactParameter(mass: number): number {
  const Rs = schwarzschildRadiusScene(mass);
  return Rs * Math.sqrt(3);
}

/**
 * Calculate shadow radius as seen by a distant observer
 * The shadow is approximately at 2.6 Rs for Schwarzschild
 * 
 * @param mass - Mass in solar masses
 * @returns Shadow radius
 */
export function shadowRadius(mass: number): number {
  const Rs = schwarzschildRadiusScene(mass);
  return 2.6 * Rs;
}

/**
 * Simulate a geodesic (light ray path) near a black hole
 * Uses a simplified stepping algorithm with relativistic corrections
 * 
 * @param startPos - Starting position [x, y, z]
 * @param direction - Initial direction [vx, vy, vz]
 * @param mass - Black hole mass
 * @param spin - Spin parameter
 * @param diskTilt - Accretion disk tilt in radians
 * @param diskInner - Inner disk radius (in Rs)
 * @param diskOuter - Outer disk radius (in Rs)
 * @param maxSteps - Maximum ray marching steps
 * @returns Geodesic result
 */
export function traceGeodesic(
  startPos: [number, number, number],
  direction: [number, number, number],
  mass: number,
  spin: number,
  diskTilt: number = 0,
  diskInner: number = 3.0,
  diskOuter: number = 11.0,
  maxSteps: number = 320
): GeodesicResult {
  const Rs = schwarzschildRadiusScene(mass);
  const EH = Rs * 0.5; // Event horizon (slightly smaller than Rs for numerical stability)
  
  // Disk normal vector (from tilt)
  const ct = Math.cos(diskTilt);
  const st = Math.sin(diskTilt);
  const diskNormal: [number, number, number] = [0, ct, -st];
  
  let pos: [number, number, number] = [...startPos];
  let vel: [number, number, number] = normalize(direction);
  
  let emission: [number, number, number] = [0, 0, 0];
  let captured = false;
  
  // Track previous position relative to disk
  let prevDiskDot = dot(pos, diskNormal);
  
  for (let i = 0; i < maxSteps; i++) {
    const r = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
    
    // Check if captured by event horizon
    if (r < EH) {
      captured = true;
      break;
    }
    
    // Calculate gravitational acceleration (Newtonian with GR corrections)
    const r3 = r * r * r;
    const rsR3 = 1.5 * Rs / r3; // Simplified GR term
    
    // Apply gravitational acceleration
    const accelMag = -rsR3;
    const accel: [number, number, number] = [
      pos[0] * accelMag,
      pos[1] * accelMag,
      pos[2] * accelMag
    ];
    
    // Frame dragging for spinning black holes
    if (spin > 0) {
      const fd = spin * Rs * Rs / (r3 * r + 0.001);
      // Tangential acceleration (simplified Lense-Thirring)
      const tangent: [number, number, number] = normalize(cross(pos, [0, 1, 0]));
      accel[0] += tangent[0] * fd * 0.7;
      accel[2] += tangent[2] * fd * 0.7;
    }
    
    // Adaptive step size
    const step = clamp(0.2 * (r - Rs) / Math.max(r, 0.001), 0.03, 2.2);
    
    // Update velocity and position
    vel = normalize([
      vel[0] + accel[0] * step,
      vel[1] + accel[1] * step,
      vel[2] + accel[2] * step
    ]);
    
    const newPos: [number, number, number] = [
      pos[0] + vel[0] * step,
      pos[1] + vel[1] * step,
      pos[2] + vel[2] * step
    ];
    
    // Check for disk crossing
    const curDiskDot = dot(newPos, diskNormal);
    if (prevDiskDot * curDiskDot < 0) {
      // Crossing detected - calculate emission
      const rNew = Math.sqrt(newPos[0] * newPos[0] + newPos[2] * newPos[2]);
      const diskEmission = calculateDiskEmission(
        rNew, Rs, diskInner, diskOuter, vel, mass
      );
      
      // Accumulate emission with visibility factor
      const vis = 1 - (emission[0] + emission[1] + emission[2]) * 0.8;
      if (vis > 0) {
        emission[0] += diskEmission[0] * vis;
        emission[1] += diskEmission[1] * vis;
        emission[2] += diskEmission[2] * vis;
      }
    }
    
    prevDiskDot = curDiskDot;
    pos = newPos;
    
    // Escape condition
    const rEscaped = 120 * Rs;
    if (r > rEscaped && dot(pos, vel) > 0) break;
    if (r > 300 * Rs) break;
  }
  
  return {
    captured,
    finalDirection: vel,
    emission,
    impactParameter: 0 // Would need to track closest approach
  };
}

// Helper functions

function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 0, 1];
  return [v[0] / len, v[1] / len, v[2] / len];
}

function dot(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate accretion disk emission based on position and velocity
 * Includes Doppler beaming and temperature gradients
 */
function calculateDiskEmission(
  r: number,
  Rs: number,
  rInner: number,
  rOuter: number,
  velocity: [number, number, number],
  mass: number
): [number, number, number] {
  // Check if within disk bounds
  const rIn = rInner * Rs;
  const rOut = rOuter * Rs;
  if (r < rIn || r > rOut) return [0, 0, 0];
  
  // Temperature profile (inner disk is hotter)
  const r01 = (r - rIn) / (rOut - rIn);
  const temperature = Math.pow(1 - r01, 0.25);
  
  // Orbital velocity (Keplerian: v = sqrt(GM/r))
  const orbitalSpeed = Math.sqrt(mass / r);
  
  // Calculate angle between velocity and line of sight (assumed -z direction)
  const velocityMag = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2);
  const cosAngle = velocityMag > 0 ? -velocity[2] / velocityMag : 1;
  
  // Doppler beaming factor
  const doppler = dopplerFactor(orbitalSpeed, Math.acos(cosAngle));
  const beaming = beamingIntensity(doppler);
  
  // Color based on temperature (blackbody approximation)
  // Hot inner: blue-white, cooler outer: orange-red
  const color = temperatureColor(temperature);
  
  return [
    color[0] * beaming * 3.1,
    color[1] * beaming * 3.1,
    color[2] * beaming * 3.1
  ];
}

/**
 * Approximate blackbody color for a given temperature (0-1)
 * Uses a simplified Planckian locus
 */
function temperatureColor(t: number): [number, number, number] {
  // Hot (1.0): blue-white (10000K+)
  // Medium (0.5): yellow (6000K)
  // Cool (0.0): red (3000K)
  
  if (t > 0.7) {
    // Blue-white
    return [1.0, 0.97, 0.88];
  } else if (t > 0.4) {
    // Yellow to orange
    const f = (t - 0.4) / 0.3;
    return [
      1.0,
      0.78 + 0.19 * f,
      0.22 + 0.66 * f
    ];
  } else {
    // Orange to red
    const f = t / 0.4;
    return [
      0.98,
      0.38 * f + 0.62 * (1 - f),
      0.04 * f + 0.02 * (1 - f)
    ];
  }
}

/**
 * Default black hole configuration
 */
export const DEFAULT_BLACKHOLE: BlackHoleParams = {
  mass: 1.5,
  spin: 0.9,
  charge: 0,
};
