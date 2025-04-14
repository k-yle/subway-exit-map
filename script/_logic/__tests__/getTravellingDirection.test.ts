import { describe, expect, it } from 'vitest';
import type { OsmFeature, OsmRelation, OsmWay } from 'osm-api';
import { getTravellingDirection } from '../getTravellingDirection.js';
import type { OsmFeatures } from '../types.def.js';

const w10 = <OsmWay>{ type: 'way', id: 10, nodes: [1, 2, 3] };
const w20 = <OsmWay>{ type: 'way', id: 20, nodes: [3, 4, 5] };

const w10r = <OsmWay>{ type: 'way', id: 10, nodes: [3, 2, 1] };
const w20r = <OsmWay>{ type: 'way', id: 20, nodes: [5, 4, 3] };

const forwardsRoute = <OsmRelation>{
  type: 'relation',
  id: 100,
  members: [
    { type: 'way', ref: 10 },
    { type: 'way', ref: 20 },
  ],
};
const backwardsRoute = <OsmRelation>{
  type: 'relation',
  id: 200,
  members: [
    { type: 'way', ref: 20 },
    { type: 'way', ref: 10 },
  ],
};

describe('getTravellingDirection', () => {
  it.each`
    track   | allTracks       | relation          | output
    ${w10}  | ${[w10, w20]}   | ${forwardsRoute}  | ${'forward'}
    ${w20}  | ${[w10, w20]}   | ${forwardsRoute}  | ${'forward'}
    ${w10}  | ${[w10, w20]}   | ${backwardsRoute} | ${'backward'}
    ${w20} | ${[w10, w20]} | ${backwardsRoute} | ${'backward' /*
    ^ 123-345

 */}
    ${w10}  | ${[w10, w20r]}  | ${forwardsRoute}  | ${'forward'}
    ${w20r} | ${[w10, w20r]}  | ${forwardsRoute}  | ${'backward'}
    ${w10}  | ${[w10, w20r]}  | ${backwardsRoute} | ${'backward'}
    ${w20r} | ${[w10, w20r]} | ${backwardsRoute} | ${'forward' /*
    ^ 123-543

 */}
    ${w10r} | ${[w10r, w20]}  | ${forwardsRoute}  | ${'backward'}
    ${w20}  | ${[w10r, w20]}  | ${forwardsRoute}  | ${'forward'}
    ${w10r} | ${[w10r, w20]}  | ${backwardsRoute} | ${'forward'}
    ${w20} | ${[w10r, w20]} | ${backwardsRoute} | ${'backward' /*
    ^ 321-345

 */}
    ${w10r} | ${[w10r, w20r]} | ${forwardsRoute}  | ${'backward'}
    ${w20r} | ${[w10r, w20r]} | ${forwardsRoute}  | ${'backward'}
    ${w10r} | ${[w10r, w20r]} | ${backwardsRoute} | ${'forward'}
    ${w20r} | ${[w10r, w20r]} | ${backwardsRoute} | ${'forward' /*
    ^ 321-543

 */}
  `(
    '%#: $output for w$track.id / r$relation.id',
    ({ track, allTracks, relation, output }) => {
      const osm: OsmFeature[] = [...allTracks, relation];
      const osmByType: OsmFeatures = { node: {}, way: {}, relation: {} };
      for (const feature of osm) osmByType[feature.type][feature.id] = feature;

      expect(getTravellingDirection(relation, track, osmByType, [])).toBe(
        output,
      );
    },
  );
});
