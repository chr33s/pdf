import type { DecodeStream } from "@chr33s/pdf-restructure";
import CFFDict from "./cff-dict.js";
import CFFIndex from "./cff-index.js";
import CFFPointer from "./cff-pointer.js";

const CFFBlendOperand = {
  decode(
    _stream: DecodeStream,
    _parent?: Record<string, unknown>,
    operands: ReadonlyArray<number> = [],
  ) {
    const numBlends = operands[operands.length - 1];
    if (typeof numBlends !== "number") {
      throw new Error("CFF blend operator missing operand count");
    }

    const deltaCount = operands.length - 1;
    if (deltaCount < numBlends) {
      throw new Error("CFF blend operator missing delta operands");
    }
  },
};

export default new CFFDict([
  // key       name                    type                                          default
  [6, "BlueValues", "delta", null],
  [7, "OtherBlues", "delta", null],
  [8, "FamilyBlues", "delta", null],
  [9, "FamilyOtherBlues", "delta", null],
  [[12, 9], "BlueScale", "number", 0.039625],
  [[12, 10], "BlueShift", "number", 7],
  [[12, 11], "BlueFuzz", "number", 1],
  [10, "StdHW", "number", null],
  [11, "StdVW", "number", null],
  [[12, 12], "StemSnapH", "delta", null],
  [[12, 13], "StemSnapV", "delta", null],
  [[12, 14], "ForceBold", "boolean", false],
  [[12, 17], "LanguageGroup", "number", 0],
  [[12, 18], "ExpansionFactor", "number", 0.06],
  [[12, 19], "initialRandomSeed", "number", 0],
  [20, "defaultWidthX", "number", 0],
  [21, "nominalWidthX", "number", 0],
  [22, "vsindex", "number", 0],
  [23, "blend", CFFBlendOperand, null],
  [19, "Subrs", new CFFPointer(new CFFIndex(), { type: "local" }), null],
]);
