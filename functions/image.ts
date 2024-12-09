import { ICONS } from './_helpers/override.js';
import type { Handler, Images } from './_logic/types.def.js';

export const onRequest: Handler = async (context) => {
  const images = await context.env.KV_STORE.get<Images>(
    'best-carriage-images',
    'json',
  );

  const apiUrl = new URL(context.request.url);

  const qId = apiUrl.searchParams.get('qId')?.toUpperCase() || '';
  const symbol = apiUrl.searchParams.get('symbol')?.toLowerCase() || '';

  const imageUrl =
    qId && symbol
      ? ICONS[qId]?.[symbol] || ICONS.generic[symbol]
      : images?.[qId];

  if (!imageUrl) return new Response(undefined, { status: 404 });

  return fetch(imageUrl, {
    // logos never change, so cache for 1 month
    headers: { 'User-Agent': apiUrl.origin },
    cf: { cacheEverything: true, cacheTtl: 60 * 60 * 24 * 31 },
  });
};
