import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
  chooseSwarmCount,
  createHoloSphere,
  paintHoloSphere,
  pushPoke,
  stepSwarm,
  type HoloSphereHandle,
  type SiteTheme,
} from './createHoloSphere';

type HoloSphereCanvasProps = {
  reduceMotion: boolean;
  theme: SiteTheme;
};

const LOOK_AT = new THREE.Vector3(0, 0, 0);

function bloomStrengthFor(theme: SiteTheme, reduceMotion: boolean) {
  if (reduceMotion) return theme === 'dark' ? 0.16 : 0.06;
  return theme === 'dark' ? 0.48 : 0.2;
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

    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || window.innerHeight || 1;
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      bloomPass.resolution.set(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    placeCamera(camera, cameraState);
    stepSwarm(holo, 0, 0, reduceMotionRef.current);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let orbiting = false;
    let pointerDown = false;
    let moved = false;
    let lastX = 0;
    let lastY = 0;
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
      moved = false;
      lastX = event.clientX;
      lastY = event.clientY;
      const hit = hitBall(event);
      if (!hit) {
        orbiting = true;
        canvas.setPointerCapture(event.pointerId);
        canvas.style.cursor = 'grabbing';
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      lastX = event.clientX;
      lastY = event.clientY;

      if (orbiting) {
        cameraState.yaw -= dx * 0.01;
        cameraState.pitch = THREE.MathUtils.clamp(cameraState.pitch + dy * 0.006, -0.85, 1.1);
        placeCamera(camera, cameraState);
        return;
      }

      if (!pointerDown) {
        canvas.style.cursor = hitBall(event) ? 'pointer' : 'grab';
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (orbiting) {
        orbiting = false;
        pointerDown = false;
        canvas.style.cursor = 'grab';
        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
        return;
      }

      if (pointerDown && !moved && !reduceMotionRef.current) {
        const hit = hitBall(event);
        if (hit) {
          pushPoke(holo, hit.point, clock, 1);
        }
      }

      pointerDown = false;
      canvas.style.cursor = hitBall(event) ? 'pointer' : 'grab';
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
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
