// @ts-nocheck

import * as r from "@chr33s/restructure";

const formats = [];
const sanitizedFormats = new WeakMap();

function getNamedFormat(format) {
  let named = sanitizedFormats.get(format);
  if (named) {
    return named;
  }

  const rawName = format.name || "";
  const desiredName = rawName.startsWith("_") ? rawName.slice(1) : rawName;

  if (!desiredName || desiredName === rawName) {
    sanitizedFormats.set(format, format);
    return format;
  }

  const NamedFormat = {
    [desiredName]: class extends format {},
  }[desiredName];

  sanitizedFormats.set(format, NamedFormat);
  return NamedFormat;
}

const fontkit = {
  logErrors: false,

  registerFormat: (format) => {
    formats.push(getNamedFormat(format));
  },

  create: (uint8ArrayFontData, postscriptName) => {
    const buffer = Buffer.from(uint8ArrayFontData);
    for (let i = 0; i < formats.length; i++) {
      const format = formats[i];
      if (format.probe(buffer)) {
        const font = new format(new r.DecodeStream(buffer));
        if (postscriptName) {
          return font.getFont(postscriptName);
        }
        return font;
      }
    }
    throw new Error("Unknown font format");
  },
};

export default fontkit;
