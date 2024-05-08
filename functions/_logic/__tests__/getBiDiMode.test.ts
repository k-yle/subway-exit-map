import { describe, expect, it } from 'vitest';
import type { OsmFeature, OsmRelation, OsmWay } from 'osm-api';
import { getBiDiMode } from '../getBiDiMode.js';
import type { Stop } from '../types.def.js';

describe('getBiDiMode', () => {
  const implicitTrack = <OsmWay>{ id: 1 };
  const explicitRegularTrack = <OsmWay>(<Partial<OsmWay>>{
    id: 1,
    tags: { 'railway:bidirectional': 'regular' },
  });
  const explicitNoTrack = <OsmWay>(<Partial<OsmWay>>{
    id: 1,
    tags: { oneway: 'yes' },
  });
  const fwdRoute = <OsmRelation>{
    type: 'relation',
    members: [
      { type: 'way', ref: 0 },
      { type: 'way', ref: 1 },
      { type: 'way', ref: 2 },
    ],
  };
  const bwdRoute = <OsmRelation>{
    type: 'relation',
    members: [
      { type: 'way', ref: 2 },
      { type: 'way', ref: 1 },
      { type: 'way', ref: 0 },
    ],
  };
  const terminatingRoute = <OsmRelation>{
    type: 'relation',
    members: [
      { type: 'way', ref: 2 },
      { type: 'way', ref: 1 },
    ],
  };

  it.each<[track: OsmWay, routes: OsmFeature[], output: Stop['biDiMode']]>([
    // regular, beacuse it's explicitly tagged
    [explicitRegularTrack, [], 'regular'],

    // regular, beacuse routes pass in 3 directions
    [
      implicitTrack,
      [fwdRoute, fwdRoute, bwdRoute, terminatingRoute],
      'regular',
    ],

    // regular, beacuse routes pass in 2 directions
    [implicitTrack, [fwdRoute, fwdRoute, bwdRoute], 'regular'],

    // regular, beacuse routes pass in 2 directions
    [implicitTrack, [fwdRoute, fwdRoute, terminatingRoute], 'regular'],

    // occasional, beacuse routes pass in 1 direction
    [implicitTrack, [fwdRoute], 'occasional'],

    // occasional, beacuse there are no routes using this track
    [implicitTrack, [], 'occasional'],

    // no, beacuse the track is tagged as unidirectional
    [explicitNoTrack, [], undefined],
  ])('figures out if a track is bidirecitonal %#', (track, allData, result) => {
    expect(getBiDiMode(track, [track, ...allData])).toBe(result);
  });
});
