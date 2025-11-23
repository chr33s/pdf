// @ts-nocheck

import * as r from "@chr33s/restructure";
import Tables from "./index.js";

let TableEntry = new r.Struct({
  tag: new r.String(4),
  checkSum: r.uint32,
  offset: new r.Pointer(r.uint32, "void", { type: "global" }),
  length: r.uint32,
});

let Directory = new r.Struct({
  tag: new r.String(4),
  numTables: r.uint16,
  searchRange: r.uint16,
  entrySelector: r.uint16,
  rangeShift: r.uint16,
  tables: new r.Array(TableEntry, "numTables"),
});

Directory.process = function () {
  let tables = {};
  for (let table of this.tables) {
    tables[table.tag] = table;
  }

  this.tables = tables;
};

Directory.preEncode = function (_stream) {
  if (!Array.isArray(this.tables)) {
    let entries = [];
    let source = this.tables ?? {};

    for (let tag of Object.keys(source)) {
      let table = source[tag];
      if (!table) continue;

      let definition = Tables[tag];
      if (!definition) {
        throw new Error("Unknown table definition for tag " + tag);
      }

      entries.push({
        tag,
        checkSum: 0,
        offset: new r.VoidPointer(definition, table),
        length: definition.size(table),
      });
    }

    this.tables = entries;
  }

  this.tag = this.tag ?? "true";
  this.numTables = this.tables.length;

  let maxExponentFor2 = 0;
  let maxPowerOf2 = 0;
  if (this.numTables > 0) {
    maxExponentFor2 = Math.floor(Math.log2(this.numTables));
    maxPowerOf2 = 1 << maxExponentFor2;
  }

  this.searchRange = maxPowerOf2 * 16;
  this.entrySelector = maxExponentFor2;
  this.rangeShift = this.numTables * 16 - this.searchRange;
};

export default Directory;
