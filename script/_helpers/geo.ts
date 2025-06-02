import { deg2rad, rad2deg } from './math.js';

const { sin, cos, atan2 } = Math;

export function getBearingBetweenCoords(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const y1 = deg2rad(lat1);
  const x1 = deg2rad(lon1);
  const y2 = deg2rad(lat2);
  const x2 = deg2rad(lon2);

  const x = cos(y2) * sin(x2 - x1);
  const y = cos(y1) * sin(y2) - sin(y1) * cos(y2) * cos(x2 - x1);

  const θ = atan2(x, y);

  return (rad2deg(θ) + 360) % 360;
}
