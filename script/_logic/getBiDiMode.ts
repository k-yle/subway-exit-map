import type { OsmWay } from 'osm-api';
import { getTrackDirection } from '../_helpers/osm.js';
import { isTruthy } from '../_helpers/objects.js';
import type { OsmFeatures, Stop } from './types.def.js';

export function getBiDiMode(
  track: OsmWay,
  allData: OsmFeatures,
): Stop['biDiMode'] {
  if (track.tags?.['railway:bidirectional'] === 'regular') {
    return 'regular';
  }

  const direction = getTrackDirection(track.tags);
  if (direction === 'both_ways' || direction === 'unknown') {
    // check if regular or occasional
    const routesThatUseThisTrack = Object.values(allData.relation).filter(
      (relation) =>
        relation.members.some((m) => m.type === 'way' && m.ref === track.id),
    );

    // bidi & no regular service -> regular (for the rare cases when its used)
    if (!routesThatUseThisTrack.length) return 'regular';

    // for every route, find the next way in the relation after this track
    const nextWays = routesThatUseThisTrack
      .map(
        (route) =>
          route.members
            .filter((m) => m?.type === 'way' && !m.role)
            .find((_, index, array) => {
              const next = array[index + 1];
              return next?.ref === track.id;
            })?.ref,
      )
      .filter(isTruthy); // if there is no nextWay, don't count this route

    if (new Set(nextWays).size > 1) {
      // there are multiple next ways, this means
      // this track is used in both directions by PTv2 routes
      return 'regular';
    }

    // bi di, but routes only travel in one direction
    return direction === 'unknown' ? 'unknown' : 'occasional';
  }

  return undefined;
}
