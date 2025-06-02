import type { OsmNode } from 'osm-api';
import { getBearingBetweenCoords } from '../../_helpers/geo.js';
import { splitInHalf } from '../../_helpers/cluster.js';
import type { OsmFeatures, Stop } from '../types.def.js';

export const flipByTrackDirection = (stops: Stop[], allData: OsmFeatures) => {
  const bearings: number[] = [];

  for (const stop of stops) {
    if (!stop.carriages.length) continue;

    const stopNode = allData.node[stop.nodeId]!;

    /**
     * there could be multiple, if the track is split
     * at the stop position, but we should be able to
     * safely pick either one.
     */
    const waysContainingNode = Object.values(allData.way).filter((way) =>
      way.nodes.includes(stop.nodeId),
    );

    let nextNode: OsmNode | undefined;
    let lastNode: OsmNode | undefined;
    for (const way of waysContainingNode) {
      const nodeIndex = way.nodes.indexOf(stop.nodeId);
      const maybeNextNodeId = way.nodes[nodeIndex + 1];
      const maybeLastNodeId = way.nodes[nodeIndex - 1];
      if (maybeNextNodeId) {
        nextNode = allData.node[maybeNextNodeId];
        break;
      }
      if (maybeLastNodeId) {
        lastNode = allData.node[maybeLastNodeId];
        break;
      }
    }
    if (!nextNode && !lastNode) {
      // this should be impossible, since a way
      // must have at least 2 nodes.
      throw new Error(`Couldn't find next nor last node for n${stop.nodeId}`);
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
    bearings.push(bearingAssumingFwd);
  }

  return splitInHalf(bearings);
};
