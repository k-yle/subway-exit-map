import { describe, expect, it } from 'vitest';
import { fillBlanksForColSpan } from '../fillBlanksForColSpan.js';

describe('fillBlanksForColSpan', () => {
  it('works for a single array', () => {
    const matrix = [['A', 'none', 'A', 'none', 'none', 'B', 'none', 'B']];
    fillBlanksForColSpan(matrix);
    expect(matrix).toStrictEqual([
      ['A', 'A', 'A', 'none', 'none', 'B', 'B', 'B'],
    ]);
  });

  it('works for a matrix with equal values', () => {
    const matrix = [
      ['A', 'none', 'A', 'none', 'none', 'B', 'none', 'B'],
      ['a', 'none', 'a', 'none', 'none', 'b', 'none', 'b'],
    ];
    fillBlanksForColSpan(matrix);
    expect(matrix).toStrictEqual([
      ['A', 'A', 'A', 'none', 'none', 'B', 'B', 'B'],
      ['a', 'a', 'a', 'none', 'none', 'b', 'b', 'b'],
    ]);
  });

  it('works for a matrix with different values', () => {
    const matrix = [
      ['A', 'no', 'A', 'no', 'no', 'B', 'no', 'B'],
      ['a', 'a', 'a', 'no', 'no', 'b', 'no', 'b'],
    ];
    fillBlanksForColSpan(matrix);
    expect(matrix).toStrictEqual([
      //     👇 the key thing is that this cell was not updated
      ['A', 'no', 'A', 'no', 'no', 'B', 'B', 'B'],
      ['a', 'a', 'a', 'no', 'no', 'b', 'b', 'b'],
      //    but this column was filled 👆
    ]);
  });
});
