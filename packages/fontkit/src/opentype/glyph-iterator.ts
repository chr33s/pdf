import type GlyphInfo from "./glyph-info.js";

export type GlyphIteratorFlags = {
  ignoreMarks?: boolean;
  ignoreBaseGlyphs?: boolean;
  ignoreLigatures?: boolean;
  rightToLeft?: boolean;
};

export type GlyphIteratorOptions = {
  flags?: GlyphIteratorFlags;
  markAttachmentType?: number;
};

export default class GlyphIterator {
  glyphs: GlyphInfo[];
  options: GlyphIteratorOptions;
  flags: GlyphIteratorFlags;
  markAttachmentType: number;
  index: number;

  constructor(glyphs: GlyphInfo[], options: GlyphIteratorOptions = {}) {
    this.glyphs = glyphs;
    this.options = {};
    this.flags = {};
    this.markAttachmentType = 0;
    this.index = 0;
    this.reset(options);
  }

  reset(options: GlyphIteratorOptions = {}, index = 0): void {
    this.options = options;
    this.flags = options.flags || {};
    this.markAttachmentType = options.markAttachmentType || 0;
    this.index = index;
  }

  get cur(): GlyphInfo | null {
    return this.glyphs[this.index] || null;
  }

  shouldIgnore(glyph: GlyphInfo): boolean {
    return Boolean(
      (this.flags.ignoreMarks && glyph.isMark) ||
      (this.flags.ignoreBaseGlyphs && glyph.isBase) ||
      (this.flags.ignoreLigatures && glyph.isLigature) ||
      (this.markAttachmentType &&
        glyph.isMark &&
        glyph.markAttachmentType !== this.markAttachmentType),
    );
  }

  move(dir: number): GlyphInfo | null {
    this.index += dir;
    while (
      0 <= this.index &&
      this.index < this.glyphs.length &&
      this.shouldIgnore(this.glyphs[this.index])
    ) {
      this.index += dir;
    }

    if (0 > this.index || this.index >= this.glyphs.length) {
      return null;
    }

    return this.glyphs[this.index];
  }

  next(): GlyphInfo | null {
    return this.move(+1);
  }

  prev(): GlyphInfo | null {
    return this.move(-1);
  }

  peek(count = 1): GlyphInfo | null {
    let idx = this.index;
    let res = this.increment(count);
    this.index = idx;
    return res;
  }

  peekIndex(count = 1): number {
    let idx = this.index;
    this.increment(count);
    let res = this.index;
    this.index = idx;
    return res;
  }

  increment(count = 1): GlyphInfo | null {
    let dir = count < 0 ? -1 : 1;
    count = Math.abs(count);
    while (count--) {
      this.move(dir);
    }

    return this.glyphs[this.index] || null;
  }
}
