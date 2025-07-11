import type { Alignment, Stop } from './types.def';

const isValid = (str: string): str is Alignment =>
  ['first', 'middle', 'last'].includes(str);

export function createShortPlatformMap(
  accessTag: string | undefined,
  cars: number,
): {
  array: ('yes' | 'no')[];
  shortPlatform: Stop['shortPlatform'];
} {
  const empty = { shortPlatform: undefined, array: [] };
  if (!accessTag) return empty;

  const [alignment, _count] = accessTag.split(';');

  if (!alignment || !_count) return empty;
  if (!isValid(alignment)) return empty;

  const count = +_count;
  if (Number.isNaN(count)) return empty;

  const array = Array.from({ length: cars })
    .fill(0)
    .map((_, index) => {
      switch (alignment) {
        case 'first': {
          return index + 1 <= count;
        }
        case 'middle': {
          // can't have a mix of even & odd
          if (cars % 2 !== count % 2) return 'yes';

          const emptyOnEitherSide = (cars - count) / 2;
          return index >= emptyOnEitherSide && index < cars - emptyOnEitherSide;
        }
        case 'last': {
          return cars - index <= count;
        }
        default: {
          alignment satisfies never;
          return true;
        }
      }
    })
    .map((bool) => (bool ? 'yes' : 'no'));

  return { array, shortPlatform: { alignment, count } };
}
