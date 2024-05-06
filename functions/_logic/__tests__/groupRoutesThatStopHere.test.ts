import { describe, expect, it } from 'vitest';
import type { OsmNode, OsmRelation } from 'osm-api';
import { groupRoutesThatStopHere } from '../groupRoutesThatStopHere.js';

const colour = { bg: 'teal', fg: '#fff' };

const _mockData: Partial<OsmRelation>[] = [
  { tags: { ref: 'M1', colour: 'teal', to: 'Tallawong' } },
  { tags: { ref: 'M1', colour: 'teal', to: 'Bankstown' } },
  { tags: { ref: 'M2', colour: 'teal', to: 'Bradfield' } },
  { tags: { ref: 'T3', colour: 'teal', to: 'Bankstown' } },
  { tags: { ref: 'M2', colour: 'teal', to: 'St Marys' } },
];
const mockData = _mockData.map(
  (r) =>
    <OsmRelation>{
      ...r,
      members: [
        { role: 'stop', ref: 123, type: 'node' },
        { role: 'stop', ref: 124, type: 'node' },
      ],
    },
);

const stop = <OsmNode>{ id: 123 };

describe('groupRoutesThatStopHere', () => {
  it('can group 1 route, 2 destinations', () => {
    expect(
      groupRoutesThatStopHere([mockData[0], mockData[1]], stop),
    ).toStrictEqual({
      'Bankstown & Tallawong': [
        {
          colour,
          ref: 'M1',
          shape: 'rectangular',
          to: ['Tallawong', 'Bankstown'],
        },
      ],
    });
  });

  it('can group 2 routes, 1 destination', () => {
    expect(
      groupRoutesThatStopHere([mockData[1], mockData[3]], stop),
    ).toStrictEqual({
      Bankstown: [
        { colour, ref: 'M1', shape: 'rectangular', to: ['Bankstown'] },
        { colour, ref: 'T3', shape: 'rectangular', to: ['Bankstown'] },
      ],
    });
  });

  it('does not group 2 routes, 2 destinations', () => {
    expect(
      groupRoutesThatStopHere([mockData[0], mockData[3]], stop),
    ).toStrictEqual({
      Bankstown: [
        { colour, ref: 'T3', shape: 'rectangular', to: ['Bankstown'] },
      ],
      Tallawong: [
        { colour, ref: 'M1', shape: 'rectangular', to: ['Tallawong'] },
      ],
    });
  });

  it('can group a mix of routes & destinations', () => {
    // it could have but the two M1s together, or the 2 Bankstowns.
    // doesn't really matter which way it does it.
    expect(groupRoutesThatStopHere(mockData, stop)).toStrictEqual({
      Bankstown: [
        { colour, ref: 'M1', shape: 'rectangular', to: ['Bankstown'] },
        { colour, ref: 'T3', shape: 'rectangular', to: ['Bankstown'] },
      ],
      'Bradfield & St Marys': [
        {
          colour,
          ref: 'M2',
          shape: 'rectangular',
          to: ['Bradfield', 'St Marys'],
        },
      ],
      Tallawong: [
        { colour, ref: 'M1', shape: 'rectangular', to: ['Tallawong'] },
      ],
    });
  });
});
