// @ts-nocheck

import * as r from "@chr33s/restructure";

// An array of predefined values accessible by instructions
export default new r.Struct({
  controlValues: new r.Array(r.int16),
});
