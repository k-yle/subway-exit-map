import type { OsmFeature } from 'osm-api';
import type { Item, parse } from 'wikibase-sdk';
import { createChunks, isTruthy } from '../_helpers/objects.js';
import { P } from '../_helpers/wikidata.js';
import type { RawInput, Wikidata } from './types.def.js';
import query from './query.overpassql.txt';

export async function fetchChunked(
  qIds: Iterable<string>,
  API_BASE_URL: string,
) {
  const data: Wikidata = {};
  for (const chunk of createChunks([...qIds], 100)) {
    console.log('Fetching from wikidata…');
    const resp = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.join('|')}&format=json`,
      { headers: { 'User-Agent': API_BASE_URL } },
    ).then((response) => response.json<parse.WbGetEntitiesResponse>());
    Object.assign(data, resp.entities);
  }
  return data;
}

export async function fetchData(API_BASE_URL: string): Promise<RawInput> {
  console.log('Fetching from overpass…');
  const osmResponse = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'User-Agent': API_BASE_URL },
  }).then((r) => r.json() as Promise<{ elements: OsmFeature[] }>);
  const osmElements = osmResponse.elements;

  const networkQIds = osmElements
    .filter((entity) => entity.type === 'relation')
    .map((entity) => entity.tags?.['network:wikidata'])
    .filter(isTruthy);

  const routeQIds = osmElements
    .filter((entity) => entity.type === 'relation' && entity.tags?.route)
    .map((entity) => entity.tags?.wikidata)
    .filter(isTruthy);

  const allQIds = new Set([...networkQIds, ...routeQIds]);

  const wikidataResponse = await fetchChunked(allQIds, API_BASE_URL);

  // now we need to fetch the trainset info
  const trainsetQIds = new Set(
    (<Item[]>Object.values(wikidataResponse)).flatMap(
      (item) =>
        item.claims?.[P.Vehicle]?.flatMap((claim) => {
          const v = claim.mainsnak.datavalue?.value;
          return typeof v === 'object' && 'id' in v ? [v.id] : [];
        }) || [],
    ),
  );
  const wikidataResponse2 = await fetchChunked(trainsetQIds, API_BASE_URL);

  return {
    osm: osmElements,
    wikidata: {
      ...wikidataResponse,
      ...wikidataResponse2,
    },
    lastUpdated: new Date().toISOString(),
  };
}
