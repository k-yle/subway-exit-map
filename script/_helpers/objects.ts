export const isTruthy = <T>(item: T | undefined | null | 0 | ''): item is T =>
  !!item;

/** @example `.filter(uniq)` */
export const uniq = <T>(item: T, index: number, array: T[]): boolean =>
  array.indexOf(item) === index;

export const uniqBy = <T>(
  array: T[],
  getKey: (item: T) => string | number,
): T[] => [...new Map(array.map((item) => [getKey(item), item])).values()];

/** {@link Object.groupBy} is not available in node v20 */
export const groupBy = <T, K extends string | number>(
  array: T[],
  getKey: (item: T) => K,
): Record<K, T[]> => {
  const output = {} as Record<K, T[]>;
  for (const item of array) {
    const key = getKey(item);
    output[key] ||= [];
    output[key].push(item);
  }
  return output;
};

export const omit = <T>(object: T, keys: (keyof T)[]): Omit<T, keyof T> => {
  const output = { ...object };
  for (const key of keys) {
    delete output[key];
  }
  return output;
};

export function* createChunks<T>(array: T[], n: number) {
  for (let index = 0; index < array.length; index += n) {
    yield array.slice(index, index + n);
  }
}
