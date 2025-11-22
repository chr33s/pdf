import base64 from "base64-js";
import decode from "../decompress.js";
// @ts-ignore
Module["readBinary"] = function () {
  var src = base64["toByteArray"](require("./mem.js"));
  return decode(src, null);
};
