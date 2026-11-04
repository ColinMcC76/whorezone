import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { applyStonePose, createPyramid, paintPyramid, type PyramidHandle, type PyramidStone, type SiteTheme } from './createPyramid';

gsap.registerPlugin(ScrollTrigger);

type PyramidCanvasProps = {
  scrollRef: React.RefObject<HTMLElement | null>;
  reduceMotion: boolean;
  theme: SiteTheme;
};

function displayedLift(stone: PyramidStone) {
  return stone.manual.active ? stone.manual.value : stone.lift.value;
}

function toggleStone(stone: PyramidStone) {
  const current = displayedLift(stone);
  const target = current > 0.5 ? 0 : 1;
  gsap.killTweensOf(stone.manual);
  stone.manual.value = current;
  stone.manual.active = true;
  gsap.to(stone.manual, {
    value: target,
    duration: 0.9,
    ease: 'power2.inOut',
  });
}

export default function PyramidCanvas({ scrollRef, reduceMotion, theme }: PyramidCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pyramidRef = useRef<PyramidHandle | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const scroll = scrollRef.current;
    if (!host || !scroll) return;

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

    const resize = () => {
      const width = host.clientWidth || scroll.clientWidth || 1;
      const height = host.clientHeight || window.innerHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    const placeCamera = () => {
      camera.position.set(
        Math.sin(cameraState.yaw) * cameraState.distance,
        cameraState.height,
        Math.cos(cameraState.yaw) * cameraState.distance,
      );
      camera.lookAt(0, 2.15, 0);
    };

    placeCamera();

    let frame = 0;
    const loop = () => {
      frame = window.requestAnimationFrame(loop);
      for (const stone of stones) applyStonePose(stone);
      placeCamera();
      renderer.render(scene, camera);
    };
    loop();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const meshes = stones.map((stone) => stone.mesh);

    const pick = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return undefined;
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(meshes, false)[0]?.object as THREE.Mesh | undefined;
    };

    const onMove = (event: PointerEvent) => {
      if (reduceMotion) return;
      canvas.style.cursor = pick(event) ? 'pointer' : 'default';
    };

    const onClick = (event: PointerEvent) => {
      if (reduceMotion) return;
      const mesh = pick(event);
      const stone = mesh?.userData.stone as PyramidStone | undefined;
      if (stone) toggleStone(stone);
    };

    if (!reduceMotion) {
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('click', onClick);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(host);

    const distance = stones.length * 42;
    if (!reduceMotion) scroll.style.setProperty('--landing-distance', `${distance}px`);

    const context = reduceMotion
      ? undefined
      : gsap.context(() => {
          const timeline = gsap.timeline();
          const stagger = 0.12;
          const liftDuration = 0.85;
          stones.forEach((stone, index) => {
            timeline.to(
              stone.lift,
              { value: 1, duration: liftDuration, ease: 'power2.inOut' },
              index * stagger,
            );
          });
          const total = Math.max((stones.length - 1) * stagger + liftDuration, 0.01);
          timeline.to(
            cameraState,
            {
              yaw: cameraState.yaw + 0.85,
              height: cameraState.height + 2.1,
              distance: cameraState.distance + 4,
              duration: total,
              ease: 'none',
            },
            0,
          );
          ScrollTrigger.create({
            trigger: scroll,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.65,
            animation: timeline,
          });
        }, scroll);

    return () => {
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('click', onClick);
      observer.disconnect();
      context?.revert();
      stones.forEach((stone) => {
        gsap.killTweensOf(stone.manual);
        gsap.killTweensOf(stone.lift);
      });
      scroll.style.removeProperty('--landing-distance');
      pyramid.dispose();
      renderer.dispose();
      pyramidRef.current = null;
      rendererRef.current = null;
      canvas.remove();
      window.scrollTo(0, 0);
    };
  }, [scrollRef, reduceMotion]);

  useEffect(() => {
    const pyramid = pyramidRef.current;
    const renderer = rendererRef.current;
    if (!pyramid || !renderer) return;
    paintPyramid(pyramid, theme);
    renderer.setClearColor(theme === 'dark' ? 0x0a0a0a : 0xf4f4f4, 1);
  }, [theme]);

  return <div ref={hostRef} className="landing-canvas-host" aria-hidden="true" />;
}
