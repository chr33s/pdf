const TINF_OK = 0;
const TINF_DATA_ERROR = -3;

class Tree {
  readonly table: Uint16Array;
  readonly trans: Uint16Array;

  constructor() {
    this.table = new Uint16Array(16);
    this.trans = new Uint16Array(288);
  }
}

class DataState {
  readonly source: Uint8Array;
  sourceIndex = 0;
  tag = 0;
  bitcount = 0;

  readonly dest: Uint8Array;
  destLen = 0;

  readonly ltree = new Tree();
  readonly dtree = new Tree();

  constructor(source: Uint8Array, dest: Uint8Array) {
    this.source = source;
    this.dest = dest;
  }
}

const staticLengthTree = new Tree();
const staticDistanceTree = new Tree();

const lengthBits = new Uint8Array(30);
const lengthBase = new Uint16Array(30);

const distanceBits = new Uint8Array(30);
const distanceBase = new Uint16Array(30);

const codeLengthOrder = new Uint8Array([
  16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15,
]);

const codeTree = new Tree();
const codeLengths = new Uint8Array(288 + 32);
const distributionOffsets = new Uint16Array(16);

function readSourceByte(state: DataState): number {
  if (state.sourceIndex >= state.source.length) {
    state.sourceIndex += 1;
    return 0;
  }

  return state.source[state.sourceIndex++];
}

function buildBitsBase(bits: Uint8Array, base: Uint16Array, delta: number, first: number): void {
  for (let i = 0; i < delta; i++) bits[i] = 0;
  for (let i = 0; i < 30 - delta; i++) bits[i + delta] = (i / delta) | 0;

  let sum = first;
  for (let i = 0; i < 30; i++) {
    base[i] = sum;
    sum += 1 << bits[i];
  }
}

function buildFixedTrees(lengthTree: Tree, distanceTree: Tree): void {
  for (let i = 0; i < 7; i++) lengthTree.table[i] = 0;

  lengthTree.table[7] = 24;
  lengthTree.table[8] = 152;
  lengthTree.table[9] = 112;

  for (let i = 0; i < 24; i++) lengthTree.trans[i] = 256 + i;
  for (let i = 0; i < 144; i++) lengthTree.trans[24 + i] = i;
  for (let i = 0; i < 8; i++) lengthTree.trans[24 + 144 + i] = 280 + i;
  for (let i = 0; i < 112; i++) lengthTree.trans[24 + 144 + 8 + i] = 144 + i;

  for (let i = 0; i < 5; i++) distanceTree.table[i] = 0;

  distanceTree.table[5] = 32;

  for (let i = 0; i < 32; i++) distanceTree.trans[i] = i;
}

function buildTree(tree: Tree, lengths: Uint8Array, offset: number, count: number): void {
  for (let i = 0; i < 16; i++) tree.table[i] = 0;

  for (let i = 0; i < count; i++) tree.table[lengths[offset + i]]++;

  tree.table[0] = 0;

  let sum = 0;
  for (let i = 0; i < 16; i++) {
    distributionOffsets[i] = sum;
    sum += tree.table[i];
  }

  for (let i = 0; i < count; i++) {
    const length = lengths[offset + i];
    if (length !== 0) {
      tree.trans[distributionOffsets[length]++] = i;
    }
  }
}

function getBit(state: DataState): number {
  if (state.bitcount === 0) {
    state.tag = readSourceByte(state);
    state.bitcount = 7;
  } else {
    state.bitcount -= 1;
  }

  const bit = state.tag & 1;
  state.tag >>>= 1;
  return bit;
}

function readBits(state: DataState, num: number, base: number): number {
  if (num === 0) return base;

  while (state.bitcount < 24) {
    state.tag |= readSourceByte(state) << state.bitcount;
    state.bitcount += 8;
  }

  const value = state.tag & (0xffff >>> (16 - num));
  state.tag >>>= num;
  state.bitcount -= num;
  return value + base;
}

function decodeSymbol(state: DataState, tree: Tree): number {
  while (state.bitcount < 24) {
    state.tag |= readSourceByte(state) << state.bitcount;
    state.bitcount += 8;
  }

  let sum = 0;
  let cur = 0;
  let len = 0;
  let tag = state.tag;

  while (true) {
    cur = 2 * cur + (tag & 1);
    tag >>>= 1;
    len += 1;

    sum += tree.table[len];
    cur -= tree.table[len];

    if (cur < 0) break;
  }

  state.tag = tag;
  state.bitcount -= len;

  return tree.trans[sum + cur];
}

