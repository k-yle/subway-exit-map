import type { Entities, Item, ItemId } from 'wikibase-sdk';
import { P, Q, WIKIDATA_SHAPES, equalsQId, isQId } from '../_helpers/wikidata';
import { take } from '../_helpers/objects';
import type { Shape } from './types.def';

export type RouteShapes = Record<ItemId, Shape>;

export function getRouteShapes(wikidata: Entities) {
  /** map of the shield's {@link Shape} for each route qId */
  const routeShapes: RouteShapes = {};

  for (const [_qId, _item] of Object.entries(wikidata)) {
    const qId = <ItemId>_qId;
    const item = <Item>_item;

    const shields =
      item.claims?.[P.HasPart]?.filter((part) =>
        equalsQId(part.mainsnak.datavalue, Q.RouteShield),
      ) || [];
    const shapes = new Set(
      shields
        .flatMap((shield) =>
          shield.qualifiers?.[P.Shape].map((shape) => shape.datavalue),
        )
        .filter(isQId)
        .map((shape) => WIKIDATA_SHAPES[<never>shape.value.id])
        .filter(Boolean),
    );
    if (shapes.size === 1) routeShapes[qId] = take(shapes)!;
  }

  return routeShapes;
}
