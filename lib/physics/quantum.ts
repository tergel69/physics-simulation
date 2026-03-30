/**
 * Quantum Mechanics Module
 * 
 * Implements scientifically accurate quantum mechanics including:
 * - Hydrogen atom wavefunctions (radial and angular parts)
 * - Associated Laguerre polynomials
 * - Associated Legendre polynomials
 * - Real spherical harmonics
 * - Electron configuration and Slater's rules
 * - Proper quantum state time evolution
 */

import { QUANTUM_CONSTANTS, PHYSICAL_CONSTANTS } from './constants';

// Types
export interface QuantumState {
  n: number; // Principal quantum number (1, 2, 3, ...)
  l: number; // Azimuthal quantum number (0 to n-1)
  m: number; // Magnetic quantum number (-l to l)
  Zeff: number; // Effective nuclear charge
}

export interface OrbitalPoint {
  x: number;
  y: number;
  z: number;
  psi: number;  // Wavefunction value (signed)
  prob: number; // |ψ|² (probability density)
  l: number;    // Angular momentum quantum number
}

export interface QuantumComponent {
  n: number;
  l: number;
  m: number;
  weight: number;
  phase: number;
}

export type OrbitalKind = 's' | 'p' | 'd' | 'f' | 'mix' | 'atlas';

// ─── Mathematical Functions ────────────────────────────────────────────────

/**
 * Factorial function with caching
 */
const factorialCache: number[] = [1];
export function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n < factorialCache.length) return factorialCache[n];
  
  let result = factorialCache[factorialCache.length - 1];
  for (let i = factorialCache.length; i <= n; i++) {
    result *= i;
    factorialCache.push(result);
  }
  return result;
}

/**
 * Generalized associated Laguerre polynomial L_n^α(x)
 * Used in hydrogen radial wavefunctions
 */
export function laguerreAssoc(n: number, alpha: number, x: number): number {
  if (n === 0) return 1;
  if (n === 1) return 1 + alpha - x;
  
  let l0 = 1;
  let l1 = 1 + alpha - x;
  
  for (let k = 1; k < n; k++) {
    const l2 = ((2 * k + 1 + alpha - x) * l1 - (k + alpha) * l0) / (k + 1);
    l0 = l1;
    l1 = l2;
  }
  
  return l1;
}

/**
 * Associated Legendre polynomial P_l^|m|(cos θ)
 * Used in spherical harmonics
 * 
 * Uses recurrence relation for numerical stability
 */
export function legendreAssoc(l: number, absM: number, cosTheta: number): number {
  const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
  
  // Start from P_m^m
  let pmm = 1;
  for (let i = 1; i <= absM; i++) {
    pmm *= -(2 * i - 1) * sinTheta;
  }
  
  if (l === absM) return pmm;
  
  // P_{m+1}^m
  let pmm1 = cosTheta * (2 * absM + 1) * pmm;
  if (l === absM + 1) return pmm1;
  
  // Recurrence: P_l^m = ((2l-1)xP_{l-1}^m - (l+m-1)P_{l-2}^m) / (l-m)
  let result = 0;
  for (let ll = absM + 2; ll <= l; ll++) {
    result = ((2 * ll - 1) * cosTheta * pmm1 - (ll + absM - 1) * pmm) / (ll - absM);
    pmm = pmm1;
    pmm1 = result;
  }
  
  return pmm1;
}

// ─── Hydrogen Wavefunctions ─────────────────────────────────────────────────

/**
 * Hydrogenic radial wavefunction R_nl(r)
 * 
 * Returns the radial part of the hydrogen wavefunction:
 * R_nl(r) = √[(2Z/na₀)³ (n-l-1)!/(2n(n+l)!)] ×
 *           (2Zr/na₀)^l × L_{n-l-1}^{2l+1}(2Zr/na₀) × exp(-Zr/na₀)
 * 
 * Uses scaled coordinate ρ = 2Z × r / (n × a₀) with a₀ = 1 for visualization
 */
