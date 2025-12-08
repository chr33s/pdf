const isBigEndian = new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x12;

const swap = (array: Uint8Array, left: number, right: number): void => {
  const temp = array[left];
  array[left] = array[right];
  array[right] = temp;
};

const swap32 = (array: Uint8Array): void => {
  const { length } = array;
  for (let index = 0; index < length; index += 4) {
    swap(array, index, index + 3);
    swap(array, index + 1, index + 2);
  }
};

/** Swaps bytes in a Uint8Array for little-endian 32-bit integer interpretation. */
export const swap32LE = (array: Uint8Array): void => {
  if (isBigEndian) {
    swap32(array);
  }
};
