// @ts-nocheck

import * as r from "@chr33s/restructure";

// Set of instructions executed whenever the point size or font transformation change
export default new r.Struct({
  controlValueProgram: new r.Array(r.uint8),
});
