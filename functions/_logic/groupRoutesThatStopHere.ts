import type { OsmNode, OsmRelation, Tags } from 'osm-api';
import { groupBy, uniq, uniqBy } from '../_helpers/objects.js';
import { getConstrastingTextColour } from '../_helpers/style.js';
import { formatList } from '../_helpers/i18n.js';
import type { RouteThatStopsHere, Stop } from './types.def.js';

/** most routes don't have a `shape` tag yet, so we can guess the shape */
const inferShape = (tags: Tags) => {
  if (tags.ref?.startsWith('<')) return 'diamond'; // NYC express trains
  if (tags.network?.includes('NYC')) return 'circle';
  return 'rectangular';
};

export function groupRoutesThatStopHere(
  relations: OsmRelation[],
  node: OsmNode,
): Stop['routes'] {
  // first pass: group by destination e.g. (7) <7> to Flushing–Main St
  const groupedByDestination = groupBy(
    uniqBy(
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

        const { role } = r.members[memberIndex];
        const isTerminating = role === 'stop_exit_only' || !hasNextStop;

        const item: RouteThatStopsHere = {
          ref: r.tags!.ref,
          colour: {
            bg: r.tags!.colour,
            fg: getConstrastingTextColour(r.tags!.colour.replace('#', '')),
          },
          shape: r.tags!.shape || inferShape(r.tags!),
          to: [(isTerminating ? r.tags!.from : r.tags!.to) || 'Unknown'],
        };
        if (isTerminating) item.doNotBoard = true;
        return item;
      }),
      JSON.stringify,
    ),
    (x) => x.to!.join('|'),
  );

  // second pass: group by route, e.g. T1 to Richmond and Emu Plains
  const singles: Record<string, string> = {};
  for (const to in groupedByDestination) {
    if (
      groupedByDestination[to].length === 1 &&
      groupedByDestination[to][0].to![0].length < 20 // only group short destinations
    ) {
      const [route] = groupedByDestination[to];
      if (route.ref in singles) {
        // we've already seen a single route with this ref
        const existingTo = singles[route.ref];
        groupedByDestination[existingTo][0].to!.push(route.to![0]);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete groupedByDestination[to];
      } else {
        // we haven't (yet) seen any other single routes with this ref
        singles[route.ref] = to;
      }
    }
  }

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
      .sort(([, [a]], [, [b]]) =>
        a.doNotBoard ? 2 : (a.ref || '').localeCompare(b.ref || ''),
      ),
  );
}
