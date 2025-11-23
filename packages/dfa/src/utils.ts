/**
 * Returns a new set representing the union of a and b.
 */
export function union<T>(a: Set<T>, b: Iterable<T>): Set<T> {
  const result = new Set(a);
  addAll(result, b);
  return result;
}

/**
 * Adds all items from the set b to a.
 */
export function addAll<T>(target: Set<T>, source: Iterable<T>): void {
  for (const item of source) {
    target.add(item);
  }
}

/**
 * Returns whether two sets are equal
 */
export function equal<T>(a: Set<T>, b: Set<T>): boolean {
  if (a === b) {
    return true;
  }

  if (a.size !== b.size) {
    return false;
  }

  for (const item of a) {
    if (!b.has(item)) {
      return false;
    }
  }

  return true;
}
