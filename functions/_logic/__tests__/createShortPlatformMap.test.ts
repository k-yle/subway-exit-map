import { describe, expect, it } from 'vitest';
import { createShortPlatformMap } from '../createShortPlatformMap.js';

describe('createShortPlatformMap', () => {
  it.each`
    accessTag      | cars  | expected
    ${'last;0'}    | ${8}  | ${'00000000'}
    ${'last;1'}    | ${8}  | ${'00000001'}
    ${'last;2'}    | ${8}  | ${'00000011'}
    ${'last;8'}    | ${8}  | ${'11111111'}
    ${'last;9'}    | ${8}  | ${'11111111'}
    ${'first;0'}   | ${8}  | ${'00000000'}
    ${'first;1'}   | ${8}  | ${'10000000'}
    ${'first;2'}   | ${8}  | ${'11000000'}
    ${'first;8'}   | ${8}  | ${'11111111'}
    ${'first;9'}   | ${8}  | ${'11111111'}
    ${'middle;1'}  | ${5}  | ${'00100'}
    ${'middle;3'}  | ${5}  | ${'01110'}
    ${'middle;5'}  | ${5}  | ${'11111'}
    ${'middle;7'}  | ${5}  | ${'11111'}
    ${'middle;0'}  | ${10} | ${'0000000000'}
    ${'middle;2'}  | ${10} | ${'0000110000'}
    ${'middle;4'}  | ${10} | ${'0001111000'}
    ${'middle;6'}  | ${10} | ${'0011111100'}
    ${'middle;10'} | ${10} | ${'1111111111'}
    ${'middle;20'} | ${10} | ${'1111111111'}
    ${'middle;1'}  | ${8}  | ${'11111111' /* error - mix of even/odd */}
    ${'middle;2'}  | ${7}  | ${'1111111' /* error - mix of even/odd */}
  `(
    '$accessTag with $cars cars = $expected',
    ({ accessTag, cars, expected }) => {
      expect(
        createShortPlatformMap(accessTag, cars)
          .map((bool) => +(bool === 'yes'))
          .join(''),
      ).toBe(expected);
    },
  );
});
