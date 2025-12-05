import * as r from "@chr33s/pdf-restructure";
import { matchesTag } from "./binary.js";
import TTFFont from "./ttf-font.js";

type DecodeStream = InstanceType<typeof r.DecodeStream>;

type TTCHeaderV1 = {
  numFonts: number;
  offsets: number[];
};

type TTCHeaderV2 = TTCHeaderV1 & {
  dsigTag: number;
  dsigLength: number;
  dsigOffset: number;
};

type TTCHeader = TTCHeaderV1 | TTCHeaderV2;

let TTCHeader = new r.VersionedStruct(r.uint32, {
  0x00010000: {
    numFonts: r.uint32,
    offsets: new r.Array(r.uint32, "numFonts"),
  },
  0x00020000: {
    numFonts: r.uint32,
    offsets: new r.Array(r.uint32, "numFonts"),
    dsigTag: r.uint32,
    dsigLength: r.uint32,
    dsigOffset: r.uint32,
  },
});

export default class TrueTypeCollection {
  static probe(buffer: Uint8Array): boolean {
    return matchesTag(buffer, "ttcf");
  }

  private readonly stream: DecodeStream;
  private readonly header: TTCHeader;

  constructor(stream: DecodeStream) {
    this.stream = stream;
    if (stream.readString(4) !== "ttcf") {
      throw new Error("Not a TrueType collection");
    }

    this.header = TTCHeader.decode(stream) as TTCHeader;
  }

  getFont(name: string): TTFFont | null {
    for (let offset of this.header.offsets) {
      let stream = new r.DecodeStream(this.stream.buffer);
      stream.pos = offset;
      let font = new TTFFont(stream);
      if (font.postscriptName === name) {
        return font;
      }
    }

    return null;
  }

  get fonts(): TTFFont[] {
    let fonts: TTFFont[] = [];
    for (let offset of this.header.offsets) {
      let stream = new r.DecodeStream(this.stream.buffer);
      stream.pos = offset;
      fonts.push(new TTFFont(stream));
    }

    return fonts;
  }
}
