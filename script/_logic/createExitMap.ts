import type { OsmNode } from 'osm-api';
import { FALSY, getTrackDirection } from '../_helpers/osm.js';
import { BEST_OVERRIDE } from '../_helpers/override.js';
import type {
  Carriage,
  ExitSide,
  ExitType,
  OsmFeatures,
  Stop,
} from './types.def.js';
import { getBiDiMode } from './getBiDiMode.js';
import { fillBlanksForColSpan } from './fillBlanksForColSpan.js';
import { createShortPlatformMap } from './createShortPlatformMap.js';

const EXIT_HIERACHY: ExitType[] = [
  'escalator',
  'flat',
  'ramp',
  'steps',
  'stairs',
];

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
  allData: OsmFeatures,
): Pick<Stop, 'exitSide' | 'carriages' | 'biDiMode' | 'shortPlatform'> {
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
    tags[`destination:symbol:carriages${suffix}`]
      ?.split('|')
      .map((s) => s.toLowerCase()) || [];

  if (!exitType.length) {
    return { carriages: [], exitSide: undefined };
  }

  const lengths = new Set([
    exitType.length,
    exitTo.length,
    exitNumber.length,
    exitSymbols.length,
  ]);
  lengths.delete(0);

  if (lengths.size !== 1) {
    throw new Error(
      `mismatched number of cars at ${tags.name} ${tags.local_ref}: ${[...lengths]}`,
    );
  }

  const available = createShortPlatformMap(
    tags[`access:carriages${suffix}`] || tags['access:carriages'],
    exitType.length,
  );

  // at this point we know all arrays have the same length

  const allExitTypes = new Set(exitType.flatMap((types) => types.split(';')));
  const bestExitType = EXIT_HIERACHY.find((exit) => allExitTypes.has(exit));

  // there could be 0-2, but we don't care which
  // one we pick if there are multiple - because we
  // assume they must have the same direction, since
  // bidi operation starts/ends at a signal node, not
  // a stop position node.
  const track = Object.values(allData.way).find((way) =>
    way.nodes.includes(node.id),
  );
  if (!track) {
    throw new Error('Node is not part of a track');
  }
  const biDiMode = getBiDiMode(track, allData);
  const direction = getTrackDirection(track.tags);

  // we do NOT copy exitType, since that would be wrong.
  fillBlanksForColSpan(
    [exitNumber, exitTo, exitSymbols].filter((row) => row?.length),
  );

  const carriages: Carriage[] = [];
  const firstIndex = exitType.findIndex((car) => !car.endsWith('*'));

  for (let index = 0; index < exitType.length; index++) {
    const flag = exitType[index].endsWith('*');
    {
      const exitType1 = noToUndefined(
        <ExitType[]>exitType[index].replace(/\*$/, '').split(';'),
      );
      const exitTo1 = noToUndefined(exitTo[index]?.split(';'));
      const exitNumber1 = noToUndefined(exitNumber[index]?.split(';'));
      const exitSymbols1 = noToUndefined(exitSymbols[index]?.split(';'));
      const unavailable = FALSY.has(available.array[index]?.toLowerCase());

      const carriage: Carriage = {
        type: flag
          ? 'gap'
          : index === firstIndex
            ? 'loco'
            : index === exitType.length - 1 && biDiMode === 'regular'
              ? 'loco'
              : 'middle',
        ref: index + 1 - firstIndex,
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

  let exitSide = <ExitSide>tags.side;

  // track is bidirectional, so there's no meaningful way of telling the
  // user to "exit on the left", because that depends on which direction
  // they're travelling. So delete the `side` data in this situation
  if (
    (direction === 'both_ways' || direction === 'unknown') &&
    biDiMode === 'regular'
  ) {
    exitSide = undefined;
  }

  if (direction === 'backward') {
    if (exitSide === 'left') exitSide = 'right';
    if (exitSide === 'right') exitSide = 'left';
  }

  /** :backwards just adds complexity, it's easier if the data is always ordered forwards */
  if (suffix === ':backward') carriages.reverse();

  return {
    exitSide,
    carriages,
    biDiMode,
    shortPlatform: available.shortPlatform,
  };
}
