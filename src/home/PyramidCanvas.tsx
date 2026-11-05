import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import gsap from 'gsap';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import {
  BLOCK_SIZE,
  createPyramid,
  findNearestEmptySeat,
  paintPyramid,
  type PyramidHandle,
  type PyramidStone,
  type SiteTheme,
} from './createPyramid';

export type PyramidCanvasHandle = {
  restack: () => void;
};

type PyramidCanvasProps = {
  reduceMotion: boolean;
  theme: SiteTheme;
};

type BodyState = {
  body: CANNON.Body;
  mode: 'seated' | 'dragging' | 'falling';
};

const LOOK_AT = new THREE.Vector3(0, 1.6, 0);
const DRAG_HEIGHT = 2.4;

function setBodyPose(body: CANNON.Body, position: THREE.Vector3, rotation = new THREE.Euler()) {
  body.position.set(position.x, position.y, position.z);
  const quat = new THREE.Quaternion().setFromEuler(rotation);
  body.quaternion.set(quat.x, quat.y, quat.z, quat.w);
  body.velocity.set(0, 0, 0);
  body.angularVelocity.set(0, 0, 0);
}

function syncMeshFromBody(stone: PyramidStone, body: CANNON.Body) {
  stone.mesh.position.set(body.position.x, body.position.y, body.position.z);
  stone.mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
}

function placeCamera(
  camera: THREE.PerspectiveCamera,
  state: PyramidHandle['cameraState'],
) {
  const cosPitch = Math.cos(state.pitch);
  camera.position.set(
    Math.sin(state.yaw) * state.distance * cosPitch,
    Math.sin(state.pitch) * state.distance + 1.2,
    Math.cos(state.yaw) * state.distance * cosPitch,
  );
  camera.lookAt(LOOK_AT);
}

