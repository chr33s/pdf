import * as r from "@chr33s/pdf-restructure";

// VariationAxisRecord - defines a variation axis
let VariationAxisRecord = new r.Struct({
  axisTag: new r.String(4), // Tag identifying the design variation for the axis
  minValue: r.fixed32, // The minimum coordinate value for the axis
  defaultValue: r.fixed32, // The default coordinate value for the axis
  maxValue: r.fixed32, // The maximum coordinate value for the axis
  flags: r.uint16, // Axis qualifiers (0x0001 = HIDDEN_AXIS)
  axisNameID: r.uint16, // The name ID for entries in the 'name' table
  name: (t: any) => t.parent.parent.name.records.fontFeatures[t.axisNameID],
});

// InstanceRecord - defines a named instance
let InstanceRecord = new r.Struct({
  subfamilyNameID: r.uint16, // The name ID for subfamily names for this instance
  name: (t: any) => t.parent.parent.name.records.fontFeatures[t.subfamilyNameID],
  flags: r.uint16, // Reserved for future use — set to 0
  coordinates: new r.Array(r.fixed32, (t) => t.parent.axisCount), // The coordinate array for this instance
  postScriptNameID: new r.Optional(r.uint16, (t) => t.parent.instanceSize - t._currentOffset > 0), // Optional PostScript name ID
});

// Font Variations Table
// https://learn.microsoft.com/en-us/typography/opentype/spec/fvar
export default new r.Struct({
  majorVersion: r.uint16, // Major version number of the font variations table — set to 1
  minorVersion: r.uint16, // Minor version number of the font variations table — set to 0
  axesArrayOffset: r.uint16, // Offset in bytes from the beginning of the table to the start of the VariationAxisRecord array
  reserved: r.uint16, // This field is permanently reserved. Set to 2.
  axisCount: r.uint16, // The number of variation axes in the font
  axisSize: r.uint16, // The size in bytes of each VariationAxisRecord — set to 20 (0x0014)
  instanceCount: r.uint16, // The number of named instances defined in the font
  instanceSize: r.uint16, // The size in bytes of each InstanceRecord
  axes: new r.Array(VariationAxisRecord, "axisCount"), // The variation axis array
  instances: new r.Array(InstanceRecord, "instanceCount"), // The named instance array
});
