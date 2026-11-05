import * as THREE from 'three';

export const COURSES = 5;
export const PITCH = 0.92;
export const BLOCK_SIZE = { x: 0.78, y: 0.5, z: 0.78 };
export const SNAP_RADIUS = 0.72;

const LEGO_COLORS = [0xc91a09, 0xf5cd2f, 0x0055bf, 0x237841, 0xfe8a18, 0xf2f3f2];

export type SiteTheme = 'light' | 'dark';

export type PyramidStone = {
  id: number;
  mesh: THREE.Mesh;
  home: THREE.Vector3;
  color: number;
  /** Seat currently occupied by this brick, or null when free on the floor. */
  seatId: number | null;
};

export type PyramidHandle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  stones: PyramidStone[];
  seats: THREE.Vector3[];
  ground: THREE.MeshStandardMaterial;
  cameraState: { yaw: number; pitch: number; distance: number };
  dispose: () => void;
};

function unit(index: number) {
  const value = Math.sin(index * 127.1 + 1.7) * 43758.5453;
  return value - Math.floor(value);
}

export function createPyramid(): PyramidHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  scene.fog = new THREE.Fog(0x0a0a0a, 16, 38);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  const cameraState = { yaw: 0.62, pitch: 0.42, distance: 12.5 };

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(8, 14, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.55);
  rim.position.set(-10, 6, -8);
  scene.add(rim);

  const geometry = new THREE.BoxGeometry(BLOCK_SIZE.x, BLOCK_SIZE.y, BLOCK_SIZE.z);
  const materials: THREE.MeshStandardMaterial[] = [];
  const stones: PyramidStone[] = [];
  const seats: THREE.Vector3[] = [];

  for (let course = 0; course < COURSES; course += 1) {
    const side = course + 1;
    const y = (COURSES - 1 - course) * (BLOCK_SIZE.y + 0.02) + BLOCK_SIZE.y / 2;
    for (let ix = 0; ix < side; ix += 1) {
      for (let iz = 0; iz < side; iz += 1) {
        seats.push(
          new THREE.Vector3(
            (ix - (side - 1) / 2) * PITCH,
            y,
            (iz - (side - 1) / 2) * PITCH,
          ),
        );
      }
    }
  }

  seats.forEach((home, index) => {
    const color = LEGO_COLORS[Math.floor(unit(index) * LEGO_COLORS.length)];
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.45,
      metalness: 0.05,
    });
    materials.push(material);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(home);
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    const stone: PyramidStone = {
      id: index,
      mesh,
      home: home.clone(),
      color,
      seatId: index,
    };
    mesh.userData.stoneId = index;
    scene.add(mesh);
    stones.push(stone);
  });

  const groundGeometry = new THREE.CircleGeometry(16, 48);
  const ground = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1, metalness: 0 });
  const groundMesh = new THREE.Mesh(groundGeometry, ground);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -0.02;
  scene.add(groundMesh);

  const handle: PyramidHandle = {
    scene,
    camera,
    stones,
    seats,
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
    material.color.setHex(stone.color);
  }
}

export function findNearestEmptySeat(
  pyramid: PyramidHandle,
  point: THREE.Vector3,
  radius = SNAP_RADIUS,
): number | null {
  let bestId: number | null = null;
  let bestDist = radius;
  const occupied = new Set(
    pyramid.stones.map((stone) => stone.seatId).filter((id): id is number => id !== null),
  );

  pyramid.seats.forEach((seat, id) => {
    if (occupied.has(id)) return;
    const dist = seat.distanceTo(point);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = id;
    }
  });

  return bestId;
}