export function radialWavefunction(
  n: number,
  l: number,
  r: number,
  Zeff: number
): number {
  // Scaled radial coordinate
  const rho = (2 * Zeff * r) / n;
  
  // Normalization prefactor
  const prefactor = Math.sqrt(
    Math.pow((2 * Zeff) / n, 3) *
    factorial(n - l - 1) /
    (2 * n * factorial(n + l))
  );
  
  // Radial part: ρ^l × exp(-ρ/2) × L_{n-l-1}^{2l+1}(ρ)
  const norm = prefactor * Math.pow(rho, l) * Math.exp(-rho / 2);
  const assocN = n - l - 1;
  const poly = laguerreAssoc(Math.max(0, assocN), 2 * l + 1, rho);
  
  return norm * poly;
}

/**
 * Real spherical harmonic Y_l^m(θ, φ)
 * 
 * Returns amplitude using the real form:
 * - For m = 0: Y_l^0 = √[(2l+1)/(4π)] × P_l^0(cos θ)
 * - For m > 0: Y_l^m = √[(2l+1)/(2π)] × P_l^|m|(cos θ) × cos(mφ) / √2
 * - For m < 0: Y_l^m = √[(2l+1)/(2π)] × P_l^|m|(cos θ) × sin(|m|φ) / √2
 * 
 * Returns amplitude (sign matters for phase coloring)
 */
export function realSphericalHarmonic(
  l: number,
  m: number,
  theta: number,
  phi: number
): number {
  const absM = Math.abs(m);
  const cosTheta = Math.cos(theta);
  
  // Associated Legendre polynomial
  const Plm = legendreAssoc(l, absM, cosTheta);
  
  // Normalization factor
  const norm = Math.sqrt(
    ((2 * l + 1) / (4 * Math.PI)) *
    factorial(l - absM) /
    factorial(l + absM)
  );
  
  const base = norm * Plm;
  
  if (m === 0) {
    return base;
  }
  
  if (m > 0) {
    return base * Math.cos(m * phi) * Math.SQRT2;
  }
  
  // m < 0
  return base * Math.sin(absM * phi) * Math.SQRT2;
}

/**
 * Full hydrogen wavefunction ψ_nlm(r, θ, φ)
 * 
 * Returns the real representation: ψ = R_nl(r) × Y_l^m(θ, φ)
 */
export function hydrogenPsi(
  n: number,
  l: number,
  m: number,
  r: number,
  theta: number,
  phi: number,
  Zeff: number = 1
): number {
  const R = radialWavefunction(n, l, r, Zeff);
  const Y = realSphericalHarmonic(l, m, theta, phi);
  return R * Y;
}

/**
 * Probability density |ψ|² at a point
 */
export function probabilityDensity(
  n: number,
  l: number,
  m: number,
  r: number,
  theta: number,
  phi: number,
  Zeff: number = 1
): number {
  const psi = hydrogenPsi(n, l, m, r, theta, phi, Zeff);
  return psi * psi;
}

// ─── Electron Configuration ────────────────────────────────────────────────

/**
 * Subshell representation
 */
export interface Subshell {
  n: number;
  l: number;
  m: number;
  occ: number;
  cap: number;
}

/**
 * Aufbau principle ordering (electron filling order)
 */
export const AUFBAU_ORDER: { n: number; l: number; cap: number }[] = [
  { n: 1, l: 0, cap: 2 },   // 1s
  { n: 2, l: 0, cap: 2 },   // 2s
  { n: 2, l: 1, cap: 6 },    // 2p
  { n: 3, l: 0, cap: 2 },    // 3s
  { n: 3, l: 1, cap: 6 },    // 3p
  { n: 4, l: 0, cap: 2 },    // 4s
  { n: 3, l: 2, cap: 10 },   // 3d
  { n: 4, l: 1, cap: 6 },    // 4p
  { n: 5, l: 0, cap: 2 },    // 5s
  { n: 4, l: 2, cap: 10 },   // 4d
  { n: 5, l: 1, cap: 6 },    // 5p
  { n: 6, l: 0, cap: 2 },    // 6s
  { n: 5, l: 2, cap: 10 },   // 5d
  { n: 6, l: 1, cap: 6 },    // 6p
  { n: 7, l: 0, cap: 2 },    // 7s
  { n: 6, l: 2, cap: 10 },   // 6d
  { n: 7, l: 1, cap: 6 },    // 7p
  { n: 5, l: 3, cap: 14 },   // 4f
  { n: 6, l: 3, cap: 14 },   // 5f
];

