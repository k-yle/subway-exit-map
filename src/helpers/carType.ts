import type { Carriage } from '../types.def';

export function carTypeToCss(index: number, carriages: Carriage[]) {
  const type = carriages[index]!.type;

  if (type === 'loco') {
    // this one needs to be replaced with `first` or `last`.
    // we do this as late as possible in the renderer, so
    // that all the upstream logic can reverse the array
    // without any repercussions.

    const isFirstNonGap =
      index === carriages.findIndex((c) => c.type !== 'gap');

    return isFirstNonGap ? 'first' : 'last';
  }
  return type; // no transformation required
}
