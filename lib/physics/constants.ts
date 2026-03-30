/**
 * Physical constants in SI units (with some scaled for visualization)
 * Based on CODATA 2018 values
 */

// Fundamental constants
export const PHYSICAL_CONSTANTS = {
  // Speed of light (m/s)
  c: 299792458,
  // Gravitational constant (m³/kg/s²)
  G: 6.67430e-11,
  // Planck constant (J·s)
  h: 6.62607015e-34,
  // Reduced Planck constant (J·s)
  hbar: 1.054571817e-34,
  // Boltzmann constant (J/K)
  kB: 1.380649e-23,
  // Elementary charge (C)
  e: 1.602176634e-19,
  // Electron mass (kg)
  m_e: 9.1093837015e-31,
  // Proton mass (kg)
  m_p: 1.67262192369e-27,
  // Fine-structure constant (α = e²/(4πε₀ħc))
  alpha: 7.2973525693e-3,
  // Vacuum permittivity (F/m)
  epsilon_0: 8.8541878128e-12,
  // Bohr radius (m)
  a0: 5.29177210903e-11,
  // Hartree energy (J)
  Eh: 4.3597447222071e-18,
  // Rydberg constant (m⁻¹)
  R_inf: 10973731.568160,
} as const;

// Solar system constants (scaled for visualization)
export const SOLAR_CONSTANTS = {
  // Solar mass (kg)
  M_sun: 1.98847e30,
  // Solar radius (m)
  R_sun: 6.957e8,
  // Astronomical unit (m)
  AU: 1.495978707e11,
  // Earth orbital period (seconds)
  year: 365.256004 * 24 * 3600,
  // Gravitational parameter GM☉ (m³/s²)
  GM_sun: 1.32712440018e20,
} as const;

// Black hole constants
export const BLACKHOLE_CONSTANTS = {
  // Schwarzschild radius: Rs = 2GM/c² for solar mass
  Rs_solar_mass: 2.95e3, // meters
  // Schwarzschild radius in km per solar mass
  Rs_per_solar_mass: 2.95,
  // Photon sphere radius (1.5 Rs)
  photon_sphere_factor: 1.5,
  // Innermost stable circular orbit (ISCO) for non-spinning BH
  isco_factor: 3.0,
  // Innermost stable circular orbit for maximally spinning Kerr BH
  isco_kerr_max: 0.5,
} as const;

// Visualization scale factors
export const VISUALIZATION_SCALE = {
  // Time scale for solar system (1 second = X days)
  time_scale: 1.0,
  // Distance scale (1 scene unit = X AU)
  au_per_unit: 0.1,
  // Black hole mass scale
  mass_scale: 1.5,
} as const;

// Quantum constants
export const QUANTUM_CONSTANTS = {
  // Bohr radius in scene units (scaled for visualization)
  a0_visual: 0.529 * 0.1, // scaled down for visibility
  // Energy levels (in eV, for hydrogen: E_n = -13.6/n²)
  E_hydrogen: -13.6,
  // Fine-structure constant
  alpha_fs: 1 / 137.035999084,
  // Common orbital quantum numbers for visualization
  common_orbitals: [
    { n: 1, l: 0, m: 0, label: '1s' },
    { n: 2, l: 0, m: 0, label: '2s' },
    { n: 2, l: 1, m: 0, label: '2p₀' },
    { n: 2, l: 1, m: 1, label: '2p₁' },
    { n: 3, l: 0, m: 0, label: '3s' },
    { n: 3, l: 1, m: 0, label: '3p₀' },
    { n: 3, l: 2, m: 0, label: '3d₀' },
    { n: 3, l: 2, m: 1, label: '3d₁' },
    { n: 3, l: 2, m: 2, label: '3d₂' },
    { n: 4, l: 0, m: 0, label: '4s' },
    { n: 4, l: 3, m: 0, label: '4f₀' },
  ] as const,
} as const;

// Angular momentum quantum number names
export const ORBITAL_NAMES: Record<number, string> = {
  0: 's',
  1: 'p',
  2: 'd',
  3: 'f',
  4: 'g',
  5: 'h',
};
