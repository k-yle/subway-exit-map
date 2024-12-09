import type { OsmFeature, OsmRelation, Tags } from 'osm-api';
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

export const getRef = (tags: Tags | undefined) => tags?.ref || tags?.uic_ref;

export const getName = (tags: Tags | undefined, languages: string[]) =>
  languages.map((lang) => tags?.[`name:${lang}`]).find(Boolean) || tags?.name;

/**
 * remove platform number from stop_position nodes
 * @deprecated TODO: we should never use the name from the stop_position
 */
export const cleanName = (name: string | undefined) =>
  name?.split(',')[0].replace(/ *((platform|station).+)? *\d*$/i, '') || '';

/**
 * shorthand to map a relation's members to it's features.
 * The `role` is not passed down.
 * @example `.map(findMember(data))`
 */
export const findMember =
  (data: OsmFeature[]) => (member: OsmRelation['members'][0]) => {
    return data.find((f) => f.type === member.type && f.id === member.ref);
  };

/** @example `.map(isStation)` */
export const isStation = (feature: OsmFeature | undefined) => {
  if (feature?.tags?.public_transport === 'station') return feature;
  return undefined;
};
