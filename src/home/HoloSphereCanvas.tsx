import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
  MAX_ZOOM_FACTOR,
  MIN_ZOOM_FACTOR,
  chooseSwarmCount,
  createHoloSphere,
  framedDistance,
  paintHoloSphere,
  pushPoke,
  setHover,
  stepSwarm,
  type HoloSphereHandle,
  type SiteTheme,
} from './createHoloSphere';

type HoloSphereCanvasProps = {
  reduceMotion: boolean;
  theme: SiteTheme;
};

const LOOK_AT = new THREE.Vector3(0, 0, 0);
/** Gentle continuous yaw spin when idle (rad/s) — full turn ~22s. */
export const FREE_SPIN_YAW = 0.28;
export const MAX_YAW_VELOCITY = 8.5;
export const MAX_PITCH_VELOCITY = 3.5;
export const YAW_SETTLE = 1.8;
const PITCH_DAMP = 3.4;
/** Ignore stale pointer samples so a paused drag still flings from the last real motion. */
export const FLICK_SAMPLE_MAX_DT = 0.085;
export const FLICK_RELEASE_WINDOW_MS = 120;

/** Resolve yaw/pitch velocity when the pointer is released after an orbit drag. */
export function releaseOrbitVelocity(args: {
  reduceMotion: boolean;
  moved: boolean;
  flickYaw: number;
  flickPitch: number;
  flickAgeMs: number;
  freeSpinYaw?: number;
  releaseWindowMs?: number;
}) {
  const freeSpin = args.freeSpinYaw ?? FREE_SPIN_YAW;
  const windowMs = args.releaseWindowMs ?? FLICK_RELEASE_WINDOW_MS;
  if (args.reduceMotion) return { yawVelocity: 0, pitchVelocity: 0 };
  if (!args.moved) return { yawVelocity: freeSpin, pitchVelocity: 0 };
  if (args.flickAgeMs <= windowMs && Math.abs(args.flickYaw) > freeSpin * 0.35) {
    return {
      yawVelocity: THREE.MathUtils.clamp(args.flickYaw, -MAX_YAW_VELOCITY, MAX_YAW_VELOCITY),
      pitchVelocity: THREE.MathUtils.clamp(args.flickPitch, -MAX_PITCH_VELOCITY, MAX_PITCH_VELOCITY),
    };
  }
  return { yawVelocity: freeSpin, pitchVelocity: 0 };
}

/** Drift yaw velocity toward idle free spin. */
export function settleYawVelocity(yawVelocity: number, delta: number, freeSpinYaw = FREE_SPIN_YAW) {
  return yawVelocity + (freeSpinYaw - yawVelocity) * Math.min(1, YAW_SETTLE * delta);
}

function bloomStrengthFor(theme: SiteTheme, reduceMotion: boolean) {
  if (reduceMotion) return theme === 'dark' ? 0.096 : 0.036;
  return theme === 'dark' ? 0.288 : 0.12;
}

function placeCamera(camera: THREE.PerspectiveCamera, state: HoloSphereHandle['cameraState']) {
  const cosPitch = Math.cos(state.pitch);
  camera.position.set(
    Math.sin(state.yaw) * state.distance * cosPitch,
    Math.sin(state.pitch) * state.distance,
    Math.cos(state.yaw) * state.distance * cosPitch,
  );
  camera.lookAt(LOOK_AT);
}

