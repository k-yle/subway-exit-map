import type { OsmFeature, Tags } from 'osm-api';
import type { ItemId } from 'wikibase-sdk';
import type { FwdBwdBoth } from '../_logic/types.def.js';
import { CITIES_WITHOUT_LOCAL_REF } from './override.js';

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

export const getLocalRef = (tags: Tags | undefined, networks: ItemId[]) => {
  if (!tags) return undefined;
  if (tags.local_ref) return tags.local_ref;

  if (new Set(networks).intersection(CITIES_WITHOUT_LOCAL_REF).size) {
    return tags.ref;
  }

  return undefined;
};

export const getRef = (tags: Tags | undefined) => tags?.ref || tags?.uic_ref;

/** converts OSM tags to an object containing just the names per language */
export const getNames = (tags: Tags | undefined): Tags => {
  const out = Object.fromEntries(
    Object.entries(tags || {})
      .filter(([k]) => k.startsWith('name:'))
      .map(([k, v]) => [k.replace('name:', ''), v]),
  );
  if (tags?.name) out[''] = tags.name;
  return out;
};

/** @example `.map(isStation)` */
export const isStation = (feature: OsmFeature | undefined) => {
  if (feature?.tags?.public_transport === 'station') return feature;
  return undefined;
};
