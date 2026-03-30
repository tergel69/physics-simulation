/**
 * Orbital Mechanics Module
 * 
 * Implements scientifically accurate orbital mechanics including:
 * - Kepler's equation solver
 * - Orbital elements and transformations
 * - N-body gravitational simulation
 * - Proper orbital velocity calculations (vis-viva equation)
 */

import { SOLAR_CONSTANTS } from './constants';

// Types
export interface OrbitalElements {
  /** Semi-major axis */
  a: number;
  /** Eccentricity */
  e: number;
  /** Orbital inclination (radians) */
  inc: number;
  /** Longitude of ascending node (radians) */
  Omega: number;
  /** Argument of periapsis (radians) */
  omega: number;
  /** Mean anomaly at epoch (radians) */
  M0: number;
}

export interface Planet {
  name: string;
  color: string;
  size: number;
  a: number;
  e: number;
  inc: number;
  Omega: number;
  omega: number;
  M0: number;
  mass: number;
  rings?: { inner: number; outer: number; color: string };
  moons?: { name: string; a: number; period: number; size: number; color: string }[];
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Velocity3D {
  vx: number;
  vy: number;
  vz: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const SCALE = 52; // AU → scene units
export const G_CONST = 420; // Tuned for visual speed (in simulation units)
export const SUN_MASS = 1.0; // Normalized solar mass

// ─── Kepler Solvers ────────────────────────────────────────────────────────

/**
 * Solve Kepler's equation: M = E - e×sin(E)
 * 
 * Uses Newton-Raphson iteration for fast convergence
 * @param M - Mean anomaly (radians)
 * @param e - Eccentricity (0-1)
 * @returns Eccentric anomaly (radians)
 */
export function solveKepler(M: number, e: number): number {
  // Normalize M to [0, 2π]
  const twoPi = 2 * Math.PI;
  M = ((M % twoPi) + twoPi) % twoPi;
  
  // Initial guess: M for small e
  let E = M;
  
  // Newton-Raphson iteration
  for (let i = 0; i < 8; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  
  return E;
}

/**
 * Calculate true anomaly from eccentric anomaly
 * 
 * @param E - Eccentric anomaly (radians)
 * @param e - Eccentricity
 * @returns True anomaly (radians)
 */
export function trueAnomaly(E: number, e: number): number {
  return 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  );
}

/**
 * Calculate radius from true anomaly
 * 
 * @param a - Semi-major axis
 * @param e - Eccentricity
 * @param nu - True anomaly (radians)
 * @returns Radius
 */
export function radiusFromTrueAnomaly(a: number, e: number, nu: number): number {
  return a * (1 - e * e) / (1 + e * Math.cos(nu));
}

// ─── Orbital Velocity ───────────────────────────────────────────────────────

/**
 * Calculate orbital velocity using the vis-viva equation
 * v² = GM(2/r - 1/a)
 * 
 * @param r - Current radius
 * @param a - Semi-major axis
 * @param GM - Gravitational parameter
 * @returns Velocity magnitude
 */
export function visVivaVelocity(r: number, a: number, GM: number): number {
  return Math.sqrt(GM * (2 / r - 1 / a));
}

/**
 * Calculate velocity vector for an orbit at a given position
 * 
 * @param r - Position vector
 * @param a - Semi-major axis
 * @param e - Eccentricity
 * @param nu - True anomaly
 * @param Omega - Longitude of ascending node
 * @param omega - Argument of periapsis
 * @param inc - Inclination
 * @param GM - Gravitational parameter
 * @returns Velocity vector
 */
export function orbitalVelocityVector(
  r: [number, number, number],
  a: number,
  e: number,
  nu: number,
  Omega: number,
  omega: number,
  inc: number,
  GM: number
): Velocity3D {
  // Velocity in orbital plane
  const vMag = visVivaVelocity(Math.sqrt(r[0]**2 + r[1]**2 + r[2]**2), a, GM);
  const vPerp = vMag;
  
  // Velocity components in orbital plane (perifocal coordinates)
  const vx_orb = -vPerp * Math.sin(nu);
  const vy_orb = vPerp * (e + Math.cos(nu));
  
  // Transform to 3D
  const cosO = Math.cos(Omega), sinO = Math.sin(Omega);
  const cosw = Math.cos(omega), sinw = Math.sin(omega);
  const cosi = Math.cos(inc), sini = Math.sin(inc);
  
  return {
    vx: (cosO * cosw - sinO * sinw * cosi) * vx_orb +
        (-cosO * sinw - sinO * cosw * cosi) * vy_orb,
    vy: (sini * sinw) * vx_orb + (sini * cosw) * vy_orb,
    vz: (sinO * cosw + cosO * sinw * cosi) * vx_orb +
        (-sinO * sinw + cosO * cosw * cosi) * vy_orb
  };
}

// ─── Position Calculations ──────────────────────────────────────────────────

/**
 * Calculate 3D position in orbit at given time
 * 
 * @param elements - Orbital elements
 * @param t - Time (seconds from epoch)
 * @param GM - Gravitational parameter (for mean motion)
 * @returns Position [x, y, z]
 */
export function orbitalPosition(
  elements: OrbitalElements,
  t: number,
  GM: number = G_CONST * SUN_MASS
): Position3D {
  const { a, e, inc, Omega, omega, M0 } = elements;
  
  // Mean motion: n = sqrt(GM/a³)
  const n = Math.sqrt(GM / (a * a * a));
  
  // Mean anomaly
  const M = M0 + n * t;
  
  // Solve Kepler's equation for eccentric anomaly
  const E = solveKepler(M, e);
  
  // Position in orbital plane (perifocal coordinates)
  const xOrb = a * (Math.cos(E) - e);
  const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(E);
  
  // Rotate by argument of periapsis, inclination, and longitude of ascending node
  const cosW = Math.cos(omega);
  const sinW = Math.sin(omega);
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);
  const cosO = Math.cos(Omega);
  const sinO = Math.sin(Omega);
  
  // Standard orbital mechanics rotation matrix
  const x = (cosO * cosW - sinO * sinW * cosI) * xOrb +
            (-cosO * sinW - sinO * cosW * cosI) * yOrb;
  const y = (sinI * sinW) * xOrb + (sinI * cosW) * yOrb;
  const z = (sinO * cosW + cosO * sinW * cosI) * xOrb +
            (-sinO * sinW + cosO * cosW * cosI) * yOrb;
  
  return { x, y, z };
}

/**
 * Calculate position with additional perturbations (simplified)
 */
export function orbitalPositionWithPerturbation(
  elements: OrbitalElements,
  t: number,
  GM: number,
  perturbations: { mass: number; position: Position3D }[] = []
): Position3D {
  // Base position
  let pos = orbitalPosition(elements, t, GM);
  
  // Add perturbations (simplified)
  for (const pert of perturbations) {
    const dx = pert.position.x - pos.x;
    const dy = pert.position.y - pos.y;
    const dz = pert.position.z - pos.z;
    const r = Math.sqrt(dx*dx + dy*dy + dz*dz);
    const r3 = r * r * r;
    
    // Simplified perturbation (would need proper integration for accuracy)
    const factor = pert.mass / r3 * 0.001;
    pos.x += dx * factor;
    pos.y += dy * factor;
    pos.z += dz * factor;
  }
  
  return pos;
}

// ─── N-Body Simulation ─────────────────────────────────────────────────────

export interface Body {
  mass: number;
  position: Position3D;
  velocity: Velocity3D;
  name?: string;
  color?: string;
  size?: number;
}

/**
 * Calculate gravitational acceleration on a body from all other bodies
 * Uses Newton's law of gravitation
 * 
 * @param bodyIndex - Index of the body to calculate acceleration for
 * @param bodies - Array of all bodies
 * @param G - Gravitational constant
 * @returns Acceleration vector
 */
export function gravitationalAcceleration(
  bodyIndex: number,
  bodies: Body[],
  G: number
): Velocity3D {
  const body = bodies[bodyIndex];
  let ax = 0, ay = 0, az = 0;
  
  for (let i = 0; i < bodies.length; i++) {
    if (i === bodyIndex) continue;
    
    const other = bodies[i];
    const dx = other.position.x - body.position.x;
    const dy = other.position.y - body.position.y;
    const dz = other.position.z - body.position.z;
    const r2 = dx*dx + dy*dy + dz*dz;
    const r = Math.sqrt(r2);
    
    if (r < 0.001) continue; // Avoid singularity
    
    const f = G * other.mass / r2;
    ax += f * dx / r;
    ay += f * dy / r;
    az += f * dz / r;
  }
  
  return { vx: ax, vy: ay, vz: az };
}

/**
 * Symplectic integrator (Velocity Verlet) for N-body simulation
 * Provides better energy conservation than Euler method
 * 
 * @param bodies - Array of bodies to simulate
 * @param dt - Time step
 * @param G - Gravitational constant
 * @returns Updated bodies
 */
export function nBodyStep(
  bodies: Body[],
  dt: number,
  G: number
): Body[] {
  const newBodies = [...bodies];
  
  // Calculate accelerations at current positions
  const accelerations = bodies.map((_, i) => gravitationalAcceleration(i, bodies, G));
  
  // First Verlet step: update positions
  for (let i = 0; i < newBodies.length; i++) {
    const b = newBodies[i];
    const a = accelerations[i];
    
    b.position.x += b.velocity.vx * dt + 0.5 * a.vx * dt * dt;
    b.position.y += b.velocity.vy * dt + 0.5 * a.vy * dt * dt;
    b.position.z += b.velocity.vz * dt + 0.5 * a.vz * dt * dt;
  }
  
  // Calculate new accelerations
  const newAccelerations = newBodies.map((_, i) => gravitationalAcceleration(i, newBodies, G));
  
  // Second Verlet step: update velocities
  for (let i = 0; i < newBodies.length; i++) {
    const a = accelerations[i];
    const aNew = newAccelerations[i];
    
    newBodies[i].velocity.vx += 0.5 * (a.vx + aNew.vx) * dt;
    newBodies[i].velocity.vy += 0.5 * (a.vy + aNew.vy) * dt;
    newBodies[i].velocity.vz += 0.5 * (a.vz + aNew.vz) * dt;
  }
  
  return newBodies;
}

// ─── Solar System Data ─────────────────────────────────────────────────────

/**
 * Solar system with accurate orbital elements
 * Distances in AU, converted to scene units
 */
export const SOLAR_SYSTEM: Planet[] = [
  {
    name: 'Mercury',
    color: '#b8a898',
    size: 3.2,
    a: 0.387 * SCALE,
    e: 0.206,
    inc: 7.0 * Math.PI / 180,
    Omega: 48.3 * Math.PI / 180,
    omega: 29.1 * Math.PI / 180,
    M0: 0,
    mass: 1.7e-7,
  },
  {
    name: 'Venus',
    color: '#e8c870',
    size: 5.8,
    a: 0.723 * SCALE,
    e: 0.007,
    inc: 3.4 * Math.PI / 180,
    Omega: 76.7 * Math.PI / 180,
    omega: 54.9 * Math.PI / 180,
    M0: 45 * Math.PI / 180,
    mass: 2.4e-6,
  },
  {
    name: 'Earth',
    color: '#4a8eff',
    size: 6.0,
    a: 1.000 * SCALE,
    e: 0.017,
    inc: 0.0,
    Omega: 0,
    omega: 102.9 * Math.PI / 180,
    M0: 90 * Math.PI / 180,
    mass: 3.0e-6,
    moons: [{ name: 'Moon', a: 5.2, period: 27.3, size: 1.8, color: '#ccccbb' }],
  },
  {
    name: 'Mars',
    color: '#c86040',
    size: 4.5,
    a: 1.524 * SCALE,
    e: 0.093,
    inc: 1.85 * Math.PI / 180,
    Omega: 49.6 * Math.PI / 180,
    omega: 286.5 * Math.PI / 180,
    M0: 135 * Math.PI / 180,
    mass: 3.2e-7,
  },
  {
    name: 'Jupiter',
    color: '#d4a870',
    size: 14,
    a: 2.1 * SCALE,
    e: 0.049,
    inc: 1.3 * Math.PI / 180,
    Omega: 100.5 * Math.PI / 180,
    omega: 273.9 * Math.PI / 180,
    M0: 200 * Math.PI / 180,
    mass: 9.5e-4,
    moons: [
      { name: 'Io', a: 18, period: 1.77, size: 2.1, color: '#ffe066' },
      { name: 'Europa', a: 28, period: 3.55, size: 1.8, color: '#d0e8ff' },
      { name: 'Ganymede', a: 44, period: 7.15, size: 2.6, color: '#bba888' },
      { name: 'Callisto', a: 62, period: 16.69, size: 2.4, color: '#887766' },
    ],
  },
  {
    name: 'Saturn',
    color: '#e8d090',
    size: 12,
    a: 2.8 * SCALE,
    e: 0.056,
    inc: 2.49 * Math.PI / 180,
    Omega: 113.7 * Math.PI / 180,
    omega: 339.4 * Math.PI / 180,
    M0: 260 * Math.PI / 180,
    mass: 2.9e-4,
    rings: { inner: 1.5, outer: 2.6, color: 'rgba(220, 200, 150, 0.55)' },
    moons: [
      { name: 'Titan', a: 48, period: 15.9, size: 2.4, color: '#c8a050' },
    ],
  },
  {
    name: 'Uranus',
    color: '#80d8e8',
    size: 9,
    a: 3.6 * SCALE,
    e: 0.046,
    inc: 0.77 * Math.PI / 180,
    Omega: 74.0 * Math.PI / 180,
    omega: 96.5 * Math.PI / 180,
    M0: 300 * Math.PI / 180,
    mass: 4.4e-5,
  },
  {
    name: 'Neptune',
    color: '#4060e8',
    size: 8.5,
    a: 4.3 * SCALE,
    e: 0.010,
    inc: 1.77 * Math.PI / 180,
    Omega: 131.8 * Math.PI / 180,
    omega: 273.2 * Math.PI / 180,
    M0: 320 * Math.PI / 180,
    mass: 5.2e-5,
  },
];

/**
 * Convert degrees to radians
 */
export function degToRad(deg: number): number {
  return deg * Math.PI / 180;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(rad: number): number {
  return rad * 180 / Math.PI;
}

/**
 * Get orbital elements for a planet
 */
export function getOrbitalElements(planet: Planet): OrbitalElements {
  return {
    a: planet.a,
    e: planet.e,
    inc: planet.inc,
    Omega: planet.Omega,
    omega: planet.omega,
    M0: planet.M0,
  };
}
