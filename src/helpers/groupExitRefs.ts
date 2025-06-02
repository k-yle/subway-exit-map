export type Grouped = (string | [from: string, to: string])[];

/**
 * Given a list of numbers or letters, like `1,2,3,4,6,7`
 * this function groups them into a more concise format,
 * such as `1-4,6,7`. See unit tests for details.
 */
export function groupExitRefs(exitRefs: string[]) {
  const grouped = exitRefs
    .sort((a, b) => a.localeCompare(b))
    .reduce<Grouped>((newArray, item, index, oldArray) => {
      newArray.push(
        !index ||
          oldArray[index - 1]!.codePointAt(0)! - item.codePointAt(0)! + 1
          ? item
          : [newArray.pop()![0], item],
      );
      return newArray;
    }, []);

  return grouped;
}
