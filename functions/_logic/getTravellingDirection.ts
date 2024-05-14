import type { OsmFeature, OsmRelation, OsmWay } from 'osm-api';
import type { FwdBwdBoth } from './types.def.js';

export function getTravellingDirection(
  route: OsmRelation,
  track: OsmWay,
  data: OsmFeature[],
  warnings: string[],
): FwdBwdBoth {
  const indexOfTrackInThisRoute = route.members.findIndex(
    (m) => m.type === 'way' && m.ref === track.id,
  );

  const nextTrack = data.find((feature): feature is OsmWay => {
    const nextTrackId = route.members[indexOfTrackInThisRoute + 1]?.ref;
    return feature.type === 'way' && feature.id === nextTrackId;
  });

  const lastTrack = data.find((feature): feature is OsmWay => {
    const lastTrackId = route.members[indexOfTrackInThisRoute - 1]?.ref;
    return feature.type === 'way' && feature.id === lastTrackId;
  });

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

  warnings.push(`w${track.id} is this only track in route r${route.id}`);
  return 'both_ways';
}
