import { describe, expect, it } from 'vitest';
import {
  FREE_SPIN_YAW,
  releaseOrbitVelocity,
  settleYawVelocity,
} from './HoloSphereCanvas';

describe('orbit inertia helpers', () => {
  it('resumes free spin after a stationary click', () => {
    expect(
      releaseOrbitVelocity({
        reduceMotion: false,
        moved: false,
        flickYaw: 0,
        flickPitch: 0,
        flickAgeMs: 0,
      }),
    ).toEqual({ yawVelocity: FREE_SPIN_YAW, pitchVelocity: 0 });
  });

  it('carries a fresh flick after release', () => {
    expect(
      releaseOrbitVelocity({
        reduceMotion: false,
        moved: true,
        flickYaw: 2.4,
        flickPitch: -0.5,
        flickAgeMs: 40,
      }),
    ).toEqual({ yawVelocity: 2.4, pitchVelocity: -0.5 });
  });

  it('resumes free spin when the flick went stale before release', () => {
    expect(
      releaseOrbitVelocity({
        reduceMotion: false,
        moved: true,
        flickYaw: 2.4,
        flickPitch: -0.5,
        flickAgeMs: 400,
      }),
    ).toEqual({ yawVelocity: FREE_SPIN_YAW, pitchVelocity: 0 });
  });

  it('disables spin under reduced motion', () => {
    expect(
      releaseOrbitVelocity({
        reduceMotion: true,
        moved: true,
        flickYaw: 3,
        flickPitch: 1,
        flickAgeMs: 10,
      }),
    ).toEqual({ yawVelocity: 0, pitchVelocity: 0 });
  });

  it('settles yaw velocity toward free spin', () => {
    let yaw = 3;
    for (let i = 0; i < 480; i += 1) yaw = settleYawVelocity(yaw, 1 / 60);
    expect(yaw).toBeCloseTo(FREE_SPIN_YAW, 2);

    yaw = 0;
    for (let i = 0; i < 480; i += 1) yaw = settleYawVelocity(yaw, 1 / 60);
    expect(yaw).toBeCloseTo(FREE_SPIN_YAW, 2);
  });
});
