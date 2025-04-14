import type { OsmFeatures, Station, Stop } from '../types.def.js';
import { flipByDestination } from './flipByDestination.js';
import { flipByTrackDirection } from './flipByTrackDirection.js';
import { flipByStopLocation } from './flipByStopLocation.js';

export type FlipFunction = (
  stops: Stop[],
  allData: OsmFeatures,
  station: Station,
  warnings: string[],
) => boolean[] | undefined;

export const flipFunctions: FlipFunction[] = [
  flipByTrackDirection,
  flipByDestination,
  flipByStopLocation,
];
