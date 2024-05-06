import { describe, expect, it } from 'vitest';
import { flipByDestination } from '../flipByDestination.js';
import type { AdjacentStop, Station, Stop } from '../../types.def.js';

export type MockStop = { flip?: boolean; to: string[]; from: string[] };

const station = <Station>{ name: 'Example' };

describe('flipByDestination', () => {
  it.each<[input: MockStop[], output: boolean[] | undefined]>([
    [
      // easy, 2 flips required
      [
        { from: ['C', 'D'], to: ['A'] },
        { from: ['A'], to: ['C'] },
        { from: ['C', 'D'], to: ['A'] },
        { from: ['A'], to: ['D'] },
      ],
      [false, true, false, true],
    ],
    [
      // easy, 1 flip required
      [
        { from: ['C'], to: ['A'] },
        { from: ['A'], to: ['C'] },
      ],
      [false, true],
    ],
    [
      // nothing to flip (because already lined up)
      [
        { from: ['A'], to: ['C'] },
        { from: ['A'], to: ['C'] },
      ],
      [false, false],
    ],
    [
      // nothing to flip (because totally different)
      [
        { from: ['A'], to: ['C'] },
        { from: ['B'], to: ['D'] },
      ],
      [false, false],
    ],
    [
      // impossible, triangle configuration
      [
        { from: ['A'], to: ['B'] },
        { from: ['B'], to: ['C'] },
        { from: ['C'], to: ['A'] },
      ],
      undefined,
    ],
    [
      // impossible, 4-point triangle
      [
        { from: ['A'], to: ['B'] },
        { from: ['B'], to: ['C'] },
        { from: ['C'], to: ['D'] },
        { from: ['A'], to: ['D'] },
      ],
      undefined,
    ],
  ])(
    'can flip platforms to get the destinations to line up %#',
    (input, output) => {
      const stops = input.map(
        (item): Partial<Stop> => ({
          lastStop: item.from.map((x) => <AdjacentStop>{ stationName: x }),
          nextStop: item.to.map((x) => <AdjacentStop>{ stationName: x }),
        }),
      );

      expect(flipByDestination(<Stop[]>stops, [], station)).toStrictEqual(
        output,
      );
    },
  );
});
