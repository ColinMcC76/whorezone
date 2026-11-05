import * as THREE from 'three';

export type SiteTheme = 'light' | 'dark';

export const SPHERE_RADIUS = 2.35;
export const PARTICLE_COUNT = 3200;
export const MAX_POKES = 6;

export type PokeWave = {
  dir: THREE.Vector3;
  birth: number;
  strength: number;
};

export type HoloSphereHandle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  shell: THREE.Mesh;
  shellMaterial: THREE.ShaderMaterial;
  particles: THREE.Points;
  particlePositions: Float32Array;
  particleVelocities: Float32Array;
  pokes: PokeWave[];
  cameraState: { yaw: number; pitch: number; distance: number };
  dispose: () => void;
};

const shellVertex = /* glsl */ `
uniform float uTime;
uniform float uReduceMotion;
uniform vec4 uPokeDirs[6];
uniform vec4 uPokeMeta[6];

varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vRipple;
varying float vScan;

float waveAt(vec3 n, vec3 dir, float birth, float strength, float time) {
  if (strength < 0.001) return 0.0;
  float age = time - birth;
  if (age < 0.0 || age > 2.4) return 0.0;
  float ang = acos(clamp(dot(normalize(n), normalize(dir)), -1.0, 1.0));
  float front = age * 2.15;
  float band = exp(-pow((ang - front) * 4.2, 2.0));
  float decay = exp(-age * 1.35);
  return band * decay * strength;
}

void main() {
  vec3 n = normalize(normal);
  float ripple = 0.0;
  if (uReduceMotion < 0.5) {
    for (int i = 0; i < 6; i++) {
      ripple += waveAt(n, uPokeDirs[i].xyz, uPokeMeta[i].x, uPokeMeta[i].y, uTime);
    }
    ripple += sin(uTime * 1.1 + position.y * 2.2) * 0.006;
  }

  vec3 displaced = position + n * ripple * 0.22;
  vec4 world = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * n);
  vRipple = ripple;
  vScan = displaced.y;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const shellFragment = /* glsl */ `