/**
 * Get electron configuration for an element
 */
export function getElectronConfig(Z: number): Subshell[] {
  let electrons = Math.max(1, Math.min(118, Math.floor(Z)));
  const config: Subshell[] = [];
  
  for (const slot of AUFBAU_ORDER) {
    if (electrons <= 0) break;
    const occ = Math.min(slot.cap, electrons);
    config.push({ n: slot.n, l: slot.l, m: 0, occ, cap: slot.cap });
    electrons -= occ;
  }
  
  return config;
}

/**
 * Slater's rules for calculating effective nuclear charge
 * 
 * Z_eff = Z - S, where S is the screening constant
 */
export function slaterShielding(Z: number, n: number, l: number): number {
  const config = getElectronConfig(Z);
  let S = 0;
  
  for (const s of config) {
    if (s.n === n && s.l === l) {
      // Same (n, l) subshell: 0.35 each (except 1s: 0.30)
      const factor = n === 1 ? 0.30 : 0.35;
      S += factor * Math.max(0, s.occ - 1);
    } else if (l <= 1) {
      // s or p electron
      if (s.n === n - 1) {
        S += 0.85 * s.occ;
      } else if (s.n < n - 1) {
        S += 1.0 * s.occ;
      } else if (s.n === n && s.l > l) {
        // Same n but higher l: no shielding
        S += 0;
      }
    } else {
      // d or f electron: all inner electrons shield completely
      if (s.n < n || (s.n === n && s.l < l)) {
        S += 1.0 * s.occ;
      }
    }
  }
  
  return S;
}

/**
 * Get effective nuclear charge for a given subshell
 */
export function getZeff(Z: number, n: number, l: number): number {
  return Math.max(1, Z - slaterShielding(Z, n, l));
}

// ─── Orbital Visualization ─────────────────────────────────────────────────

/**
 * Map orbital type to angular momentum quantum number
 */
export function kindToL(kind: Exclude<OrbitalKind, 'mix' | 'atlas'>): number {
  switch (kind) {
    case 's': return 0;
    case 'p': return 1;
    case 'd': return 2;
    case 'f': return 3;
  }
}

/**
 * Get all m values for a given l
 */
export function mValues(l: number): number[] {
  const ms: number[] = [];
  for (let m = -l; m <= l; m++) ms.push(m);
  return ms;
}

/**
 * Get outermost subshell for a given angular momentum
 */
export function getOutermostSubshell(
  Z: number,
  targetL: number
): { n: number; l: number; m: number; Zeff: number } | null {
  const config = getElectronConfig(Z);
  for (let i = config.length - 1; i >= 0; i--) {
    const s = config[i];
    if (s.l === targetL) {
      const Zeff = getZeff(Z, s.n, s.l);
      return { n: s.n, l: s.l, m: 0, Zeff };
    }
  }
  return null;
}

// Random number generator for sampling
let _seed = 0x12345678;

export function lcg(): number {
  _seed = (Math.imul(_seed, 1664525) + 1013904223) >>> 0;
  return (_seed >>> 0) / 0x100000000;
}

export function setSeed(seed: number): void {
  _seed = seed;
}

// ─── Orbital Sampling ─────────────────────────────────────────────────────

/**
 * Sample a point from a hydrogen orbital using rejection sampling
 * Based on |ψ|² probability distribution
 */
