const { abs, min, PI: π } = Math;

export const deg2rad = (deg: number) => deg * (π / 180);
export const rad2deg = (rad: number) => rad * (180 / π);

export const avg = (list: number[]) =>
  list.reduce((a, b) => a + b, 0) / list.length;

/** gets the difference between 2 bearings */
export function getAnglularDiff(a: number, b: number) {
  const diff = abs((a % 360) - (b % 360));
  return min(diff, 360 - diff);
}
