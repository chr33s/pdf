export function binarySearch<T>(arr: T[], cmp: (value: T) => number): number {
  let min = 0;
  let max = arr.length - 1;
  while (min <= max) {
    let mid = (min + max) >> 1;
    let res = cmp(arr[mid]);

    if (res < 0) {
      max = mid - 1;
    } else if (res > 0) {
      min = mid + 1;
    } else {
      return mid;
    }
  }

  return -1;
}

export function range(index: number, end: number): number[] {
  let range: number[] = [];
  while (index < end) {
    range.push(index++);
  }
  return range;
}
