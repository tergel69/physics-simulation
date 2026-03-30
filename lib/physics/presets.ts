/**
 * Black Hole Presets Module
 * 
 * Contains real black hole configurations based on observed data:
 * - Sgr A*: Supermassive black hole at Milky Way center
 * - M87*: First imaged black hole (Event Horizon Telescope)
 * - Cygnus X-1: Stellar mass black hole
 * - Custom: User adjustable parameters
 */

import { BLACKHOLE_CONSTANTS } from './constants';

// Types
export interface BlackHolePreset {
  id: string;
  name: string;
  description: string;
  mass: number;           // Solar masses
  spin: number;           // 0-1 (dimensionless spin parameter a/M)
  distance: number;       // Light years
  accretionRate: number;  // Solar masses per year (fraction)
  diskTemp: number;       // Average disk temperature (Kelvin)
  shadowRadius: number;   // Schwarzschild radii
  color: string;          // Display color
}

// Real black hole data
export const BLACK_HOLE_PRESETS: BlackHolePreset[] = [
  {
    id: 'sgr-a',
    name: 'Sagittarius A*',
    description: 'Supermassive black hole at the center of our Milky Way. Mass: 4.3 million solar masses.',
    mass: 4.3e6,
    spin: 0.9,  // Estimated high spin
    distance: 26000,  // Light years (about 8 kpc)
    accretionRate: 1e-5,  // Very low accretion
    diskTemp: 1e7,  // Hot corona
    shadowRadius: 2.6,
    color: '#ff6b35',
  },
  {
    id: 'm87',
    name: 'M87*',
    description: 'Supermassive black hole imaged by Event Horizon Telescope (2019). Famous for its massive jet.',
    mass: 6.5e9,
    spin: 0.9,  // Estimated high spin
    distance: 5.3e7,  // Light years (about 16.4 Mpc)
    accretionRate: 0.1,  // Higher accretion rate
    diskTemp: 1e8,  // Very hot
    shadowRadius: 2.6,
    color: '#4ecdc4',
  },
  {
    id: 'cygnus-x1',
    name: 'Cygnus X-1',
    description: 'Stellar mass black hole in the Milky Way. First discovered black hole in our galaxy.',
    mass: 21,
    spin: 0.95,  // Measured high spin
    distance: 6000,  // Light years
    accretionRate: 2e-7,  // Stellar mass donor
    diskTemp: 1e7,
    shadowRadius: 2.6,
    color: '#ffe66d',
  },
  {
    id: 'ton-618',
    name: 'TON 618',
    description: 'One of the most massive known black holes. Quasar with extremely high luminosity.',
    mass: 6.6e10,  // ~66 billion solar masses
    spin: 0.9,  // Estimated
    distance: 1.04e9,  // Light years
    accretionRate: 100,  // Extreme accretion
    diskTemp: 1e9,
    shadowRadius: 2.6,
    color: '#ff0055',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Create your own black hole with adjustable parameters.',
    mass: 10,
    spin: 0.5,
    distance: 1000,
    accretionRate: 0.01,
    diskTemp: 1e6,
    shadowRadius: 2.6,
    color: '#a855f7',
  },
];

/**
 * Get a preset by ID
 */
export function getPreset(id: string): BlackHolePreset | undefined {
  return BLACK_HOLE_PRESETS.find(p => p.id === id);
}

/**
 * Calculate Schwarzschild radius for a given mass
 * Rs = 2GM/c² = 2.95 km per solar mass
 */
export function calculateSchwarzschildRadius(solarMasses: number): number {
  return solarMasses * BLACKHOLE_CONSTANTS.Rs_per_solar_mass; // km
}

/**
 * Calculate event horizon radius
 * For Schwarzschild: r+ = Rs/2 (in our normalized units where Rs = 2M)
 */
export function calculateEventHorizon(mass: number, spin: number = 0): number {
  const Rs = 2 * mass; // In normalized units
  // Kerr metric: r+ = M + sqrt(M² - a²)
  // a = spin * M (in geometric units)
  const a = spin * mass;
  return mass + Math.sqrt(mass * mass - a * a);
}

