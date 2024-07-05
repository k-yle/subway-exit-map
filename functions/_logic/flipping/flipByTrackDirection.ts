import type { OsmNode, OsmWay } from 'osm-api';
import { getBearingBetweenCoords } from '../../_helpers/geo.js';
import { splitInHalf } from '../../_helpers/cluster.js';
import type { FlipFunction } from './index.js';

export const flipByTrackDirection: FlipFunction = (
  stops,
  allData,
  station,
  warnings,
) => {
  const bearings: number[] = [];

  const anyBiDiWithNoPreferredDirection = stops.filter(
    (stop) => stop.direction === 'both_ways' && !!stop.carriages.length,
  );
  if (anyBiDiWithNoPreferredDirection.length) {
    // to fix this, stop_positions on bidirectional tracks need
    // to have exit:carriages:[forward/backward] tagged. This
    // tells us what the preffered direction is.
    warnings.push(
      `Ambiguous track direction at ${station.name} ${anyBiDiWithNoPreferredDirection.map((stop) => stop.nodeId)}`,
    );
    return undefined;
  }

  for (const stop of stops) {
    if (!stop.carriages.length) continue;

    const stopNode = allData.find(
      (feature): feature is OsmNode =>
        feature.type === 'node' && feature.id === stop.nodeId,
    )!;

    /**
     * there could be multiple, if the track is split
     * at the stop position, but we should be able to
     * safely pick either one.
     */
    const waysContainingNode = allData.filter(
      (feature): feature is OsmWay =>
        feature.type === 'way' && feature.nodes.includes(stop.nodeId),
    );

    let nextNode: OsmNode | undefined;
    let lastNode: OsmNode | undefined;
    for (const way of waysContainingNode) {
      const nodeIndex = way.nodes.indexOf(stop.nodeId);
      const maybeNextNodeId = way.nodes[nodeIndex + 1];
      const maybeLastNodeId = way.nodes[nodeIndex - 1];
      if (maybeNextNodeId) {
        nextNode = allData.find(
          (feature): feature is OsmNode =>
            feature.type === 'node' && feature.id === maybeNextNodeId,
        );
        break;
      }
      if (maybeLastNodeId) {
        lastNode = allData.find(
          (feature): feature is OsmNode =>
            feature.type === 'node' && feature.id === maybeLastNodeId,
        );
        break;
      }
    }
    if (!nextNode && !lastNode) {
      // this should be impossible, since a way
      // must have at least 2 nodes.
      warnings.push(`Couldn't find next nor last node for n${stop.nodeId}`);
      return undefined;
    }

    // swap argument order if using the lastNode
    const bearingAssumingFwd = nextNode
      ? getBearingBetweenCoords(
          stopNode.lat,
          stopNode.lon,
          nextNode.lat,
          nextNode.lon,
        )
      : getBearingBetweenCoords(
          lastNode!.lat,
          lastNode!.lon,
          stopNode.lat,
          stopNode.lon,
        );

    // At this point, we know that the track is unidirectional, and we've been assuming
    // fwd=the oneway direction. But it could have oneway=-1, so check for that.
    bearings.push(
      bearingAssumingFwd + (stop.direction === 'backward' ? 180 : 0),
    );
  }

  return splitInHalf(bearings);
};
