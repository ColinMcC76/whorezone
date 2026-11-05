import { describe, expect, it } from 'vitest';
import { createPyramid, findNearestEmptySeat, COURSES } from './createPyramid';
import * as THREE from 'three';

describe('createPyramid', () => {
  it('builds a simpler solid pyramid with fixed brick colors and no routes', () => {
    const pyramid = createPyramid();
    const expected = (COURSES * (COURSES + 1) * (2 * COURSES + 1)) / 6;
    expect(pyramid.stones.length).toBe(expected);
    expect(pyramid.seats.length).toBe(expected);
    expect(new Set(pyramid.stones.map((stone) => stone.home.y)).size).toBe(COURSES);

    for (const stone of pyramid.stones) {
      expect(stone).not.toHaveProperty('route');
      expect(stone.mesh.userData).not.toHaveProperty('route');
      expect(stone.seatId).toBe(stone.id);
      expect(stone.color).toBeGreaterThan(0);
    }

    pyramid.dispose();
  });

  it('snaps only to empty seats', () => {
    const pyramid = createPyramid();
    const first = pyramid.stones[0];
    first.seatId = null;
    const near = findNearestEmptySeat(pyramid, first.home.clone().add(new THREE.Vector3(0.1, 0, 0)));
    expect(near).toBe(first.id);

    first.seatId = first.id;
    const occupied = findNearestEmptySeat(pyramid, first.home);
    expect(occupied).toBeNull();
    pyramid.dispose();
  });
});
