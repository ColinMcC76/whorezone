import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  DESKTOP_SWARM_COUNT,
  MOBILE_SWARM_COUNT,
  SPHERE_RADIUS,
  chooseSwarmCount,
  createHoloSphere,
  pushPoke,
  stepSwarm,
} from './createHoloSphere';

describe('createHoloSphere', () => {
  it('builds a fluid swarm with haze and no shell or routes', () => {
    const count = 120;
    const holo = createHoloSphere(count);
    expect(holo.swarm.count).toBe(count);
    expect(holo.count).toBe(count);
    expect(holo.homes.length).toBe(count * 3);
    expect(holo.positions.length).toBe(count * 3);
    expect(holo.velocities.length).toBe(count * 3);
    expect(holo.hitSphere).toBeTruthy();
    expect(holo.haze).toBeTruthy();
    expect(holo.hazeMaterial).toBeTruthy();
    expect(holo).not.toHaveProperty('shell');
    expect(holo.swarm.userData).not.toHaveProperty('route');

    pushPoke(holo, new THREE.Vector3(0, SPHERE_RADIUS, 0), 0.2, 1);
    expect(holo.pokes.length).toBe(1);
    stepSwarm(holo, 0.35, 0.016, false);
    expect(
      Math.abs(holo.velocities[0]) + Math.abs(holo.velocities[1]) + Math.abs(holo.velocities[2]),
    ).toBeGreaterThan(0);

    stepSwarm(holo, 0.5, 0.016, true);
    expect(holo.positions[0]).toBeCloseTo(holo.homes[0], 5);
    expect(holo.velocities[0]).toBe(0);

    holo.dispose();
  });

  it('auto-scales swarm count for phones and weak GPUs', () => {
    expect(chooseSwarmCount(1280, false, 8)).toBe(DESKTOP_SWARM_COUNT);
    expect(chooseSwarmCount(390, false, 8)).toBe(MOBILE_SWARM_COUNT);
    expect(chooseSwarmCount(1280, true, 8)).toBe(MOBILE_SWARM_COUNT);
    expect(chooseSwarmCount(1280, false, 4)).toBe(MOBILE_SWARM_COUNT);
  });
});
