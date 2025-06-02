import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { OsmFeature } from 'osm-api';
import type { Item, ItemId, parse } from 'wikibase-sdk';
import { createChunks, isTruthy } from '../_helpers/objects.js';
import { P } from '../_helpers/wikidata.js';
import { getNetworks } from '../_helpers/override.js';
import type { RawInput, Wikidata } from './types.def.js';

export const TMP_FILE = join(tmpdir(), 'exitsTmp.json');

export async function fetchChunked(qIds: Iterable<ItemId>, userAgent: string) {
  const data: Wikidata = {};
  for (const chunk of createChunks([...qIds], 50)) {
    console.log('Fetching from wikidata…');
    const resp = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.join('|')}&format=json`,
      { headers: { 'User-Agent': userAgent } },
    ).then(
      (response) =>
        response.json() as Promise<
          parse.WbGetEntitiesResponse | { error: unknown }
        >,
    );
    if ('error' in resp) throw new Error(JSON.stringify(resp.error));

    Object.assign(data, resp.entities);
  }
  return data;
}

export async function fetchData(userAgent: string): Promise<RawInput> {
  try {
    const cached: RawInput = JSON.parse(await fs.readFile(TMP_FILE, 'utf8'));
    console.log(`Using cached data from ${TMP_FILE}`);
    return cached;
  } catch {
    // no cache available
  }

  console.log('Fetching from overpass…');
  const query = await fs.readFile(
    join(import.meta.dirname, 'query.overpassql'),
    'utf8',
  );

  const osmResponse = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'User-Agent': userAgent },
  }).then((r) => r.json() as Promise<{ elements: OsmFeature[] }>);
  const osmElements = osmResponse.elements;

  const networkQIds = osmElements
    .filter((entity) => entity.type === 'relation')
    .flatMap((entity) => getNetworks(entity.tags))
    .filter(isTruthy);

  const routeQIds = osmElements
    .filter((entity) => entity.type === 'relation' && entity.tags?.route)
    .flatMap((entity) => <ItemId | undefined>entity.tags?.wikidata?.split(';'))
    .filter(isTruthy);

  const allQIds = new Set([...networkQIds, ...routeQIds]);

  const wikidataResponse = await fetchChunked(allQIds, userAgent);

  // now we need to fetch the trainset info
  const trainsetQIds = new Set(
    (<Item[]>Object.values(wikidataResponse)).flatMap(
      (item) =>
        item.claims?.[P.Vehicle]?.flatMap((claim) => {
          const v = claim.mainsnak.datavalue?.value;
          return typeof v === 'object' && 'id' in v ? [<ItemId>v.id] : [];
        }) || [],
    ),
  );
  const wikidataResponse2 = await fetchChunked(trainsetQIds, userAgent);

  const result: RawInput = {
    osm: osmElements,
    wikidata: {
      ...wikidataResponse,
      ...wikidataResponse2,
    },
    lastUpdated: new Date().toISOString(),
  };

  await fs.writeFile(TMP_FILE, JSON.stringify(result, null, 2));

  return result;
}
