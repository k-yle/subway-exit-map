export const uniqBy = <T>(
  array: T[],
  getKey: (item: T) => string | number,
): T[] => [...new Map(array.map((item) => [getKey(item), item])).values()];
