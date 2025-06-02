import { FALSY } from '../_helpers/osm.js';

const isEmpty = (str: string) => FALSY.has(str);

/**
 * Given:
 * ```
 * // A|none|A|none|none|B|none|B
 * ```
 *
 * It looks better on the frontend if
 * we don't repeat destinations A and B.
 * That requires filling the gaps:
 * ```
 * // A|A|A|none|none|B|B|B
 * ```
 *
 * Then the frontend can use colspan to
 * merge the cells:
 * ```
 * // …A…|none|none|…B…
 * ```
 *
 * This function does the second part (filling
 * the blanks between equal values). Examples in
 * the unit tests.
 */
export function fillBlanksForColSpan(matrix: string[][]): void {
  if (!matrix.length) return;
  const length = matrix[0]!.length;

  /* eslint-disable unicorn/prevent-abbreviations -- i & j are better than "jindex" */
  for (let i = 0; i < length - 1; i++) {
    const thisColHasData = matrix.some((row) => !isEmpty(row[i]!));
    const isNextBlank = matrix.every((row) => isEmpty(row[i + 1]!));

    if (thisColHasData && isNextBlank) {
      const nextNonEmptyIndex =
        i +
        Math.min(
          ...matrix.map(
            (row) =>
              1 + row.slice(1 + i).findIndex((cell) => !isEmpty(cell)) ||
              Infinity, // replace 0 with infinity so that we can use Math.min
          ),
        );
      if (nextNonEmptyIndex !== Infinity) {
        const isNextNonEmptyColumnEqual = matrix.every(
          (row) => row[i] === row[nextNonEmptyIndex],
        );
        if (isNextNonEmptyColumnEqual) {
          for (let j = i; j < nextNonEmptyIndex; j++) {
            for (const row of matrix) {
              row[j] = row[i]!;
            }
          }
        }
      }
    }
  }
}
