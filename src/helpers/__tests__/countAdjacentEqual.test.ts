import { describe, expect, it } from 'vitest';
import { countAdjacentEqual } from '../countAdjacentEqual';

describe('countAdjacentEqual', () => {
  it.each`
    input        | output
    ${'aaab'}    | ${[3, 0, 0, 1]}
    ${'aaabaaa'} | ${[3, 0, 0, 1, 3, 0, 0]}
    ${'abababa'} | ${[1, 1, 1, 1, 1, 1, 1]}
    ${'aa'}      | ${[2, 0]}
    ${''}        | ${[]}
  `('converts $input to $output', ({ input, output }) => {
    expect(countAdjacentEqual([...input])).toEqual(output);
  });
});
