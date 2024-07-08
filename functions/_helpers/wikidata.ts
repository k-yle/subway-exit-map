import type { Item } from 'wikibase-sdk';
import type { Rank } from '../_logic/types.def.js';

export enum P {
  Vehicle = 'P3438',
  Length = 'P2043',
  Stability = 'P2668',
}

export enum Q {
  Carriage = 'Q753779',
  Unstable = 'Q24025284',
}

const RANK_MAP: Record<Rank, number> = {
  normal: 0,
  deprecated: -1,
  preferred: +1,
};

export const sortByRank = (a: { rank: Rank }, b: { rank: Rank }) =>
  RANK_MAP[a.rank] - RANK_MAP[b.rank];

export const getItemName = (item: Item) => {
  const defaultName =
    item.labels?.en?.value || Object.values(item.labels || {})[0]?.value || '';
  const altNames = item.aliases?.en?.map((term) => term.value) || [];

  // ignore names that are less than 3 chars long
  // but then pick the shortest remaining name
  const all = [defaultName, ...altNames]
    .filter((name) => name.length > 3)
    .sort((a, b) => a.length - b.length);

  return all[0] || defaultName;
};

export const getItemWikipedia = (item: Item) => {
  const page = item.sitelinks?.enwiki || Object.values(item.sitelinks || {})[0];
  if (!page) return undefined;

  return `${page.site.replace('wiki', '')}:${encodeURIComponent(page.title.replaceAll(' ', '_'))}`;
};
