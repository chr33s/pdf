/*
 * Copyright 2012 Mozilla Foundation
 *
 * The LZWStream class contained in this file is a TypeScript port of the
 * JavaScript LZWStream class in Mozilla's pdf.js project, made available
 * under the Apache 2.0 open source license.
 */

import DecodeStream from "./DecodeStream.js";
import { StreamType } from "./Stream.js";

const MAX_CODE_LENGTH = 12;
const INITIAL_CODE_LENGTH = 9;
const MAX_DICTIONARY_SIZE = 1 << MAX_CODE_LENGTH;

class LZWStream extends DecodeStream {
  #stream: StreamType;
  #cachedData: number;
  #bitsCached: number;
  #lzwState?: {
    earlyChange: 0 | 1;
    codeLength: number;
    nextCode: number;
    dictionaryValues: Uint8Array;
    dictionaryLengths: Uint16Array;
    dictionaryPrevCodes: Uint16Array;
    currentSequence: Uint8Array;
    currentSequenceLength: number;
    prevCode?: number | null;
  };

  constructor(
    stream: StreamType,
    maybeLength: number | undefined,
    earlyChange: 0 | 1,
  ) {
    super(maybeLength);

    this.#stream = stream;
    this.#cachedData = 0;
    this.#bitsCached = 0;

    const maxLzwDictionarySize = MAX_DICTIONARY_SIZE;
    const lzwState = {
      earlyChange,
      codeLength: INITIAL_CODE_LENGTH,
      nextCode: 258,
      dictionaryValues: new Uint8Array(maxLzwDictionarySize),
      dictionaryLengths: new Uint16Array(maxLzwDictionarySize),
      dictionaryPrevCodes: new Uint16Array(maxLzwDictionarySize),
      currentSequence: new Uint8Array(maxLzwDictionarySize),
      currentSequenceLength: 0,
    };
    for (let i = 0; i < 256; ++i) {
      lzwState.dictionaryValues[i] = i;
      lzwState.dictionaryLengths[i] = 1;
    }
    this.#lzwState = lzwState;
  }

  protected readBlock() {
    const blockSize = 512;

    let estimatedDecodedSize = blockSize * 2;
    const decodedSizeDelta = blockSize;
    let i;
    let j;
    let q;

    const lzwState = this.#lzwState;
    if (!lzwState) {
      return; // eof was found
    }

    const earlyChange = lzwState.earlyChange;
    let nextCode = lzwState.nextCode;
    const dictionaryValues = lzwState.dictionaryValues;
    const dictionaryLengths = lzwState.dictionaryLengths;
    const dictionaryPrevCodes = lzwState.dictionaryPrevCodes;
    let codeLength = lzwState.codeLength;
    let prevCode = lzwState.prevCode;
    const currentSequence = lzwState.currentSequence;
    let currentSequenceLength = lzwState.currentSequenceLength;

    let decodedLength = 0;
    let currentBufferLength = this.bufferLength;
    let buffer = this.ensureBuffer(this.bufferLength + estimatedDecodedSize);

    for (i = 0; i < blockSize; i++) {
      const code = this.#readBits(codeLength);

      // Explicitly check for EOF
      if (code === null) {
        break;
      }

      const hasPrev = currentSequenceLength > 0;
      if (code < 256) {
        currentSequence[0] = code as number;
        currentSequenceLength = 1;
      } else if (code >= 258) {
        if (code < nextCode) {
          currentSequenceLength = dictionaryLengths[code];
          for (j = currentSequenceLength - 1, q = code; j >= 0; j--) {
            currentSequence[j] = dictionaryValues[q];
            q = dictionaryPrevCodes[q];
          }
        } else if (hasPrev) {
          currentSequence[currentSequenceLength++] = currentSequence[0];
        } else {
          this.eof = true;
          this.#lzwState = undefined;
          break;
        }
      } else if (code === 256) {
        codeLength = INITIAL_CODE_LENGTH;
        nextCode = 258;
        prevCode = undefined;
        currentSequenceLength = 0;
        continue;
      } else {
        this.eof = true;
        this.#lzwState = undefined;
        break;
      }

      if (hasPrev && prevCode != null && nextCode < MAX_DICTIONARY_SIZE) {
        dictionaryPrevCodes[nextCode] = prevCode;
        dictionaryLengths[nextCode] = dictionaryLengths[prevCode] + 1;
        dictionaryValues[nextCode] = currentSequence[0];
        nextCode++;

        while (
          codeLength < MAX_CODE_LENGTH &&
          nextCode + earlyChange >= 1 << codeLength
        ) {
          // Increase bit-width as soon as the dictionary crosses the spec threshold.
          codeLength++;
        }
      }
      prevCode = code;

      decodedLength += currentSequenceLength;
      if (estimatedDecodedSize < decodedLength) {
        do {
          estimatedDecodedSize += decodedSizeDelta;
        } while (estimatedDecodedSize < decodedLength);
        buffer = this.ensureBuffer(this.bufferLength + estimatedDecodedSize);
      }
      for (j = 0; j < currentSequenceLength; j++) {
        buffer[currentBufferLength++] = currentSequence[j];
      }
    }
    lzwState.nextCode = nextCode;
    lzwState.codeLength = codeLength;
    lzwState.prevCode = prevCode;
    lzwState.currentSequenceLength = currentSequenceLength;

    this.bufferLength = currentBufferLength;
  }

  #readBits(n: number) {
    let bitsCached = this.#bitsCached;
    let cachedData = this.#cachedData;
    while (bitsCached < n) {
      const c = this.#stream.getByte();
      if (c === -1) {
        this.eof = true;
        return null;
      }
      cachedData = (cachedData << 8) | c;
      bitsCached += 8;
    }
    this.#bitsCached = bitsCached -= n;
    this.#cachedData = cachedData;
    return (cachedData >>> bitsCached) & ((1 << n) - 1);
  }
}

export default LZWStream;
