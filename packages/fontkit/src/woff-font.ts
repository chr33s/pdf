import * as r from "@chr33s/restructure";
import inflate from "@chr33s/tiny-inflate";
import WOFFDirectory from "./tables/woff-directory.js";
import TTFFont from "./ttf-font.js";

type DecodeStream = InstanceType<typeof r.DecodeStream>;
type TTDirectoryData = TTFFont["directory"];

type WOFFDirectoryEntry = {
  tag: string;
  offset: number;
  length: number;
  compLength: number;
};

type WOFFDirectoryData = {
  tables: Record<string, WOFFDirectoryEntry>;
};

export default class WOFFFont extends TTFFont {
  declare directory: TTDirectoryData & WOFFDirectoryData;
  declare stream: DecodeStream;

  static probe(buffer: Buffer): boolean {
    return buffer.toString("ascii", 0, 4) === "wOFF";
  }

  _decodeDirectory(): TTDirectoryData & WOFFDirectoryData {
    return (this.directory = WOFFDirectory.decode(this.stream, {
      _startOffset: 0,
    }) as TTDirectoryData & WOFFDirectoryData);
  }

  protected override _getTableStream(tag: string): DecodeStream | null {
    const table = this.directory.tables[tag];
    if (table) {
      this.stream.pos = table.offset;

      if (table.compLength < table.length) {
        this.stream.pos += 2; // skip deflate header
        const outBuffer = Buffer.alloc(table.length);
        const buf = inflate(
          this.stream.readBuffer(table.compLength - 2),
          outBuffer,
        ) as Buffer;
        return new r.DecodeStream(buf);
      } else {
        return this.stream;
      }
    }

    return null;
  }
}