/**
 * Calculate photon sphere radius
 * For Schwarzschild: 1.5 Rs
 * For Kerr: varies with spin and viewing angle
 */
export function calculatePhotonSphere(mass: number, spin: number = 0): number {
  const Rs = 2 * mass;
  // For equatorial orbit: r = 1.5 Rs
  // For polar orbit: varies
  return 1.5 * Rs;
}

/**
 * Calculate ISCO (Innermost Stable Circular Orbit)
 * For Schwarzschild: 3 Rs
 * For Kerr: decreases with spin (0.5 Rs for maximal prograde)
 */
export function calculateISCO(mass: number, spin: number = 0): number {
  const Rs = 2 * mass;
  // ISCO = 3 Rs for Schwarzschild (a=0)
  // ISCO = 0.5 Rs for maximal Kerr (a=M, prograde)
  const minISCO = 0.5 * Rs;
  const maxISCO = 3 * Rs;
  return maxISCO - spin * (maxISCO - minISCO);
}

/**
 * Calculate gravitational lensing deflection angle
 * α = 4GM/(c²b) = 2Rs/b for weak field
 */
export function calculateDeflectionAngle(mass: number, impactParameter: number): number {
  const Rs = 2 * mass;
  return 2 * Rs / impactParameter;
}

/**
 * Calculate gravitational redshift at radius r
 * z = 1/sqrt(1 - Rs/r) - 1
 */
export function calculateRedshift(mass: number, radius: number): number {
  const Rs = 2 * mass;
  if (radius <= Rs) return Infinity; // Inside event horizon
  return 1 / Math.sqrt(1 - Rs / radius) - 1;
}

/**
 * Calculate gravitational time dilation factor
 * dt/dr = 1/sqrt(1 - Rs/r)
 */
export function calculateTimeDilation(mass: number, radius: number): number {
  const Rs = 2 * mass;
  if (radius <= Rs) return 0; // Time stops at horizon
  return 1 / Math.sqrt(1 - Rs / radius);
}

/**
 * Calculate Doppler beaming factor
 * D = 1/γ(1 - β cos θ)
 */
export function calculateDopplerFactor(velocity: number, angleToObserver: number): number {
  const beta = Math.min(velocity, 0.9999);
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  return 1 / (gamma * (1 - beta * Math.cos(angleToObserver)));
}

/**
 * Get visual scale factor for rendering
 * Adjusts camera distance based on black hole mass
 */
export function getVisualScale(mass: number): number {
  // Logarithmic scaling to keep things visible
  if (mass < 100) {
    return 20 + mass * 0.5;  // Stellar mass: closer view
  } else if (mass < 1e6) {
    return 50 + Math.log10(mass) * 10;  // Intermediate
  } else {
    return 100 + Math.log10(mass / 1e6) * 30;  // Supermassive
  }
}

/**
 * Format mass for display
 */
export function formatMass(mass: number): string {
  if (mass >= 1e9) {
    return `${(mass / 1e9).toFixed(1)} billion M☉`;
  } else if (mass >= 1e6) {
    return `${(mass / 1e6).toFixed(1)} million M☉`;
  } else if (mass >= 1e3) {
    return `${(mass / 1e3).toFixed(1)} thousand M☉`;
  } else if (mass >= 1) {
    return `${mass.toFixed(1)} M☉`;
  } else {
    return `${(mass * 1000).toFixed(1)}% M☉`;
  }
}

/**
 * Format distance for display
 */
export function formatDistance(lightYears: number): string {
  if (lightYears >= 1e9) {
    return `${(lightYears / 1e9).toFixed(1)} billion ly`;
  } else if (lightYears >= 1e6) {
    return `${(lightYears / 1e6).toFixed(1)} million ly`;
  } else if (lightYears >= 1e3) {
    return `${(lightYears / 1e3).toFixed(1)} thousand ly`;
  } else {
    return `${lightYears.toFixed(0)} ly`;
  }
}

/**
 * Get preset-specific camera distance
 */
export function getPresetCameraDistance(preset: BlackHolePreset): number {
  return getVisualScale(preset.mass);
}
