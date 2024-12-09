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
export const getTrackDirection = (
  tags: Tags | undefined,
): FwdBwdBoth | 'unknown' => {
  return (
    Object.entries(tags || {})
      .map(([key, value]) => ONEWAY_TAGS[key]?.[value])
      .find(Boolean) || 'unknown'
  );
};

export const FALSY = new Set(['', 'no', 'none', 'emergency']);

/**
 * remove platform number from stop_position nodes
 * @deprecated TODO: we should never use the name from the stop_position
 */
export const cleanName = (name: string | undefined) =>
  name?.split(',')[0].replace(/ *((platform|station).+)? *\d*$/i, '') || '';
