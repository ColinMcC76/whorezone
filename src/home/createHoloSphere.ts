import * as THREE from 'three';

export type SiteTheme = 'light' | 'dark';

export const SPHERE_RADIUS = 2.35;
export const DESKTOP_SWARM_COUNT = 5500;
export const MOBILE_SWARM_COUNT = 1800;
export const MAX_POKES = 6;
const ORB_RADIUS = 0.03;

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
  count: number;
  homes: Float32Array;
  positions: Float32Array;
  velocities: Float32Array;
  phases: Float32Array;
  scales: Float32Array;
  pokes: PokeWave[];
  cameraState: { yaw: number; pitch: number; distance: number };
  dispose: () => void;
};

const scratch = new THREE.Object3D();

function unit(index: number) {
  const value = Math.sin(index * 127.1 + 1.7) * 43758.5453;
  return value - Math.floor(value);
}

function waveAt(nx: number, ny: number, nz: number, poke: PokeWave, time: number) {
  const age = time - poke.birth;
  if (age < 0 || age > 2.8) return 0;
  const dot = nx * poke.dir.x + ny * poke.dir.y + nz * poke.dir.z;
  const ang = Math.acos(Math.min(1, Math.max(-1, dot)));
  const front = age * 1.85;
  const band = Math.exp(-Math.pow((ang - front) * 3.6, 2));
  const decay = Math.exp(-age * 0.95);
  return band * decay * poke.strength;
}

/** Pick swarm size once at startup. Phones / weak GPUs get the lighter count. */
export function chooseSwarmCount(
  width = typeof window !== 'undefined' ? window.innerWidth : 1280,
  coarsePointer = typeof window !== 'undefined'
    ? window.matchMedia('(pointer: coarse)').matches
    : false,
  cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8,
): number {
  if (width < 820 || coarsePointer || cores <= 4) return MOBILE_SWARM_COUNT;
  return DESKTOP_SWARM_COUNT;
}

