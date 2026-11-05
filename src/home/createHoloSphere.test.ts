import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  PARTICLE_COUNT,
  SPHERE_RADIUS,
  createHoloSphere,
  pushPoke,
  syncPokeUniforms,
} from './createHoloSphere';

describe('createHoloSphere', () => {
  it('builds a shell and interior particles with no route tags', () => {
    const holo = createHoloSphere();
    expect(holo.shell).toBeTruthy();
    expect(holo.particles).toBeTruthy();
    expect(holo.particlePositions.length).toBe(PARTICLE_COUNT * 3);
    expect(holo.shell.userData).not.toHaveProperty('route');

    pushPoke(holo, new THREE.Vector3(0, SPHERE_RADIUS, 0), 0.2, 1);
    syncPokeUniforms(holo, 0.2, false);
    expect(holo.pokes.length).toBe(1);

    holo.dispose();
  });
});
