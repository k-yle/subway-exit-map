import type { OsmFeature } from 'osm-api';
import type { Station, Stop } from '../types.def.js';
import { flipByDestination } from './flipByDestination.js';
import { flipByTrackDirection } from './flipByTrackDirection.js';
import { flipByStopLocation } from './flipByStopLocation.js';

export type FlipFunction = (
  stops: Stop[],
  allData: OsmFeature[],
  station: Station,
) => boolean[] | undefined;

export const flipFunctions: FlipFunction[] = [
  flipByDestination,
  flipByTrackDirection,
  flipByStopLocation,
];
