import { deg2rad, rad2deg } from './math.js';

const { sin, cos, atan2, sqrt } = Math;

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

/** returns the distance in metres between two coordinates */
export function distanceBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lng2 - lng1);

  const a =
    sin(dLat / 2) * sin(dLat / 2) +
    cos(deg2rad(lat1)) * cos(deg2rad(lat2)) * sin(dLon / 2) * sin(dLon / 2);
  const c = 2 * atan2(sqrt(a), sqrt(1 - a));

  return 6_371_000 * c; // radius of the earth (metres)
}
