import { describe, expect, it } from 'vitest';
import type { OsmFeature, OsmRelation, OsmWay } from 'osm-api';
import { getBiDiMode } from '../getBiDiMode.js';
import type { OsmFeatures, Stop } from '../types.def.js';

describe('getBiDiMode', () => {
  const implicitTrack = <OsmWay>{ type: 'way', id: 2 };
  const explicitOccasionalTrack = <OsmWay>(<Partial<OsmWay>>{
    type: 'way',
    id: 2,
    tags: { 'railway:bidirectional': 'possible' },
  });
  const explicitRegularTrack = <OsmWay>(<Partial<OsmWay>>{
    type: 'way',
    id: 2,
    tags: { 'railway:bidirectional': 'regular' },
  });
  const explicitNoTrack = <OsmWay>(<Partial<OsmWay>>{
    type: 'way',
    id: 2,
    tags: { oneway: 'yes' },
  });
  const fwdRoute = <OsmRelation>{
    type: 'relation',
    id: 100,
    members: [
      { type: 'way', ref: 1 },
      { type: 'way', ref: 2 },
      { type: 'way', ref: 3 },
    ],
  };
  const bwdRoute = <OsmRelation>{
    type: 'relation',
    id: 200,
    members: [
      { type: 'way', ref: 3 },
      { type: 'way', ref: 2 },
      { type: 'way', ref: 1 },
    ],
  };
  const fwdTerminatingRoute = <OsmRelation>{
    type: 'relation',
    id: 300,
    members: [
      { type: 'way', ref: 1 },
      { type: 'way', ref: 2 },
    ],
  };
  const bwdTerminatingRoute = <OsmRelation>{
    type: 'relation',
    id: 400,
    members: [
      { type: 'way', ref: 3 },
      { type: 'way', ref: 2 },
    ],
  };
  const fwdOriginatingRoute = <OsmRelation>{
    type: 'relation',
    id: 500,
    members: [
      { type: 'way', ref: 2 },
      { type: 'way', ref: 3 },
    ],
  };
  const bwdOriginatingRoute = <OsmRelation>{
    type: 'relation',
    id: 600,
    members: [
      { type: 'way', ref: 2 },
      { type: 'way', ref: 1 },
    ],
  };

  it.each<[track: OsmWay, routes: OsmFeature[], output: Stop['biDiMode']]>([
    // regular, because it's explicitly tagged
    [explicitRegularTrack, [], 'regular'],

    // regular, because routes pass in 3 directions
    [
      implicitTrack,
      [fwdRoute, fwdRoute, bwdRoute, fwdTerminatingRoute],
      'regular',
    ],

    // regular, because routes pass in 2 directions
    [implicitTrack, [fwdRoute, fwdRoute, bwdRoute], 'regular'],

    // unknown, because routes pass in 1 direction.
    // the terminating route came from the same place as fwd
    [implicitTrack, [fwdRoute, fwdRoute, fwdTerminatingRoute], 'unknown'],

    // regular, because routes pass in 2 direction.
    // the terminating route came from the other direction to fwdRoute
    [implicitTrack, [fwdRoute, fwdRoute, bwdTerminatingRoute], 'regular'],

    // occasional, because routes pass in 1 direction.
    // the terminating route came from the same place as fwd
    [implicitTrack, [fwdRoute, fwdRoute, fwdOriginatingRoute], 'unknown'],

    // regular, because routes pass in 2 direction.
    // the terminating route came from the other direction to fwdRoute
    [implicitTrack, [fwdRoute, fwdRoute, bwdOriginatingRoute], 'unknown'], // TODO: bug

    // occasional, because routes pass in 1 direction
    [implicitTrack, [fwdRoute], 'unknown'],

    // regular, because there are no routes using this track
    [implicitTrack, [], 'regular'],

    // regular, because routes pass in 3 directions
    [
      explicitOccasionalTrack,
      [fwdRoute, fwdRoute, bwdRoute, fwdTerminatingRoute],
      'regular',
    ],

    // regular, because routes pass in 2 directions
    [explicitOccasionalTrack, [fwdRoute, fwdRoute, bwdRoute], 'regular'],

    // occasional, because routes pass in 1 direction.
    // the terminating route came from the same place as fwd
    [
      explicitOccasionalTrack,
      [fwdRoute, fwdRoute, fwdTerminatingRoute],
      'occasional',
    ],

    // regular, because routes pass in 2 direction.
    // the terminating route came from the other direction to fwdRoute
    [
      explicitOccasionalTrack,
      [fwdRoute, fwdRoute, bwdTerminatingRoute],
      'regular',
    ],

    // occasional, because routes pass in 1 direction.
    // the terminating route came from the same place as fwd
    [
      explicitOccasionalTrack,
      [fwdRoute, fwdRoute, fwdOriginatingRoute],
      'occasional',
    ],

    // regular, because routes pass in 2 direction.
    // the terminating route came from the other direction to fwdRoute
    [
      explicitOccasionalTrack,
      [fwdRoute, fwdRoute, bwdOriginatingRoute],
      'occasional',
    ], // TODO: bug

    // occasional, because routes pass in 1 direction
    [explicitOccasionalTrack, [fwdRoute], 'occasional'],

    // regular, because there are no routes using this track
    [implicitTrack, [], 'regular'],

    // no, because the track is tagged as unidirectional
    [explicitNoTrack, [], undefined],
  ])('figures out if a track is bidirecitonal %#', (track, allData, result) => {
    const osm = [track, ...allData];
    const osmByType: OsmFeatures = { node: {}, way: {}, relation: {} };
    for (const feature of osm) osmByType[feature.type][feature.id] = feature;

    expect(getBiDiMode(track, osmByType)).toBe(result);
  });
});