const PyramidCanvas = forwardRef<PyramidCanvasHandle, PyramidCanvasProps>(function PyramidCanvas(
  { reduceMotion, theme },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pyramidRef = useRef<PyramidHandle | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bodiesRef = useRef<Map<number, BodyState>>(new Map());
  const worldRef = useRef<CANNON.World | null>(null);
  const restackFn = useRef<() => void>(() => undefined);

  useImperativeHandle(ref, () => ({
    restack: () => restackFn.current(),
  }));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'landing-canvas';
    host.appendChild(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    } catch {
      canvas.remove();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    const pyramid = createPyramid();
    pyramidRef.current = pyramid;
    paintPyramid(pyramid, theme);
    renderer.setClearColor(theme === 'dark' ? 0x0a0a0a : 0xf4f4f4, 1);
    const { scene, camera, stones, cameraState } = pyramid;

    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -18, 0) });
    world.allowSleep = true;
    world.broadphase = new CANNON.SAPBroadphase(world);
    worldRef.current = world;

    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    const boxShape = new CANNON.Box(
      new CANNON.Vec3(BLOCK_SIZE.x / 2, BLOCK_SIZE.y / 2, BLOCK_SIZE.z / 2),
    );
    const bodies = new Map<number, BodyState>();
    bodiesRef.current = bodies;

    for (const stone of stones) {
      const body = new CANNON.Body({
        mass: 1.2,
        shape: boxShape,
        linearDamping: 0.35,
        angularDamping: 0.45,
        sleepSpeedLimit: 0.18,
        sleepTimeLimit: 0.35,
      });
      setBodyPose(body, stone.home);
      body.type = CANNON.Body.KINEMATIC;
      world.addBody(body);
      bodies.set(stone.id, { body, mode: 'seated' });
      syncMeshFromBody(stone, body);
    }

    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || window.innerHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    placeCamera(camera, cameraState);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DRAG_HEIGHT);
    const hitPoint = new THREE.Vector3();
    const meshes = stones.map((stone) => stone.mesh);

    let draggingId: number | null = null;
    let orbiting = false;
    let lastX = 0;
    let lastY = 0;
    let moved = false;

    const setPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      return true;
    };

    const pickStone = (event: PointerEvent) => {
      if (!setPointer(event)) return undefined;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      if (!hit) return undefined;
      const id = hit.object.userData.stoneId as number;
      return stones.find((stone) => stone.id === id);
    };

    const seatStone = (stone: PyramidStone, seatId: number) => {
      const state = bodies.get(stone.id);
      if (!state) return;
      gsap.killTweensOf(stone.mesh.position);
      gsap.killTweensOf(stone.mesh.rotation);
      stone.seatId = seatId;
      const target = pyramid.seats[seatId];
      state.mode = 'seated';
      state.body.type = CANNON.Body.KINEMATIC;
      state.body.allowSleep = true;
      setBodyPose(state.body, target);
      syncMeshFromBody(stone, state.body);
      stone.mesh.rotation.set(0, 0, 0);
    };

    const dropStone = (stone: PyramidStone, point: THREE.Vector3) => {
      const state = bodies.get(stone.id);
      if (!state) return;
      stone.seatId = null;

      if (reduceMotion) {
        const floorPoint = new THREE.Vector3(point.x, BLOCK_SIZE.y / 2, point.z);
        state.mode = 'seated';
        state.body.type = CANNON.Body.KINEMATIC;
        setBodyPose(state.body, floorPoint);
        syncMeshFromBody(stone, state.body);
        stone.mesh.rotation.set(0, 0, 0);
        return;
      }

      state.mode = 'falling';
      state.body.type = CANNON.Body.DYNAMIC;
      state.body.wakeUp();
      setBodyPose(state.body, point);
      state.body.velocity.set(0, -1.5, 0);
      syncMeshFromBody(stone, state.body);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      moved = false;
      lastX = event.clientX;
      lastY = event.clientY;
      const stone = pickStone(event);
      if (stone) {
        draggingId = stone.id;
        stone.seatId = null;
        const state = bodies.get(stone.id);
        if (state) {
          state.mode = 'dragging';
          state.body.type = CANNON.Body.KINEMATIC;
          state.body.wakeUp();
        }
        canvas.setPointerCapture(event.pointerId);
        canvas.style.cursor = 'grabbing';
        return;
      }
      orbiting = true;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (event: PointerEvent) => {
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      lastX = event.clientX;
      lastY = event.clientY;

      if (draggingId !== null) {
        if (!setPointer(event)) return;
        raycaster.setFromCamera(pointer, camera);
        if (!raycaster.ray.intersectPlane(dragPlane, hitPoint)) return;
        const clamped = hitPoint.clone();
        clamped.y = DRAG_HEIGHT;
        clamped.x = THREE.MathUtils.clamp(clamped.x, -7, 7);
        clamped.z = THREE.MathUtils.clamp(clamped.z, -7, 7);
        const stone = stones.find((item) => item.id === draggingId);
        const state = bodies.get(draggingId);
        if (!stone || !state) return;
        setBodyPose(state.body, clamped);
        syncMeshFromBody(stone, state.body);
        return;
      }

      if (orbiting) {
        cameraState.yaw -= dx * 0.01;
        cameraState.pitch = THREE.MathUtils.clamp(cameraState.pitch + dy * 0.006, 0.18, 1.15);
        placeCamera(camera, cameraState);
        return;
      }

      canvas.style.cursor = pickStone(event) ? 'grab' : 'grab';
    };

    const onPointerUp = (event: PointerEvent) => {
      if (draggingId !== null) {
        const stone = stones.find((item) => item.id === draggingId);
        const state = bodies.get(draggingId);
        if (stone && state) {
          const release = stone.mesh.position.clone();
          const seatId = findNearestEmptySeat(pyramid, release);
          if (seatId !== null) {
            if (reduceMotion) {
              seatStone(stone, seatId);
            } else {
              const target = pyramid.seats[seatId];
              stone.seatId = seatId;
              state.mode = 'seated';
              state.body.type = CANNON.Body.KINEMATIC;
              gsap.to(stone.mesh.position, {
                x: target.x,
                y: target.y,
                z: target.z,
                duration: 0.35,
                ease: 'power2.out',
                onUpdate: () => setBodyPose(state.body, stone.mesh.position),
                onComplete: () => {
                  setBodyPose(state.body, target);
                  syncMeshFromBody(stone, state.body);
                  stone.mesh.rotation.set(0, 0, 0);
                },
              });
              gsap.to(stone.mesh.rotation, { x: 0, y: 0, z: 0, duration: 0.35, ease: 'power2.out' });
            }
          } else {
            dropStone(stone, release);
          }
        }
        draggingId = null;
      }
      orbiting = false;
      canvas.style.cursor = 'grab';
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      void moved;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.style.cursor = 'grab';
    canvas.style.touchAction = 'none';

    const observer = new ResizeObserver(resize);
    observer.observe(host);

    restackFn.current = () => {
      for (const stone of stones) {
        gsap.killTweensOf(stone.mesh.position);
        gsap.killTweensOf(stone.mesh.rotation);
        const state = bodies.get(stone.id);
        if (!state) continue;
        stone.seatId = stone.id;
        state.mode = 'seated';
        state.body.type = CANNON.Body.KINEMATIC;
        const target = pyramid.seats[stone.id];
        if (reduceMotion) {
          setBodyPose(state.body, target);
          syncMeshFromBody(stone, state.body);
          stone.mesh.rotation.set(0, 0, 0);
        } else {
          gsap.to(stone.mesh.position, {
            x: target.x,
            y: target.y,
            z: target.z,
            duration: 0.55,
            ease: 'power2.inOut',
            onUpdate: () => setBodyPose(state.body, stone.mesh.position),
            onComplete: () => {
              setBodyPose(state.body, target);
              syncMeshFromBody(stone, state.body);
            },
          });
          gsap.to(stone.mesh.rotation, { x: 0, y: 0, z: 0, duration: 0.55, ease: 'power2.inOut' });
        }
      }
    };

    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      frame = window.requestAnimationFrame(loop);
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      world.step(1 / 60, delta, 4);

      for (const stone of stones) {
        if (draggingId === stone.id) continue;
        const state = bodies.get(stone.id);
        if (!state) continue;
        if (state.mode === 'falling' || state.mode === 'dragging') {
          syncMeshFromBody(stone, state.body);
        } else if (!gsap.isTweening(stone.mesh.position)) {
          syncMeshFromBody(stone, state.body);
        }
      }

      placeCamera(camera, cameraState);
      renderer.render(scene, camera);
    };
    loop(performance.now());

    return () => {
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      observer.disconnect();
      stones.forEach((stone) => {
        gsap.killTweensOf(stone.mesh.position);
        gsap.killTweensOf(stone.mesh.rotation);
      });
      world.bodies.slice().forEach((body) => world.removeBody(body));
      pyramid.dispose();
      renderer.dispose();
      pyramidRef.current = null;
      rendererRef.current = null;
      worldRef.current = null;
      bodiesRef.current = new Map();
      canvas.remove();
    };
  }, [reduceMotion]);

  useEffect(() => {
    const pyramid = pyramidRef.current;
    const renderer = rendererRef.current;
    if (!pyramid || !renderer) return;
    paintPyramid(pyramid, theme);
    renderer.setClearColor(theme === 'dark' ? 0x0a0a0a : 0xf4f4f4, 1);
  }, [theme]);

  return <div ref={hostRef} className="landing-canvas-host" aria-hidden="true" />;
});

export default PyramidCanvas;