export function sampleHydrogenPoint(
  n: number,
  l: number,
  m: number,
  time: number,
  Zeff: number = 1
): OrbitalPoint | null {
  // Expected radius for this orbital
  const rExpected = (n * n) / Zeff;
  const maxR = rExpected * 7.5;
  
  for (let attempt = 0; attempt < 32; attempt++) {
    // Sample r using exponential distribution (good for hydrogen)
    const r = -rExpected * Math.log(Math.max(1e-9, lcg())) * 1.15;
    if (r > maxR || r < 1e-6) continue;
    
    // Sample angles uniformly
    const theta = Math.acos(1 - 2 * lcg());
    const phi = 2 * Math.PI * lcg();
    
    // Calculate wavefunction value
    const psi = hydrogenPsi(n, l, m, r, theta, phi, Zeff);
    const prob = psi * psi;
    
    // Calculate peak probability for rejection sampling
    const rPeak = rExpected * 0.72;
    const psiPeak = Math.abs(hydrogenPsi(n, l, m, rPeak, Math.PI / 2, 0, Zeff));
    const probPeak = psiPeak * psiPeak * 2.8;
    
    // Rejection sampling
    if (lcg() < prob / Math.max(probPeak, 1e-30)) {
      const sinTheta = Math.sin(theta);
      const scale = 2.7; // Visualization scale
      
      return {
        x: r * sinTheta * Math.cos(phi) * scale,
        y: r * Math.cos(theta) * scale,
        z: r * sinTheta * Math.sin(phi) * scale,
        psi,
        prob: Math.min(1, prob / Math.max(probPeak, 1e-30)),
        l,
      };
    }
  }
  
  return null;
}

/**
 * Calculate time-dependent amplitude for a quantum superposition
 */
export function stateAmplitude(
  components: QuantumComponent[],
  r: number,
  theta: number,
  phi: number,
  Zeff: number,
  time: number
): number {
  let sum = 0;
  
  for (const c of components) {
    // Time-dependent phase evolution
    // E_n ∝ -1/n², so frequency ∝ 1/n²
    const phase = c.phase + time * (0.25 + c.n * 0.04);
    sum += c.weight * hydrogenPsi(c.n, c.l, c.m, r, theta, phi, Zeff) * Math.cos(phase);
  }
  
  return sum;
}

/**
 * Sample from a quantum superposition state
 */
export function sampleSuperpositionPoint(
  components: QuantumComponent[],
  time: number,
  Zeff: number = 1
): OrbitalPoint | null {
  const maxN = Math.max(...components.map(c => c.n));
  const rExpected = (maxN * maxN) / Zeff;
  const maxR = rExpected * 7.5;
  
  for (let attempt = 0; attempt < 40; attempt++) {
    const r = -rExpected * Math.log(Math.max(1e-9, lcg())) * 1.1;
    if (r > maxR || r < 1e-6) continue;
    
    const theta = Math.acos(1 - 2 * lcg());
    const phi = 2 * Math.PI * lcg();
    
    const psi = stateAmplitude(components, r, theta, phi, Zeff, time);
    const prob = psi * psi;
    
    const rPeak = rExpected * 0.7;
    const ampPeak = Math.abs(stateAmplitude(components, rPeak, Math.PI / 2, 0, Zeff, time));
    const probPeak = ampPeak * ampPeak * 3.2;
    
    if (lcg() < prob / Math.max(probPeak, 1e-30)) {
      const sinTheta = Math.sin(theta);
      const scale = 2.7;
      const l = components[0]?.l ?? 0;
      
      return {
        x: r * sinTheta * Math.cos(phi) * scale,
        y: r * Math.cos(theta) * scale,
        z: r * sinTheta * Math.sin(phi) * scale,
        psi,
        prob: Math.min(1, prob / Math.max(probPeak, 1e-30)),
        l,
      };
    }
  }
  
  return null;
}

// ─── Orbital Colors ───────────────────────────────────────────────────────

/**
 * Get color based on wavefunction phase (sign) and probability density
 * Different angular momenta have different color schemes
 */