export default function HoloSphereCanvas({ reduceMotion, theme }: HoloSphereCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const holoRef = useRef<HoloSphereHandle | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bloomRef = useRef<UnrealBloomPass | null>(null);
  const themeRef = useRef(theme);
  const reduceMotionRef = useRef(reduceMotion);
  themeRef.current = theme;
  reduceMotionRef.current = reduceMotion;

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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    rendererRef.current = renderer;

    const count = chooseSwarmCount();
    const holo = createHoloSphere(count);
    holoRef.current = holo;
    paintHoloSphere(holo, themeRef.current);
    renderer.setClearColor(themeRef.current === 'dark' ? 0x0a0a0a : 0xf4f4f4, 1);
    const { scene, camera, hitSphere, cameraState } = holo;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      bloomStrengthFor(themeRef.current, reduceMotionRef.current),
      0.32,
      themeRef.current === 'dark' ? 0.55 : 0.68,
    );
    bloomRef.current = bloomPass;
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    let fitDistance = framedDistance(1, camera.fov);
    let zoomFactor = 1;

    const applyFramedCamera = () => {
      cameraState.distance = fitDistance * zoomFactor;
      placeCamera(camera, cameraState);
    };

    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || window.innerHeight || 1;
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      bloomPass.resolution.set(width, height);
      camera.aspect = width / height;
      // Narrow/tall phones need a wider FOV so the ball still reads large without clipping.
      camera.fov = width / height < 0.72 ? 46 : 38;
      camera.updateProjectionMatrix();
      fitDistance = framedDistance(camera.aspect, camera.fov);
      applyFramedCamera();
    };
    resize();
    stepSwarm(holo, 0, 0, reduceMotionRef.current);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let orbiting = false;
    let pointerDown = false;
    let moved = false;
    let lastX = 0;
    let lastY = 0;
    let lastSampleAt = performance.now();
    let yawVelocity = reduceMotionRef.current ? 0 : FREE_SPIN_YAW;
    let pitchVelocity = 0;
    let flickYaw = 0;
    let flickPitch = 0;
    let lastFlickAt = 0;
    let clock = 0;

    const setPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      return true;
    };

    const hitBall = (event: PointerEvent) => {
      if (!setPointer(event)) return null;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(hitSphere, false);
      return hits[0] ?? null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      pointerDown = true;
      orbiting = false;
      moved = false;
      lastX = event.clientX;
      lastY = event.clientY;
      lastSampleAt = performance.now();
      flickYaw = 0;
      flickPitch = 0;
      lastFlickAt = 0;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (event: PointerEvent) => {
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;

      if (pointerDown) {
        if (!moved && Math.abs(dx) + Math.abs(dy) > 3) {
          moved = true;
          orbiting = true;
          // Grabbing the sphere pauses idle spin; flick velocity is sampled while dragging.
          yawVelocity = 0;
          pitchVelocity = 0;
          setHover(holo, null);
        }
        if (orbiting) {
          const now = performance.now();
          const dt = Math.max(1 / 120, (now - lastSampleAt) / 1000);
          lastSampleAt = now;
          const yawDelta = -dx * 0.01;
          const pitchDelta = dy * 0.006;
          // Drag anywhere — including on the sphere — orbits the view.
          cameraState.yaw += yawDelta;
          cameraState.pitch = THREE.MathUtils.clamp(cameraState.pitch + pitchDelta, -0.85, 1.1);
          // Only trust fresh, meaningful samples so a pause before release doesn't kill the flick.
          if (Math.hypot(dx, dy) >= 1 && dt <= FLICK_SAMPLE_MAX_DT) {
            flickYaw = THREE.MathUtils.clamp(
              THREE.MathUtils.lerp(flickYaw, yawDelta / dt, 0.7),
              -MAX_YAW_VELOCITY,
              MAX_YAW_VELOCITY,
            );
            flickPitch = THREE.MathUtils.clamp(
              THREE.MathUtils.lerp(flickPitch, pitchDelta / dt, 0.7),
              -MAX_PITCH_VELOCITY,
              MAX_PITCH_VELOCITY,
            );
            lastFlickAt = now;
            yawVelocity = flickYaw;
            pitchVelocity = flickPitch;
          }
          placeCamera(camera, cameraState);
        }
        return;
      }

      const hit = hitBall(event);
      if (hit && !reduceMotionRef.current) {
        setHover(holo, hit.point);
        canvas.style.cursor = 'pointer';
      } else {
        setHover(holo, null);
        canvas.style.cursor = 'grab';
      }
    };

    const onPointerLeave = () => {
      if (!pointerDown) setHover(holo, null);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomFactor = THREE.MathUtils.clamp(
        zoomFactor * Math.exp(event.deltaY * 0.00115),
        MIN_ZOOM_FACTOR,
        MAX_ZOOM_FACTOR,
      );
      applyFramedCamera();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (pointerDown && !moved && !reduceMotionRef.current) {
        const hit = hitBall(event);
        if (hit) {
          pushPoke(holo, hit.point, clock);
        }
      }

      if (pointerDown) {
        const released = releaseOrbitVelocity({
          reduceMotion: reduceMotionRef.current,
          moved,
          flickYaw,
          flickPitch,
          flickAgeMs: performance.now() - lastFlickAt,
        });
        yawVelocity = released.yawVelocity;
        pitchVelocity = released.pitchVelocity;
      }

      orbiting = false;
      pointerDown = false;
      const hit = hitBall(event);
      if (hit && !reduceMotionRef.current) {
        setHover(holo, hit.point);
        canvas.style.cursor = 'pointer';
      } else {
        setHover(holo, null);
        canvas.style.cursor = 'grab';
      }
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.style.cursor = 'grab';
    canvas.style.touchAction = 'none';

    const observer = new ResizeObserver(resize);
    observer.observe(host);

    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      frame = window.requestAnimationFrame(loop);
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += delta;

      if (!pointerDown) {
        if (reduceMotionRef.current) {
          yawVelocity = 0;
          pitchVelocity = 0;
        } else {
          // Drift flick momentum back toward the idle free spin.
          yawVelocity = settleYawVelocity(yawVelocity, delta);
          pitchVelocity *= Math.exp(-PITCH_DAMP * delta);
          if (Math.abs(pitchVelocity) < 0.001) pitchVelocity = 0;
          cameraState.yaw += yawVelocity * delta;
          const nextPitch = cameraState.pitch + pitchVelocity * delta;
          if (nextPitch <= -0.85 || nextPitch >= 1.1) pitchVelocity = 0;
          cameraState.pitch = THREE.MathUtils.clamp(nextPitch, -0.85, 1.1);
        }
      }

      stepSwarm(holo, clock, delta, reduceMotionRef.current);
      placeCamera(camera, cameraState);
      composer.render();
    };
    loop(performance.now());

    return () => {
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('wheel', onWheel);
      observer.disconnect();
      holo.dispose();
      composer.dispose();
      renderer.dispose();
      holoRef.current = null;
      rendererRef.current = null;
      bloomRef.current = null;
      canvas.remove();
    };
  }, []);

  useEffect(() => {
    const holo = holoRef.current;
    const renderer = rendererRef.current;
    const bloom = bloomRef.current;
    if (!holo || !renderer) return;
    paintHoloSphere(holo, theme);
    renderer.setClearColor(theme === 'dark' ? 0x0a0a0a : 0xf4f4f4, 1);
    if (bloom) {
      bloom.strength = bloomStrengthFor(theme, reduceMotion);
      bloom.threshold = theme === 'dark' ? 0.55 : 0.68;
    }
  }, [theme, reduceMotion]);

  return <div ref={hostRef} className="landing-canvas-host" aria-hidden="true" />;
}
