import type { OsmRelation, OsmWay } from 'osm-api';
import type { FwdBwdBoth, OsmFeatures } from './types.def.js';

export function getTravellingDirection(
  route: OsmRelation,
  track: OsmWay,
  data: OsmFeatures,
  warnings: string[],
): FwdBwdBoth {
  const indexOfTrackInThisRoute = route.members.findIndex(
    (m) => m.type === 'way' && m.ref === track.id,
  );

  if (indexOfTrackInThisRoute === -1) {
    throw new Error('invariant: the track must be in the relation');
  }

  const nextTrackId = route.members[indexOfTrackInThisRoute + 1]?.ref;
  const nextTrack = data.way[nextTrackId];

  const lastTrackId = route.members[indexOfTrackInThisRoute - 1]?.ref;
  const lastTrack = data.way[lastTrackId];

  if (nextTrack) {
    if (
      track.nodes[0] === nextTrack.nodes[0] ||
      track.nodes[0] === nextTrack.nodes.at(-1)
    ) {
      // (this) (next)    (this) (next)
      // -----> -----> or -----> <-----
      // Connected head-to-tail or head-to-head. Either
      // way, the next track is connected to the head of
      // this track, so the route travels backwards.
      return 'backward';
    }
    return 'forward';
  }

  if (lastTrack) {
    if (
      track.nodes.at(-1) === lastTrack.nodes[0] ||
      track.nodes.at(-1) === lastTrack.nodes.at(-1)
    ) {
      // (prev) (this)    (prev) (this)
      // -----> -----> or <----- ----->
      // Connected tail-to-tail or tail-to-head. Either
      // way, the prev track is connected to the tail of
      // this track, so the route travels backwards.
      return 'backward';
    }
    return 'forward';
  }

  // the overpass query should have fetched any tracks connected to this one.
  // if not, the physcial geometry disagrees with the relation's order.
  warnings.push(
    `The next/prev tracks within r${route.id} are ostensibly w${nextTrackId} & w${lastTrackId}, ` +
      `but neither was downloaded. The relation is likely not sorted.`,
  );
  return 'both_ways';
}
