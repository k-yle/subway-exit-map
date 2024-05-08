import { describe, expect, it } from 'vitest';
import type { OsmNode, OsmRelation } from 'osm-api';
import { groupRoutesThatStopHere } from '../groupRoutesThatStopHere.js';

const common = {
  colour: { bg: 'teal', fg: '#fff' },
  shape: 'rectangular',
};

const _mockData: Partial<OsmRelation>[] = [
  { tags: { ref: 'M1', colour: 'teal', to: 'Tallawong', from: 'Bankstown' } },
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
          ...common,
          ref: 'M1',
          to: ['Tallawong', 'Bankstown'],
          type: 'to',
        },
      ],
    });
  });

  it('can group 2 routes, 1 destination', () => {
    expect(
      groupRoutesThatStopHere([mockData[1], mockData[3]], stop),
    ).toStrictEqual({
      Bankstown: [
        { ...common, ref: 'M1', to: ['Bankstown'], type: 'to' },
        { ...common, ref: 'T3', to: ['Bankstown'], type: 'to' },
      ],
    });
  });

  it('does not group 2 routes, 2 destinations', () => {
    expect(
      groupRoutesThatStopHere([mockData[0], mockData[3]], stop),
    ).toStrictEqual({
      Bankstown: [{ ...common, ref: 'T3', to: ['Bankstown'], type: 'to' }],
      Tallawong: [{ ...common, ref: 'M1', to: ['Tallawong'], type: 'to' }],
    });
  });

  it('can group a mix of routes & destinations', () => {
    // it could have but the two M1s together, or the 2 Bankstowns.
    // doesn't really matter which way it does it.
    expect(groupRoutesThatStopHere(mockData, stop)).toStrictEqual({
      Bankstown: [
        { ...common, ref: 'M1', to: ['Bankstown'], type: 'to' },
        { ...common, ref: 'T3', to: ['Bankstown'], type: 'to' },
      ],
      'Bradfield & St Marys': [
        { ...common, ref: 'M2', to: ['Bradfield', 'St Marys'], type: 'to' },
      ],
      Tallawong: [{ ...common, ref: 'M1', to: ['Tallawong'], type: 'to' }],
    });
  });

  describe('bidirectional platforms', () => {
    // e.g. melbourne's northern group at flinders street.
    // same ref for all 4. 2 are _exit_only, 2 are _entry_only.
    // 3 unique end points for the route.
    const fourbyFour = [
      { from: 1, to: 2 },
      { from: 2, to: 1 },
      { from: 1, to: 3 },
      { from: 3, to: 1 },
    ].map(
      ({ from, to }) => <OsmRelation>(<Partial<OsmRelation>>{
          tags: { ref: 'M1', colour: 'teal', from: `#${from}`, to: `#${to}` },
          members: [
            { role: 'stop_entry_only', ref: from, type: 'node' },
            { role: 'stop', ref: 1.5, type: 'node' },
            { role: 'stop_exit_only', ref: to, type: 'node' },
          ],
        }),
    );

    it('handles a bidirectional platform at the terminus of 1 route', () => {
      expect(
        groupRoutesThatStopHere(fourbyFour.slice(0, 2), <OsmNode>{ id: 1 }),
      ).toStrictEqual({
        // this is good, since we are at #1, we do not expect to see #1 in the data
        '#2': [{ ...common, ref: 'M1', to: ['#2'], type: 'both' }],
      });
    });

    it('handles a bidirectional platform at the terminus of 2 routes with the same ref but diff destinations', () => {
      expect(
        groupRoutesThatStopHere(fourbyFour, <OsmNode>{ id: 1 }),
      ).toStrictEqual({
        // this is good, since we are at #1, we do not expect to see #1 in the data
        '#2 & #3': [{ ...common, ref: 'M1', to: ['#2', '#3'], type: 'both' }],
      });
    });

    it('handles a bidirectional platform midway along 1 route', () => {
      expect(
        groupRoutesThatStopHere(fourbyFour.slice(0, 2), <OsmNode>{ id: 1.5 }),
      ).toStrictEqual({
        // we are at #1.5, so we expect to see #1 and #2 in the destinations
        '#1 & #2': [{ ...common, ref: 'M1', to: ['#2', '#1'], type: 'to' }],
      });
    });

    it('handles a bidirectional platform midway along 2 routes with the same ref but diff destinations', () => {
      expect(
        groupRoutesThatStopHere(fourbyFour, <OsmNode>{ id: 1.5 }),
      ).toStrictEqual({
        // we are at #1.5, so we expect to see #1 and #2 in the destinations
        '#1, #2, & #3': [
          { ...common, ref: 'M1', to: ['#2', '#1', '#3'], type: 'to' },
        ],
      });
    });
  });
});
