import type { OsmFeature, OsmNode, OsmWay } from 'osm-api';
import { FALSY, getTrackDirection } from '../_helpers/osm.js';
import { BEST_OVERRIDE } from '../_helpers/override.js';
import type {
  Carriage,
  ExitSide,
  ExitType,
  FwdBwdBoth,
  Stop,
} from './types.def.js';
import { getBiDiMode } from './getBiDiMode.js';
import { fillBlanksForColSpan } from './fillBlanksForColSpan.js';

const EXIT_HIERACHY: ExitType[] = ['escalator', 'flat', 'ramp', 'stairs'];

/** replaces OSM's string keywords with false */
const noToUndefined = <T extends string>(
  item: T[] | undefined,
): T[] | undefined => {
  if (!item) return undefined;

  const isFalsy = item.length === 1 && FALSY.has(item[0].toLowerCase());
  return isFalsy ? undefined : item;
};

export function createExitMap(
  node: OsmNode,
  allData: OsmFeature[],
): Pick<Stop, 'exitSide' | 'carriages' | 'direction' | 'biDiMode'> {
  const tags = node.tags!;

  const suffix = tags['exit:carriages:forward']
    ? ':forward'
    : tags['exit:carriages:backward']
      ? ':backward'
      : '';

  const exitType =
    tags[`exit:carriages${suffix}`]?.split('\n')[0].split('|') || [];
  const exitTo = tags[`destination:carriages${suffix}`]?.split('|') || [];
  const exitNumber =
    tags[`destination:ref:carriages${suffix}`]?.split('|') || [];
  const exitSymbols =
    tags[`destination:symbol:carriages${suffix}`]?.split('|') || [];
  const available = tags[`access:carriages${suffix}`]?.split('|') || [];

  if (!exitType.length) {
    throw new Error(`No main tag for “${suffix}” of node ${node.id}`);
  }

  const hasElipses = exitType[0] === '...' || exitType.at(-1) === '...';
  const lengths = new Set([
    exitType.length,
    exitTo.length,
    exitNumber.length,
    exitSymbols.length,
    available.length,
  ]);
  lengths.delete(0);

  if (!hasElipses && lengths.size !== 1) {
    throw new Error(
      `mismatched number of cars at ${tags.name} ${tags.local_ref}: ${[...lengths]}`,
    );
  }

  // at this point we know all arrays have the same length

  const allExitTypes = new Set(exitType.flatMap((types) => types.split(';')));
  const bestExitType = EXIT_HIERACHY.find((exit) => allExitTypes.has(exit));

  // there could be 0-2, but we don't care which
  // one we pick if there are multiple - because we
  // assume they must have the same direction, since
  // bidi operation starts/ends at a signal node, not
  // a stop position node.
  const track = allData.find(
    (m): m is OsmWay => m.type === 'way' && m.nodes.includes(node.id),
  );
  if (!track) {
    throw new Error('Node is not part of a track');
  }
  const biDiMode = getBiDiMode(track, allData);

  const trackDirection = getTrackDirection(track.tags);
  const direction = <FwdBwdBoth>suffix?.slice(1) || trackDirection;

  // we do NOT copy exitType, since that would be wrong.
  fillBlanksForColSpan(
    [exitNumber, exitTo, exitSymbols].filter((row) => row?.length),
  );

  const carriages: Carriage[] = [];
  for (let index = 0; index < exitType.length; index++) {
    const isElipsis = exitType[index] === '...';
    if (isElipsis && (!index || index === exitType.length - 1)) {
      // the train continues for an unspecified length
      carriages.push({ type: 'ellipsis', ref: index + 1 });
    } else {
      const exitType1 = noToUndefined(<ExitType[]>exitType[index].split(';'));
      const exitTo1 = noToUndefined(exitTo[index]?.split(';'));
      const exitNumber1 = noToUndefined(exitNumber[index]?.split(';'));
      const exitSymbols1 = noToUndefined(exitSymbols[index]?.split(';'));
      const unavailable = FALSY.has(available[index]?.toLowerCase());

      const carriage: Carriage = {
        type:
          index === 0 ||
          (index === exitType.length - 1 && biDiMode === 'regular')
            ? 'loco'
            : 'carriage',
        ref: index + 1,
      };

      const isBest = BEST_OVERRIDE[node.id]
        ? BEST_OVERRIDE[node.id].includes(carriage.ref)
        : bestExitType && exitType1?.includes(bestExitType);

      if (isBest) carriage.isBest = true;
      if (exitType1) carriage.exitType = exitType1;
      if (exitTo1) carriage.exitTo = exitTo1;
      if (exitNumber1) carriage.exitNumber = exitNumber1;
      if (exitSymbols1) carriage.exitSymbols = exitSymbols1;
      if (unavailable) carriage.unavailable = unavailable;

      carriages.push(carriage);
    }
  }

  return {
    exitSide: <ExitSide>tags[`side${suffix}`],
    carriages,
    direction,
    biDiMode,
  };
}
