import type { Tags } from 'osm-api';
import type { ItemId } from 'wikibase-sdk';
import type { Data } from '../_logic/types.def';

/**
 * Override the source data for exceptional cases
 * where the data model is not flexible enough.
 */
export const BEST_OVERRIDE: Record<string, number[]> = {
  2000391: [1, 4, 7], // SYD - Town Hall 1
  2000392: [1, 4, 7], // SYD - Town Hall 2
  2000393: [2, 4, 5, 8], // SYD - Town Hall 3
};

export const NETWORK_OVERRIDE: Record<ItemId, ItemId> = {
  Q6955406: 'Q7660181', // NSW TrainLink -> Sydney Trains
};

export const getNetworks = (tags: Tags): ItemId[] => {
  const qIds = <ItemId[] | undefined>tags['network:wikidata']?.split(';') || [];
  return qIds.map((qId) => NETWORK_OVERRIDE[qId] || qId);
};

/** some cities (e.g. London & Wien) use `ref` instead of `local_ref` */
export const CITIES_WITHOUT_LOCAL_REF = new Set([
  'Q209400', // Wiener Linien
  'Q2516485', // VOR (Österreich)
]);

// TODO: remove hardcoded icons
export const ICONS: Data['supportedSymbols'] = {
  generic: {
    bus: 'https://commons.wikimedia.org/wiki/Special:FilePath/RWBA_Bus.svg',
    's-bahn':
      'https://commons.wikimedia.org/wiki/Special:FilePath/S-Bahn_Austria.svg',
    tram: 'https://commons.wikimedia.org/wiki/Special:FilePath/IE%20road%20sign%20symbol%20F-016.svg',
    train:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Fernbahn_Signet_HVV.svg',
    light_rail:
      'https://commons.wikimedia.org/wiki/Special:FilePath/IE%20road%20sign%20symbol%20F-016.svg',
    ferry:
      'https://commons.wikimedia.org/wiki/Special:FilePath/RWBA%20Fähre(R).svg',
    metro:
      'https://commons.wikimedia.org/wiki/Special:FilePath/BSicon%20SUBWAY-CHN.svg',
  },
  Q7660181: {
    // Sydney Trains
    bus: 'https://commons.wikimedia.org/wiki/Special:FilePath/TfNSW%20B.svg',
    train: 'https://commons.wikimedia.org/wiki/Special:FilePath/TfNSW%20T.svg',
    ferry: 'https://commons.wikimedia.org/wiki/Special:FilePath/TfNSW%20F.svg',
    light_rail:
      'https://commons.wikimedia.org/wiki/Special:FilePath/TfNSW%20L.svg',
    metro: 'https://commons.wikimedia.org/wiki/Special:FilePath/TfNSW%20M.svg',
  },
  Q14774571: {
    // Sydney Metro
    bus: 'https://commons.wikimedia.org/wiki/Special:FilePath/TfNSW%20B.svg',
    train: 'https://commons.wikimedia.org/wiki/Special:FilePath/TfNSW%20T.svg',
    ferry: 'https://commons.wikimedia.org/wiki/Special:FilePath/TfNSW%20F.svg',
    light_rail:
      'https://commons.wikimedia.org/wiki/Special:FilePath/TfNSW%20L.svg',
    metro: 'https://commons.wikimedia.org/wiki/Special:FilePath/TfNSW%20M.svg',
  },
};
