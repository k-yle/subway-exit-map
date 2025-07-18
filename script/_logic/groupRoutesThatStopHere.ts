import type { OsmNode, OsmRelation, Tags } from 'osm-api';
import type { ItemId } from 'wikibase-sdk';
import { groupBy, omit, uniq, uniqBy } from '../_helpers/objects.js';
import { getConstrastingTextColour } from '../_helpers/style.js';
import { getShieldKey, getShieldKeyHashed } from '../_helpers/hash.js';
import { getNetworks } from '../_helpers/override.js';
import type { RouteShield, RouteThatStopsHere, Stop } from './types.def.js';
import type { RouteShapes } from './getRouteShapes.js';

const DEST_DELIMITER = '𖠕';

export function getRouteShield(
  tags: Tags,
  routeShapes: RouteShapes,
): RouteShield {
  const colour = tags!.colour || '#333333';
  return {
    ref: tags!.ref!,
    colour: {
      bg: colour,
      fg: getConstrastingTextColour(colour.replace('#', '')),
    },
    shape: routeShapes[<ItemId>tags!.wikidata] || 'rectangular',
  };
}

export function groupRoutesThatStopHere(
  relations: OsmRelation[],
  node: OsmNode,
  routeShapes: RouteShapes,
): Stop['routes'] {
  const unique = uniqBy(
    relations.map((r) => {
      const memberIndex = r.members.findIndex(
        (m) => m.type === 'node' && m.ref === node.id,
      );
      /**
       * the last stop should have stop_exit_only,
       * but if not we can figure out if it's the last.
       */
      const hasNextStop = r.members
        .slice(memberIndex + 1)
        .some((m) => m.role.startsWith('stop'));

      const { role } = r.members[memberIndex]!;
      const isTerminating = role === 'stop_exit_only' || !hasNextStop;

      const shield = getRouteShield(r.tags!, routeShapes);

      const from = [r.tags!.from, r.tags!['from:ref']]
        .filter(Boolean)
        .join(DEST_DELIMITER);
      const to = [r.tags!.to, r.tags!['to:ref']]
        .filter(Boolean)
        .join(DEST_DELIMITER);

      const item: RouteThatStopsHere = {
        ...shield,
        to: [(isTerminating ? from : to) || 'Unknown'],
        type: isTerminating ? 'from' : 'to',
        shieldKey: getShieldKeyHashed(shield),
        qId: getNetworks(r.tags!)!,
        osmId: r.id,
      };
      return item;
    }),
    (x) => `${getShieldKey(x)}${x.type}${x.to?.join('|')}`,
  );

  // if the route starts and ends here, merge the two entries
  for (const a of unique) {
    if (a.type === 'to') {
      const identicalPairIndex = unique.findIndex(
        (b) =>
          b !== a &&
          JSON.stringify(omit(b, ['type', 'osmId'])) ===
            JSON.stringify(omit(a, ['type', 'osmId'])),
      );
      if (identicalPairIndex !== -1) {
        // delete `b` & mark `a` as both
        unique.splice(identicalPairIndex, 1);
        a.type = 'both';
      }
    }
  }

  // first pass: group by destination e.g. (7) <7> to Flushing–Main St
  const groupedByDestination = groupBy(unique, (x) => x.type + x.to!.join('|'));

  // second pass: group by route, e.g. T1 to Richmond and Emu Plains
  const singles: Record<string, string> = {};
  for (const key in groupedByDestination) {
    if (
      groupedByDestination[key]!.length === 1 &&
      groupedByDestination[key]![0]!.to![0]!.length < 20 // only group short destinations
    ) {
      const route = groupedByDestination[key]![0]!;
      if (route.ref in singles) {
        // we've already seen a single route with this ref
        const existingKey = singles[route.ref]!;
        groupedByDestination[existingKey]![0]!.to!.push(route.to![0]!);
        delete groupedByDestination[key];
      } else {
        // we haven't (yet) seen any other single routes with this ref
        singles[route.ref] = key;
      }
    }
  }

  // sorting and deduplication
  return Object.fromEntries(
    Object.values(groupedByDestination)
      .map((unsorted) => {
        // order of columns when there are multiple refs on one row
        const routes = unsorted.sort((a, b) =>
          (a.ref || '').localeCompare(b.ref || ''),
        );

        const to = routes
          .flatMap((r) => r.to!)
          .filter(uniq)
          .sort((a, b) => a.localeCompare(b))
          .join(' | ');
        return <const>[to, routes];
      })
      // order of rows when there are multiple routes & multiple destinations
      .sort(([, a], [, b]) => {
        if (a[0]!.type !== 'to') return 2;
        if (b[0]!.type !== 'to') return -2;
        return (a[0]!.ref || '').localeCompare(b[0]!.ref || '');
      }),
  );
}
