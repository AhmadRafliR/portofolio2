// Particle-portrait strands (implementasi.md §2.1.4). One instanced quad per strand; every position is a pure
// function of time and the phase uniforms, so the CPU never touches individual particles.

export const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uSpread;   // 0 → 1 : burst out of the centre into the vortex
uniform float uMorph;    // 0 → 1 : vortex → face
uniform float uSphere;   // 0 → 1 : face → Mars sphere
uniform float uFade;
uniform float uCount;
uniform float uPx;
uniform float uFaceScale;
uniform vec2 uFaceCenter;
uniform vec2 uPointer;
uniform float uPointerAmt;
uniform vec3 uMarsPos;
uniform float uMarsR;
uniform mat3 uMarsRot;
uniform vec3 uSun;
uniform sampler2D uMarsTex;
uniform float uHasTex;

attribute vec2 aFace;
attribute vec4 aMeta;   // angle, length, tone, seed
attribute float aIdx;

varying vec2 vUv;
varying vec3 vColor;
varying float vAlpha;

float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
vec3 fib(float i, float n) {
  float y = 1.0 - 2.0 * (i + 0.5) / n;
  float r = sqrt(max(0.0, 1.0 - y * y));
  float th = i * 2.39996323;
  return vec3(cos(th) * r, y, sin(th) * r);
}
vec3 flowN(vec3 p, float t) {
  return vec3(
    sin(p.y * 2.1 + t) + sin(p.z * 1.7 - t * 0.7),
    sin(p.z * 2.3 + t * 0.8) + sin(p.x * 1.9 + t * 0.5),
    sin(p.x * 2.0 - t * 0.6) + sin(p.y * 1.5 + t)
  ) * 0.5;
}
float ease(float x) { x = clamp(x, 0.0, 1.0); return x * x * (3.0 - 2.0 * x); }

void main() {
  float ang = aMeta.x;
  float len = aMeta.y;
  float tone = aMeta.z;
  float seed = aMeta.w;
  float h2 = hash(aIdx * 1.31 + 7.0);

  // --- vortex: a thick swirling ball, faster at the equator (differential rotation)
  vec3 d = fib(mod(aIdx * 7.0, uCount), uCount);
  float lat = d.y;
  float rr = sqrt(max(0.0, 1.0 - lat * lat));
  float spin = uTime * (0.8 + 0.9 * (1.0 - abs(lat))) + seed * 6.2831;
  float rad = uFaceScale * (0.84 + 0.2 * h2);
  vec3 vp = vec3(cos(spin) * rr, lat * 0.95, sin(spin) * rr) * rad;
  vp += flowN(vp * 1.4 / uFaceScale, uTime * 0.9) * 0.11 * uFaceScale;
  vec3 vtan = normalize(vec3(-sin(spin), 0.25 * sin(uTime + seed * 9.0), cos(spin)));
  float spread = ease((uSpread - h2 * 0.35) / 0.65);
  vp = vp * spread + vec3(uFaceCenter, 0.0);

  // --- face
  vec3 fp = vec3(uFaceCenter + aFace * uFaceScale, (seed - 0.5) * 0.05);
  vec3 ftan = vec3(cos(ang), sin(ang), 0.0);

  // --- Mars sphere (same transform and UV mapping as the Mars mesh)
  vec3 sp0 = fib(aIdx, uCount);
  vec3 n = uMarsRot * sp0;
  vec3 sp = uMarsPos + n * uMarsR * 1.004;
  vec3 stan = normalize(cross(vec3(0.0, 1.0, 0.0), n) + vec3(1e-4));

  float m = ease(uMorph * 1.35 - seed * 0.35);
  float s = ease(uSphere * 1.35 - h2 * 0.35);

  vec3 pos = mix(vp, fp, m);
  pos += flowN(pos * 2.0 / uFaceScale, uTime * 0.6) * 0.012 * uFaceScale * m * (1.0 - s); // breathing
  pos = mix(pos, sp, s);
  pos += flowN(pos * 1.5, uTime) * 0.28 * sin(s * 3.14159) * uMarsR; // swirl on the way to the sphere

  // pointer pushes strands aside (face and vortex only)
  vec2 dp = pos.xy - uPointer;
  float dd = dot(dp, dp);
  float push = exp(-dd / (0.05 * uFaceScale * uFaceScale)) * 0.14 * uFaceScale * uPointerAmt * (1.0 - s);
  pos.xy += normalize(dp + vec2(1e-5)) * push;

  vec3 dir = normalize(mix(mix(vtan, ftan, m), stan, s) + vec3(1e-5));

  // --- colour
  float t2 = pow(tone, 1.35);
  vec3 col = mix(vec3(0.5 + 0.5 * h2), vec3(mix(0.09, 1.0, t2)), m);
  float amber = step(seed, 0.075);
  float cyan = step(0.075, seed) * step(seed, 0.1);
  col = mix(col, vec3(1.0, 0.71, 0.29), amber * (1.0 - 0.5 * m));
  col = mix(col, vec3(0.0, 0.85, 1.0), cyan * (1.0 - 0.6 * m));
  vec3 mc = vec3(0.76, 0.3, 0.12);
  if (uHasTex > 0.5) {
    float th = acos(clamp(sp0.y, -1.0, 1.0));
    float ph = atan(sp0.z, -sp0.x);
    if (ph < 0.0) ph += 6.2831853;
    mc = pow(texture2D(uMarsTex, vec2(ph / 6.2831853, 1.0 - th / 3.14159265)).rgb, vec3(1.0 / 2.2));
  }
  float lam = max(0.1, dot(n, normalize(uSun)));
  col = mix(col, mc * (0.25 + 1.05 * lam), s);
  float facing = mix(1.0, smoothstep(-0.1, 0.35, n.z), s);

  // --- strand quad, built in view space so it always faces the camera
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vec2 dir2 = normalize((viewMatrix * vec4(dir, 0.0)).xy + vec2(1e-5));
  vec2 perp = vec2(-dir2.y, dir2.x);
  float L = mix(mix(0.15 * uFaceScale, (0.012 + 0.05 * len) * uFaceScale, m), 0.035 * uMarsR, s);
  float W = uPx * mix(1.5, 1.25, m);
  mv.xy += dir2 * position.x * L + perp * position.y * W;
  gl_Position = projectionMatrix * mv;

  vUv = uv;
  vColor = col;
  vAlpha = uFade * facing * max(spread, m) * mix(0.9, 0.95, m);
}
`

export const fragmentShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float a = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.55, vUv.x);
  a *= 1.0 - abs(vUv.y - 0.5) * 1.1;
  a *= vAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a);
}
`
