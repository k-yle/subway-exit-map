import type { OsmFeature, OsmNode } from 'osm-api';
import type { Item, ItemId } from 'wikibase-sdk';
import { getNetwork } from '../_helpers/override.js';
import { getShieldKeyHashed } from '../_helpers/hash.js';
import { cleanName, getName } from '../_helpers/osm.js';
import { P, Q, getItemName, getItemWikipedia } from '../_helpers/wikidata.js';
import {
  type Data,
  type ExitSide,
  Regularity,
  type Station,
  type Stop,
  type Trainset,
  type Wikidata,
} from './types.def.js';
import { getRouteShield } from './groupRoutesThatStopHere.js';

export async function getAllRoutes(
  data: OsmFeature[],
  wikidata: Wikidata,
  stationsByStopId: Record<number, [Station, Stop]>,
  languages: string[],
) {
  const nodesWithNoData: Data['nodesWithNoData'] = {};
  const routes: Data['routes'] = {};

  const routeQIds = new Set<string>();

  for (const route of data) {
    if (route.type !== 'relation' || !route.tags?.route) continue;

    if (route.tags.wikidata) {
      routeQIds.add(route.tags.wikidata);
    }

    const network = getNetwork(route.tags)!;
    const shield = getRouteShield(route.tags);
    const shieldKey = await getShieldKeyHashed(shield);
    routes[network] ||= {};
    routes[network][shieldKey] ||= {
      shield,
      wikidata: undefined, // added below
      variants: {},
    };

    if (route.tags.wikidata) {
      const item = <Item>wikidata[<ItemId>route.tags.wikidata];
      const networkItem = <Item | undefined>(
        wikidata[<ItemId>route.tags['network:wikidata']]
      );
      if (!item) {
        throw new Error(`No data for ${route.tags.wikidata}`);
      }

      routes[network][shieldKey].wikidata ||= {
        name: getItemName(item),
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
            name: getItemName(trainset),
            wikidata: trainsetQId,
            wikipedia: getItemWikipedia(trainset),
            regularity:
              stabilityId === Q.Unstable
                ? Regularity.usually
                : Regularity.always,
            carriages,
          };
        }),
      };
    }

    routes[network][shieldKey].variants[route.id] = {
      tags: {
        from: route.tags.from,
        to: route.tags.to,
        via: route.tags.via,
      },
      lastUpdate: {
        date: route.timestamp,
        user: route.user,
      },
      stops: route.members
        .filter((m) => m.role.startsWith('stop') && m.type === 'node')
        .map((member) => {
          const stationRelation = stationsByStopId[member.ref]?.[0].relationId;

          if (!stationRelation) {
            const node = data.find(
              (x): x is OsmNode => x.type === 'node' && x.id === member.ref,
            );
            if (node) {
              nodesWithNoData[node.id] = {
                name: cleanName(getName(node.tags, languages)),
                // TODO: the side could be wrong, because we don't know
                // which way the train travels down the track. Currently
                // it assumes forwards.
                exitSide: <ExitSide>node.tags?.side,
                platform: node.tags?.local_ref,
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

  return { routes, nodesWithNoData };
}
