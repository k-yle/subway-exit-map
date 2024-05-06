/**
 * Returns an array representing adjacent array items
 * that are equal. The result array can be sent directly
 * to the colSpan prop.
 */
export function countAdjacentEqual(array: string[]): number[] {
  const result: number[] = [];

  for (let index = 0; index < array.length; index++) {
    const current = array[index];
    const previous = array[index - 1];

    if (current === previous) {
      // same as prev, so increment the last non-zero cell
      // also push a zero value to the output
      const lastNonNullIndex = result.findLastIndex(Boolean)!;
      result[lastNonNullIndex]++;
      result.push(0);
    } else {
      // diff to previous
      result.push(1);
    }
  }

  return result;
}