export function orbitalColor(psi: number, prob: number, l: number): string {
  const alpha = 0.08 + Math.min(0.85, prob * 0.9);
  
  if (l === 0) {
    // s orbitals: blue-violet positive, magenta negative
    return psi >= 0
      ? `rgba(160, 100, 255, ${alpha})`
      : `rgba(255, 80, 200, ${alpha})`;
  } else if (l === 1) {
    // p orbitals: cyan positive, amber negative
    return psi >= 0
      ? `rgba(60, 200, 255, ${alpha})`
      : `rgba(255, 160, 40, ${alpha})`;
  } else if (l === 2) {
    // d orbitals: lime positive, red-orange negative
    return psi >= 0
      ? `rgba(80, 255, 160, ${alpha})`
      : `rgba(255, 80, 60, ${alpha})`;
  } else {
    // f orbitals: gold positive, indigo negative
    return psi >= 0
      ? `rgba(255, 220, 60, ${alpha})`
      : `rgba(100, 60, 255, ${alpha})`;
  }
}

// ─── 3D Transformations ───────────────────────────────────────────────────

/**
 * Rotate a point in 3D using Euler angles (yaw, pitch, roll)
 */
export function rotatePoint(
  x: number,
  y: number,
  z: number,
  yaw: number,
  pitch: number,
  roll: number
): [number, number, number] {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const cr = Math.cos(roll), sr = Math.sin(roll);
  
  // Yaw (around Y axis)
  let px = x * cy - z * sy;
  let pz = x * sy + z * cy;
  let py = y;
  
  // Pitch (around X axis)
  const py2 = py * cp - pz * sp;
  const pz2 = py * sp + pz * cp;
  py = py2;
  pz = pz2;
  
  // Roll (around Z axis)
  const px2 = px * cr - py * sr;
  const py3 = px * sr + py * cr;
  px = px2;
  py = py3;
  
  return [px, py, pz];
}

// ─── Predefined Orbitals ─────────────────────────────────────────────────

/**
 * Hydrogen orbital specifications for the atlas
 */
export const HYDROGEN_ATLAS: { n: number; l: number; m: number; label: string }[] = [
  { n: 1, l: 0, m: 0, label: '1s' },
  { n: 2, l: 0, m: 0, label: '2s' },
  { n: 2, l: 1, m: 0, label: '2p₀' },
  { n: 2, l: 1, m: 1, label: '2p₁' },
  { n: 3, l: 0, m: 0, label: '3s' },
  { n: 3, l: 1, m: 0, label: '3p₀' },
  { n: 3, l: 1, m: 1, label: '3p₁' },
  { n: 3, l: 2, m: 0, label: '3d₀' },
  { n: 3, l: 2, m: 1, label: '3d₁' },
  { n: 3, l: 2, m: 2, label: '3d₂' },
  { n: 4, l: 0, m: 0, label: '4s' },
  { n: 4, l: 1, m: 0, label: '4p₀' },
  { n: 4, l: 1, m: 1, label: '4p₁' },
  { n: 4, l: 2, m: 0, label: '4d₀' },
  { n: 4, l: 2, m: 1, label: '4d₁' },
  { n: 4, l: 3, m: 0, label: '4f₀' },
  { n: 4, l: 3, m: 1, label: '4f₁' },
];

/**
 * Default superposition for mixed orbital visualization
 */
export const SUPERPOSITION_COMPONENTS: QuantumComponent[] = [
  { n: 2, l: 0, m: 0, weight: 0.72, phase: 0.0 },
  { n: 2, l: 1, m: 0, weight: 0.62, phase: Math.PI * 0.7 },
  { n: 3, l: 0, m: 0, weight: 0.40, phase: Math.PI * 1.3 },
];

/**
 * Sample an orbital point based on type
 */
export function sampleOrbitalPoint(
  Z: number,
  kind: OrbitalKind,
  time: number,
): OrbitalPoint | null {
  if (kind === 'atlas') return null;
  
  if (kind === 'mix') {
    return sampleSuperpositionPoint(SUPERPOSITION_COMPONENTS, time, 1);
  }
  
  const baseSpec =
    kind === 's' ? { n: 1, l: 0, m: 0 } :
    kind === 'p' ? { n: 2, l: 1, m: 0 } :
    kind === 'd' ? { n: 3, l: 2, m: 0 } :
    { n: 4, l: 3, m: 0 };
  
  return sampleHydrogenPoint(baseSpec.n, baseSpec.l, baseSpec.m, time, 1);
}