uniform float uTime;
uniform float uReduceMotion;
uniform vec3 uGlow;
uniform vec3 uCore;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vRipple;
varying float vScan;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 2.4);
  float scan = 0.0;
  if (uReduceMotion < 0.5) {
    scan = 0.045 * sin(vScan * 42.0 - uTime * 2.4);
  }
  float body = 0.1 + fresnel * 0.78 + abs(vRipple) * 0.55 + scan;
  vec3 color = mix(uCore, uGlow, clamp(fresnel * 1.15 + abs(vRipple) * 0.4, 0.0, 1.0));
  color += uGlow * fresnel * 0.4;
  gl_FragColor = vec4(color, clamp(body * uOpacity, 0.05, 0.72));
}
`;

function unit(index: number) {
  const value = Math.sin(index * 127.1 + 1.7) * 43758.5453;
  return value - Math.floor(value);
}

export function createHoloSphere(): HoloSphereHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  scene.fog = new THREE.Fog(0x0a0a0a, 14, 36);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  const cameraState = { yaw: 0.55, pitch: 0.28, distance: 8.4 };

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 0.8);
  key.position.set(4, 8, 5);
  scene.add(key);

  const shellMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReduceMotion: { value: 0 },
      uGlow: { value: new THREE.Color(0xf4f4f4) },
      uCore: { value: new THREE.Color(0x9a9a9a) },
      uOpacity: { value: 1 },
      uPokeDirs: {
        value: Array.from({ length: MAX_POKES }, () => new THREE.Vector4()),
      },
      uPokeMeta: {
        value: Array.from({ length: MAX_POKES }, () => new THREE.Vector4()),
      },
    },
    vertexShader: shellVertex,
    fragmentShader: shellFragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(SPHERE_RADIUS, 96, 64),
    shellMaterial,
  );
  scene.add(shell);

  const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
  const particleVelocities = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const u = unit(i);
    const v = unit(i + 3);
    const w = unit(i + 7);
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const r = SPHERE_RADIUS * Math.cbrt(w) * 0.92;
    const ix = i * 3;
    particlePositions[ix] = r * Math.sin(phi) * Math.cos(theta);
    particlePositions[ix + 1] = r * Math.cos(phi);
    particlePositions[ix + 2] = r * Math.sin(phi) * Math.sin(theta);
    particleVelocities[ix] = (unit(i + 11) - 0.5) * 0.08;
    particleVelocities[ix + 1] = (unit(i + 13) - 0.5) * 0.08;
    particleVelocities[ix + 2] = (unit(i + 17) - 0.5) * 0.08;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xf4f4f4,
    size: 0.045,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  const groundGeometry = new THREE.CircleGeometry(14, 48);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 1,
    metalness: 0,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -SPHERE_RADIUS - 0.35;
  scene.add(ground);

  const pokes: PokeWave[] = [];

  const handle: HoloSphereHandle = {
    scene,
    camera,
    shell,
    shellMaterial,
    particles,
    particlePositions,
    particleVelocities,
    pokes,
    cameraState,
    dispose() {
      shell.geometry.dispose();
      shellMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      groundGeometry.dispose();
      groundMaterial.dispose();
    },
  };

  paintHoloSphere(handle, 'dark');
  return handle;
}

export function paintHoloSphere(holo: HoloSphereHandle, theme: SiteTheme) {
  const dark = theme === 'dark';
  const background = dark ? 0x0a0a0a : 0xf4f4f4;
  holo.scene.background = new THREE.Color(background);
  holo.scene.fog = new THREE.Fog(background, 14, 36);

  const glow = dark ? 0xf5f5f5 : 0x111111;
  const core = dark ? 0x8f8f8f : 0x6a6a6a;
  holo.shellMaterial.uniforms.uGlow.value.setHex(glow);
  holo.shellMaterial.uniforms.uCore.value.setHex(core);
  holo.shellMaterial.uniforms.uOpacity.value = dark ? 1.05 : 0.7;
  holo.shellMaterial.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;

  const particleMaterial = holo.particles.material as THREE.PointsMaterial;
  particleMaterial.color.setHex(dark ? 0xf5f5f5 : 0x222222);
  particleMaterial.opacity = dark ? 0.8 : 0.42;
  particleMaterial.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
  particleMaterial.size = dark ? 0.045 : 0.038;

  const ground = holo.scene.children.find(
    (child) => child instanceof THREE.Mesh && child !== holo.shell,
  ) as THREE.Mesh | undefined;
  if (ground && ground.material instanceof THREE.MeshStandardMaterial) {
    ground.material.color.setHex(dark ? 0x111111 : 0xe4e4e4);
  }
}

export function pushPoke(holo: HoloSphereHandle, point: THREE.Vector3, time: number, strength = 1) {
  const dir = point.clone().normalize();
  holo.pokes.unshift({ dir, birth: time, strength });
  if (holo.pokes.length > MAX_POKES) holo.pokes.length = MAX_POKES;
}

export function syncPokeUniforms(holo: HoloSphereHandle, time: number, reduceMotion: boolean) {
  holo.shellMaterial.uniforms.uTime.value = time;
  holo.shellMaterial.uniforms.uReduceMotion.value = reduceMotion ? 1 : 0;
  const dirs = holo.shellMaterial.uniforms.uPokeDirs.value as THREE.Vector4[];
  const meta = holo.shellMaterial.uniforms.uPokeMeta.value as THREE.Vector4[];
  for (let i = 0; i < MAX_POKES; i += 1) {
    const poke = holo.pokes[i];
    if (!poke) {
      dirs[i].set(0, 1, 0, 0);
      meta[i].set(0, 0, 0, 0);
      continue;
    }
    dirs[i].set(poke.dir.x, poke.dir.y, poke.dir.z, 0);
    meta[i].set(poke.birth, reduceMotion ? 0 : poke.strength, 0, 0);
  }
}

export function stepParticles(
  holo: HoloSphereHandle,
  time: number,
  delta: number,
  reduceMotion: boolean,
) {
  const positions = holo.particlePositions;
  const velocities = holo.particleVelocities;
  const limit = SPHERE_RADIUS * 0.94;

  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const ix = i * 3;
    let x = positions[ix];
    let y = positions[ix + 1];
    let z = positions[ix + 2];
    let vx = velocities[ix];
    let vy = velocities[ix + 1];
    let vz = velocities[ix + 2];

    if (!reduceMotion) {
      vx += Math.sin(time * 0.7 + i) * 0.01 * delta;
      vy += Math.cos(time * 0.55 + i * 0.3) * 0.01 * delta;
      vz += Math.sin(time * 0.4 + i * 0.7) * 0.01 * delta;

      for (const poke of holo.pokes) {
        const age = time - poke.birth;
        if (age < 0 || age > 2.4) continue;
        const px = positions[ix];
        const py = positions[ix + 1];
        const pz = positions[ix + 2];
        const len = Math.hypot(px, py, pz) || 1;
        const nx = px / len;
        const ny = py / len;
        const nz = pz / len;
        const dot = nx * poke.dir.x + ny * poke.dir.y + nz * poke.dir.z;
        const ang = Math.acos(Math.min(1, Math.max(-1, dot)));
        const front = age * 2.15;
        const band = Math.exp(-Math.pow((ang - front) * 4.2, 2));
        const decay = Math.exp(-age * 1.35);
        const force = band * decay * poke.strength * 2.8;
        // Push roughly tangent/outward from poke center.
        vx += (nx - poke.dir.x) * force * delta;
        vy += (ny - poke.dir.y) * force * delta;
        vz += (nz - poke.dir.z) * force * delta;
      }
    }

    vx *= 0.985;
    vy *= 0.985;
    vz *= 0.985;
    x += vx * delta * 60;
    y += vy * delta * 60;
    z += vz * delta * 60;

    const dist = Math.hypot(x, y, z);
    if (dist > limit) {
      const s = limit / dist;
      x *= s;
      y *= s;
      z *= s;
      const bounce = 0.35;
      vx *= -bounce;
      vy *= -bounce;
      vz *= -bounce;
    }

    positions[ix] = x;
    positions[ix + 1] = y;
    positions[ix + 2] = z;
    velocities[ix] = vx;
    velocities[ix + 1] = vy;
    velocities[ix + 2] = vz;
  }

  const attr = holo.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
  attr.needsUpdate = true;
}
