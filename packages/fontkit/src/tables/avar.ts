import * as r from "@chr33s/pdf-restructure";

// F2DOT14 - 2.14 fixed-point format used for normalized coordinates
let F2DOT14 = new r.Fixed(16, "BE", 14);

// AxisValueMap record - maps fromCoordinate to toCoordinate
let AxisValueMap = new r.Struct({
  fromCoordinate: F2DOT14, // A normalized coordinate value obtained using default normalization
  toCoordinate: F2DOT14, // The modified, normalized coordinate value
});

// SegmentMaps record - contains axis value maps for one axis
let SegmentMaps = new r.Struct({
  positionMapCount: r.uint16, // The number of correspondence pairs for this axis
  axisValueMaps: new r.Array(AxisValueMap, "positionMapCount"), // The array of axis value map records
});

// Axis Variations Table
// https://learn.microsoft.com/en-us/typography/opentype/spec/avar
export default new r.Struct({
  majorVersion: r.uint16, // Major version number of the axis variations table — set to 1
  minorVersion: r.uint16, // Minor version number of the axis variations table — set to 0
  reserved: new r.Reserved(r.uint16), // Permanently reserved; set to 0
  axisCount: r.uint16, // The number of variation axes for this font (must match 'fvar' axisCount)
  axisSegmentMaps: new r.Array(SegmentMaps, "axisCount"), // The segment maps array — one per axis
});
