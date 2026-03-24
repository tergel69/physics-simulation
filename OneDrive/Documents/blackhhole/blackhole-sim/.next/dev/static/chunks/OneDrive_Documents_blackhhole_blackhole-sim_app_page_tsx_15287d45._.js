(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BlackHoleSimulation
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Documents/blackhhole/blackhole-sim/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Documents/blackhhole/blackhole-sim/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
// ─── WebGL1 helpers ──────────────────────────────────────────────────────────
function mkShader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Shader error: ' + gl.getShaderInfoLog(s));
    return s;
}
function mkProg(gl, vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, mkShader(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, mkShader(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Link error: ' + gl.getProgramInfoLog(p));
    return p;
}
function ul(gl, p, n) {
    return gl.getUniformLocation(p, n);
}
// ─── Fullscreen quad VS ──────────────────────────────────────────────────────
const QUAD_VS = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;
// ─── Main scene FS ────────────────────────────────────────────────────────────
const SCENE_FS = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform vec3  uCamPos;
uniform mat3  uCamRot;
uniform float uSpin;
uniform float uDiskTilt;
uniform float uDiskBright;
uniform float uMass;
varying vec2 vUv;

float h3(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
float ns(vec3 p){
  vec3 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(
    mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){
  float v=0.0,a=0.5;
  for(int i=0;i<5;i++){v+=a*ns(p);p=p*2.1+vec3(1.7,9.2,5.4);a*=0.5;}
  return v;
}

vec3 stars(vec3 rd){
  vec3 col=vec3(0.0);
  float band=exp(-pow(rd.y*5.0,2.0));
  col+=vec3(0.16,0.14,0.24)*band*0.18;
  col+=vec3(0.04,0.03,0.08)*pow(clamp(1.0-abs(rd.y),0.0,1.0),2.0);
  for(int i=0;i<5;i++){
    float sc=90.0+float(i)*130.0;
    vec3 g=floor(rd*sc);
    float r=h3(g+float(i)*17.3);
    if(r>0.9988){
      float br=h3(g+vec3(91.3));
      vec3 sc2=mix(vec3(0.7,0.82,1.0),mix(vec3(1.0,0.95,0.7),vec3(1.0,0.55,0.35),clamp((br-0.5)*2.0,0.0,1.0)),clamp((br-0.3)*2.0,0.0,1.0));
      col+=sc2*(br*0.8+0.2)*0.9;
    }
  }
  return col;
}

vec3 diskCol(vec3 p, float rs){
  float r=length(p.xz);
  float phi=atan(p.z,p.x);
  float rIn=3.0*rs,rOut=11.0*rs;
  if(r<rIn||r>rOut) return vec3(0.0);
  float r01=(r-rIn)/(rOut-rIn);
  float omega=pow(max(r,0.01),-1.5);
  float flow=phi*6.0-uTime*uSpin*omega*55.0;
  vec3 tp=vec3(cos(flow)*r01*4.0,sin(flow)*r01*4.0,uTime*0.08);
  float pl=fbm(tp*2.5),p2=fbm(tp*4.0+vec3(3.1,1.7,2.4));
  float tex=pl*0.6+p2*0.4;
  float dop=0.25+0.75*pow(max(0.0,sin(phi-uTime*uSpin*0.3)),1.6);
  vec3 white=vec3(1.00,0.97,0.88),gold=vec3(1.00,0.78,0.22),orange=vec3(0.98,0.38,0.04),red=vec3(0.62,0.04,0.02);
  vec3 base=mix(mix(mix(white,gold,smoothstep(0.0,0.25,r01)),orange,smoothstep(0.2,0.55,r01)),red,smoothstep(0.5,1.0,r01));
  float fl=pow(max(0.0,ns(vec3(flow*0.25,r01*7.0,uTime*0.4))-0.74),2.0)*5.0;
  base+=vec3(1.0,0.8,0.3)*fl;
  float rim=exp(-pow((r-rIn)/(0.14*rIn),2.0));
  base+=vec3(1.0,0.96,0.82)*rim*0.9;
  base*=mix(1.15,0.92,smoothstep(0.55,1.0,r01));
  float vf=exp(-abs(p.y)/(0.08*rs));
  return base*(0.58+tex*1.02)*dop*vf*uDiskBright*3.1;
}

vec3  g_emission;
vec3  g_finalDir;
bool  g_captured;

void traceGeodesic(vec3 ro, vec3 rd, float rs){
  g_emission=vec3(0.0); g_captured=false; g_finalDir=rd;
  float EH=rs*0.52;
  float ct=cos(uDiskTilt),st=sin(uDiskTilt);
  vec3 dN=normalize(vec3(0.0,ct,-st));
  vec3 pos=ro,vel=normalize(rd);
  float prevDot=dot(pos,dN);
  for(int i=0;i<320;i++){
    float r=length(pos);
    float rsR3=1.5*rs/(r*r*r);
    vec3 acc=-pos*rsR3;
    if(uSpin>0.0){
      float fd=uSpin*rs*rs/(r*r*r*r+0.001);
      vec3 tang=cross(normalize(pos),vec3(0.0,1.0,0.0));
      acc+=tang*fd*0.7;
    }
    float step=clamp(0.2*(r-rs)/max(r,0.001),0.03,2.2);
    vel=normalize(vel+acc*step);
    pos=pos+vel*step;
    r=length(pos);
    if(r<EH){g_captured=true;return;}
    float curDot=dot(pos,dN);
    if(prevDot*curDot<0.0){
      float t2=-prevDot/(curDot-prevDot);
      vec3 hp=pos+vel*(step*(t2-1.0));
      vec3 hpL=vec3(hp.x,dot(hp,vec3(0.0,ct,st)),dot(hp,vec3(0.0,-st,ct)));
      hpL.y=0.0;
      vec3 dc=diskCol(hpL,rs);
      float vis=1.0-length(g_emission)*0.8;
      g_emission+=dc*max(vis,0.0);
    }
    prevDot=curDot;
    if(r>120.0*rs&&dot(pos,vel)>0.0) break;
    if(r>300.0*rs) break;
  }
  g_finalDir=vel;
}

void main(){
  vec2 uv=(vUv*2.0-1.0);
  uv.x*=uRes.x/uRes.y;
  vec3 rdL=normalize(vec3(uv,-1.75));
  vec3 rd=normalize(uCamRot*rdL);
  vec3 ro=uCamPos;
  float rs=uMass*1.5;
  traceGeodesic(ro,rd,rs);
  vec3 col=vec3(0.0);
  if(g_captured){
    col=vec3(0.006,0.002,0.010);
  } else {
    col=stars(g_finalDir)*0.85;
    vec3 toBH=-normalize(ro);
    float cosA=dot(rd,toBH);
    float sepA=acos(clamp(cosA,-1.0,1.0));
    float camR=length(ro);
    float shadowA=atan(2.6*rs,camR);
    float shadow=smoothstep(shadowA+0.04,shadowA-0.008,sepA);
    col*=1.0-shadow*0.97;
    float pr=exp(-pow((sepA-shadowA)/0.007,2.0));
    col+=vec3(1.0,0.88,0.55)*pr*4.0;
    float pr2=exp(-pow((sepA-shadowA*0.92)/0.012,2.0));
    col+=vec3(0.8,0.6,0.3)*pr2*1.5;
    float ig=exp(-pow((sepA-shadowA*0.86)/0.045,2.0))*0.5;
    col+=vec3(0.7,0.3,0.05)*ig;
    float cr=exp(-pow((sepA-shadowA*1.2)/0.08,2.0))*0.25;
    col+=vec3(0.45,0.1,0.6)*cr;
    float haze=exp(-pow((sepA-shadowA*1.45)/0.16,2.0))*0.22;
    col+=vec3(0.12,0.04,0.22)*haze;
  }
  col+=g_emission;
  {
    float jc=abs(dot(rd,vec3(0.0,1.0,0.0)));
    float jet=pow(max(0.0,1.0-(1.0-jc)*22.0),2.0)*exp(-length(ro)*0.025)*uSpin;
    col+=vec3(0.1,0.25,1.0)*jet*0.5;
  }
  col=col*(2.51*col+0.03)/(col*(2.43*col+0.59)+0.14);
  col=clamp(col,0.0,1.0);
  float v=1.0-dot(uv*0.28,uv*0.28);
  col*=clamp(v,0.0,1.0);
  gl_FragColor=vec4(col,1.0);
}`;
// ─── Ray overlay shaders ─────────────────────────────────────────────────────
const RAY_VS = `
attribute vec2  aPos;
attribute float aAlpha;
attribute vec3  aColor;
varying   float vAlpha;
varying   vec3  vColor;
uniform   vec2  uRes;
void main(){
  vec2 n = aPos / uRes * 2.0 - 1.0;
  n.y = -n.y;
  gl_Position = vec4(n, 0.0, 1.0);
  vAlpha = aAlpha;
  vColor = aColor;
}`;
const RAY_FS = `
precision mediump float;
varying float vAlpha;
varying vec3  vColor;
void main(){ gl_FragColor = vec4(vColor, vAlpha); }`;
const STRIDE = 6;
// ─── Quantum: proper hydrogen wavefunctions ──────────────────────────────────
// Generalized Laguerre polynomial L_n^alpha(x)
function laguerreAssoc(n, alpha, x) {
    if (n === 0) return 1;
    if (n === 1) return 1 + alpha - x;
    let l0 = 1, l1 = 1 + alpha - x;
    for(let k = 1; k < n; k++){
        const l2 = ((2 * k + 1 + alpha - x) * l1 - (k + alpha) * l0) / (k + 1);
        l0 = l1;
        l1 = l2;
    }
    return l1;
}
function factorial(n) {
    let v = 1;
    for(let i = 2; i <= n; i++)v *= i;
    return v;
}
// Associated Legendre polynomial P_l^|m|(cos θ) — real, unnormalized
function legendreAssoc(l, absM, cosTheta) {
    const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
    // Start from P_m^m and use recurrence
    let pmm = 1;
    for(let i = 1; i <= absM; i++)pmm *= -(2 * i - 1) * sinTheta;
    if (l === absM) return pmm;
    let pmm1 = cosTheta * (2 * absM + 1) * pmm;
    if (l === absM + 1) return pmm1;
    let result = 0;
    for(let ll = absM + 2; ll <= l; ll++){
        result = ((2 * ll - 1) * cosTheta * pmm1 - (ll + absM - 1) * pmm) / (ll - absM);
        pmm = pmm1;
        pmm1 = result;
    }
    return pmm1;
}
// Hydrogenic radial wavefunction R_nl(r) — returns real amplitude
// Uses scaled coordinate rho = 2*Z*r / (n*a0) with a0=1
function radialWavefunction(n, l, r, Zeff) {
    const rho = 2 * Zeff * r / n;
    const prefactor = Math.sqrt(Math.pow(2 * Zeff / n, 3) * factorial(n - l - 1) / (2 * n * factorial(n + l)));
    const norm = prefactor * Math.pow(rho, l) * Math.exp(-rho * 0.5);
    const assocN = n - l - 1;
    const poly = laguerreAssoc(Math.max(0, assocN), 2 * l + 1, rho);
    return norm * poly;
}
// Real spherical harmonic Y_l^m — returns amplitude (sign matters for phase coloring)
function realSphericalHarmonic(l, m, theta, phi) {
    const absM = Math.abs(m);
    const cosTheta = Math.cos(theta);
    const Plm = legendreAssoc(l, absM, cosTheta);
    const norm = Math.sqrt((2 * l + 1) / (4 * Math.PI) * factorial(l - absM) / factorial(l + absM));
    const base = norm * Plm;
    if (m === 0) return base;
    if (m > 0) return base * Math.cos(m * phi) * Math.SQRT2;
    return base * Math.sin(absM * phi) * Math.SQRT2;
}
// Full wavefunction value ψ_nlm(r, θ, φ) — real representation
function hydrogenPsi(n, l, m, r, theta, phi, Zeff) {
    const R = radialWavefunction(n, l, r, Zeff);
    const Y = realSphericalHarmonic(l, m, theta, phi);
    return R * Y;
}
const AUFBAU = [
    {
        n: 1,
        l: 0,
        cap: 2
    },
    {
        n: 2,
        l: 0,
        cap: 2
    },
    {
        n: 2,
        l: 1,
        cap: 6
    },
    {
        n: 3,
        l: 0,
        cap: 2
    },
    {
        n: 3,
        l: 1,
        cap: 6
    },
    {
        n: 4,
        l: 0,
        cap: 2
    },
    {
        n: 3,
        l: 2,
        cap: 10
    },
    {
        n: 4,
        l: 1,
        cap: 6
    },
    {
        n: 5,
        l: 0,
        cap: 2
    },
    {
        n: 4,
        l: 2,
        cap: 10
    },
    {
        n: 5,
        l: 1,
        cap: 6
    },
    {
        n: 6,
        l: 0,
        cap: 2
    },
    {
        n: 5,
        l: 2,
        cap: 10
    },
    {
        n: 6,
        l: 1,
        cap: 6
    },
    {
        n: 7,
        l: 0,
        cap: 2
    },
    {
        n: 6,
        l: 2,
        cap: 10
    },
    {
        n: 7,
        l: 1,
        cap: 6
    },
    {
        n: 5,
        l: 3,
        cap: 14
    },
    {
        n: 6,
        l: 3,
        cap: 14
    }
];
function getConfig(Z) {
    let rem = Math.max(1, Math.min(118, Math.floor(Z)));
    const config = [];
    for (const slot of AUFBAU){
        if (rem <= 0) break;
        const occ = Math.min(slot.cap, rem);
        // pick representative m for this subshell (m=0 for visualization)
        config.push({
            n: slot.n,
            l: slot.l,
            m: 0,
            occ,
            cap: slot.cap
        });
        rem -= occ;
    }
    return config;
}
// Slater's rules screening constant
function slaterShielding(Z, n, l) {
    const config = getConfig(Z);
    let S = 0;
    for (const s of config){
        if (s.n === n && s.l === l) {
            S += 0.35 * Math.max(0, s.occ - 1);
        } else if (l <= 1) {
            if (s.n === n - 1) S += 0.85 * s.occ;
            else if (s.n < n - 1) S += 1.0 * s.occ;
            else if (s.n === n && s.l > l) S += 0; // same-n d/f don't shield s/p
        } else {
            // d or f: all inner shells fully shield
            if (s.n < n || s.n === n && s.l < l) S += 1.0 * s.occ;
        }
    }
    return S;
}
function getZeff(Z, n, l) {
    return Math.max(1, Z - slaterShielding(Z, n, l));
}
// Orbital element from config for a given angular momentum quantum number
function getOutermostSubshell(Z, targetL) {
    const config = getConfig(Z);
    for(let i = config.length - 1; i >= 0; i--){
        const s = config[i];
        if (s.l === targetL) {
            const Zeff = getZeff(Z, s.n, s.l);
            return {
                n: s.n,
                l: s.l,
                m: 0,
                Zeff
            };
        }
    }
    return null;
}
// Map OrbitalKind to l quantum number
function kindToL(kind) {
    switch(kind){
        case 's':
            return 0;
        case 'p':
            return 1;
        case 'd':
            return 2;
        case 'f':
            return 3;
    }
}
// Pick m values appropriate for nice-looking real harmonics
function mValues(l) {
    const ms = [];
    for(let m = -l; m <= l; m++)ms.push(m);
    return ms;
}
const HYDROGEN_ATLAS = [
    {
        n: 1,
        l: 0,
        m: 0,
        label: '(1,0,0)'
    },
    {
        n: 2,
        l: 0,
        m: 0,
        label: '(2,0,0)'
    },
    {
        n: 2,
        l: 1,
        m: 0,
        label: '(2,1,0)'
    },
    {
        n: 3,
        l: 0,
        m: 0,
        label: '(3,0,0)'
    },
    {
        n: 3,
        l: 1,
        m: 0,
        label: '(3,1,0)'
    },
    {
        n: 3,
        l: 1,
        m: 1,
        label: '(3,1,1)'
    },
    {
        n: 3,
        l: 2,
        m: 0,
        label: '(3,2,0)'
    },
    {
        n: 3,
        l: 2,
        m: 1,
        label: '(3,2,1)'
    },
    {
        n: 3,
        l: 2,
        m: 2,
        label: '(3,2,2)'
    },
    {
        n: 4,
        l: 0,
        m: 0,
        label: '(4,0,0)'
    },
    {
        n: 4,
        l: 1,
        m: 0,
        label: '(4,1,0)'
    },
    {
        n: 4,
        l: 1,
        m: 1,
        label: '(4,1,1)'
    },
    {
        n: 4,
        l: 2,
        m: 0,
        label: '(4,2,0)'
    },
    {
        n: 4,
        l: 2,
        m: 1,
        label: '(4,2,1)'
    },
    {
        n: 4,
        l: 3,
        m: 0,
        label: '(4,3,0)'
    },
    {
        n: 4,
        l: 3,
        m: 1,
        label: '(4,3,1)'
    }
];
const SUPERPOSITION_COMPONENTS = [
    {
        n: 2,
        l: 0,
        m: 0,
        weight: 0.72,
        phase: 0.0
    },
    {
        n: 2,
        l: 1,
        m: 0,
        weight: 0.62,
        phase: Math.PI * 0.7
    },
    {
        n: 3,
        l: 0,
        m: 0,
        weight: 0.40,
        phase: Math.PI * 1.3
    }
];
let _seed = 0x12345678;
function lcg() {
    _seed = Math.imul(_seed, 1664525) + 1013904223 >>> 0;
    return (_seed >>> 0) / 0x100000000;
}
function sampleOrbitalPoint(Z, kind, t) {
    if (kind === 'atlas') return null;
    if (kind === 'mix') {
        return sampleSuperpositionPoint(SUPERPOSITION_COMPONENTS, t, 1);
    }
    const baseSpec = kind === 's' ? {
        n: 1,
        l: 0,
        m: 0
    } : kind === 'p' ? {
        n: 2,
        l: 1,
        m: 0
    } : kind === 'd' ? {
        n: 3,
        l: 2,
        m: 0
    } : {
        n: 4,
        l: 3,
        m: 0
    };
    return sampleHydrogenPoint(baseSpec.n, baseSpec.l, baseSpec.m, t, 1);
}
// Colour by phase (sign of ψ) and density
function orbitalColor(psi, prob, l) {
    const alpha = 0.08 + Math.min(0.85, prob * 0.9);
    if (l === 0) {
        // s: blue-violet positive, magenta negative
        return psi >= 0 ? `rgba(160, 100, 255, ${alpha})` : `rgba(255, 80, 200, ${alpha})`;
    } else if (l === 1) {
        // p: cyan positive, amber negative
        return psi >= 0 ? `rgba(60, 200, 255, ${alpha})` : `rgba(255, 160, 40, ${alpha})`;
    } else if (l === 2) {
        // d: lime positive, red-orange negative
        return psi >= 0 ? `rgba(80, 255, 160, ${alpha})` : `rgba(255, 80, 60, ${alpha})`;
    } else {
        // f: gold positive, indigo negative
        return psi >= 0 ? `rgba(255, 220, 60, ${alpha})` : `rgba(100, 60, 255, ${alpha})`;
    }
}
function rotatePoint(x, y, z, yaw, pitch, roll) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cr = Math.cos(roll), sr = Math.sin(roll);
    let px = x * cy - z * sy;
    let pz = x * sy + z * cy;
    let py = y;
    const py2 = py * cp - pz * sp;
    const pz2 = py * sp + pz * cp;
    py = py2;
    pz = pz2;
    const px2 = px * cr - py * sr;
    const py3 = px * sr + py * cr;
    px = px2;
    py = py3;
    return [
        px,
        py,
        pz
    ];
}
function stateAmplitude(components, r, theta, phi, Zeff, t) {
    let sum = 0;
    for (const c of components){
        const phase = c.phase + t * (0.25 + c.n * 0.04);
        sum += c.weight * hydrogenPsi(c.n, c.l, c.m, r, theta, phi, Zeff) * Math.cos(phase);
    }
    return sum;
}
function sampleHydrogenPoint(n, l, m, t, Zeff = 1) {
    const rExpected = n * n / Zeff;
    const maxR = rExpected * 7.5;
    for(let attempt = 0; attempt < 32; attempt++){
        const r = -rExpected * Math.log(Math.max(1e-9, lcg())) * 1.15;
        if (r > maxR || r < 1e-6) continue;
        const theta = Math.acos(1 - 2 * lcg());
        const phi = 2 * Math.PI * lcg();
        const psi = hydrogenPsi(n, l, m, r, theta, phi, Zeff);
        const prob = psi * psi;
        const rPeak = rExpected * 0.72;
        const psiPeak = Math.abs(hydrogenPsi(n, l, m, rPeak, Math.PI / 2, 0, Zeff));
        const probPeak = psiPeak * psiPeak * 2.8;
        if (lcg() < prob / Math.max(probPeak, 1e-30)) {
            const sinTheta = Math.sin(theta);
            const scale = 2.7;
            return {
                x: r * sinTheta * Math.cos(phi) * scale,
                y: r * Math.cos(theta) * scale,
                z: r * sinTheta * Math.sin(phi) * scale,
                psi,
                prob: Math.min(1, prob / Math.max(probPeak, 1e-30)),
                l
            };
        }
    }
    return null;
}
function sampleSuperpositionPoint(components, t, Zeff = 1) {
    const maxN = Math.max(...components.map((c)=>c.n));
    const rExpected = maxN * maxN / Zeff;
    const maxR = rExpected * 7.5;
    for(let attempt = 0; attempt < 40; attempt++){
        const r = -rExpected * Math.log(Math.max(1e-9, lcg())) * 1.1;
        if (r > maxR || r < 1e-6) continue;
        const theta = Math.acos(1 - 2 * lcg());
        const phi = 2 * Math.PI * lcg();
        const psi = stateAmplitude(components, r, theta, phi, Zeff, t);
        const prob = psi * psi;
        const rPeak = rExpected * 0.7;
        const ampPeak = Math.abs(stateAmplitude(components, rPeak, Math.PI / 2, 0, Zeff, t));
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
                l
            };
        }
    }
    return null;
}
function drawQuantumAtlas(ctx, canvas, t) {
    const cols = 4;
    const rows = 4;
    const margin = 14;
    const gap = 8;
    const cellW = (canvas.width - margin * 2 - gap * (cols - 1)) / cols;
    const cellH = (canvas.height - margin * 2 - gap * (rows - 1)) / rows;
    const count = Math.min(HYDROGEN_ATLAS.length, cols * rows);
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const bg = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.28, 10, canvas.width * 0.5, canvas.height * 0.28, Math.max(canvas.width, canvas.height) * 0.7);
    bg.addColorStop(0, 'rgba(60, 20, 90, 0.18)');
    bg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 230, 200, 0.96)';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Hydrogen Wave Function', canvas.width * 0.5, 28);
    ctx.fillStyle = 'rgba(210, 170, 255, 0.78)';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('Real hydrogenic orbitals and a coherent superposition', canvas.width * 0.5, 44);
    for(let idx = 0; idx < count; idx++){
        const spec = HYDROGEN_ATLAS[idx];
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = margin + col * (cellW + gap);
        const y = 56 + row * (cellH + gap);
        const tileW = cellW;
        const tileH = cellH;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, tileW, tileH, 8);
        ctx.fillStyle = 'rgba(10, 8, 18, 0.96)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 200, 120, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, tileW - 2, tileH - 2, 7);
        ctx.clip();
        ctx.globalCompositeOperation = 'lighter';
        const samples = 1000;
        for(let i = 0; i < samples; i++){
            const pt = sampleHydrogenPoint(spec.n, spec.l, spec.m, t, 1);
            if (!pt) continue;
            const rot = rotatePoint(pt.x, pt.y, pt.z, 0.7 + idx * 0.14, 0.82, 0.22);
            const depth = Math.max(0.18, Math.min(1, 0.92 - rot[2] / 36));
            const px = x + tileW * 0.5 + rot[0] * tileW * 0.15;
            const py = y + tileH * 0.53 - rot[1] * tileH * 0.15;
            ctx.fillStyle = orbitalColor(pt.psi, pt.prob * depth, spec.l);
            const s = 0.85 + pt.prob * 1.15;
            ctx.fillRect(px - s * 0.5, py - s * 0.5, s, s);
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
        ctx.fillRect(x, y + tileH - 20, tileW, 20);
        ctx.fillStyle = 'rgba(255, 235, 210, 0.92)';
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(spec.label, x + tileW * 0.5, y + tileH - 6);
        ctx.restore();
    }
    ctx.restore();
}
// ─── Camera ───────────────────────────────────────────────────────────────────
function getBasis(yaw, pitch) {
    const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const fx = -sinY * cosP, fy = sinP, fz = -cosY * cosP;
    let rx = -fz, ry = 0, rz = fx;
    const rl = Math.hypot(rx, ry, rz) || 1;
    rx /= rl;
    ry /= rl;
    rz /= rl;
    const ux = ry * fz - rz * fy;
    const uy = rz * fx - rx * fz;
    const uz = rx * fy - ry * fx;
    return {
        right: [
            rx,
            ry,
            rz
        ],
        up: [
            ux,
            uy,
            uz
        ],
        fwd: [
            fx,
            fy,
            fz
        ]
    };
}
const SCALE = 52; // AU → scene units
const SOLAR_SYSTEM = [
    {
        name: 'Mercury',
        color: '#b8a898',
        size: 3.2,
        a: 0.387 * SCALE,
        e: 0.206,
        inc: 7.0,
        Omega: 48.3,
        omega: 29.1,
        M0: 0,
        mass: 1.7e-7
    },
    {
        name: 'Venus',
        color: '#e8c870',
        size: 5.8,
        a: 0.723 * SCALE,
        e: 0.007,
        inc: 3.4,
        Omega: 76.7,
        omega: 54.9,
        M0: 45,
        mass: 2.4e-6
    },
    {
        name: 'Earth',
        color: '#4a8eff',
        size: 6.0,
        a: 1.000 * SCALE,
        e: 0.017,
        inc: 0.0,
        Omega: 0,
        omega: 102.9,
        M0: 90,
        mass: 3.0e-6,
        moons: [
            {
                name: 'Moon',
                a: 5.2,
                period: 27.3,
                size: 1.8,
                color: '#ccccbb'
            }
        ]
    },
    {
        name: 'Mars',
        color: '#c86040',
        size: 4.5,
        a: 1.524 * SCALE,
        e: 0.093,
        inc: 1.85,
        Omega: 49.6,
        omega: 286.5,
        M0: 135,
        mass: 3.2e-7
    },
    {
        name: 'Jupiter',
        color: '#d4a870',
        size: 14,
        a: 2.1 * SCALE,
        e: 0.049,
        inc: 1.3,
        Omega: 100.5,
        omega: 273.9,
        M0: 200,
        mass: 9.5e-4,
        moons: [
            {
                name: 'Io',
                a: 18,
                period: 1.77,
                size: 2.1,
                color: '#ffe066'
            },
            {
                name: 'Europa',
                a: 28,
                period: 3.55,
                size: 1.8,
                color: '#d0e8ff'
            },
            {
                name: 'Ganymede',
                a: 44,
                period: 7.15,
                size: 2.6,
                color: '#bba888'
            },
            {
                name: 'Callisto',
                a: 62,
                period: 16.69,
                size: 2.4,
                color: '#887766'
            }
        ]
    },
    {
        name: 'Saturn',
        color: '#e8d090',
        size: 12,
        a: 2.8 * SCALE,
        e: 0.056,
        inc: 2.49,
        Omega: 113.7,
        omega: 339.4,
        M0: 260,
        mass: 2.9e-4,
        rings: {
            inner: 1.5,
            outer: 2.6,
            color: 'rgba(220, 200, 150, 0.55)'
        },
        moons: [
            {
                name: 'Titan',
                a: 48,
                period: 15.9,
                size: 2.4,
                color: '#c8a050'
            }
        ]
    },
    {
        name: 'Uranus',
        color: '#80d8e8',
        size: 9,
        a: 3.6 * SCALE,
        e: 0.046,
        inc: 0.77,
        Omega: 74.0,
        omega: 96.5,
        M0: 300,
        mass: 4.4e-5
    },
    {
        name: 'Neptune',
        color: '#4060e8',
        size: 8.5,
        a: 4.3 * SCALE,
        e: 0.010,
        inc: 1.77,
        Omega: 131.8,
        omega: 273.2,
        M0: 320,
        mass: 5.2e-5
    }
];
const SUN_MASS = 1.0; // normalized
const G_CONST = 420; // tuned for visual speed
// Solve Kepler's equation M = E - e*sin(E) via Newton iteration
function solveKepler(M, e) {
    let E = M;
    for(let i = 0; i < 8; i++)E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    return E;
}
// 3D position in orbit at time t (seconds, arbitrary epoch)
function orbitalPosition(p, t) {
    const { a, e, inc, Omega, omega, M0 } = p;
    // Mean motion n = sqrt(GM/a³), scaled
    const n = Math.sqrt(G_CONST * SUN_MASS / (a * a * a));
    const M = M0 * Math.PI / 180 + n * t;
    const E = solveKepler(M, e);
    // Position in orbital plane
    const xOrb = a * (Math.cos(E) - e);
    const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(E);
    // Rotate by argument of periapsis ω, inclination i, longitude of ascending node Ω
    const cosW = Math.cos(omega * Math.PI / 180), sinW = Math.sin(omega * Math.PI / 180);
    const cosI = Math.cos(inc * Math.PI / 180), sinI = Math.sin(inc * Math.PI / 180);
    const cosO = Math.cos(Omega * Math.PI / 180), sinO = Math.sin(Omega * Math.PI / 180);
    // Standard orbital mechanics rotation
    const x = (cosO * cosW - sinO * sinW * cosI) * xOrb + (-cosO * sinW - sinO * cosW * cosI) * yOrb;
    const y = sinI * sinW * xOrb + sinI * cosW * yOrb;
    const z = (sinO * cosW + cosO * sinW * cosI) * xOrb + (-sinO * sinW + cosO * cosW * cosI) * yOrb;
    return [
        x,
        y,
        z
    ];
}
function BlackHoleSimulation() {
    _s();
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('blackhole');
    const [atomZ, setAtomZ] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(6);
    const [orbitalType, setOrbitalType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('atlas');
    const [showLabels, setShowLabels] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const sim2DRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const S = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        yaw: 0.0,
        pitch: 0.0,
        camDist: 28,
        targetYaw: 0.0,
        targetPitch: 0.0,
        camPos: [
            0,
            0,
            28
        ],
        moveSpeed: 0.5,
        keys: {},
        spin: 0.9,
        diskTilt: 20,
        diskBright: 1.0,
        mass: 1.5,
        pointerDown: false,
        mouseInside: false,
        lastX: 0,
        lastY: 0,
        rays: [],
        raysPerClick: 3
    });
    const moveForwardBy = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BlackHoleSimulation.useCallback[moveForwardBy]": (delta)=>{
            const s = S.current;
            const { fwd } = getBasis(s.yaw, s.pitch);
            s.camPos = [
                s.camPos[0] + fwd[0] * delta,
                s.camPos[1] + fwd[1] * delta,
                s.camPos[2] + fwd[2] * delta
            ];
        }
    }["BlackHoleSimulation.useCallback[moveForwardBy]"], []);
    const setDistance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BlackHoleSimulation.useCallback[setDistance]": (d)=>{
            const s = S.current;
            const nd = Math.max(2, Math.min(200, d));
            moveForwardBy(nd - s.camDist);
            s.camDist = nd;
        }
    }["BlackHoleSimulation.useCallback[setDistance]"], [
        moveForwardBy
    ]);
    // ── Black hole WebGL ────────────────────────────────────────────────────────
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BlackHoleSimulation.useEffect": ()=>{
            var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
            if (mode !== 'blackhole') return;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const gl = canvas.getContext('webgl', {
                antialias: false,
                alpha: false,
                depth: false
            });
            if (!gl) {
                alert('WebGL not supported');
                return;
            }
            const resize = {
                "BlackHoleSimulation.useEffect.resize": ()=>{
                    const r = canvas.getBoundingClientRect();
                    canvas.width = Math.round(r.width * Math.min(devicePixelRatio, 2));
                    canvas.height = Math.round(r.height * Math.min(devicePixelRatio, 2));
                    gl.viewport(0, 0, canvas.width, canvas.height);
                }
            }["BlackHoleSimulation.useEffect.resize"];
            resize();
            const ro = new ResizeObserver(resize);
            ro.observe(canvas);
            let sceneProg, rayProg;
            try {
                sceneProg = mkProg(gl, QUAD_VS, SCENE_FS);
                rayProg = mkProg(gl, RAY_VS, RAY_FS);
            } catch (e) {
                console.error(e);
                return;
            }
            const quadBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1,
                -1,
                1,
                -1,
                -1,
                1,
                1,
                1
            ]), gl.STATIC_DRAW);
            const rayBuf = gl.createBuffer();
            const getCam = {
                "BlackHoleSimulation.useEffect.getCam": ()=>{
                    const { camPos } = S.current;
                    const { right, up, fwd } = getBasis(S.current.yaw, S.current.pitch);
                    return {
                        pos: new Float32Array(camPos),
                        rot: new Float32Array([
                            ...right,
                            ...up,
                            ...fwd
                        ])
                    };
                }
            }["BlackHoleSimulation.useEffect.getCam"];
            const projectPoint = {
                "BlackHoleSimulation.useEffect.projectPoint": (x, y, z)=>{
                    const s = S.current;
                    const { right, up, fwd } = getBasis(s.yaw, s.pitch);
                    const vx = x - s.camPos[0], vy = y - s.camPos[1], vz = z - s.camPos[2];
                    const px = vx * right[0] + vy * right[1] + vz * right[2];
                    const py = vx * up[0] + vy * up[1] + vz * up[2];
                    const pz = vx * fwd[0] + vy * fwd[1] + vz * fwd[2];
                    if (pz <= 0.1) return null;
                    const sc = canvas.height * 0.62;
                    return [
                        px / pz * sc + canvas.width * 0.5,
                        -py / pz * sc + canvas.height * 0.5
                    ];
                }
            }["BlackHoleSimulation.useEffect.projectPoint"];
            const stepRays = {
                "BlackHoleSimulation.useEffect.stepRays": ()=>{
                    const s = S.current;
                    const rs = s.mass * 1.5, MASS3D = s.mass * 4.2, SPD = 5.2;
                    for (const r of s.rays){
                        if (r.life <= 0) continue;
                        const d2 = r.x * r.x + r.y * r.y + r.z * r.z;
                        const d = Math.sqrt(d2);
                        if (d < rs * 0.7) {
                            r.life = 0;
                            continue;
                        }
                        if (r.age > 0.15) {
                            const f = MASS3D / Math.max(d2 * d, 0.2);
                            r.vx += -r.x * f;
                            r.vy += -r.y * f;
                            r.vz += -r.z * f;
                            if (s.spin > 0) {
                                const fd = s.spin * rs * rs / Math.max(d2, 0.3);
                                const nvx = r.vx - r.vz * fd;
                                const nvz = r.vz + r.vx * fd;
                                r.vx = nvx;
                                r.vz = nvz;
                            }
                        }
                        const mag = Math.hypot(r.vx, r.vy, r.vz);
                        if (mag > 0) {
                            r.vx = r.vx / mag * SPD;
                            r.vy = r.vy / mag * SPD;
                            r.vz = r.vz / mag * SPD;
                        }
                        r.x += r.vx;
                        r.y += r.vy;
                        r.z += r.vz;
                        r.life -= 0.0045;
                        r.age += 0.016;
                        r.trail.push({
                            x: r.x,
                            y: r.y,
                            z: r.z
                        });
                        if (r.trail.length > 120) r.trail.shift();
                    }
                    s.rays = s.rays.filter({
                        "BlackHoleSimulation.useEffect.stepRays": (r)=>r.life > 0 && Math.max(Math.abs(r.x), Math.abs(r.y), Math.abs(r.z)) < 700
                    }["BlackHoleSimulation.useEffect.stepRays"]);
                }
            }["BlackHoleSimulation.useEffect.stepRays"];
            const drawRays = {
                "BlackHoleSimulation.useEffect.drawRays": ()=>{
                    _s();
                    const { rays } = S.current;
                    const data = [];
                    for (const ray of rays){
                        const tl = ray.trail.length;
                        if (tl < 2) continue;
                        for(let i = 1; i < tl; i++){
                            const alpha = i / tl * Math.max(ray.life, 0) * 0.9;
                            const p0 = projectPoint(ray.trail[i - 1].x, ray.trail[i - 1].y, ray.trail[i - 1].z);
                            const p1 = projectPoint(ray.trail[i].x, ray.trail[i].y, ray.trail[i].z);
                            if (!p0 || !p1) continue;
                            data.push(p0[0], p0[1], alpha * 0.5, ...ray.color, p1[0], p1[1], alpha, ...ray.color);
                        }
                    }
                    // Always show the geodesic beam toward BH
                    {
                        const s = S.current;
                        const rs = s.mass * 1.5;
                        const SPD = 5.2;
                        let px = s.camPos[0], py = s.camPos[1], pz = s.camPos[2];
                        const dm = Math.hypot(-px, -py, -pz) || 1;
                        let vx = -px / dm * SPD, vy = -py / dm * SPD, vz = -pz / dm * SPD;
                        for(let i = 0; i < 120; i++){
                            const r2 = px * px + py * py + pz * pz, r = Math.sqrt(r2) || 1;
                            if (r < rs * 0.7) break;
                            const f = s.mass * 4.2 / Math.max(r2 * r, 0.2);
                            vx += -px * f;
                            vy += -py * f;
                            vz += -pz * f;
                            if (s.spin > 0) {
                                const fd = s.spin * rs * rs / Math.max(r2, 0.3);
                                const nvx = vx - vz * fd;
                                const nvz = vz + vx * fd;
                                vx = nvx;
                                vz = nvz;
                            }
                            const vm = Math.hypot(vx, vy, vz) || 1;
                            vx = vx / vm * SPD;
                            vy = vy / vm * SPD;
                            vz = vz / vm * SPD;
                            const pp0 = projectPoint(px, py, pz);
                            px += vx;
                            py += vy;
                            pz += vz;
                            const pp1 = projectPoint(px, py, pz);
                            if (!pp0 || !pp1) continue;
                            data.push(pp0[0], pp0[1], 0.39, 1, 0.95, 0.7, pp1[0], pp1[1], 0.65, 1, 0.95, 0.7);
                        }
                    }
                    if (data.length === 0) return;
                    const arr = new Float32Array(data);
                    gl.useProgram(rayProg);
                    gl.enable(gl.BLEND);
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                    gl.bindBuffer(gl.ARRAY_BUFFER, rayBuf);
                    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
                    const F = 4, SB = STRIDE * F;
                    const aPos = gl.getAttribLocation(rayProg, 'aPos');
                    gl.enableVertexAttribArray(aPos);
                    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, SB, 0);
                    const aA = gl.getAttribLocation(rayProg, 'aAlpha');
                    gl.enableVertexAttribArray(aA);
                    gl.vertexAttribPointer(aA, 1, gl.FLOAT, false, SB, 2 * F);
                    const aC = gl.getAttribLocation(rayProg, 'aColor');
                    gl.enableVertexAttribArray(aC);
                    gl.vertexAttribPointer(aC, 3, gl.FLOAT, false, SB, 3 * F);
                    gl.uniform2fv(ul(gl, rayProg, 'uRes'), [
                        canvas.width,
                        canvas.height
                    ]);
                    gl.drawArrays(gl.LINES, 0, arr.length / STRIDE);
                    gl.disable(gl.BLEND);
                }
            }["BlackHoleSimulation.useEffect.drawRays"];
            _s(drawRays, "ZdQBZ3rq7bWAAMQq6hlVCmYF0jM=", false, {
                "BlackHoleSimulation.useEffect": function() {
                    return [
                        gl.useProgram
                    ];
                }
            }["BlackHoleSimulation.useEffect"]);
            let raf = 0, t = 0;
            const frame = {
                "BlackHoleSimulation.useEffect.frame": ()=>{
                    _s1();
                    raf = requestAnimationFrame(frame);
                    t += 0.016;
                    const s = S.current;
                    const keys = s.keys;
                    let mx = 0, my = 0, mz = 0;
                    if (keys['KeyW']) mz -= 1;
                    if (keys['KeyS']) mz += 1;
                    if (keys['KeyA']) mx -= 1;
                    if (keys['KeyD']) mx += 1;
                    if (keys['KeyE'] || keys['Space']) my += 1;
                    if (keys['KeyQ']) my -= 1;
                    if (mx || my || mz) {
                        const { right, up, fwd } = getBasis(s.yaw, s.pitch);
                        const boost = keys['ShiftLeft'] || keys['ShiftRight'] ? 3 : 1;
                        const spd = s.moveSpeed * boost * 2.5;
                        s.camPos = [
                            s.camPos[0] + (right[0] * mx + up[0] * my + fwd[0] * mz) * spd,
                            s.camPos[1] + (right[1] * mx + up[1] * my + fwd[1] * mz) * spd,
                            s.camPos[2] + (right[2] * mx + up[2] * my + fwd[2] * mz) * spd
                        ];
                    }
                    s.yaw += (s.targetYaw - s.yaw) * 0.16;
                    s.pitch += (s.targetPitch - s.pitch) * 0.16;
                    gl.disable(gl.BLEND);
                    gl.useProgram(sceneProg);
                    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
                    const aQ = gl.getAttribLocation(sceneProg, 'aPos');
                    gl.enableVertexAttribArray(aQ);
                    gl.vertexAttribPointer(aQ, 2, gl.FLOAT, false, 0, 0);
                    const { pos, rot } = getCam();
                    gl.uniform2fv(ul(gl, sceneProg, 'uRes'), [
                        canvas.width,
                        canvas.height
                    ]);
                    gl.uniform1f(ul(gl, sceneProg, 'uTime'), t);
                    gl.uniform3fv(ul(gl, sceneProg, 'uCamPos'), pos);
                    gl.uniformMatrix3fv(ul(gl, sceneProg, 'uCamRot'), false, rot);
                    gl.uniform1f(ul(gl, sceneProg, 'uSpin'), s.spin);
                    gl.uniform1f(ul(gl, sceneProg, 'uDiskTilt'), s.diskTilt * Math.PI / 180);
                    gl.uniform1f(ul(gl, sceneProg, 'uDiskBright'), s.diskBright);
                    gl.uniform1f(ul(gl, sceneProg, 'uMass'), s.mass);
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                    stepRays();
                    drawRays();
                }
            }["BlackHoleSimulation.useEffect.frame"];
            _s1(frame, "ZdQBZ3rq7bWAAMQq6hlVCmYF0jM=", false, {
                "BlackHoleSimulation.useEffect": function() {
                    return [
                        gl.useProgram
                    ];
                }
            }["BlackHoleSimulation.useEffect"]);
            frame();
            // Events
            const onDown = {
                "BlackHoleSimulation.useEffect.onDown": (e)=>{
                    S.current.pointerDown = true;
                    S.current.lastX = e.clientX;
                    S.current.lastY = e.clientY;
                    canvas.setPointerCapture(e.pointerId);
                    canvas.style.cursor = 'grabbing';
                }
            }["BlackHoleSimulation.useEffect.onDown"];
            const onMove = {
                "BlackHoleSimulation.useEffect.onMove": (e)=>{
                    if (!S.current.pointerDown) return;
                    S.current.targetYaw += (e.clientX - S.current.lastX) * 0.005;
                    S.current.targetPitch = Math.max(-1.45, Math.min(1.45, S.current.targetPitch - (e.clientY - S.current.lastY) * 0.005));
                    S.current.lastX = e.clientX;
                    S.current.lastY = e.clientY;
                }
            }["BlackHoleSimulation.useEffect.onMove"];
            const onEnter = {
                "BlackHoleSimulation.useEffect.onEnter": (e)=>{
                    S.current.mouseInside = true;
                    S.current.lastX = e.clientX;
                    S.current.lastY = e.clientY;
                    canvas.style.cursor = 'grab';
                }
            }["BlackHoleSimulation.useEffect.onEnter"];
            const onLeave = {
                "BlackHoleSimulation.useEffect.onLeave": ()=>{
                    S.current.mouseInside = false;
                    S.current.pointerDown = false;
                    canvas.style.cursor = 'default';
                }
            }["BlackHoleSimulation.useEffect.onLeave"];
            const onUp = {
                "BlackHoleSimulation.useEffect.onUp": ()=>{
                    S.current.pointerDown = false;
                    canvas.style.cursor = 'grab';
                }
            }["BlackHoleSimulation.useEffect.onUp"];
            let lastPinch = 0;
            const onTouchStart = {
                "BlackHoleSimulation.useEffect.onTouchStart": (e)=>{
                    if (e.touches.length === 2) lastPinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                }
            }["BlackHoleSimulation.useEffect.onTouchStart"];
            const onTouchMove = {
                "BlackHoleSimulation.useEffect.onTouchMove": (e)=>{
                    e.preventDefault();
                    if (e.touches.length === 2) {
                        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                        setDistance(S.current.camDist * (lastPinch / d));
                        lastPinch = d;
                    }
                }
            }["BlackHoleSimulation.useEffect.onTouchMove"];
            const onWheel = {
                "BlackHoleSimulation.useEffect.onWheel": (e)=>{
                    e.preventDefault();
                    setDistance(S.current.camDist + e.deltaY * 0.04);
                }
            }["BlackHoleSimulation.useEffect.onWheel"];
            const RAY_COLS = [
                [
                    1,
                    .9,
                    .3
                ],
                [
                    .9,
                    .4,
                    1
                ],
                [
                    .3,
                    .9,
                    1
                ],
                [
                    1,
                    .5,
                    .1
                ],
                [
                    .4,
                    1,
                    .5
                ],
                [
                    1,
                    .4,
                    .4
                ]
            ];
            const screenRayDir = {
                "BlackHoleSimulation.useEffect.screenRayDir": (sx, sy)=>{
                    const u = sx / canvas.width * 2 - 1, v = -(sy / canvas.height * 2 - 1), aspect = canvas.width / canvas.height;
                    const { right, up, fwd } = getBasis(S.current.yaw, S.current.pitch);
                    const wx = right[0] * u * aspect + up[0] * v + fwd[0] * -1.75;
                    const wy = right[1] * u * aspect + up[1] * v + fwd[1] * -1.75;
                    const wz = right[2] * u * aspect + up[2] * v + fwd[2] * -1.75;
                    const m = Math.hypot(wx, wy, wz) || 1;
                    return [
                        wx / m,
                        wy / m,
                        wz / m
                    ];
                }
            }["BlackHoleSimulation.useEffect.screenRayDir"];
            const spawnRays = {
                "BlackHoleSimulation.useEffect.spawnRays": (dir)=>{
                    const n = S.current.raysPerClick, spread = n > 1 ? 0.13 : 0, spd = 5.2;
                    const { right, up } = getBasis(S.current.yaw, S.current.pitch);
                    for(let i = 0; i < n; i++){
                        const j = (i - (n - 1) / 2) * spread;
                        const jx = dir[0] + right[0] * j + up[0] * j * 0.3;
                        const jy = dir[1] + right[1] * j + up[1] * j * 0.3;
                        const jz = dir[2] + right[2] * j + up[2] * j * 0.3;
                        const jm = Math.hypot(jx, jy, jz) || 1;
                        S.current.rays.push({
                            x: S.current.camPos[0],
                            y: S.current.camPos[1],
                            z: S.current.camPos[2],
                            vx: jx / jm * spd,
                            vy: jy / jm * spd,
                            vz: jz / jm * spd,
                            life: 1,
                            age: 0,
                            trail: [
                                {
                                    x: S.current.camPos[0],
                                    y: S.current.camPos[1],
                                    z: S.current.camPos[2]
                                }
                            ],
                            color: RAY_COLS[i % RAY_COLS.length]
                        });
                    }
                }
            }["BlackHoleSimulation.useEffect.spawnRays"];
            const onClick = {
                "BlackHoleSimulation.useEffect.onClick": (e)=>{
                    if (Math.abs(e.movementX) + Math.abs(e.movementY) > 4) return;
                    const rect = canvas.getBoundingClientRect();
                    spawnRays(screenRayDir((e.clientX - rect.left) * canvas.width / rect.width, (e.clientY - rect.top) * canvas.height / rect.height));
                }
            }["BlackHoleSimulation.useEffect.onClick"];
            const fireAtBH = {
                "BlackHoleSimulation.useEffect.fireAtBH": ()=>{
                    const s = S.current;
                    const bm = Math.hypot(-s.camPos[0], -s.camPos[1], -s.camPos[2]) || 1;
                    spawnRays([
                        -s.camPos[0] / bm,
                        -s.camPos[1] / bm,
                        -s.camPos[2] / bm
                    ]);
                }
            }["BlackHoleSimulation.useEffect.fireAtBH"];
            const onKey = {
                "BlackHoleSimulation.useEffect.onKey": (e)=>{
                    const tracked = [
                        'KeyW',
                        'KeyA',
                        'KeyS',
                        'KeyD',
                        'KeyQ',
                        'KeyE',
                        'Space',
                        'ShiftLeft',
                        'ShiftRight'
                    ];
                    if (tracked.includes(e.code)) {
                        S.current.keys[e.code] = e.type === 'keydown';
                        e.preventDefault();
                    }
                    if (e.code === 'KeyF' && e.type === 'keydown') {
                        fireAtBH();
                        e.preventDefault();
                    }
                }
            }["BlackHoleSimulation.useEffect.onKey"];
            canvas.addEventListener('pointerdown', onDown);
            canvas.addEventListener('pointerenter', onEnter);
            canvas.addEventListener('pointerleave', onLeave);
            canvas.addEventListener('pointermove', onMove);
            canvas.addEventListener('pointerup', onUp);
            canvas.addEventListener('touchstart', onTouchStart, {
                passive: true
            });
            canvas.addEventListener('touchmove', onTouchMove, {
                passive: false
            });
            canvas.addEventListener('wheel', onWheel, {
                passive: false
            });
            canvas.addEventListener('click', onClick);
            window.addEventListener('keydown', onKey);
            window.addEventListener('keyup', onKey);
            return ({
                "BlackHoleSimulation.useEffect": ()=>{
                    cancelAnimationFrame(raf);
                    ro.disconnect();
                    gl.deleteProgram(sceneProg);
                    gl.deleteProgram(rayProg);
                    gl.deleteBuffer(quadBuf);
                    gl.deleteBuffer(rayBuf);
                    canvas.removeEventListener('pointerdown', onDown);
                    canvas.removeEventListener('pointerenter', onEnter);
                    canvas.removeEventListener('pointerleave', onLeave);
                    canvas.removeEventListener('pointermove', onMove);
                    canvas.removeEventListener('pointerup', onUp);
                    canvas.removeEventListener('touchstart', onTouchStart);
                    canvas.removeEventListener('touchmove', onTouchMove);
                    canvas.removeEventListener('wheel', onWheel);
                    canvas.removeEventListener('click', onClick);
                    window.removeEventListener('keydown', onKey);
                    window.removeEventListener('keyup', onKey);
                }
            })["BlackHoleSimulation.useEffect"];
        }
    }["BlackHoleSimulation.useEffect"], [
        mode,
        setDistance
    ]);
    // ── 2D canvas: gravity + quantum ────────────────────────────────────────────
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BlackHoleSimulation.useEffect": ()=>{
            if (mode === 'blackhole') return;
            const canvas = sim2DRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const resize = {
                "BlackHoleSimulation.useEffect.resize": ()=>{
                    const r = canvas.getBoundingClientRect();
                    canvas.width = Math.round(r.width * Math.min(devicePixelRatio, 2));
                    canvas.height = Math.round(r.height * Math.min(devicePixelRatio, 2));
                }
            }["BlackHoleSimulation.useEffect.resize"];
            resize();
            const ro = new ResizeObserver(resize);
            ro.observe(canvas);
            if (mode === 'gravity') {
                S.current.camPos = [
                    0,
                    80,
                    380
                ];
                S.current.yaw = 0;
                S.current.pitch = -0.22;
                S.current.targetYaw = 0;
                S.current.targetPitch = -0.22;
            }
            if (mode === 'quantum') {
                S.current.camPos = [
                    0,
                    0,
                    72
                ];
                S.current.yaw = 0.2;
                S.current.pitch = -0.1;
                S.current.targetYaw = 0.2;
                S.current.targetPitch = -0.1;
            }
            const project3D = {
                "BlackHoleSimulation.useEffect.project3D": (x, y, z)=>{
                    const s = S.current;
                    const { right, up, fwd } = getBasis(s.yaw, s.pitch);
                    const vx = x - s.camPos[0], vy = y - s.camPos[1], vz = z - s.camPos[2];
                    const px = vx * right[0] + vy * right[1] + vz * right[2];
                    const py = vx * up[0] + vy * up[1] + vz * up[2];
                    const pz = vx * fwd[0] + vy * fwd[1] + vz * fwd[2];
                    if (pz <= 0.1) return null;
                    const sc = canvas.height * 0.7;
                    return [
                        px / pz * sc + canvas.width * 0.5,
                        -py / pz * sc + canvas.height * 0.5,
                        pz
                    ];
                }
            }["BlackHoleSimulation.useEffect.project3D"];
            // Shared input
            const onDown = {
                "BlackHoleSimulation.useEffect.onDown": (e)=>{
                    S.current.pointerDown = true;
                    S.current.lastX = e.clientX;
                    S.current.lastY = e.clientY;
                    canvas.setPointerCapture(e.pointerId);
                    canvas.style.cursor = 'grabbing';
                }
            }["BlackHoleSimulation.useEffect.onDown"];
            const onMove = {
                "BlackHoleSimulation.useEffect.onMove": (e)=>{
                    S.current.targetYaw += (e.clientX - S.current.lastX) * 0.005;
                    S.current.targetPitch = Math.max(-1.45, Math.min(1.45, S.current.targetPitch - (e.clientY - S.current.lastY) * 0.005));
                    S.current.lastX = e.clientX;
                    S.current.lastY = e.clientY;
                }
            }["BlackHoleSimulation.useEffect.onMove"];
            const onEnter = {
                "BlackHoleSimulation.useEffect.onEnter": (e)=>{
                    S.current.mouseInside = true;
                    S.current.lastX = e.clientX;
                    S.current.lastY = e.clientY;
                    canvas.style.cursor = 'grab';
                }
            }["BlackHoleSimulation.useEffect.onEnter"];
            const onLeave = {
                "BlackHoleSimulation.useEffect.onLeave": ()=>{
                    S.current.mouseInside = false;
                    S.current.pointerDown = false;
                    canvas.style.cursor = 'default';
                }
            }["BlackHoleSimulation.useEffect.onLeave"];
            const onUp = {
                "BlackHoleSimulation.useEffect.onUp": ()=>{
                    S.current.pointerDown = false;
                    canvas.style.cursor = 'grab';
                }
            }["BlackHoleSimulation.useEffect.onUp"];
            const onWheel = {
                "BlackHoleSimulation.useEffect.onWheel": (e)=>{
                    e.preventDefault();
                    const s = S.current;
                    const { fwd } = getBasis(s.yaw, s.pitch);
                    s.camPos = [
                        s.camPos[0] + fwd[0] * e.deltaY * 0.6,
                        s.camPos[1] + fwd[1] * e.deltaY * 0.6,
                        s.camPos[2] + fwd[2] * e.deltaY * 0.6
                    ];
                }
            }["BlackHoleSimulation.useEffect.onWheel"];
            const onKey = {
                "BlackHoleSimulation.useEffect.onKey": (e)=>{
                    const tracked = [
                        'KeyW',
                        'KeyA',
                        'KeyS',
                        'KeyD',
                        'KeyQ',
                        'KeyE',
                        'Space',
                        'ShiftLeft',
                        'ShiftRight'
                    ];
                    if (tracked.includes(e.code)) {
                        S.current.keys[e.code] = e.type === 'keydown';
                        e.preventDefault();
                    }
                }
            }["BlackHoleSimulation.useEffect.onKey"];
            canvas.addEventListener('pointerdown', onDown);
            canvas.addEventListener('pointerenter', onEnter);
            canvas.addEventListener('pointerleave', onLeave);
            canvas.addEventListener('pointermove', onMove);
            canvas.addEventListener('pointerup', onUp);
            canvas.addEventListener('wheel', onWheel, {
                passive: false
            });
            window.addEventListener('keydown', onKey);
            window.addEventListener('keyup', onKey);
            // ── Starfield (shared) ──
            let seed2 = 0xdeadbeef;
            const rng2 = {
                "BlackHoleSimulation.useEffect.rng2": ()=>{
                    seed2 = seed2 * 1664525 + 1013904223 >>> 0;
                    return (seed2 >>> 0) / 0x100000000;
                }
            }["BlackHoleSimulation.useEffect.rng2"];
            const starfield = Array.from({
                length: 220
            }, {
                "BlackHoleSimulation.useEffect.starfield": ()=>{
                    const theta = Math.acos(1 - 2 * rng2()), phi = 2 * Math.PI * rng2();
                    const r = 2800 + rng2() * 3200;
                    return {
                        x: Math.sin(theta) * Math.cos(phi) * r,
                        y: Math.cos(theta) * r * 0.8,
                        z: Math.sin(theta) * Math.sin(phi) * r,
                        size: 0.5 + rng2() * 1.4,
                        alpha: 0.15 + rng2() * 0.55
                    };
                }
            }["BlackHoleSimulation.useEffect.starfield"]);
            const planetState = SOLAR_SYSTEM.map({
                "BlackHoleSimulation.useEffect.planetState": (p, i)=>{
                    const pos = orbitalPosition(p, 0);
                    // Velocity: approximate circular orbit tangent
                    const dt = 0.1;
                    const pos2 = orbitalPosition(p, dt);
                    const vel = [
                        (pos2[0] - pos[0]) / dt,
                        (pos2[1] - pos[1]) / dt,
                        (pos2[2] - pos[2]) / dt
                    ];
                    return {
                        pos,
                        vel,
                        trail: []
                    };
                }
            }["BlackHoleSimulation.useEffect.planetState"]);
            let raf = 0, t = 0;
            const frame = {
                "BlackHoleSimulation.useEffect.frame": ()=>{
                    raf = requestAnimationFrame(frame);
                    t += 0.016;
                    // Camera movement
                    const s = S.current;
                    s.yaw += (s.targetYaw - s.yaw) * 0.16;
                    s.pitch += (s.targetPitch - s.pitch) * 0.16;
                    const keys = s.keys;
                    let mx = 0, my = 0, mz = 0;
                    if (keys['KeyW']) mz -= 1;
                    if (keys['KeyS']) mz += 1;
                    if (keys['KeyA']) mx -= 1;
                    if (keys['KeyD']) mx += 1;
                    if (keys['KeyE'] || keys['Space']) my += 1;
                    if (keys['KeyQ']) my -= 1;
                    if (mx || my || mz) {
                        const { right, up, fwd } = getBasis(s.yaw, s.pitch);
                        const boost = keys['ShiftLeft'] || keys['ShiftRight'] ? 3 : 1;
                        const spd = s.moveSpeed * boost * (mode === 'gravity' ? 12 : 4);
                        s.camPos = [
                            s.camPos[0] + (right[0] * mx + up[0] * my + fwd[0] * mz) * spd,
                            s.camPos[1] + (right[1] * mx + up[1] * my + fwd[1] * mz) * spd,
                            s.camPos[2] + (right[2] * mx + up[2] * my + fwd[2] * mz) * spd
                        ];
                    }
                    // Background
                    ctx.fillStyle = '#030408';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    // Stars
                    for (const star of starfield){
                        const pr = project3D(star.x, star.y, star.z);
                        if (!pr) continue;
                        const tw = 0.7 + 0.3 * Math.sin(t * 0.8 + star.x * 0.002);
                        ctx.fillStyle = `rgba(230,225,255,${star.alpha * tw})`;
                        ctx.beginPath();
                        ctx.arc(pr[0], pr[1], star.size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    if (mode === 'gravity') {
                        // ── Spacetime grid ──
                        // Update planet positions via Kepler (faster, more accurate than n-body for solar)
                        for(let i = 0; i < SOLAR_SYSTEM.length; i++){
                            const pos = orbitalPosition(SOLAR_SYSTEM[i], t * 8);
                            planetState[i].pos = pos;
                            if (i > 0) {
                                planetState[i].trail.push({
                                    x: pos[0],
                                    y: pos[1],
                                    z: pos[2]
                                });
                                if (planetState[i].trail.length > 320) planetState[i].trail.shift();
                            }
                        }
                        // Gravity warp: depressed y based on Sun's potential (planets too small to matter visually)
                        const warpY = {
                            "BlackHoleSimulation.useEffect.frame.warpY": (x, z)=>{
                                const r = Math.sqrt(x * x + z * z);
                                return -200 / (1 + r / 60);
                            }
                        }["BlackHoleSimulation.useEffect.frame.warpY"];
                        ctx.save();
                        const gridN = 18, gridSize = 520;
                        for(let i = -gridN; i <= gridN; i++){
                            const xLine = i / gridN * gridSize;
                            // Radial lines from -gridSize to +gridSize
                            const steps = 48;
                            for(let pass = 0; pass < 2; pass++){
                                for(let si = 1; si <= steps; si++){
                                    const t0 = (si - 1) / steps * 2 - 1, t1 = si / steps * 2 - 1;
                                    let xa, za, xb, zb;
                                    if (pass === 0) {
                                        xa = xLine;
                                        za = t0 * gridSize;
                                        xb = xLine;
                                        zb = t1 * gridSize;
                                    } else {
                                        xa = t0 * gridSize;
                                        za = xLine;
                                        xb = t1 * gridSize;
                                        zb = xLine;
                                    }
                                    const ya = warpY(xa, za), yb = warpY(xb, zb);
                                    const pa = project3D(xa, ya, za), pb = project3D(xb, yb, zb);
                                    if (!pa || !pb) continue;
                                    const warp = Math.abs(ya) / 200;
                                    const r = Math.round(12 + warp * 100), g = Math.round(14 + warp * 30), b2 = Math.round(22 + warp * 15);
                                    ctx.strokeStyle = `rgb(${r},${g},${b2})`;
                                    ctx.lineWidth = 0.7;
                                    ctx.beginPath();
                                    ctx.moveTo(pa[0], pa[1]);
                                    ctx.lineTo(pb[0], pb[1]);
                                    ctx.stroke();
                                }
                            }
                        }
                        ctx.restore();
                        // ── Orbit trails ──
                        for(let i = 0; i < SOLAR_SYSTEM.length; i++){
                            const st = planetState[i];
                            if (st.trail.length < 2) continue;
                            for(let ti = 1; ti < st.trail.length; ti++){
                                const pr0 = project3D(st.trail[ti - 1].x, st.trail[ti - 1].y, st.trail[ti - 1].z);
                                const pr1 = project3D(st.trail[ti].x, st.trail[ti].y, st.trail[ti].z);
                                if (!pr0 || !pr1) continue;
                                const alpha = ti / st.trail.length * 0.35;
                                ctx.beginPath();
                                ctx.moveTo(pr0[0], pr0[1]);
                                ctx.lineTo(pr1[0], pr1[1]);
                                ctx.strokeStyle = SOLAR_SYSTEM[i].color + Math.round(alpha * 255).toString(16).padStart(2, '0');
                                ctx.lineWidth = 1;
                                ctx.stroke();
                            }
                        }
                        const drawList = [];
                        for(let i = 0; i < SOLAR_SYSTEM.length; i++){
                            const pos = planetState[i].pos;
                            const pr = project3D(pos[0], pos[1], pos[2]);
                            if (pr) drawList.push({
                                p: SOLAR_SYSTEM[i],
                                st: planetState[i],
                                pr
                            });
                        }
                        drawList.sort({
                            "BlackHoleSimulation.useEffect.frame": (a, b)=>b.pr[2] - a.pr[2]
                        }["BlackHoleSimulation.useEffect.frame"]);
                        // Sun glow first (always at origin)
                        const sunPr = project3D(0, 0, 0);
                        if (sunPr) {
                            for(let g = 3; g >= 0; g--){
                                const glow = ctx.createRadialGradient(sunPr[0], sunPr[1], 0, sunPr[0], sunPr[1], 60 * (g + 1));
                                glow.addColorStop(0, `rgba(255,230,160,${0.12 - g * 0.025})`);
                                glow.addColorStop(1, 'rgba(255,140,30,0)');
                                ctx.fillStyle = glow;
                                ctx.beginPath();
                                ctx.arc(sunPr[0], sunPr[1], 60 * (g + 1), 0, Math.PI * 2);
                                ctx.fill();
                            }
                            const sunGrad = ctx.createRadialGradient(sunPr[0] - 5, sunPr[1] - 5, 0, sunPr[0], sunPr[1], 22);
                            sunGrad.addColorStop(0, '#fff8e8');
                            sunGrad.addColorStop(0.4, '#ffcc44');
                            sunGrad.addColorStop(1, '#ff8800');
                            ctx.fillStyle = sunGrad;
                            ctx.beginPath();
                            ctx.arc(sunPr[0], sunPr[1], 22, 0, Math.PI * 2);
                            ctx.fill();
                            if (showLabels) {
                                ctx.fillStyle = 'rgba(255,200,100,0.9)';
                                ctx.font = 'bold 11px "Courier New",monospace';
                                ctx.textAlign = 'center';
                                ctx.fillText('Sun', sunPr[0], sunPr[1] - 28);
                            }
                        }
                        for (const item of drawList){
                            const { p, pr } = item;
                            const sz = Math.max(2, p.size * (800 / pr[2]));
                            // Rings (behind planet)
                            if (p.rings && pr) {
                                ctx.save();
                                ctx.translate(pr[0], pr[1]);
                                ctx.rotate(-0.35);
                                ctx.strokeStyle = p.rings.color;
                                ctx.lineWidth = Math.max(1.5, sz * 0.18);
                                ctx.beginPath();
                                ctx.ellipse(0, 0, sz * p.rings.outer, sz * p.rings.outer * 0.35, 0, 0, Math.PI * 2);
                                ctx.stroke();
                                ctx.strokeStyle = p.rings.color.replace('0.55', '0.28');
                                ctx.lineWidth = Math.max(1, sz * 0.10);
                                ctx.beginPath();
                                ctx.ellipse(0, 0, sz * p.rings.inner, sz * p.rings.inner * 0.35, 0, 0, Math.PI * 2);
                                ctx.stroke();
                                ctx.restore();
                            }
                            // Planet body
                            const pg = ctx.createRadialGradient(pr[0] - sz * 0.25, pr[1] - sz * 0.25, 0, pr[0], pr[1], sz);
                            pg.addColorStop(0, lightenColor(p.color, 1.4));
                            pg.addColorStop(0.6, p.color);
                            pg.addColorStop(1, '#0a0a10');
                            ctx.fillStyle = pg;
                            ctx.beginPath();
                            ctx.arc(pr[0], pr[1], sz, 0, Math.PI * 2);
                            ctx.fill();
                            // Earth atmosphere
                            if (p.name === 'Earth') {
                                ctx.strokeStyle = 'rgba(100,160,255,0.28)';
                                ctx.lineWidth = sz * 0.35;
                                ctx.beginPath();
                                ctx.arc(pr[0], pr[1], sz * 1.18, 0, Math.PI * 2);
                                ctx.stroke();
                            }
                            // Moons
                            if (p.moons) {
                                for (const moon of p.moons){
                                    const angle = t * 8 / moon.period * Math.PI * 2;
                                    const mx2 = item.st.pos[0] + Math.cos(angle) * moon.a;
                                    const mz2 = item.st.pos[2] + Math.sin(angle) * moon.a;
                                    const my2 = item.st.pos[1];
                                    const mpr = project3D(mx2, my2, mz2);
                                    if (!mpr) continue;
                                    const ms = Math.max(1, moon.size * (800 / mpr[2]));
                                    ctx.fillStyle = moon.color;
                                    ctx.beginPath();
                                    ctx.arc(mpr[0], mpr[1], ms, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                            }
                            // Label
                            if (showLabels) {
                                ctx.fillStyle = p.color + 'cc';
                                ctx.font = `${Math.max(9, Math.min(13, sz * 0.9))}px "Courier New",monospace`;
                                ctx.textAlign = 'center';
                                ctx.fillText(p.name, pr[0], pr[1] - sz - 5);
                            }
                        }
                    }
                    if (mode === 'quantum') {
                        if (orbitalType === 'atlas') {
                            drawQuantumAtlas(ctx, canvas, t);
                            return;
                        }
                        const Z = Math.max(1, Math.min(10, atomZ));
                        // Auto-rotate slowly when idle
                        if (!s.mouseInside) s.targetYaw += 0.0014;
                        // Nucleus
                        const cx = canvas.width * 0.5, cy = canvas.height * 0.5;
                        const nucPr = project3D(0, 0, 0);
                        if (nucPr) {
                            for(let g = 3; g >= 0; g--){
                                const r = 6 + g * 4;
                                const glow = ctx.createRadialGradient(nucPr[0], nucPr[1], 0, nucPr[0], nucPr[1], r);
                                glow.addColorStop(0, `rgba(220,180,255,${0.18 - g * 0.04})`);
                                glow.addColorStop(1, 'rgba(120,40,255,0)');
                                ctx.fillStyle = glow;
                                ctx.beginPath();
                                ctx.arc(nucPr[0], nucPr[1], r, 0, Math.PI * 2);
                                ctx.fill();
                            }
                            const nGrad = ctx.createRadialGradient(nucPr[0] - 2, nucPr[1] - 2, 0, nucPr[0], nucPr[1], 7);
                            nGrad.addColorStop(0, '#f0e0ff');
                            nGrad.addColorStop(0.5, '#c070ff');
                            nGrad.addColorStop(1, '#6010aa');
                            ctx.fillStyle = nGrad;
                            ctx.beginPath();
                            ctx.arc(nucPr[0], nucPr[1], 7, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        // Sample wavefunction and render probability cloud
                        ctx.save();
                        ctx.globalCompositeOperation = 'lighter';
                        const nPoints = 12000;
                        for(let i = 0; i < nPoints; i++){
                            const pt = sampleOrbitalPoint(Z, orbitalType, t);
                            if (!pt) continue;
                            const pr = project3D(pt.x, pt.y, pt.z);
                            if (!pr) continue;
                            const depth = Math.max(0.12, Math.min(1, 0.9 - pr[2] / 200));
                            ctx.fillStyle = orbitalColor(pt.psi, pt.prob * depth, pt.l);
                            const sz = 0.9 + pt.prob * 1.1;
                            ctx.fillRect(pr[0] - sz * 0.5, pr[1] - sz * 0.5, sz, sz);
                        }
                        ctx.restore();
                        // Legend
                        ctx.save();
                        ctx.fillStyle = 'rgba(0,0,0,0.55)';
                        ctx.beginPath();
                        ctx.roundRect(14, 14, 200, 62, 6);
                        ctx.fill();
                        ctx.fillStyle = '#c8a8ff';
                        ctx.font = 'bold 13px "Courier New",monospace';
                        ctx.textAlign = 'left';
                        ctx.fillText('Hydrogen Wave Function', 22, 34);
                        ctx.fillStyle = '#8878aa';
                        ctx.font = '11px "Courier New",monospace';
                        ctx.fillText(`state: ${orbitalType === 'mix' ? 'superposition' : orbitalType}`, 22, 50);
                        ctx.fillText('ψ sign maps to colour', 22, 66);
                        ctx.restore();
                        // Phase legend
                        ctx.save();
                        const lx = canvas.width - 140, ly = 14;
                        ctx.fillStyle = 'rgba(0,0,0,0.5)';
                        ctx.beginPath();
                        ctx.roundRect(lx, ly, 126, 48, 5);
                        ctx.fill();
                        ctx.fillStyle = 'rgba(160,100,255,0.8)';
                        ctx.fillRect(lx + 10, ly + 10, 10, 10);
                        ctx.fillStyle = 'rgba(255,80,200,0.8)';
                        ctx.fillRect(lx + 10, ly + 28, 10, 10);
                        ctx.fillStyle = '#aaa';
                        ctx.font = '10px "Courier New",monospace';
                        ctx.textAlign = 'left';
                        ctx.fillText('ψ > 0 (positive)', lx + 26, ly + 20);
                        ctx.fillText('ψ < 0 (negative)', lx + 26, ly + 38);
                        ctx.restore();
                    }
                }
            }["BlackHoleSimulation.useEffect.frame"];
            frame();
            return ({
                "BlackHoleSimulation.useEffect": ()=>{
                    cancelAnimationFrame(raf);
                    ro.disconnect();
                    canvas.removeEventListener('pointerdown', onDown);
                    canvas.removeEventListener('pointerenter', onEnter);
                    canvas.removeEventListener('pointerleave', onLeave);
                    canvas.removeEventListener('pointermove', onMove);
                    canvas.removeEventListener('pointerup', onUp);
                    canvas.removeEventListener('wheel', onWheel);
                    window.removeEventListener('keydown', onKey);
                    window.removeEventListener('keyup', onKey);
                }
            })["BlackHoleSimulation.useEffect"];
        }
    }["BlackHoleSimulation.useEffect"], [
        mode,
        atomZ,
        orbitalType,
        showLabels
    ]);
    // ── Fire ring ──────────────────────────────────────────────────────────────
    const fireRing = ()=>{
        const cols = [
            [
                1,
                .9,
                .3
            ],
            [
                .9,
                .4,
                1
            ],
            [
                .3,
                .9,
                1
            ],
            [
                1,
                .5,
                .1
            ],
            [
                .4,
                1,
                .5
            ],
            [
                1,
                .4,
                .4
            ]
        ];
        for(let i = 0; i < 32; i++){
            const a = i / 32 * Math.PI * 2, r = 10;
            const px = Math.cos(a) * r, pz = Math.sin(a) * r;
            const m = Math.hypot(-px, 0, -pz) || 1;
            S.current.rays.push({
                x: px,
                y: 0,
                z: pz,
                vx: -px / m * 5.2,
                vy: 0,
                vz: -pz / m * 5.2,
                life: 1,
                age: 0,
                trail: [],
                color: cols[i % cols.length]
            });
        }
    };
    // ── Styles ─────────────────────────────────────────────────────────────────
    const s = S.current;
    const panel = {
        width: '100%',
        maxWidth: 900,
        borderRadius: 10,
        border: '1px solid #1a1a1a',
        background: 'linear-gradient(180deg,#0c0a0e,#060508)',
        padding: 18,
        boxSizing: 'border-box',
        color: '#999',
        fontFamily: 'monospace'
    };
    const row = {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        color: '#888',
        fontFamily: 'monospace',
        letterSpacing: '0.06em'
    };
    const slider = {
        width: 68,
        accentColor: '#e8700a'
    };
    const val = {
        color: '#e8a030',
        minWidth: 34,
        fontSize: 11
    };
    const menuWrap = {
        width: '100%',
        maxWidth: 900,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'space-between',
        border: '1px solid #1a0a00',
        borderRadius: 8,
        padding: 10,
        boxSizing: 'border-box',
        marginBottom: 12,
        background: 'linear-gradient(180deg,#0a0604,#050302)'
    };
    const menuBtn = (active)=>({
            fontSize: 11,
            padding: '6px 14px',
            cursor: 'pointer',
            borderRadius: 6,
            fontFamily: 'monospace',
            letterSpacing: '0.06em',
            border: active ? '1px solid #e8700a' : '1px solid #2a2a2a',
            color: active ? '#f2a64b' : '#777',
            background: active ? '#120600' : '#0b0b0b'
        });
    const btnBase = {
        fontSize: 11,
        padding: '4px 12px',
        cursor: 'pointer',
        borderRadius: 4,
        fontFamily: 'monospace',
        letterSpacing: '0.06em'
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            width: '100%',
            minHeight: '100vh',
            background: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            boxSizing: 'border-box'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: menuWrap,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            color: '#c4832b',
                            fontFamily: '"Courier New",monospace',
                            letterSpacing: '0.18em',
                            fontSize: 12
                        },
                        children: "SIMULATION MENU"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                        lineNumber: 1451,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'flex',
                            gap: 8,
                            flexWrap: 'wrap'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                style: menuBtn(mode === 'blackhole'),
                                onClick: ()=>setMode('blackhole'),
                                children: "Black Hole"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1453,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                style: menuBtn(mode === 'gravity'),
                                onClick: ()=>setMode('gravity'),
                                children: "Solar System"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1454,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                style: menuBtn(mode === 'quantum'),
                                onClick: ()=>setMode('quantum'),
                                children: "Quantum Model"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1455,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                        lineNumber: 1452,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                lineNumber: 1450,
                columnNumber: 7
            }, this),
            mode === 'blackhole' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            textAlign: 'center',
                            marginBottom: 10
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                style: {
                                    margin: 0,
                                    fontSize: 'clamp(15px,2.8vw,24px)',
                                    fontWeight: 400,
                                    letterSpacing: '0.22em',
                                    color: '#d4880a',
                                    fontFamily: '"Courier New",monospace',
                                    textTransform: 'uppercase'
                                },
                                children: "Schwarzschild Black Hole"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1462,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: '4px 0 0',
                                    fontSize: 11,
                                    color: '#444',
                                    letterSpacing: '0.12em',
                                    fontFamily: 'monospace'
                                },
                                children: "DRAG TO LOOK · SCROLL/PINCH TO ZOOM · CLICK TO FIRE PHOTONS · F KEY FIRES AT BH · WASD FLY · SPACE/E UP · Q DOWN"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1465,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                        lineNumber: 1461,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: 'relative',
                            width: '100%',
                            maxWidth: 900
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                                ref: canvasRef,
                                style: {
                                    width: '100%',
                                    aspectRatio: '16/10',
                                    display: 'block',
                                    cursor: 'grab',
                                    borderRadius: 6,
                                    border: '1px solid #2a1000'
                                }
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1471,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    position: 'absolute',
                                    left: '50%',
                                    top: '50%',
                                    width: 14,
                                    height: 14,
                                    marginLeft: -7,
                                    marginTop: -7,
                                    pointerEvents: 'none'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            position: 'absolute',
                                            left: 6,
                                            top: 0,
                                            width: 2,
                                            height: 14,
                                            background: '#c98d4a'
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1474,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            position: 'absolute',
                                            left: 0,
                                            top: 6,
                                            width: 14,
                                            height: 2,
                                            background: '#c98d4a'
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1475,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1473,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    position: 'absolute',
                                    left: 10,
                                    top: 10,
                                    padding: '6px 8px',
                                    background: 'rgba(0,0,0,0.55)',
                                    border: '1px solid #2a1000',
                                    borderRadius: 6,
                                    color: '#c98d4a',
                                    fontFamily: 'monospace',
                                    fontSize: 10,
                                    letterSpacing: '0.08em'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            "POS ",
                                            s.camPos[0].toFixed(1),
                                            " ",
                                            s.camPos[1].toFixed(1),
                                            " ",
                                            s.camPos[2].toFixed(1)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1479,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            "YAW ",
                                            s.yaw.toFixed(2),
                                            " PITCH ",
                                            s.pitch.toFixed(2)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1480,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1478,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                        lineNumber: 1470,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 10,
                            marginTop: 10,
                            maxWidth: 900,
                            width: '100%',
                            justifyContent: 'center',
                            alignItems: 'center'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                style: row,
                                children: [
                                    "Disk tilt",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "range",
                                        min: 0,
                                        max: 89,
                                        step: 1,
                                        defaultValue: s.diskTilt,
                                        style: slider,
                                        onChange: (e)=>{
                                            S.current.diskTilt = +e.target.value;
                                            e.target.nextSibling.textContent = e.target.value + '°';
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1485,
                                        columnNumber: 41
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: val,
                                        children: [
                                            s.diskTilt,
                                            "°"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1485,
                                        columnNumber: 251
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1485,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                style: row,
                                children: [
                                    "Spin",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "range",
                                        min: 0,
                                        max: 2,
                                        step: 0.05,
                                        defaultValue: s.spin,
                                        style: slider,
                                        onChange: (e)=>{
                                            S.current.spin = +e.target.value;
                                            e.target.nextSibling.textContent = (+e.target.value).toFixed(2);
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1486,
                                        columnNumber: 36
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: val,
                                        children: s.spin.toFixed(2)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1486,
                                        columnNumber: 250
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1486,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                style: row,
                                children: [
                                    "Glow",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "range",
                                        min: 0.2,
                                        max: 3,
                                        step: 0.05,
                                        defaultValue: s.diskBright,
                                        style: slider,
                                        onChange: (e)=>{
                                            S.current.diskBright = +e.target.value;
                                            e.target.nextSibling.textContent = (+e.target.value).toFixed(1);
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1487,
                                        columnNumber: 36
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: val,
                                        children: s.diskBright.toFixed(1)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1487,
                                        columnNumber: 264
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1487,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                style: row,
                                children: [
                                    "Mass",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "range",
                                        min: 0.5,
                                        max: 3,
                                        step: 0.1,
                                        defaultValue: s.mass,
                                        style: slider,
                                        onChange: (e)=>{
                                            S.current.mass = +e.target.value;
                                            e.target.nextSibling.textContent = (+e.target.value).toFixed(1);
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1488,
                                        columnNumber: 36
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: val,
                                        children: s.mass.toFixed(1)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1488,
                                        columnNumber: 251
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1488,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                style: row,
                                children: [
                                    "Rays",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "range",
                                        min: 1,
                                        max: 8,
                                        step: 1,
                                        defaultValue: s.raysPerClick,
                                        style: slider,
                                        onChange: (e)=>{
                                            S.current.raysPerClick = +e.target.value;
                                            e.target.nextSibling.textContent = e.target.value;
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1489,
                                        columnNumber: 36
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: val,
                                        children: s.raysPerClick
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1489,
                                        columnNumber: 249
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1489,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                style: row,
                                children: [
                                    "Dist",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "range",
                                        min: 6,
                                        max: 80,
                                        step: 1,
                                        defaultValue: s.camDist,
                                        style: slider,
                                        onChange: (e)=>{
                                            setDistance(+e.target.value);
                                            e.target.nextSibling.textContent = e.target.value;
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1490,
                                        columnNumber: 36
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: val,
                                        children: s.camDist
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1490,
                                        columnNumber: 235
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1490,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                style: {
                                    ...btnBase,
                                    background: '#100400',
                                    color: '#e8700a',
                                    border: '1px solid #8b3a0a'
                                },
                                onClick: fireRing,
                                children: "Ring shot"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1491,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                style: {
                                    ...btnBase,
                                    background: '#0c0a08',
                                    color: '#c98d4a',
                                    border: '1px solid #533014'
                                },
                                onClick: ()=>{
                                    const s2 = S.current;
                                    const bm = Math.hypot(-s2.camPos[0], -s2.camPos[1], -s2.camPos[2]) || 1;
                                    const d = [
                                        -s2.camPos[0] / bm,
                                        -s2.camPos[1] / bm,
                                        -s2.camPos[2] / bm
                                    ];
                                    const n2 = s2.raysPerClick, sp = 5.2;
                                    const { right, up } = getBasis(s2.yaw, s2.pitch);
                                    for(let i = 0; i < n2; i++){
                                        const j = (i - (n2 - 1) / 2) * (n2 > 1 ? 0.1 : 0);
                                        const jx = d[0] + right[0] * j + up[0] * j * 0.35;
                                        const jy = d[1] + right[1] * j + up[1] * j * 0.35;
                                        const jz = d[2] + right[2] * j + up[2] * j * 0.35;
                                        const jm = Math.hypot(jx, jy, jz) || 1;
                                        s2.rays.push({
                                            x: s2.camPos[0],
                                            y: s2.camPos[1],
                                            z: s2.camPos[2],
                                            vx: jx / jm * sp,
                                            vy: jy / jm * sp,
                                            vz: jz / jm * sp,
                                            life: 1,
                                            age: 0,
                                            trail: [
                                                {
                                                    x: s2.camPos[0],
                                                    y: s2.camPos[1],
                                                    z: s2.camPos[2]
                                                }
                                            ],
                                            color: [
                                                1,
                                                .7,
                                                .2
                                            ]
                                        });
                                    }
                                },
                                children: "Fire at BH (F)"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1492,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                style: {
                                    ...btnBase,
                                    background: '#0a0a0a',
                                    color: '#555',
                                    border: '1px solid #2a2a2a'
                                },
                                onClick: ()=>{
                                    S.current.rays = [];
                                },
                                children: "Clear"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1493,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                        lineNumber: 1484,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    width: '100%',
                    maxWidth: 900
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: panel,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                style: {
                                    margin: 0,
                                    color: '#d0a060',
                                    fontWeight: 400,
                                    letterSpacing: '0.16em',
                                    fontSize: 16
                                },
                                children: mode === 'gravity' ? 'Solar System — Keplerian Orbits' : 'Quantum Atomic Orbitals'
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1499,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: '6px 0 0',
                                    lineHeight: 1.6,
                                    fontSize: 12
                                },
                                children: mode === 'gravity' ? 'Accurate elliptical orbits via Kepler\'s equation with correct inclinations, eccentricities, and orbital parameters. Moons of Jupiter and Saturn included. Spacetime curvature grid shows solar gravitational well.' : 'Real hydrogen-like wavefunctions ψ_nlm using associated Laguerre radial functions and real spherical harmonics. Probability density |ψ|² sampled via rejection sampling. Orbital phase shown by colour: positive lobe vs. negative lobe.'
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1502,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: 10,
                                    display: 'flex',
                                    gap: 8,
                                    flexWrap: 'wrap',
                                    alignItems: 'center'
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: {
                                        fontSize: 10,
                                        color: '#555'
                                    },
                                    children: "DRAG TO ORBIT · SCROLL TO ZOOM · WASD TO FLY · SPACE/E UP · Q DOWN"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                    lineNumber: 1508,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1507,
                                columnNumber: 13
                            }, this),
                            mode === 'gravity' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: 10,
                                    display: 'flex',
                                    gap: 8,
                                    flexWrap: 'wrap',
                                    alignItems: 'center'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        style: menuBtn(showLabels),
                                        onClick: ()=>setShowLabels((v)=>!v),
                                        children: showLabels ? 'Labels ON' : 'Labels OFF'
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1513,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        style: {
                                            ...btnBase,
                                            background: '#0a0a0a',
                                            color: '#c98d4a',
                                            border: '1px solid #533014'
                                        },
                                        onClick: ()=>{
                                            S.current.camPos = [
                                                0,
                                                80,
                                                380
                                            ];
                                            S.current.yaw = 0;
                                            S.current.pitch = -0.22;
                                            S.current.targetYaw = 0;
                                            S.current.targetPitch = -0.22;
                                        },
                                        children: "Reset View"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1516,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                lineNumber: 1512,
                                columnNumber: 15
                            }, this),
                            mode === 'quantum' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            marginTop: 10,
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 8,
                                            alignItems: 'center'
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            style: row,
                                            children: [
                                                "Z",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "range",
                                                    min: 1,
                                                    max: 118,
                                                    step: 1,
                                                    value: atomZ,
                                                    style: {
                                                        ...slider,
                                                        accentColor: '#a060ff'
                                                    },
                                                    onChange: (e)=>setAtomZ(+e.target.value)
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                                    lineNumber: 1528,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "number",
                                                    min: 1,
                                                    max: 118,
                                                    value: atomZ,
                                                    onChange: (e)=>setAtomZ(Math.max(1, Math.min(118, Math.floor(+e.target.value || 1)))),
                                                    style: {
                                                        width: 52,
                                                        background: '#0b0b0b',
                                                        border: '1px solid #222',
                                                        color: '#c0a0e0',
                                                        fontFamily: 'monospace',
                                                        padding: '2px 4px',
                                                        borderRadius: 3
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                                    lineNumber: 1529,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                            lineNumber: 1526,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1525,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            gap: 6,
                                            flexWrap: 'wrap',
                                            marginTop: 8
                                        },
                                        children: [
                                            'atlas',
                                            's',
                                            'p',
                                            'd',
                                            'f',
                                            'mix'
                                        ].map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                style: menuBtn(orbitalType === k),
                                                onClick: ()=>setOrbitalType(k),
                                                children: k === 'atlas' ? 'Hydrogen atlas' : k === 'mix' ? 'superposition' : `${k} orbital`
                                            }, k, false, {
                                                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                                lineNumber: 1535,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                                        lineNumber: 1533,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                        lineNumber: 1498,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$blackhhole$2f$blackhole$2d$sim$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                        ref: sim2DRef,
                        style: {
                            width: '100%',
                            aspectRatio: '16/10',
                            display: 'block',
                            marginTop: 10,
                            borderRadius: 8,
                            border: '1px solid #1a1a1a',
                            background: '#030408'
                        }
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                        lineNumber: 1548,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
                lineNumber: 1497,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Documents/blackhhole/blackhole-sim/app/page.tsx",
        lineNumber: 1448,
        columnNumber: 5
    }, this);
}
_s(BlackHoleSimulation, "GlSg4m5UOOFFH5vXP2KVjkVH9fw=");
_c = BlackHoleSimulation;
// ── Utility ──────────────────────────────────────────────────────────────────
function lightenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.min(255, Math.round(r * factor))},${Math.min(255, Math.round(g * factor))},${Math.min(255, Math.round(b * factor))})`;
}
var _c;
__turbopack_context__.k.register(_c, "BlackHoleSimulation");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=OneDrive_Documents_blackhhole_blackhole-sim_app_page_tsx_15287d45._.js.map