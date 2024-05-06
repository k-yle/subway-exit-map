import type { Tags } from 'osm-api';
import type { FwdBwdBoth } from '../_logic/types.def.js';

const ONEWAY_TAGS: Record<string, Record<string, FwdBwdBoth>> = {
  oneway: {
    yes: 'forward',
    '-1': 'backward',
    alternating: 'both_ways',
    reversible: 'both_ways',
  },
  'railway:preferred_direction': {
    forward: 'forward',
    backward: 'backward',
    both: 'both_ways',
  },
  'railway:bidirectional': {
    regular: 'both_ways',
    signals: 'both_ways',
    possible: 'both_ways',
    yes: 'both_ways',
  },
};

/** assume bidirectional unless explicitly tagged. */
export const getTrackDirection = (tags: Tags | undefined): FwdBwdBoth => {
  if (!tags) return 'both_ways';
  return (
    Object.entries(tags)
      .map(([key, value]) => ONEWAY_TAGS[key]?.[value])
      .find(Boolean) || 'both_ways'
  );
};
