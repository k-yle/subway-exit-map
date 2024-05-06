import type { OsmFeature } from 'osm-api';
import { isTruthy, uniq } from '../_helpers/objects.js';
import type { RawInput, Wikidata } from './types.def.js';
import query from './query.overpassql.txt';

export async function fetchData(API_BASE_URL: string): Promise<RawInput> {
  const osmResponse = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'User-Agent': API_BASE_URL },
  }).then((r) => r.json() as Promise<{ elements: OsmFeature[] }>);
  const osmElements = osmResponse.elements;

  const allQIds = osmElements
    .filter((entity) => entity.type === 'relation')
    .map((entity) => entity.tags?.['network:wikidata'])
    .filter(isTruthy)
    .filter(uniq);

  const wikidataResponse = await fetch(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${allQIds.join('|')}&origin=*`,
    { headers: { 'User-Agent': API_BASE_URL } },
  ).then((r) => r.json() as Promise<{ entities: Wikidata }>);

  return {
    osm: osmElements,
    wikidata: wikidataResponse.entities,
    lastUpdated: new Date().toISOString(),
  };
}
