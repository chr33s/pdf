declare module "unicode-trie" {
  export default class UnicodeTrie {
    constructor(buffer: ArrayBuffer | ArrayBufferView | number[]);
    get(codePoint: number): number;
  }
}

declare module "unicode-trie/builder" {
  interface UnicodeTrieBuilderOptions {
    highStart?: number;
  }

  export default class UnicodeTrieBuilder {
    constructor(options?: UnicodeTrieBuilderOptions);
    set(codePoint: number, value: number): void;
    toBuffer(): Uint8Array;
  }
}

declare module "base64-arraybuffer" {
  export function encode(source: ArrayBufferLike | ArrayBufferView): string;
  export function decode(encoded: string): ArrayBuffer;
}

declare module "codepoints" {
  export interface CodePointRecord {
    code: number;
    category: string;
    combiningClassName?: string;
    script?: string;
    eastAsianWidth?: string;
    numeric?: string;
  }

  const data: Iterable<CodePointRecord | null>;
  export default data;
}
