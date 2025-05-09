import { deg2rad, rad2deg } from './math.js';

const { sin, cos, atan2 } = Math;

export function getBearingBetweenCoords(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const [y1, x1, y2, x2] = [lat1, lon1, lat2, lon2].map(deg2rad);

  const x = cos(y2) * sin(x2 - x1);
  const y = cos(y1) * sin(y2) - sin(y1) * cos(y2) * cos(x2 - x1);

  const θ = atan2(x, y);

  return (rad2deg(θ) + 360) % 360;
}
