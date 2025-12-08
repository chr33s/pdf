import * as r from "@chr33s/pdf-restructure";

// F2DOT14 - 2.14 fixed-point format used for normalized coordinates (Tuple records)
let F2DOT14 = new r.Fixed(16, "BE", 14);

// Custom offset decoder for glyph variation data offsets
class GlyphVariationDataOffset {
  static decode(stream: any, parent: any) {
    // If flags bit 0 is set, offsets are uint32; otherwise uint16 * 2
    // When short format (Offset16) is used, the value stored is the offset divided by 2
    return parent.flags & 1 ? stream.readUInt32BE() : stream.readUInt16BE() * 2;
  }
}

// Glyph Variations Table
// https://learn.microsoft.com/en-us/typography/opentype/spec/gvar
let gvar = new r.Struct({
  majorVersion: r.uint16, // Major version number of the glyph variations table — set to 1
  minorVersion: r.uint16, // Minor version number of the glyph variations table — set to 0
  axisCount: r.uint16, // The number of variation axes (must match 'fvar' axisCount)
  sharedTupleCount: r.uint16, // The number of shared tuple records
  sharedTuplesOffset: new r.Pointer(
    r.uint32, // Offset from the start of this table to the shared tuple records
    new r.Array(new r.Array(F2DOT14, "axisCount"), "sharedTupleCount"),
  ),
  glyphCount: r.uint16, // The number of glyphs in this font (must match elsewhere in font)
  flags: r.uint16, // Bit 0: if set, offsets are uint32; if clear, offsets are uint16 * 2
  glyphVariationDataArrayOffset: r.uint32, // Offset from start of table to GlyphVariationData array
  glyphVariationDataOffsets: new r.Array(
    new r.Pointer(GlyphVariationDataOffset, "void", {
      relativeTo: "glyphVariationDataArrayOffset",
      allowNull: false,
    }),
    (t) => t.glyphCount + 1, // One extra offset to determine size of last table
  ),
});

export default gvar;
