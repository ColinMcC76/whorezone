import * as THREE from 'three';

export type SiteTheme = 'light' | 'dark';

export const SPHERE_RADIUS = 2.35;
export const SWARM_COUNT = 2000;
export const MAX_POKES = 6;
const ORB_RADIUS = 0.045;

export type PokeWave = {
  dir: THREE.Vector3;
  birth: number;
  strength: number;
};

export type HoloSphereHandle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  swarm: THREE.InstancedMesh;
  hitSphere: THREE.Mesh;
  homes: Float32Array;
  phases: Float32Array;
  scales: Float32Array;
  pokes: PokeWave[];
  cameraState: { yaw: number; pitch: number; distance: number };
  ground: THREE.MeshStandardMaterial;
  dispose: () => void;
};

const scratch = new THREE.Object3D();

function unit(index: number) {
  const value = Math.sin(index * 127.1 + 1.7) * 43758.5453;
  return value - Math.floor(value);
}

function waveAt(nx: number, ny: number, nz: number, poke: PokeWave, time: number) {
  const age = time - poke.birth;
  if (age < 0 || age > 2.6) return 0;
  const dot = nx * poke.dir.x + ny * poke.dir.y + nz * poke.dir.z;
  const ang = Math.acos(Math.min(1, Math.max(-1, dot)));
  const front = age * 2.05;
  const band = Math.exp(-Math.pow((ang - front) * 4.0, 2));
  const decay = Math.exp(-age * 1.2);
  return band * decay * poke.strength;
}

export function createHoloSphere(): HoloSphereHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  scene.fog = new THREE.Fog(0x0a0a0a, 14, 36);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  const cameraState = { yaw: 0.55, pitch: 0.28, distance: 8.4 };

  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(4, 8, 5);
  scene.add(key);

  const homes = new Float32Array(SWARM_COUNT * 3);
  const phases = new Float32Array(SWARM_COUNT);
  const scales = new Float32Array(SWARM_COUNT);

  for (let i = 0; i < SWARM_COUNT; i += 1) {
    const u = unit(i);
    const v = unit(i + 3);
    // Bias toward the surface so the swarm reads as a ball of lights.
    const surfaceBias = Math.pow(unit(i + 7), 0.35);
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const r = SPHERE_RADIUS * (0.42 + surfaceBias * 0.56);
    const ix = i * 3;
    homes[ix] = r * Math.sin(phi) * Math.cos(theta);
    homes[ix + 1] = r * Math.cos(phi);
    homes[ix + 2] = r * Math.sin(phi) * Math.sin(theta);
    phases[i] = unit(i + 19) * Math.PI * 2;
    scales[i] = 0.7 + unit(i + 23) * 0.7;
  }

  const orbGeometry = new THREE.SphereGeometry(ORB_RADIUS, 12, 10);
  const orbMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4f4f4,
    emissive: 0xffffff,
    emissiveIntensity: 2.2,
    roughness: 0.25,
    metalness: 0.0,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });

  const swarm = new THREE.InstancedMesh(orbGeometry, orbMaterial, SWARM_COUNT);
  swarm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  swarm.frustumCulled = false;

  for (let i = 0; i < SWARM_COUNT; i += 1) {
    const ix = i * 3;
    scratch.position.set(homes[ix], homes[ix + 1], homes[ix + 2]);
    scratch.scale.setScalar(scales[i]);
    scratch.updateMatrix();
    swarm.setMatrixAt(i, scratch.matrix);
  }
  swarm.instanceMatrix.needsUpdate = true;
  scene.add(swarm);

  const hitSphere = new THREE.Mesh(
    new THREE.SphereGeometry(SPHERE_RADIUS, 32, 24),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  scene.add(hitSphere);

  const groundGeometry = new THREE.CircleGeometry(14, 48);
  const ground = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 1,
    metalness: 0,
  });
  const groundMesh = new THREE.Mesh(groundGeometry, ground);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -SPHERE_RADIUS - 0.35;
  scene.add(groundMesh);

  const pokes: PokeWave[] = [];

  const handle: HoloSphereHandle = {
    scene,
    camera,
    swarm,
    hitSphere,
    homes,
    phases,
    scales,
    pokes,
    cameraState,
    ground,
    dispose() {
      orbGeometry.dispose();
      orbMaterial.dispose();
      hitSphere.geometry.dispose();
      (hitSphere.material as THREE.Material).dispose();
      groundGeometry.dispose();
      ground.dispose();
      swarm.dispose();
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
  holo.ground.color.setHex(dark ? 0x111111 : 0xe4e4e4);

  const material = holo.swarm.material as THREE.MeshStandardMaterial;
  if (dark) {
    material.color.setHex(0xd8d8d8);
    material.emissive.setHex(0xffffff);
    material.emissiveIntensity = 2.4;
    material.opacity = 0.88;
  } else {
    material.color.setHex(0x222222);
    material.emissive.setHex(0x111111);
    material.emissiveIntensity = 0.7;
    material.opacity = 0.62;
  }
  material.blending = THREE.NormalBlending;
  material.needsUpdate = true;
}

export function pushPoke(holo: HoloSphereHandle, point: THREE.Vector3, time: number, strength = 1) {
  holo.pokes.unshift({ dir: point.clone().normalize(), birth: time, strength });
  if (holo.pokes.length > MAX_POKES) holo.pokes.length = MAX_POKES;
}

export function stepSwarm(
  holo: HoloSphereHandle,
  time: number,
  _delta: number,
  reduceMotion: boolean,
) {
  const { homes, phases, scales, pokes, swarm } = holo;

  for (let i = 0; i < SWARM_COUNT; i += 1) {
    const ix = i * 3;
    const hx = homes[ix];
    const hy = homes[ix + 1];
    const hz = homes[ix + 2];
    const len = Math.hypot(hx, hy, hz) || 1;
    const nx = hx / len;
    const ny = hy / len;
    const nz = hz / len;

    let x = hx;
    let y = hy;
    let z = hz;
    let scale = scales[i];

    if (!reduceMotion) {
      const phase = phases[i];
      // High-frequency shudder around the home seat.
      const shudder = 0.018 + 0.01 * Math.sin(time * 7.5 + phase);
      x += Math.sin(time * 18.0 + phase) * shudder;
      y += Math.cos(time * 16.5 + phase * 1.3) * shudder;
      z += Math.sin(time * 17.2 + phase * 0.7) * shudder;

      // Slow fluid drift so the surface feels alive.
      const drift = 0.035;
      x += Math.sin(time * 0.7 + phase) * drift * nx;
      y += Math.cos(time * 0.55 + phase * 0.4) * drift * ny;
      z += Math.sin(time * 0.63 + phase * 0.9) * drift * nz;

      let ripple = 0;
      for (const poke of pokes) {
        const wave = waveAt(nx, ny, nz, poke, time);
        ripple += wave;
      }
      x += nx * ripple * 0.34;
      y += ny * ripple * 0.34;
      z += nz * ripple * 0.34;
      // Extra shudder on the wave front.
      const jolt = ripple * 0.05;
      x += Math.sin(time * 40 + phase) * jolt;
      y += Math.cos(time * 37 + phase) * jolt;
      z += Math.sin(time * 43 + phase) * jolt;
      scale *= 1 + ripple * 0.55;
    }

    scratch.position.set(x, y, z);
    scratch.scale.setScalar(scale);
    scratch.updateMatrix();
    swarm.setMatrixAt(i, scratch.matrix);
  }

  swarm.instanceMatrix.needsUpdate = true;
}