function decodeTrees(state: DataState, lengthTree: Tree, distanceTree: Tree): void {
  const hlit = readBits(state, 5, 257);
  const hdist = readBits(state, 5, 1);
  const hclen = readBits(state, 4, 4);

  for (let i = 0; i < 19; i++) codeLengths[i] = 0;

  for (let i = 0; i < hclen; i++) {
    const clen = readBits(state, 3, 0);
    codeLengths[codeLengthOrder[i]] = clen;
  }

  buildTree(codeTree, codeLengths, 0, 19);

  let num = 0;
  while (num < hlit + hdist) {
    const symbol = decodeSymbol(state, codeTree);

    if (symbol === 16) {
      const prev = codeLengths[num - 1];
      for (let length = readBits(state, 2, 3); length > 0; length--) {
        codeLengths[num++] = prev;
      }
    } else if (symbol === 17) {
      for (let length = readBits(state, 3, 3); length > 0; length--) {
        codeLengths[num++] = 0;
      }
    } else if (symbol === 18) {
      for (let length = readBits(state, 7, 11); length > 0; length--) {
        codeLengths[num++] = 0;
      }
    } else {
      codeLengths[num++] = symbol;
    }
  }

  buildTree(lengthTree, codeLengths, 0, hlit);
  buildTree(distanceTree, codeLengths, hlit, hdist);
}

function inflateBlockData(state: DataState, lengthTree: Tree, distanceTree: Tree): number {
  while (true) {
    const symbol = decodeSymbol(state, lengthTree);

    if (symbol === 256) return TINF_OK;

    if (symbol < 256) {
      state.dest[state.destLen++] = symbol;
      continue;
    }

    const lengthSymbol = symbol - 257;
    const length = readBits(state, lengthBits[lengthSymbol], lengthBase[lengthSymbol]);
    const distanceSymbol = decodeSymbol(state, distanceTree);
    const distance = readBits(state, distanceBits[distanceSymbol], distanceBase[distanceSymbol]);
    const start = state.destLen - distance;
    const end = start + length;

    for (let i = start; i < end; i++) {
      state.dest[state.destLen++] = state.dest[i];
    }
  }
}

function inflateUncompressedBlock(state: DataState): number {
  while (state.bitcount > 8) {
    state.sourceIndex -= 1;
    state.bitcount -= 8;
  }

  if (state.sourceIndex + 4 > state.source.length) {
    return TINF_DATA_ERROR;
  }

  let length = state.source[state.sourceIndex + 1];
  length = 256 * length + state.source[state.sourceIndex];

  let invlength = state.source[state.sourceIndex + 3];
  invlength = 256 * invlength + state.source[state.sourceIndex + 2];

  if (length !== (~invlength & 0x0000ffff)) {
    return TINF_DATA_ERROR;
  }

  state.sourceIndex += 4;

  if (state.sourceIndex + length > state.source.length) {
    return TINF_DATA_ERROR;
  }

  for (let i = length; i > 0; i--) {
    state.dest[state.destLen++] = state.source[state.sourceIndex++];
  }

  state.bitcount = 0;

  return TINF_OK;
}

function inflateRaw(source: Uint8Array, dest: Uint8Array): Uint8Array {
  const state = new DataState(source, dest);

  while (true) {
    const bfinal = getBit(state);
    const btype = readBits(state, 2, 0);

    let res: number;
    if (btype === 0) {
      res = inflateUncompressedBlock(state);
    } else if (btype === 1) {
      res = inflateBlockData(state, staticLengthTree, staticDistanceTree);
    } else if (btype === 2) {
      decodeTrees(state, state.ltree, state.dtree);
      res = inflateBlockData(state, state.ltree, state.dtree);
    } else {
      res = TINF_DATA_ERROR;
    }

    if (res !== TINF_OK) {
      throw new Error("Data error");
    }

    if (bfinal === 1) break;
  }

  if (state.destLen < state.dest.length) {
    if (typeof state.dest.slice === "function") {
      return state.dest.slice(0, state.destLen);
    }

    return state.dest.subarray(0, state.destLen);
  }

  return state.dest;
}

buildFixedTrees(staticLengthTree, staticDistanceTree);
buildBitsBase(lengthBits, lengthBase, 4, 3);
buildBitsBase(distanceBits, distanceBase, 2, 1);
lengthBits[28] = 0;
lengthBase[28] = 258;

export function inflate(source: Uint8Array, dest: Uint8Array): Uint8Array {
  return inflateRaw(source, dest);
}

export default inflate;
