import type {
  Item,
  ItemId,
  SnakDataValue,
  WikibaseEntityIdSnakDataValue,
} from 'wikibase-sdk';
import type { MultiLingualNames, Rank, Shape } from '../_logic/types.def.js';

export enum P {
  Country = 'P17',
  Logo2 = 'P154',
  GeoCoordinates = 'P625',
  FacebookUsername = 'P2013',
  Length = 'P2043',
  Stability = 'P2668',
  Vehicle = 'P3438',
  Logo1 = 'P8972',
  Uses = 'P2283',
  HasPart = 'P527',
  Quantity = 'P1114',
  Css = 'P10177',
  AppliesToPart = 'P518',
  FirstNumber = 'P1545',
  Shape = 'P1419',
}

export enum Q {
  Carriage = 'Q753779',
  Unstable = 'Q24025284',
  Door = 'Q36794',
  TrainDoor = 'Q117075694',
  PlatformScreenDoor = 'Q570730',
  NumericalDigit = 'Q82990',
  RouteShield = 'Q5759965',
  AlphanumericCode = 'Q3504901',
  Station = 'Q12819564',
}

export const WIKIDATA_SHAPES: Record<ItemId, Shape> = {
  Q17278: 'circle',
  Q41159: 'diamond',
};

const RANK_MAP: Record<Rank, number> = {
  normal: 0,
  deprecated: -1,
  preferred: +1,
};

export const isQId = (
  snak: SnakDataValue | undefined,
): snak is WikibaseEntityIdSnakDataValue => {
  return typeof snak?.value === 'object' && 'id' in snak.value;
};

export const equalsQId = (
  snak: SnakDataValue | undefined,
  qId: ItemId,
): snak is WikibaseEntityIdSnakDataValue => {
  return isQId(snak) && snak.value.id === qId;
};

export const sortByRank = (a: { rank: Rank }, b: { rank: Rank }) =>
  RANK_MAP[a.rank] - RANK_MAP[b.rank];

export const getItemNames = (item: Item): MultiLingualNames => {
  const names: MultiLingualNames = {};

  for (const lang in item.labels) {
    const defaultName =
      item.labels?.[lang]?.value ||
      Object.values(item.labels || {})[0]?.value ||
      '';
    const altNames = item.aliases?.[lang]?.map((term) => term.value) || [];

    // ignore names that are less than 3 chars long
    // but then pick the shortest remaining name
    const all = [defaultName, ...altNames]
      .filter((name) => name.length > 3)
      .sort((a, b) => a.length - b.length);

    names[lang] = all[0] || defaultName;
  }
  return names;
};

export const getItemWikipedia = (item: Item) => {
  const wikipediaPages: MultiLingualNames = {};
  for (const [site, page] of Object.entries(item.sitelinks || {})) {
    const lang = site.replace('wiki', '');
    if (page.title) {
      wikipediaPages[lang] =
        `${lang}:${encodeURIComponent(page.title.replaceAll(' ', '_'))}`;
    }
  }
  return wikipediaPages;
};
