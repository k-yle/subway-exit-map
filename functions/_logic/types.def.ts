import type { KVNamespace, PagesFunction } from '@cloudflare/workers-types';
import type { OsmFeature } from 'osm-api';

export type FwdBwdBoth = 'forward' | 'backward' | 'both_ways';

export type ExitSide = 'left' | 'right' | undefined;

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
   * - `undefined` means unidirectional.
   */
  biDiMode?: 'regular' | 'occasional';
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
};

export enum FareGates {
  yes = 'yes',
  no = 'no',
  partial = 'partial',
}

export type Station = {
  relationId: number;
  gtfsId: string;
  name: string;
  networks: string[];
  fareGates: FareGates | undefined;
  stops: Stop[];
  flipAlgorithm?: string;
};

export type Data = {
  warnings: string[];
  stations: Station[];
  networks: {
    qId: string;
    name: string;
    logoUrl?: string;
    wikipedia?: string;
  }[];
  routes: {
    [network: string]: {
      [shieldKey: string]: {
        shield: RouteShield;
        variants: {
          [osmId: string]: {
            from: string;
            to: string;
            via: string;
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

export type Wikidata = {
  [qId: string]: {
    pageid: number;
    ns: number;
    title: string;
    lastrevid: number;
    /** ISO Date */
    modified: string;
    type: 'item';
    id: string;
    labels: {
      [languageCode: string]: {
        language: string;
        value: string;
      };
    };
    descriptions: {
      [languageCode: string]: {
        language: string;
        value: string;
      };
    };
    aliases: {
      [languageCode: string]: {
        language: string;
        value: string;
      }[];
    };
    claims: {
      [propertyId: string]: {
        mainsnak: {
          snaktype: 'value';
          property: string;
          hash: string;
          datavalue: { value: string };
          datatype: string;
        };
        type: 'statement';
        id: string;
        rank: Rank;
      }[];
    };
    sitelinks: {
      [wikiName: string]: {
        site: string;
        title: string;
        badges: unknown[];
      };
    };
  };
};

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
