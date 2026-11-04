import * as THREE from 'three';

const COURSES = 8;
const PITCH = 0.92;
const BLOCK = 0.78;

export type PyramidStone = {
  mesh: THREE.Mesh;
  home: THREE.Vector3;
  out: THREE.Vector3;
  arc: number;
  spin: number;
  tilt: number;
  /** Scroll timeline writes this. 0 is seated, 1 is lifted off. */
  lift: { value: number };
  /** Click writes this and, while active, it wins over the scroll timeline. */
  manual: { value: number; active: boolean };
};

export type PyramidHandle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  stones: PyramidStone[];
  cameraState: { yaw: number; height: number; distance: number };
  dispose: () => void;
};

function unit(index: number) {
  const value = Math.sin(index * 127.1 + 1.7) * 43758.5453;
  return value - Math.floor(value);
}

export function applyStonePose(stone: PyramidStone) {
  const raw = stone.manual.active ? stone.manual.value : stone.lift.value;
  const t = THREE.MathUtils.clamp(raw, 0, 1);
  const arc = Math.sin(t * Math.PI) * stone.arc;
  stone.mesh.position.set(
    THREE.MathUtils.lerp(stone.home.x, stone.out.x, t),
    THREE.MathUtils.lerp(stone.home.y, stone.out.y, t) + arc,
    THREE.MathUtils.lerp(stone.home.z, stone.out.z, t),
  );
  stone.mesh.rotation.set(stone.tilt * t, stone.spin * t, stone.tilt * 0.35 * t);
}

export function createPyramid(): PyramidHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x100e0c);
  scene.fog = new THREE.Fog(0x100e0c, 16, 38);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  const cameraState = { yaw: 0.62, height: 4.4, distance: 15.5 };

  scene.add(new THREE.AmbientLight(0xfff1dd, 0.38));
  scene.add(new THREE.HemisphereLight(0xffe6c4, 0x2a2118, 0.5));
  const key = new THREE.DirectionalLight(0xfff0d2, 2.15);
  key.position.set(8, 14, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc9d7ff, 0.9);
  rim.position.set(-10, 6, -8);
  scene.add(rim);

  const geometry = new THREE.BoxGeometry(BLOCK, BLOCK * 0.62, BLOCK);
  const palette = [0xc4a574, 0xb08968, 0xd4b896, 0xa67c52, 0x8d6b45, 0xcdb089];
  const materials: THREE.MeshStandardMaterial[] = [];
  const stones: PyramidStone[] = [];

  type Spot = { x: number; y: number; z: number; course: number };
  const layout: Spot[] = [];
  const blockHeight = BLOCK * 0.62;

  for (let course = 0; course < COURSES; course += 1) {
    const side = course + 1;
    const y = (COURSES - 1 - course) * (blockHeight + 0.045) + blockHeight / 2;
    const filled = side <= 3;
    for (let ix = 0; ix < side; ix += 1) {
      for (let iz = 0; iz < side; iz += 1) {
        const onRim = ix === 0 || iz === 0 || ix === side - 1 || iz === side - 1;
        if (!filled && !onRim) continue;
        layout.push({
          x: (ix - (side - 1) / 2) * PITCH,
          y,
          z: (iz - (side - 1) / 2) * PITCH,
          course,
        });
      }
    }
  }

  layout.sort((a, b) => b.y - a.y || a.z - b.z || a.x - b.x);

  layout.forEach((spot, index) => {
    const material = new THREE.MeshStandardMaterial({
      color: palette[Math.floor(unit(index) * palette.length)],
      roughness: 0.78 + unit(index + 2) * 0.18,
      metalness: 0.02,
    });
    materials.push(material);

    const mesh = new THREE.Mesh(geometry, material);
    const home = new THREE.Vector3(spot.x, spot.y, spot.z);
    mesh.position.copy(home);

    const length = Math.hypot(spot.x, spot.z);
    const dirX = length < 0.001 ? 1 : spot.x / length;
    const dirZ = length < 0.001 ? 0 : spot.z / length;
    const reach = 2.6 + spot.course * 0.42;
    const jitter = unit(index + 5);
    const out = new THREE.Vector3(
      spot.x + dirX * reach,
      spot.y + 0.35 + jitter * 0.55,
      spot.z + dirZ * reach,
    );

    const stone: PyramidStone = {
      mesh,
      home,
      out,
      arc: 0.85 + jitter * 0.7,
      spin: (jitter - 0.5) * 1.4,
      tilt: (unit(index + 11) - 0.5) * 0.5,
      lift: { value: 0 },
      manual: { value: 0, active: false },
    };
    mesh.userData.stone = stone;
    scene.add(mesh);
    stones.push(stone);
  });

  const groundGeometry = new THREE.CircleGeometry(18, 48);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 1, metalness: 0 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  return {
    scene,
    camera,
    stones,
    cameraState,
    dispose() {
      geometry.dispose();
      groundGeometry.dispose();
      groundMaterial.dispose();
      materials.forEach((material) => material.dispose());
    },
  };
}
