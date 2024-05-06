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

export type Carriage =
  | { type: 'ellipsis'; ref: number }
  | {
      type: 'carriage' | 'loco';
      ref: number;
      isBest?: true;
      unavailable?: true;
      exitType?: ExitType[];
      exitNumber?: string[];
      exitTo?: string[];
    };

export type AdjacentStop = {
  gtfsId: string | undefined;
  stationName: string;
  platform: string | undefined;
};

export type RouteThatStopsHere = {
  ref: string;
  colour: { bg: string; fg: string };
  shape: string;
  /** @internal */
  to?: string[];
  doNotBoard?: boolean;
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
  lastUpdate: {
    user: string;
    date: string;
  };
  routes: {
    [to: string]: RouteThatStopsHere[];
  };
};

export type Station = {
  relationId: number;
  gtfsId: string;
  name: string;
  networks: string[];
  fareGates: boolean | undefined;
  stops: {
    [id: string]: Stop;
  };
  flipAlgorithm?: string;
};

export type Data = {
  stations: {
    [id: string]: Station;
  };
  networks: {
    [qId: string]: {
      name: string;
      logoUrl?: string;
      wikipedia?: string;
    };
  };
  sizeMb: number;
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
