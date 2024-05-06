import { splitInHalf } from '../../_helpers/cluster.js';
import {
  distanceBetween,
  getBearingBetweenCoords,
} from '../../_helpers/geo.js';
import { avg } from '../../_helpers/math.js';
import type { FlipFunction } from './index.js';

export const flipByStopLocation: FlipFunction = (stops, _, station) => {
  const allLats = stops.map((element) => element.lat);
  const allLons = stops.map((element) => element.lon);

  const centroid = { lat: avg(allLats), lon: avg(allLons) };

  const distancesFromCentroid = stops.map((stop) =>
    distanceBetween(centroid.lat, centroid.lon, stop.lat, stop.lon),
  );
  const avgDistance = avg(distancesFromCentroid);
  const isAnyStopNearCentroid = distancesFromCentroid.find(
    (distance) => distance < avgDistance / 2,
  );
  if (isAnyStopNearCentroid) {
    // one stop is 2 std deviations closer to the centroid,
    // which means the data is probably rubbish. So abort.
    console.warn(`${station.name}: flipping failed`);
    return undefined;
  }

  const bearings = stops.map((stop) =>
    getBearingBetweenCoords(centroid.lat, centroid.lon, stop.lat, stop.lon),
  );

  console.warn(`${station.name}: using unsafe flipping algorithm`);

  return splitInHalf(bearings);
};
