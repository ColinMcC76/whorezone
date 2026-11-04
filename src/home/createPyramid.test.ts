import { describe, expect, it } from 'vitest';
import { createPyramid } from './createPyramid';

describe('createPyramid', () => {
  it('builds about a hundred stones and does not tag them with routes', () => {
    const pyramid = createPyramid();
    expect(pyramid.stones.length).toBeGreaterThan(90);
    expect(pyramid.stones.length).toBeLessThan(140);
    expect(new Set(pyramid.stones.map((stone) => stone.home.y)).size).toBe(8);

    for (const stone of pyramid.stones) {
      expect(stone).not.toHaveProperty('route');
      expect(stone.mesh.userData).not.toHaveProperty('route');
      expect(stone.lift.value).toBe(0);
      expect(stone.manual.active).toBe(false);
    }

    pyramid.dispose();
  });
});
