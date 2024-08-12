import type { OsmNode, OsmRelation, Tags } from 'osm-api';
import { groupBy, omit, uniq, uniqBy } from '../_helpers/objects.js';
import { getConstrastingTextColour } from '../_helpers/style.js';
import { formatList } from '../_helpers/i18n.js';
import { getShieldKey, getShieldKeyHashed } from '../_helpers/hash.js';
import { getNetwork } from '../_helpers/override.js';
import type { RouteShield, RouteThatStopsHere, Stop } from './types.def.js';

/** most routes don't have a `shape` tag yet, so we can guess the shape */
const inferShape = (tags: Tags) => {
  if (tags.ref?.startsWith('<')) return 'diamond'; // NYC express trains
  if (tags.network?.includes('NYC')) return 'circle';
  return 'rectangular';
};

export function getRouteShield(tags: Tags): RouteShield {
  const colour = tags!.colour || '#333333';
  return {
    ref: tags!.ref,
    colour: {
      bg: colour,
      fg: getConstrastingTextColour(colour.replace('#', '')),
    },
    shape: tags!.shape || inferShape(tags!),
  };
}

export async function groupRoutesThatStopHere(
  relations: OsmRelation[],
  node: OsmNode,
): Promise<Stop['routes']> {
  const unique = uniqBy(
    await Promise.all(
      relations.map(async (r) => {
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

        const { role } = r.members[memberIndex];
        const isTerminating = role === 'stop_exit_only' || !hasNextStop;

        const shield = getRouteShield(r.tags!);
        const item: RouteThatStopsHere = {
          ...shield,
          to: [(isTerminating ? r.tags!.from : r.tags!.to) || 'Unknown'],
          type: isTerminating ? 'from' : 'to',
          shieldKey: await getShieldKeyHashed(shield),
          qId: getNetwork(r.tags!)!,
          osmId: r.id,
        };
        return item;
      }),
    ),
    (x) => `${getShieldKey(x)}${x.type}${x.to?.join('|')}`,
  );

  // if the route starts and ends here, merge the two entries
  for (const a of unique) {
    if (a.type === 'to') {
      const identicalPairIndex = unique.findIndex(
        (b) =>
          b !== a &&
          JSON.stringify(omit(b, ['type'])) ===
            JSON.stringify(omit(a, ['type'])),
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
      groupedByDestination[key].length === 1 &&
      groupedByDestination[key][0].to![0].length < 20 // only group short destinations
    ) {
      const [route] = groupedByDestination[key];
      if (route.ref in singles) {
        // we've already seen a single route with this ref
        const existingKey = singles[route.ref];
        groupedByDestination[existingKey][0].to!.push(route.to![0]);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
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
        const to = formatList(
          routes
            .flatMap((r) => r.to!)
            .filter(uniq)
            .sort((a, b) => a.localeCompare(b)),
        );
        return <const>[to, routes];
      })
      // order of rows when there are multiple routes & multiple destinations
      .sort(([, [a]], [, [b]]) => {
        if (a.type !== 'to') return 2;
        if (b.type !== 'to') return -2;
        return (a.ref || '').localeCompare(b.ref || '');
      }),
  );
}
