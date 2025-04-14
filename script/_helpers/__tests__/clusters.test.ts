import { describe, expect, it } from 'vitest';
import { splitInHalf } from '../cluster.js';

describe('splitInHalf', () => {
  it('works in the standard case', () => {
    expect(splitInHalf([1, 180, 10, 181])).toStrictEqual([
      true,
      false,
      true,
      false,
    ]);
  });

  it('returns a single cluster when all values are equal', () => {
    expect(splitInHalf([1, 1, 1, 1])).toStrictEqual([true, true, true, true]);
  });

  it('returns a single cluster when all values are almost equal', () => {
    expect(splitInHalf([1, 1.01, 1, 1])).toStrictEqual([
      true,
      true,
      true,
      true,
    ]);
  });
});
