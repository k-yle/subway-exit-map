import type { KVNamespace, PagesFunction } from '@cloudflare/workers-types';
import type { OsmFeature } from 'osm-api';
import type { ItemId, parse } from 'wikibase-sdk';

export type FwdBwdBoth = 'forward' | 'backward' | 'both_ways';

export type ExitSide = 'left' | 'right' | 'both' | undefined;

export type ExitType =
  | 'stairs'
  | 'steps'
  | 'escalator'
  | 'lift'
  | 'elevator'
  | 'ramp'
  | 'flat'
  | 'yes';

export type Carriage = {
  type: 'first' | 'middle' | 'last' | 'gap';
  ref: number;
  isBest?: true;
  unavailable?: true;
  exitType?: ExitType[];
  exitNumber?: string[];
  exitSymbols?: string[];
  exitTo?: string[];
};

export type AdjacentStop = {
  gtfsId: string | undefined;
  stationName: string;
  platform: string | undefined;
};

export type RouteShield = {
  ref: string;
  colour: { bg: string; fg: string };
  shape: string;
};

export type RouteThatStopsHere = RouteShield & {
  /** @internal */
  to?: string[];
  type: 'to' | 'from' | 'both';
  qId: string;
  shieldKey: string;
  osmId: number;
};

export type Stop = {
  nodeId: number;
  gtfsId: string;
  platform: string | undefined;
  description: string | undefined;
  inaccessible: boolean;
  lat: number;
  lon: number;

  direction: FwdBwdBoth;
  exitSide: ExitSide;
  carriages: Carriage[];

  lastStop: AdjacentStop[];
  nextStop: AdjacentStop[];
  /** if true, invert front/rear of platform */
  flip?: boolean;
  /**
   * - `regular` means the track has `railway:bidirectional=regular`,
   *   or there are PTv2 relations that travels in both directions
   *   past this node.
   *
   * - `occasional` means the track supports bidirectional operation,
   *   but the PTv2 relations only travel in one direction, or the
   *   track has `railway:bidirectional=possible`
   *
   * - `unknown` means there's no directional info in the database.
   *
   * - `undefined` means unidirectional.
   */
  biDiMode?: 'regular' | 'occasional' | 'unknown';
  availableLabel?: string | undefined;
  lastUpdate: {
    user: string;
    date: string;
  };
  routes: {
    [to: string]: RouteThatStopsHere[];
  };
  passThroughRoutes:
    | (RouteShield & { isDuplicate?: { to?: string; from?: string } })[]
    | undefined;

  /**
   * A huge station might be divided into different names.
   * If this name exists, it should be prefered over the
   * station's default name.
   */
  disambiguationName?: string;
};

export enum FareGates {
  yes = 'yes',
  no = 'no',
  partial = 'partial',
}

export enum Regularity {
  always = 'always',
  usually = 'usually',
}

export type Station = {
  relationId: number;
  gtfsId: string;
  name: string;
  networks: ItemId[];
  fareGates: FareGates | undefined;
  fareGatesNote: string | undefined;
  stops: Stop[];
  flipAlgorithm?: string;
};

export type Trainset = {
  name: string;
  wikidata: string;
  wikipedia: string | undefined;
  carriages: number[] | undefined;
  regularity: Regularity;
};

export type RouteWikiInfo = {
  name: string;
  qId: string;
  wikipedia: string | undefined;
  trainsets: Trainset[] | undefined;
};

export type Data = {
  warnings: string[];
  stations: Station[];
  networks: {
    qId: ItemId;
    name: string;
    logoUrl?: string;
    wikipedia?: string;
  }[];
  routes: {
    [network: ItemId]: {
      [shieldKey: string]: {
        shield: RouteShield;
        wikidata: RouteWikiInfo | undefined;
        variants: {
          [osmId: string]: {
            tags: Record<'from' | 'to' | 'via', string | undefined>;
            lastUpdate: Stop['lastUpdate'];
            stops: {
              /** undefined if we have no exit: data for this stop */
              stationRelation: number | undefined;
              stopNode: number;
              restriction: 'entry_only' | 'exit_only' | undefined;
              requestOnly: boolean | undefined;
            }[];
          };
        };
      };
    };
  };
  nodesWithNoData: {
    [nodeId: number]: Pick<Stop, 'exitSide' | 'platform'> & {
      name: string | undefined;
    };
  };
  supportedSymbols: {
    [symbol: string]: string;
  };
  lastGenerated: string;
  lastUpdated: string;
};

export type Rank = 'normal' | 'preferred' | 'deprecated';

export type Wikidata = parse.WbGetEntitiesResponse['entities'];

export type Images = {
  [qId: string]: string;
};

export type RawInput = {
  osm: OsmFeature[];
  wikidata: Wikidata;
  lastUpdated: string;
};

export type Handler = PagesFunction<{
  KV_STORE: KVNamespace;
}>;
