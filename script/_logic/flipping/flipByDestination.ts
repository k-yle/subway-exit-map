import type { FlipFunction } from './index.js';

export const flipByDestination: FlipFunction = (items) => {
  // abort if some platforms don't have destination data, since we won't be able to flip them
  if (items.some((stop) => !stop.lastStop.length && !stop.nextStop.length)) {
    return undefined;
  }

  function moveAllToOneSide(nodeId: number, side: 'left' | 'right') {
    for (const item of items) {
      const hasThisNameOnFrom = item.lastStop.some(
        (from) => from.nodeId === nodeId,
      );
      const hasThisNameOnTo = item.nextStop.some((to) => to.nodeId === nodeId);
      const hasThisNameOnLeft = item.flip ? hasThisNameOnTo : hasThisNameOnFrom;
      const hasThisNameOnRight = item.flip
        ? hasThisNameOnFrom
        : hasThisNameOnTo;

      if (
        (side === 'left' && hasThisNameOnRight) ||
        (side === 'right' && hasThisNameOnLeft)
      ) {
        // if ('flip' in item) {
        //   console.warn(
        //     `Reflipping ${item.name}${item.ref} to get ${name} on the ${side}`,
        //   );
        // }
        // console.log(
        //   `Flipping ${item.name}${item.ref} to get ${name} on the ${side}`,
        // );
        item.flip = !item.flip;
      }
    }
  }

  function getItemsOnBothSides() {
    const left = new Set<number>();
    const right = new Set<number>();
    for (const item of items) {
      const fromSide = item.flip ? right : left;
      const toSide = item.flip ? left : right;
      for (const from of item.lastStop) fromSide.add(from.nodeId);
      for (const to of item.nextStop) toSide.add(to.nodeId);
    }

    const intersection = new Set([...left].filter((item) => right.has(item)));
    return [...intersection];
  }

  const LIMIT = 20;
  for (let index = 0; index < LIMIT; index++) {
    const bothSides = getItemsOnBothSides();
    // console.log('bothSides', bothSides);
    if (bothSides.length === 0) break;
    moveAllToOneSide(bothSides[0], 'left');
  }
  const final = getItemsOnBothSides();
  if (final.length) {
    // failed, so undo any mutations to the input argument
    for (const item of items) delete item.flip;
    return undefined;
  }

  return items.map((x) => x.flip || false);
};
