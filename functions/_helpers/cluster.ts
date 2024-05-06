import { avg, getAnglularDiff } from './math.js';

function assignToClusters(bearings: number[], centroids: number[]) {
  const clusters: number[][] = [[], []];
  for (const point of bearings) {
    let [minIndex, minDistance] = [0, Infinity];
    for (let index = 0; index < centroids.length; index++) {
      const distance = getAnglularDiff(point, centroids[index]);
      if (distance < minDistance) {
        minDistance = distance;
        minIndex = index;
      }
    }
    clusters[minIndex].push(point);
  }
  return clusters;
}

export function kMeanCluster(bearings: number[]): number[][] {
  let centroids = bearings.slice(0, 2);
  let clusters: number[][] = [];
  for (let index = 0; index < 10; index++) {
    clusters = assignToClusters(bearings, centroids);
    centroids = clusters.map(avg);
  }
  return clusters;
}

/** clusters a series of number, then returns true/false for each value */
export function splitInHalf(bearings: number[]): boolean[] {
  const clusters = kMeanCluster(bearings);
  return bearings.map((bearing) => clusters[0].includes(bearing));
}