export function createHoloSphere(count = chooseSwarmCount()): HoloSphereHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  scene.fog = new THREE.Fog(0x0a0a0a, 14, 36);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  const cameraState = { yaw: 0.55, pitch: 0.28, distance: 8.4 };

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(4, 8, 5);
  scene.add(key);

  const homes = new Float32Array(count * 3);
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const scales = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const u = unit(i);
    const v = unit(i + 3);
    const surfaceBias = Math.pow(unit(i + 7), 0.2);
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const r = SPHERE_RADIUS * (0.55 + surfaceBias * 0.44);
    const ix = i * 3;
    homes[ix] = r * Math.sin(phi) * Math.cos(theta);
    homes[ix + 1] = r * Math.cos(phi);
    homes[ix + 2] = r * Math.sin(phi) * Math.sin(theta);
    positions[ix] = homes[ix];
    positions[ix + 1] = homes[ix + 1];
    positions[ix + 2] = homes[ix + 2];
    phases[i] = unit(i + 19) * Math.PI * 2;
    scales[i] = 0.65 + unit(i + 23) * 0.75;
  }

  const orbGeometry = new THREE.SphereGeometry(ORB_RADIUS, 10, 8);
  const orbMaterial = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    emissive: 0xffffff,
    emissiveIntensity: 1.15,
    roughness: 0.32,
    metalness: 0,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });

  const swarm = new THREE.InstancedMesh(orbGeometry, orbMaterial, count);
  swarm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  swarm.frustumCulled = false;

  for (let i = 0; i < count; i += 1) {
    const ix = i * 3;
    scratch.position.set(positions[ix], positions[ix + 1], positions[ix + 2]);
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

  const pokes: PokeWave[] = [];

  const handle: HoloSphereHandle = {
    scene,
    camera,
    swarm,
    hitSphere,
    count,
    homes,
    positions,
    velocities,
    phases,
    scales,
    pokes,
    cameraState,
    dispose() {
      orbGeometry.dispose();
      orbMaterial.dispose();
      hitSphere.geometry.dispose();
      (hitSphere.material as THREE.Material).dispose();
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

  const material = holo.swarm.material as THREE.MeshStandardMaterial;
  if (dark) {
    material.color.setHex(0xcfcfcf);
    material.emissive.setHex(0xffffff);
    material.emissiveIntensity = 1.2;
    material.opacity = 0.78;
  } else {
    material.color.setHex(0x1f1f1f);
    material.emissive.setHex(0x111111);
    material.emissiveIntensity = 0.4;
    material.opacity = 0.5;
  }
  material.needsUpdate = true;
}

export function pushPoke(holo: HoloSphereHandle, point: THREE.Vector3, time: number, strength = 1) {
  holo.pokes.unshift({ dir: point.clone().normalize(), birth: time, strength });
  if (holo.pokes.length > MAX_POKES) holo.pokes.length = MAX_POKES;
}

export function stepSwarm(
  holo: HoloSphereHandle,
  time: number,
  delta: number,
  reduceMotion: boolean,
) {
  const { count, homes, positions, velocities, phases, scales, pokes, swarm } = holo;
  const dt = Math.min(delta, 0.033);

  for (let i = 0; i < count; i += 1) {
    const ix = i * 3;
    const hx = homes[ix];
    const hy = homes[ix + 1];
    const hz = homes[ix + 2];
    const homeLen = Math.hypot(hx, hy, hz) || 1;
    const nx = hx / homeLen;
    const ny = hy / homeLen;
    const nz = hz / homeLen;

    let x = positions[ix];
    let y = positions[ix + 1];
    let z = positions[ix + 2];
    let vx = velocities[ix];
    let vy = velocities[ix + 1];
    let vz = velocities[ix + 2];
    let scale = scales[i];

    if (reduceMotion) {
      x = hx;
      y = hy;
      z = hz;
      vx = 0;
      vy = 0;
      vz = 0;
    } else {
      const phase = phases[i];

      // Spring back to home seat.
      const spring = 7.5;
      vx += (hx - x) * spring * dt;
      vy += (hy - y) * spring * dt;
      vz += (hz - z) * spring * dt;

      // Soft surface cohesion: nudge along the sphere tangent toward a drifting neighbor bias.
      const cohesion = 0.55;
      const cx = Math.sin(time * 0.55 + phase) * cohesion;
      const cy = Math.cos(time * 0.42 + phase * 0.7) * cohesion;
      const cz = Math.sin(time * 0.48 + phase * 1.1) * cohesion;
      // Project drift onto tangent plane.
      const cDot = cx * nx + cy * ny + cz * nz;
      vx += (cx - nx * cDot) * dt;
      vy += (cy - ny * cDot) * dt;
      vz += (cz - nz * cDot) * dt;

      // Poke wave impulse — slosh outward then settle.
      let ripple = 0;
      for (const poke of pokes) {
        const wave = waveAt(nx, ny, nz, poke, time);
        ripple += wave;
        const impulse = wave * 18;
        vx += nx * impulse * dt;
        vy += ny * impulse * dt;
        vz += nz * impulse * dt;
        // Tangential swirl for a more fluid look.
        vx += (ny * poke.dir.z - nz * poke.dir.y) * wave * 6 * dt;
        vy += (nz * poke.dir.x - nx * poke.dir.z) * wave * 6 * dt;
        vz += (nx * poke.dir.y - ny * poke.dir.x) * wave * 6 * dt;
      }

      // High-frequency shudder (velocity jitter, not hard offset).
      const shudder = 0.35 + ripple * 1.8;
      vx += Math.sin(time * 22 + phase) * shudder * dt;
      vy += Math.cos(time * 19 + phase * 1.2) * shudder * dt;
      vz += Math.sin(time * 24 + phase * 0.6) * shudder * dt;

      // Damping.
      const damp = Math.exp(-3.2 * dt);
      vx *= damp;
      vy *= damp;
      vz *= damp;

      x += vx * dt;
      y += vy * dt;
      z += vz * dt;

      // Keep roughly inside / near the ball radius.
      const dist = Math.hypot(x, y, z) || 1;
      const maxR = SPHERE_RADIUS * 1.08;
      const minR = SPHERE_RADIUS * 0.28;
      if (dist > maxR) {
        const s = maxR / dist;
        x *= s;
        y *= s;
        z *= s;
        vx *= 0.5;
        vy *= 0.5;
        vz *= 0.5;
      } else if (dist < minR) {
        const s = minR / dist;
        x *= s;
        y *= s;
        z *= s;
      }

      scale *= 1 + ripple * 0.45;
    }

    positions[ix] = x;
    positions[ix + 1] = y;
    positions[ix + 2] = z;
    velocities[ix] = vx;
    velocities[ix + 1] = vy;
    velocities[ix + 2] = vz;

    scratch.position.set(x, y, z);
    scratch.scale.setScalar(scale);
    scratch.updateMatrix();
    swarm.setMatrixAt(i, scratch.matrix);
  }

  swarm.instanceMatrix.needsUpdate = true;
}
