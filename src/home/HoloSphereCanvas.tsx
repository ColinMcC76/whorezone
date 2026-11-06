import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
  MAX_ZOOM_FACTOR,
  MIN_ZOOM_FACTOR,
  SPHERE_RADIUS,
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

/** Soft radial dim — light-mode black-hole falloff that darkens white toward the sphere. */
const BlackHoleDimShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uAspect: { value: 1 },
    uRadius: { value: 0.46 },
    uStrength: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uCenter;
    uniform float uAspect;
    uniform float uRadius;
    uniform float uStrength;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 delta = vUv - uCenter;
      delta.x *= uAspect;
      float dist = length(delta);
      float falloff = smoothstep(uRadius, uRadius * 0.12, dist);
      float dim = 1.0 - uStrength * falloff;
      gl_FragColor = vec4(color.rgb * dim, color.a);
    }
  `,
};

function blackHoleStrengthFor(theme: SiteTheme, reduceMotion: boolean) {
  if (theme !== 'light') return 0;
  return reduceMotion ? 0.28 : 0.52;
}

type HoloSphereCanvasProps = {
  interactive?: boolean;
  reduceMotion: boolean;
  theme: SiteTheme;
};

const LOOK_AT = new THREE.Vector3(0, 0, 0);
const WORLD_UP = new THREE.Vector3(0, 1, 0);
/** Gentle continuous spin around world Y when idle (rad/s) — full turn ~52s. */
export const FREE_SPIN_YAW = 0.12;
export const MAX_ANGULAR_SPEED = 9;
export const YAW_SETTLE = 1.8;
/** Ignore stale pointer samples so a pause before release doesn't kill the flick. */
export const FLICK_SAMPLE_MAX_DT = 0.085;
export const FLICK_RELEASE_WINDOW_MS = 120;

const scratchRight = new THREE.Vector3();
const scratchUp = new THREE.Vector3();
const scratchAxis = new THREE.Vector3();
const scratchSample = new THREE.Vector3();
const scratchQuat = new THREE.Quaternion();
const scratchOffset = new THREE.Vector3();
const freeSpinTarget = new THREE.Vector3(0, FREE_SPIN_YAW, 0);

/** Resolve world-space angular velocity when the pointer is released after an orbit drag. */
export function releaseOrbitAngularVelocity(args: {
  reduceMotion: boolean;
  moved: boolean;
  flick: THREE.Vector3;
  flickAgeMs: number;
  freeSpin?: THREE.Vector3;
  releaseWindowMs?: number;
}) {
  const freeSpin = args.freeSpin ?? freeSpinTarget;
  const windowMs = args.releaseWindowMs ?? FLICK_RELEASE_WINDOW_MS;
  if (args.reduceMotion) return new THREE.Vector3(0, 0, 0);
  if (!args.moved) return freeSpin.clone();
  if (args.flickAgeMs <= windowMs && args.flick.length() > FREE_SPIN_YAW * 0.35) {
    const out = args.flick.clone();
    if (out.length() > MAX_ANGULAR_SPEED) out.setLength(MAX_ANGULAR_SPEED);
    return out;
  }
  return freeSpin.clone();
}

/** Drift angular velocity toward idle free spin around world Y. */
export function settleAngularVelocity(
  angularVelocity: THREE.Vector3,
  delta: number,
  freeSpin: THREE.Vector3 = freeSpinTarget,
) {
  const t = Math.min(1, YAW_SETTLE * delta);
  angularVelocity.x += (freeSpin.x - angularVelocity.x) * t;
  angularVelocity.y += (freeSpin.y - angularVelocity.y) * t;
  angularVelocity.z += (freeSpin.z - angularVelocity.z) * t;
  return angularVelocity;
}

function bloomStrengthFor(theme: SiteTheme, reduceMotion: boolean) {
  if (reduceMotion) return theme === 'dark' ? 0.096 : 0.02;
  // Light mode stays soft so near-black orbs don't bloom into grey haze.
  return theme === 'dark' ? 0.288 : 0.055;
}

/** Trackball placement — orientation can tumble past the poles with no hard stops. */
function placeCamera(camera: THREE.PerspectiveCamera, state: HoloSphereHandle['cameraState']) {
  scratchOffset.set(0, 0, state.distance).applyQuaternion(state.orientation);
  camera.position.copy(scratchOffset);
  camera.up.copy(WORLD_UP).applyQuaternion(state.orientation).normalize();
  camera.lookAt(LOOK_AT);
}

function applyAngularDelta(
  orientation: THREE.Quaternion,
  axis: THREE.Vector3,
  angle: number,
) {
  if (Math.abs(angle) < 1e-8 || axis.lengthSq() < 1e-12) return;
  scratchQuat.setFromAxisAngle(axis, angle);
  orientation.premultiply(scratchQuat).normalize();
}

export default function HoloSphereCanvas({
  interactive = true,
  reduceMotion,
  theme,
}: HoloSphereCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const holoRef = useRef<HoloSphereHandle | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bloomRef = useRef<UnrealBloomPass | null>(null);
  const dimPassRef = useRef<ShaderPass | null>(null);
  const themeRef = useRef(theme);
  const reduceMotionRef = useRef(reduceMotion);
  const interactiveRef = useRef(interactive);
  themeRef.current = theme;
  reduceMotionRef.current = reduceMotion;
  interactiveRef.current = interactive;

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
    const dimPass = new ShaderPass(BlackHoleDimShader);
    dimPass.uniforms.uStrength.value = blackHoleStrengthFor(
      themeRef.current,
      reduceMotionRef.current,
    );
    dimPassRef.current = dimPass;
    composer.addPass(dimPass);
    composer.addPass(new OutputPass());

    let fitDistance = framedDistance(1, camera.fov);
    let zoomFactor = 1;
    const projectedCenter = new THREE.Vector3();

    const applyFramedCamera = () => {
      cameraState.distance = fitDistance * zoomFactor;
      placeCamera(camera, cameraState);
    };

    const updateDimCenter = () => {
      projectedCenter.copy(LOOK_AT).project(camera);
      dimPass.uniforms.uCenter.value.set(
        projectedCenter.x * 0.5 + 0.5,
        projectedCenter.y * 0.5 + 0.5,
      );
      const halfFov = THREE.MathUtils.degToRad(camera.fov) * 0.5;
      const visibleHeight = 2 * Math.tan(halfFov) * cameraState.distance;
      const radiusUv = (SPHERE_RADIUS * 1.35) / Math.max(visibleHeight, 0.001);
      dimPass.uniforms.uRadius.value = THREE.MathUtils.clamp(radiusUv, 0.28, 0.62);
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
      dimPass.uniforms.uAspect.value = width / Math.max(height, 1);
      applyFramedCamera();
      updateDimCenter();
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
    const angularVelocity = reduceMotionRef.current
      ? new THREE.Vector3(0, 0, 0)
      : freeSpinTarget.clone();
    const flick = new THREE.Vector3(0, 0, 0);
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
      if (!interactiveRef.current || event.button !== 0) return;
      pointerDown = true;
      orbiting = false;
      moved = false;
      lastX = event.clientX;
      lastY = event.clientY;
      lastSampleAt = performance.now();
      flick.set(0, 0, 0);
      lastFlickAt = 0;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!interactiveRef.current) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;

      if (pointerDown) {
        if (!moved && Math.abs(dx) + Math.abs(dy) > 3) {
          moved = true;
          orbiting = true;
          // Grabbing the sphere pauses idle spin; flick velocity is sampled while dragging.
          angularVelocity.set(0, 0, 0);
          setHover(holo, null);
        }
        if (orbiting) {
          const now = performance.now();
          const dt = Math.max(1 / 120, (now - lastSampleAt) / 1000);
          lastSampleAt = now;

          // Camera-local axes in world space — no pitch clamps, poles are free to tumble through.
          scratchRight.set(1, 0, 0).applyQuaternion(cameraState.orientation).normalize();
          scratchUp.set(0, 1, 0).applyQuaternion(cameraState.orientation).normalize();
          const yawDelta = -dx * 0.01;
          const pitchDelta = -dy * 0.006;
          applyAngularDelta(cameraState.orientation, scratchUp, yawDelta);
          applyAngularDelta(cameraState.orientation, scratchRight, pitchDelta);

          if (Math.hypot(dx, dy) >= 1 && dt <= FLICK_SAMPLE_MAX_DT) {
            scratchSample
              .copy(scratchUp)
              .multiplyScalar(yawDelta / dt)
              .addScaledVector(scratchRight, pitchDelta / dt);
            flick.lerp(scratchSample, 0.7);
            if (flick.length() > MAX_ANGULAR_SPEED) flick.setLength(MAX_ANGULAR_SPEED);
            lastFlickAt = now;
            angularVelocity.copy(flick);
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
      if (!interactiveRef.current) return;
      if (!pointerDown) setHover(holo, null);
    };

    const onWheel = (event: WheelEvent) => {
      if (!interactiveRef.current) return;
      event.preventDefault();
      zoomFactor = THREE.MathUtils.clamp(
        zoomFactor * Math.exp(event.deltaY * 0.00115),
        MIN_ZOOM_FACTOR,
        MAX_ZOOM_FACTOR,
      );
      applyFramedCamera();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!interactiveRef.current) return;
      if (pointerDown && !moved && !reduceMotionRef.current) {
        const hit = hitBall(event);
        if (hit) {
          pushPoke(holo, hit.point, clock);
        }
      }

      if (pointerDown) {
        angularVelocity.copy(
          releaseOrbitAngularVelocity({
            reduceMotion: reduceMotionRef.current,
            moved,
            flick,
            flickAgeMs: performance.now() - lastFlickAt,
          }),
        );
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
          angularVelocity.set(0, 0, 0);
        } else {
          settleAngularVelocity(angularVelocity, delta);
          const speed = angularVelocity.length();
          if (speed > 1e-5) {
            scratchAxis.copy(angularVelocity).multiplyScalar(1 / speed);
            applyAngularDelta(cameraState.orientation, scratchAxis, speed * delta);
          }
        }
      }

      stepSwarm(holo, clock, delta, reduceMotionRef.current);
      placeCamera(camera, cameraState);
      updateDimCenter();
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
      dimPassRef.current = null;
      canvas.remove();
    };
  }, []);

  useEffect(() => {
    const holo = holoRef.current;
    const renderer = rendererRef.current;
    const bloom = bloomRef.current;
    const dimPass = dimPassRef.current;
    if (!holo || !renderer) return;
    paintHoloSphere(holo, theme);
    renderer.setClearColor(theme === 'dark' ? 0x0a0a0a : 0xf4f4f4, 1);
    if (bloom) {
      bloom.strength = bloomStrengthFor(theme, reduceMotion);
      bloom.threshold = theme === 'dark' ? 0.55 : 0.72;
    }
    if (dimPass) {
      dimPass.uniforms.uStrength.value = blackHoleStrengthFor(theme, reduceMotion);
    }
  }, [theme, reduceMotion]);

  useEffect(() => {
    const host = hostRef.current;
    const holo = holoRef.current;
    if (host) {
      host.style.pointerEvents = interactive ? 'auto' : 'none';
      const canvas = host.querySelector('canvas');
      if (canvas instanceof HTMLCanvasElement) {
        canvas.style.pointerEvents = interactive ? 'auto' : 'none';
        canvas.style.cursor = interactive ? 'grab' : 'default';
        canvas.style.touchAction = interactive ? 'none' : 'auto';
      }
    }
    if (!interactive && holo) setHover(holo, null);
  }, [interactive]);

  return (
    <div
      ref={hostRef}
      className="landing-canvas-host"
      aria-hidden="true"
      style={{ pointerEvents: interactive ? 'auto' : 'none' }}
    />
  );
}
