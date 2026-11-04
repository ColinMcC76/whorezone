import * as THREE from 'three';

const COURSES = 8;
const PITCH = 0.92;
const BLOCK = 0.78;

export type SiteTheme = 'light' | 'dark';

export type PyramidStone = {
  mesh: THREE.Mesh;
  home: THREE.Vector3;
  out: THREE.Vector3;
  arc: number;
  spin: number;
  tilt: number;
  tone: number;
  /** Scroll timeline writes this. 0 is seated, 1 is lifted off. */
  lift: { value: number };
  /** Click writes this and, while active, it wins over the scroll timeline. */
  manual: { value: number; active: boolean };
};

export type PyramidHandle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  stones: PyramidStone[];
  ground: THREE.MeshStandardMaterial;
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

  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(8, 14, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.7);
  rim.position.set(-10, 6, -8);
  scene.add(rim);

  const geometry = new THREE.BoxGeometry(BLOCK, BLOCK * 0.62, BLOCK);
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
    const tone = unit(index);
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.78 + unit(index + 2) * 0.18,
      metalness: 0.04,
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
      tone,
      lift: { value: 0 },
      manual: { value: 0, active: false },
    };
    mesh.userData.stone = stone;
    scene.add(mesh);
    stones.push(stone);
  });

  const groundGeometry = new THREE.CircleGeometry(18, 48);
  const ground = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1, metalness: 0 });
  const groundMesh = new THREE.Mesh(groundGeometry, ground);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -0.02;
  scene.add(groundMesh);

  const handle: PyramidHandle = {
    scene,
    camera,
    stones,
    ground,
    cameraState,
    dispose() {
      geometry.dispose();
      groundGeometry.dispose();
      ground.dispose();
      materials.forEach((material) => material.dispose());
    },
  };
  paintPyramid(handle, 'dark');
  return handle;
}

export function paintPyramid(pyramid: PyramidHandle, theme: SiteTheme) {
  const dark = theme === 'dark';
  const background = dark ? 0x0a0a0a : 0xf4f4f4;
  pyramid.scene.background = new THREE.Color(background);
  pyramid.scene.fog = new THREE.Fog(background, 16, 38);
  pyramid.ground.color.set(dark ? 0x111111 : 0xe4e4e4);
  for (const stone of pyramid.stones) {
    const material = stone.mesh.material as THREE.MeshStandardMaterial;
    const shade = dark ? 0.38 + stone.tone * 0.52 : 0.08 + stone.tone * 0.38;
    material.color.setScalar(shade);
  }
}
