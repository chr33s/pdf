import type { DecodeStream } from "@chr33s/restructure";
import * as r from "@chr33s/restructure";
import TTFFont from "./ttf-font.js";

let DFontName = new r.String(r.uint8);

let Ref = new r.Struct({
  id: r.uint16,
  nameOffset: r.int16,
  attr: r.uint8,
  dataOffset: r.uint24,
  handle: r.uint32,
});

let Type = new r.Struct({
  name: new r.String(4),
  maxTypeIndex: r.uint16,
  refList: new r.Pointer(r.uint16, new r.Array(Ref, (t) => t.maxTypeIndex + 1), { type: "parent" }),
});

let TypeList = new r.Struct({
  length: r.uint16,
  types: new r.Array(Type, (t) => t.length + 1),
});

let DFontMap = new r.Struct({
  reserved: new r.Reserved(r.uint8, 24),
  typeList: new r.Pointer(r.uint16, TypeList),
  nameListOffset: new r.Pointer(r.uint16, "void"),
});

let DFontHeader = new r.Struct({
  dataOffset: r.uint32,
  map: new r.Pointer(r.uint32, DFontMap),
  dataLength: r.uint32,
  mapLength: r.uint32,
});

type DFontRef = {
  id: number;
  nameOffset: number;
  attr: number;
  dataOffset: number;
  handle: number;
  name?: string | null;
};

type DFontType = {
  name: string;
  maxTypeIndex: number;
  refList: DFontRef[];
};

type DFontMapStruct = {
  typeList: {
    length: number;
    types: DFontType[];
  };
  nameListOffset: number;
};

type DFontHeaderStruct = {
  dataOffset: number;
  map: DFontMapStruct;
  dataLength: number;
  mapLength: number;
};

type BufferLike = Buffer | ArrayBuffer | ArrayBufferView;

function toBuffer(source: BufferLike): Buffer {
  if (Buffer.isBuffer(source)) {
    return source;
  }

  if (source instanceof ArrayBuffer) {
    return Buffer.from(source);
  }

  return Buffer.from(source.buffer, source.byteOffset, source.byteLength);
}

export default class DFont {
  #stream: DecodeStream;
  #header: DFontHeaderStruct;
  #sfnt: DFontType | null;

  static probe(buffer: BufferLike): boolean {
    const stream = new r.DecodeStream(toBuffer(buffer));
    let header: DFontHeaderStruct;

    try {
      header = DFontHeader.decode(stream) as DFontHeaderStruct;
    } catch {
      return false;
    }

    for (const type of header.map.typeList.types) {
      if (type.name === "sfnt") {
        return true;
      }
    }

    return false;
  }

  constructor(stream: DecodeStream) {
    this.#stream = stream;
    this.#header = DFontHeader.decode(this.#stream) as DFontHeaderStruct;
    this.#sfnt = null;

    for (const type of this.#header.map.typeList.types) {
      for (const ref of type.refList) {
        if (ref.nameOffset >= 0) {
          this.#stream.pos = ref.nameOffset + this.#header.map.nameListOffset;
          const decodedName = DFontName.decode(this.#stream) as string | Buffer;
          ref.name = typeof decodedName === "string" ? decodedName : decodedName.toString("utf8");
        } else {
          ref.name = null;
        }
      }

      if (type.name === "sfnt") {
        this.#sfnt = type;
      }
    }
  }

  getFont(name: string): TTFFont | null {
    if (!this.#sfnt) {
      return null;
    }

    for (const ref of this.#sfnt.refList) {
      const pos = this.#header.dataOffset + ref.dataOffset + 4;
      const baseBuffer = this.#stream.buffer as Buffer;
      const slice = baseBuffer.slice(pos);
      const stream = new r.DecodeStream(slice);
      const font = new TTFFont(stream);
      if (font.postscriptName === name) {
        return font;
      }
    }

    return null;
  }

  get fonts(): TTFFont[] {
    if (!this.#sfnt) {
      return [];
    }

    const baseBuffer = this.#stream.buffer as Buffer;
    const fonts: TTFFont[] = [];
    for (const ref of this.#sfnt.refList) {
      const pos = this.#header.dataOffset + ref.dataOffset + 4;
      const stream = new r.DecodeStream(baseBuffer.slice(pos));
      fonts.push(new TTFFont(stream));
    }

    return fonts;
  }
}
