import type { OsmFeature, OsmNode, OsmRelation, OsmWay, Tags } from 'osm-api';
import type { ItemId, parse } from 'wikibase-sdk';

export type MultiLingualNames = Tags;

export type FwdBwdBoth = 'forward' | 'backward' | 'both_ways';

export type ExitSide = 'left' | 'right' | 'both' | undefined;

export type Alignment = 'first' | 'middle' | 'last';

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
  type: 'loco' | 'middle' | 'gap';
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
  nodeId: number;
  stationName: MultiLingualNames;
  platform: string | undefined;
};

export type Shape = 'circle' | 'rectangular' | 'diamond';

export type RouteShield = {
  ref: string;
  colour: { bg: string; fg: string };
  shape: Shape;
};

export type RouteThatStopsHere = RouteShield & {
  /** @internal */
  to?: string[];
  type: 'to' | 'from' | 'both';
  /** ID of the network(s) */
  qId: ItemId[];
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
  shortPlatform?: { alignment: Alignment; count: number };
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
  disambiguationName?: MultiLingualNames;
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
  name: MultiLingualNames;
  networks: ItemId[];
  fareGates: FareGates | undefined;
  fareGatesNote: string | undefined;
  stops: Stop[];
};

export type Trainset = {
  name: string;
  wikidata: string;
  wikipedia: MultiLingualNames;
  carriages: number[] | undefined;
  regularity: Regularity;
  doors?: {
    /** number of doors per carriage */
    quantity: number;
    alignment: React.CSSProperties['justifyContent'];
  };
};

export type RouteWikiInfo = {
  name: string;
  qId: string;
  wikipedia: MultiLingualNames;
  trainsets: Trainset[] | undefined;
};

export type Data = {
  warnings: string[];
  stations: Station[];
  networks: {
    qId: ItemId;
    name: MultiLingualNames;
    logoUrl: string | undefined;
    wikipedia: MultiLingualNames;
    country: string | undefined;
    centre: { lat: number; lon: number };
    /**
     * if undefined, the system does not use numbered platform screen doors.
     * if a number, then that's the number of the first door, starting from
     * the front.
     */
    doorNumbers?: number;
  }[];
  routes: {
    [network: ItemId]: {
      [shieldKey: string]: {
        shield: RouteShield;
        wikidata: RouteWikiInfo | undefined;
        variants: {
          [osmId: string]: {
            tags: {
              from: string | undefined;
              fromRef: string | undefined;
              to: string | undefined;
              toRef: string | undefined;
              via: string[] | undefined;
              direction: string | undefined;
            };
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
      name: Tags;
    };
  };
  supportedSymbols: {
    generic: { [symbol: string]: string };
    [network: ItemId]: { [symbol: string]: string };
  };
  lastGenerated: string;
  lastUpdated: string;
};

export type Rank = 'normal' | 'preferred' | 'deprecated';

export type Wikidata = parse.WbGetEntitiesResponse['entities'];

export type Images = {
  [qId: string]: string;
};

/** an object for faster lookups */
export interface OsmFeatures {
  node: { [nodeId: number]: OsmNode };
  way: { [wayId: number]: OsmWay };
  relation: { [relationId: number]: OsmRelation };
}

export type RawInput = {
  osm: OsmFeature[];
  wikidata: Wikidata;
  lastUpdated: string;
};
