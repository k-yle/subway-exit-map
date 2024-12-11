import { fetchData } from './_logic/fetchData.js';
import { processData } from './_logic/processData.js';
import type { Handler, RawInput } from './_logic/types.def.js';

export const onRequest: Handler = async (context) => {
  const url = new URL(context.request.url);
  const bypassCache = url.searchParams.get('bypassCache') === 'true';
  const extended = url.searchParams.get('extended') === 'true';

  let input = await context.env.KV_STORE.get<RawInput>('best-carriage', 'json');

  // if the cached data is over 1 day old, discard it
  if (
    bypassCache ||
    (input && Date.now() - +new Date(input.lastUpdated) > 1000 * 60 * 60 * 24)
  ) {
    input = null;
  }

  const isCached = !!input;

  const API_BASE_URL = url.origin;

  input ||= await fetchData(API_BASE_URL);

  const languages =
    context.request.headers
      .get('Accept-Language')
      ?.split(',')
      .map((code) => code.split(';')[0])
      .flatMap((locale) => [locale, locale.split('-')[0]]) || [];

  if (!languages.length) languages.push('en');

  const { imageUrls, toClient } = await processData(
    input,
    languages,
    API_BASE_URL,
  );

  if (!isCached) {
    await context.env.KV_STORE.put('best-carriage', JSON.stringify(input));
    await context.env.KV_STORE.put(
      'best-carriage-images',
      JSON.stringify(imageUrls),
    );
  }

  toClient.country = context.request.headers.get('CF-IPCountry') || undefined;

  return Response.json(
    extended
      ? toClient
      : { ...toClient, routes: undefined, nodesWithNoData: undefined },
  );
};
