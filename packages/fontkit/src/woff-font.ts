import { inflateRaw } from "@chr33s/compression";
import * as r from "@chr33s/restructure";
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
  private _decompressedTables: Map<string, Buffer> = new Map();
  private _initPromise: Promise<void> | null = null;

  static probe(buffer: Buffer): boolean {
    return buffer.toString("ascii", 0, 4) === "wOFF";
  }

  _decodeDirectory(): TTDirectoryData & WOFFDirectoryData {
    return (this.directory = WOFFDirectory.decode(this.stream, {
      _startOffset: 0,
    }) as TTDirectoryData & WOFFDirectoryData);
  }

  /**
   * Initialize the WOFF font by pre-decompressing all compressed tables.
   * Must be called before accessing font data.
   */
  async init(): Promise<void> {
    if (this._initPromise) return this._initPromise;

    this._initPromise = this._decompressAllTables();
    return this._initPromise;
  }

  private async _decompressAllTables(): Promise<void> {
    const entries = Object.values(this.directory.tables);
    const compressionTasks = entries
      .filter((table) => table.compLength < table.length)
      .map(async (table) => {
        this.stream.pos = table.offset + 2; // skip deflate header
        const compressedData = this.stream.readBuffer(table.compLength - 2);
        const decompressed = await inflateRaw(compressedData);
        this._decompressedTables.set(table.tag, Buffer.from(decompressed));
      });

    await Promise.all(compressionTasks);
  }

  protected override _getTableStream(tag: string): DecodeStream | null {
    const table = this.directory.tables[tag];
    if (table) {
      if (table.compLength < table.length) {
        const decompressed = this._decompressedTables.get(tag);
        if (!decompressed) {
          throw new Error(
            `WOFF table '${tag}' not decompressed. Call init() first and await its result.`,
          );
        }
        return new r.DecodeStream(decompressed);
      } else {
        this.stream.pos = table.offset;
        return this.stream;
      }
    }

    return null;
  }
}
