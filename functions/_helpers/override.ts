/**
 * Override the source data for exceptional cases
 * where the data model is not flexible enough.
 */
export const BEST_OVERRIDE: Record<string, number[]> = {
  2000391: [1, 4, 7], // SYD - Town Hall 1
  2000392: [1, 4, 7], // SYD - Town Hall 2
  2000393: [2, 4, 5, 8], // SYD - Town Hall 3
};

export const NETWORK_OVERRIDE: Record<string, string> = {
  Q6955406: 'Q7660181', // NSW TrainLink -> Sydney Trains
};

/**
 * Sydney is the only city that uses `destination:symbol:carriages`, so
 * for now these are hardcoded.
 */
export const ICONS: Record<string, string> = {
  bus: 'https://commons.wikimedia.org/wiki/Special:FilePath/TfNSW%20B.svg',
  train: 'https://commons.wikimedia.org/wiki/Special:FilePath/TfNSW%20T.svg',
  ferry: 'https://commons.wikimedia.org/wiki/Special:FilePath/TfNSW%20F.svg',
  light_rail:
    'https://commons.wikimedia.org/wiki/Special:FilePath/TfNSW%20L.svg',
  metro: 'https://commons.wikimedia.org/wiki/Special:FilePath/TfNSW%20M.svg',
};
