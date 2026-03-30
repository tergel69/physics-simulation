/**
 * Physics Module Index
 * 
 * Exports all physics-related modules for the simulation
 */

// Constants
export * from './constants';

// Black Hole Physics
export {
  schwarzschildRadius,
  schwarzschildRadiusScene,
  photonSphereRadius,
  iscoRadius,
  gravitationalRedshift,
  criticalImpactParameter,
  shadowRadius,
  traceGeodesic,
  DEFAULT_BLACKHOLE,
  type BlackHoleParams,
  type GeodesicResult,
} from './blackhole';

// Export black hole gravitational acceleration with alias
export {
  gravitationalAcceleration as blackHoleGravity,
} from './blackhole';

// Quantum Mechanics
export {
  hydrogenPsi,
  radialWavefunction,
  realSphericalHarmonic,
  probabilityDensity,
  getElectronConfig,
  slaterShielding,
  getZeff,
  kindToL,
  mValues,
  getOutermostSubshell,
  sampleHydrogenPoint,
  sampleSuperpositionPoint,
  stateAmplitude,
  orbitalColor,
  rotatePoint,
  HYDROGEN_ATLAS,
  SUPERPOSITION_COMPONENTS,
  sampleOrbitalPoint,
  factorial,
  laguerreAssoc,
  legendreAssoc,
  lcg,
  setSeed,
  type QuantumState,
  type OrbitalPoint,
  type QuantumComponent,
  type OrbitalKind,
  type Subshell,
} from './quantum';

// Orbital Mechanics
export {
  solveKepler,
  trueAnomaly,
  radiusFromTrueAnomaly,
  visVivaVelocity,
  orbitalVelocityVector,
  orbitalPosition,
  orbitalPositionWithPerturbation,
  gravitationalAcceleration,
  nBodyStep,
  SOLAR_SYSTEM,
  SCALE,
  G_CONST,
  SUN_MASS,
  degToRad,
  radToDeg,
  getOrbitalElements,
  type OrbitalElements,
  type Planet,
  type Position3D,
  type Velocity3D,
  type Body,
} from './orbital';

// Black Hole Presets
export {
  BLACK_HOLE_PRESETS,
  getPreset,
  getPresetCameraDistance,
  calculateSchwarzschildRadius,
  calculateEventHorizon,
  calculatePhotonSphere,
  calculateISCO,
  calculateDeflectionAngle,
  calculateRedshift,
  calculateTimeDilation,
  calculateDopplerFactor,
  getVisualScale,
  formatMass,
  formatDistance,
  type BlackHolePreset,
} from './presets';