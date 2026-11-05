import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  FREE_SPIN_YAW,
  releaseOrbitAngularVelocity,
  settleAngularVelocity,
} from './HoloSphereCanvas';

describe('orbit inertia helpers', () => {
  it('resumes free spin after a stationary click', () => {
    const released = releaseOrbitAngularVelocity({
      reduceMotion: false,
      moved: false,
      flick: new THREE.Vector3(0, 0, 0),
      flickAgeMs: 0,
    });
    expect(released.x).toBeCloseTo(0);
    expect(released.y).toBeCloseTo(FREE_SPIN_YAW);
    expect(released.z).toBeCloseTo(0);
  });

  it('carries a fresh flick after release', () => {
    const flick = new THREE.Vector3(0.4, 2.4, -0.5);
    const released = releaseOrbitAngularVelocity({
      reduceMotion: false,
      moved: true,
      flick,
      flickAgeMs: 40,
    });
    expect(released.x).toBeCloseTo(0.4);
    expect(released.y).toBeCloseTo(2.4);
    expect(released.z).toBeCloseTo(-0.5);
  });

  it('resumes free spin when the flick went stale before release', () => {
    const released = releaseOrbitAngularVelocity({
      reduceMotion: false,
      moved: true,
      flick: new THREE.Vector3(0.4, 2.4, -0.5),
      flickAgeMs: 400,
    });
    expect(released.x).toBeCloseTo(0);
    expect(released.y).toBeCloseTo(FREE_SPIN_YAW);
    expect(released.z).toBeCloseTo(0);
  });

  it('disables spin under reduced motion', () => {
    const released = releaseOrbitAngularVelocity({
      reduceMotion: true,
      moved: true,
      flick: new THREE.Vector3(1, 3, 1),
      flickAgeMs: 10,
    });
    expect(released.length()).toBe(0);
  });

  it('settles angular velocity toward free spin on world Y', () => {
    const angular = new THREE.Vector3(2, 3, -1);
    for (let i = 0; i < 480; i += 1) settleAngularVelocity(angular, 1 / 60);
    expect(angular.x).toBeCloseTo(0, 2);
    expect(angular.y).toBeCloseTo(FREE_SPIN_YAW, 2);
    expect(angular.z).toBeCloseTo(0, 2);

    angular.set(0, 0, 0);
    for (let i = 0; i < 480; i += 1) settleAngularVelocity(angular, 1 / 60);
    expect(angular.y).toBeCloseTo(FREE_SPIN_YAW, 2);
  });
});
