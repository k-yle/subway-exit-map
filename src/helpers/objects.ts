export const uniqBy = <T>(
  array: T[],
  getKey: (item: T) => string | number,
): T[] => [...new Map(array.map((item) => [getKey(item), item])).values()];

/**
 * gets the first item from a set. more efficient that
 * spreading the entire thing into an array
 */
export const take = <T>(set: Set<T>): T | undefined =>
  set.values().next().value;
