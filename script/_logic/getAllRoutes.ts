import type { Item, ItemId } from 'wikibase-sdk';
import type { Property as Css } from 'csstype';
import { getNetworks } from '../_helpers/override.js';
import { getShieldKeyHashed } from '../_helpers/hash.js';
import { getLocalRef, getNames } from '../_helpers/osm.js';
import {
  P,
  Q,
  equalsQId,
  getItemNames,
  getItemWikipedia,
} from '../_helpers/wikidata.js';
import {
  type Data,
  type Direction,
  type OsmFeatures,
  Regularity,
  type Station,
  type Stop,
  type Trainset,
  type Wikidata,
} from './types.def.js';
import { getRouteShield } from './groupRoutesThatStopHere.js';
import type { RouteShapes } from './getRouteShapes.js';

/** valid values for `justify-content` */
const FLEXBOX: string[] = [
  'start',
  'center',
  'end',
  'space-between',
  'space-around',
  'space-evenly',
] satisfies Css.JustifyContent[];

/**
 * the trainset can have "HasPart=Door" to define the number of
 * doors per carriage, and their alignment along the long edge
 * of the carriage.
 */
function getDoorInfo(trainset: Item): Trainset['doors'] {
  const door = trainset.claims?.[P.HasPart]?.find(
    (part) =>
      equalsQId(part.mainsnak.datavalue, Q.Door) ||
      equalsQId(part.mainsnak.datavalue, Q.TrainDoor),
  );

  const doorQty = door?.qualifiers?.[P.Quantity]?.[0]?.datavalue?.value;
  const doorAlignment = door?.qualifiers?.[P.Css]?.[0]?.datavalue?.value
    ?.toString()
    .split('#')[1];

  if (
    typeof doorQty !== 'object' ||
    !('amount' in doorQty) ||
    Number.isNaN(+doorQty.amount) ||
    !+doorQty.amount
  ) {
    return undefined;
  }

  if (typeof doorAlignment !== 'string') return undefined;
  if (!FLEXBOX.includes(doorAlignment)) return undefined;

  return {
    quantity: +doorQty.amount,
    alignment: <Css.JustifyContent>doorAlignment,
  };
}

export function getAllRoutes(
  osm: OsmFeatures,
  wikidata: Wikidata,
  stationsByStopId: Record<number, [Station, Stop]>,
  routeShapes: RouteShapes,
) {
  const nodesWithNoData: Data['nodesWithNoData'] = {};
  const routes: Data['routes'] = {};

  const routeQIds = new Set<string>();

  for (const route of Object.values(osm.relation)) {
    if (!route.tags?.route) continue;

    if (route.tags.wikidata) {
      routeQIds.add(route.tags.wikidata);
    }

    const networks = getNetworks(route.tags)!;
    const shield = getRouteShield(route.tags, routeShapes);
    const shieldKey = getShieldKeyHashed(shield);
    for (const network of networks) {
      routes[network] ||= {};
      routes[network][shieldKey] ||= {
        shield,
        wikidata: undefined, // added below
        variants: {},
      };

      if (route.tags.wikidata) {
        const item = <Item>wikidata[<ItemId>route.tags.wikidata];
        const networkItem = <Item | undefined>(
          wikidata[getNetworks(route.tags)[0]!]
        );
        if (!item) {
          throw new Error(`No data for ${route.tags.wikidata}`);
        }

        routes[network][shieldKey].wikidata ||= {
          names: getItemNames(item),
          qId: item.id,
          wikipedia: getItemWikipedia(item),
          trainsets: (
            item.claims?.[P.Vehicle] || networkItem?.claims?.[P.Vehicle]
          )?.map((claim): Trainset => {
            const idObject = claim.mainsnak.datavalue?.value;
            const trainsetQId =
              typeof idObject === 'object' && 'id' in idObject
                ? <ItemId>idObject.id
                : undefined;
            if (!trainsetQId) throw new Error('Invalid claim');

            const trainset = <Item>wikidata[trainsetQId];

            if (!trainset) throw new Error(`${trainsetQId} missing`);

            const carriages = claim.qualifiers?.[P.Length]
              ?.map((qualifier) =>
                qualifier.datavalue?.type === 'quantity'
                  ? qualifier.datavalue.value
                  : undefined,
              )
              .filter((value) => value && value?.unit.endsWith(Q.Carriage))
              .map((value) => +value!.amount);

            const stability =
              claim.qualifiers?.[P.Stability]?.[0]?.datavalue?.value;
            const stabilityId =
              typeof stability === 'object' && 'id' in stability
                ? <ItemId>stability.id
                : undefined;

            return {
              names: getItemNames(trainset),
              wikidata: trainsetQId,
              wikipedia: getItemWikipedia(trainset),
              regularity:
                stabilityId === Q.Unstable
                  ? Regularity.usually
                  : Regularity.always,
              carriages,
              doors: getDoorInfo(trainset),
            };
          }),
        };
      }

      routes[network][shieldKey].variants[route.id] = {
        tags: {
          from: route.tags.from,
          fromRef: route.tags['from:ref'],
          to: route.tags.to,
          toRef: route.tags['to:ref'],
          via: route.tags.via?.split(';'),
          direction: <Direction | undefined>route.tags.direction,
        },
        lastUpdate: {
          date: route.timestamp,
          user: route.user,
        },
        stops: route.members
          .filter((m) => m.role.startsWith('stop') && m.type === 'node')
          .map((member) => {
            const stationRelation =
              stationsByStopId[member.ref]?.[0].relationId;

            if (!stationRelation) {
              const node = osm[member.type][member.ref];
              if (node) {
                nodesWithNoData[node.id] = {
                  name: getNames(node.tags),
                  exitSide: undefined,
                  platform: getLocalRef(node.tags, [network]),
                };
              }
            }

            return {
              stationRelation,
              stopNode: member.ref,
              requestOnly: member.role.includes('_on_demand') || undefined,
              restriction: member.role.includes('entry_only')
                ? 'entry_only'
                : member.role.includes('exit_only')
                  ? 'exit_only'
                  : undefined,
            };
          }),
      };
    }
  }

  return { routes, nodesWithNoData };
}
