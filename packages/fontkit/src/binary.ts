const utf8Decoder = new TextDecoder("utf-8");

export type BinaryLike = Uint8Array | ArrayBuffer | ArrayBufferView;

export function toUint8Array(source: BinaryLike): Uint8Array {
  if (source instanceof Uint8Array) {
    return source;
  }

  if (ArrayBuffer.isView(source)) {
    return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
  }

  if (source instanceof ArrayBuffer) {
    return new Uint8Array(source);
  }

  throw new TypeError("Unsupported binary source provided to toUint8Array");
}

export function matchesTag(buffer: Uint8Array, tag: string, offset = 0): boolean {
  if (buffer.length - offset < tag.length) {
    return false;
  }

  for (let i = 0; i < tag.length; i++) {
    if (buffer[offset + i] !== tag.charCodeAt(i)) {
      return false;
    }
  }

  return true;
}

export function decodeUtf8(bytes: Uint8Array): string {
  return utf8Decoder.decode(bytes);
}

export function encodedLength(value: string, encoding: "utf16le" | "ascii"): number {
  return encoding === "utf16le" ? value.length * 2 : value.length;
}
