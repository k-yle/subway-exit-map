import { describe, expect, it } from 'vitest';
import { getAnglularDiff } from '../math.js';

describe('getAnglularDiff', () => {
  it.each`
    a          | b           | diff
    ${10}      | ${10}       | ${0}
    ${10}      | ${0}        | ${10}
    ${10}      | ${-10}      | ${20}
    ${360}     | ${0}        | ${0}
    ${360}     | ${10}       | ${10}
    ${360}     | ${-360}     | ${0}
    ${360}     | ${720}      | ${0}
    ${360 * 4} | ${-360 * 3} | ${0}
  `('realises that $a° and $b° are $diff° apart', ({ a, b, diff }) => {
    expect(getAnglularDiff(a, b)).toBe(diff);
  });
});
