import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  SWARM_COUNT,
  SPHERE_RADIUS,
  createHoloSphere,
  pushPoke,
  stepSwarm,
} from './createHoloSphere';

describe('createHoloSphere', () => {
  it('builds a swarm of glowing spheres with no shell or routes', () => {
    const holo = createHoloSphere();
    expect(holo.swarm.count).toBe(SWARM_COUNT);
    expect(holo.homes.length).toBe(SWARM_COUNT * 3);
    expect(holo.hitSphere).toBeTruthy();
    expect(holo).not.toHaveProperty('shell');
    expect(holo.swarm.userData).not.toHaveProperty('route');

    pushPoke(holo, new THREE.Vector3(0, SPHERE_RADIUS, 0), 0.2, 1);
    expect(holo.pokes.length).toBe(1);
    stepSwarm(holo, 0.35, 0.016, false);

    holo.dispose();
  });
});
