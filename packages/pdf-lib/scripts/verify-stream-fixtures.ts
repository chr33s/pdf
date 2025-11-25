#!/usr/bin/env node
import { Buffer } from "node:buffer";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync, inflateSync } from "node:zlib";

import fontkit from "@chr33s/fontkit";

import { createCmap } from "../dist/core/embedders/c-map.js";
import * as pdfLib from "../dist/index.js";
import { byAscendingId, sortedUniq } from "../dist/utils/arrays.js";

const {
  PDFArray,
  PDFBool,
  PDFContext,
  PDFDict,
  PDFHexString,
  PDFName,
  PDFNull,
  PDFNumber,
  PDFObjectStreamParser,
  PDFRawStream,
  PDFRef,
  PDFStreamWriter,
  PDFString,
  PDFXRefStreamParser,
  ReparseError,
} = pdfLib;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const testRoot = join(__dirname, "..", "test");

const ok: string[] = [];
const skipped: string[] = [];

const toPosix = (value: string) => value.split(sep).join("/");

const relativePath = (target: string) =>
  toPosix(relative(testRoot, target)) || ".";

const cmapFontSources = {
  "ubuntu-R.ttf.cmap": join(
    __dirname,
    "..",
    "assets",
    "fonts",
    "ubuntu",
    "ubuntu-R.ttf",
  ),
  "source-han-serif-jp-regular.otf.cmap": join(
    __dirname,
    "..",
    "assets",
    "fonts",
    "source-hans-jp",
    "source-han-serif-jp-regular.otf",
  ),
};

const recordSuccess = (label: string) => {
  ok.push(label);
};

function compareBuffers(
  label: string,
  actual: Uint8Array | ArrayBuffer,
  expected: Uint8Array | ArrayBuffer,
) {
  const viewA = actual instanceof Uint8Array ? actual : new Uint8Array(actual);
  const viewB =
    expected instanceof Uint8Array ? expected : new Uint8Array(expected);

  if (viewA.length !== viewB.length) {
    throw new Error(
      `${label}: length mismatch (expected ${viewB.length}, got ${viewA.length})`,
    );
  }
  for (let i = 0; i < viewB.length; i++) {
    if (viewA[i] !== viewB[i]) {
      throw new Error(
        `${label}: byte mismatch at offset ${i} (expected ${viewB[i]}, got ${viewA[i]})`,
      );
    }
  }
  ok.push(label);
}

function decodeAscii85(text: string) {
  const output = [];
  let tuple = 0;
  let count = 0;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 126) {
      break; // ~ signals end
    }
    if (code <= 32) {
      continue; // whitespace
    }
    if (code === 122) {
      if (count !== 0) {
        throw new Error("ascii85: invalid 'z' inside partial block");
      }
      output.push(0, 0, 0, 0);
      continue;
    }
    if (code < 33 || code > 117) {
      throw new Error(`ascii85: invalid byte ${code}`);
    }

    tuple = tuple * 85 + (code - 33);
    count++;

    if (count === 5) {
      output.push((tuple >>> 24) & 0xff);
      output.push((tuple >>> 16) & 0xff);
      output.push((tuple >>> 8) & 0xff);
      output.push(tuple & 0xff);
      tuple = 0;
      count = 0;
    }
  }

  if (count > 0) {
    let padding = 5 - count;
    while (padding-- > 0) {
      tuple = tuple * 85 + 84; // pad with 'u'
    }
    const bytes = [
      (tuple >>> 24) & 0xff,
      (tuple >>> 16) & 0xff,
      (tuple >>> 8) & 0xff,
      tuple & 0xff,
    ];
    for (let i = 0; i < count - 1; i++) {
      output.push(bytes[i]);
    }
  }

  return Uint8Array.from(output);
}

function decodeAsciiHex(text: string) {
  let digits = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === ">") {
      break;
    }
    const code = ch.charCodeAt(0);
    if (code <= 32) {
      continue;
    }
    digits += ch;
  }

  if (digits.length % 2 === 1) {
    digits += "0";
  }

  const result = new Uint8Array(digits.length / 2);
  for (let i = 0, q = 0; i < digits.length; i += 2, q++) {
    result[q] = parseInt(digits.slice(i, i + 2), 16);
  }
  return result;
}

function decodeRunLength(data: Uint8Array) {
  const out = [];
  for (let i = 0; i < data.length; ) {
    const length = data[i++];
    if (length === 128) {
      break;
    }
    if (length < 128) {
      const run = length + 1;
      for (let j = 0; j < run && i < data.length; j++, i++) {
        out.push(data[i]);
      }
    } else {
      const value = data[i++];
      const run = 257 - length;
      for (let j = 0; j < run; j++) {
        out.push(value);
      }
    }
  }
  return Uint8Array.from(out);
}

function decodeFlate(data: Uint8Array) {
  try {
    return new Uint8Array(inflateRawSync(data));
  } catch (rawErr) {
    try {
      return new Uint8Array(inflateSync(data));
    } catch (err) {
      const rawMsg = rawErr instanceof Error ? rawErr.message : String(rawErr);
      const errMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`flate: failed to inflate (${rawMsg}; ${errMsg})`);
    }
  }
}

function decodeLzw(data: Uint8Array, earlyChange = 0) {
  const maxDictSize = 4096;
  const dictionaryValues = new Uint8Array(maxDictSize);
  const dictionaryLengths = new Uint16Array(maxDictSize);
  const dictionaryPrevCodes = new Uint16Array(maxDictSize);

  for (let i = 0; i < 256; i++) {
    dictionaryValues[i] = i;
    dictionaryLengths[i] = 1;
  }

  const currentSequence = new Uint8Array(maxDictSize);
  let currentSequenceLength = 0;
  let nextCode = 258;
  let codeLength = 9;
  let prevCode;

  let bitBuffer = 0;
  let bitsInBuffer = 0;
  let bytePos = 0;

  const result = [];

  const readBits = (n: number): number | null => {
    while (bitsInBuffer < n) {
      if (bytePos >= data.length) {
        return null;
      }
      bitBuffer = (bitBuffer << 8) | data[bytePos++];
      bitsInBuffer += 8;
    }
    bitsInBuffer -= n;
    const mask = (1 << n) - 1;
    const value = (bitBuffer >>> bitsInBuffer) & mask;
    bitBuffer &= (1 << bitsInBuffer) - 1;
    return value;
  };

  while (true) {
    const code = readBits(codeLength);
    if (code === null) {
      break;
    }

    const hasPrev = currentSequenceLength > 0;

    if (code < 256) {
      currentSequence[0] = code;
      currentSequenceLength = 1;
    } else if (code >= 258) {
      if (code < nextCode) {
        currentSequenceLength = dictionaryLengths[code];
        let q = code;
        for (let j = currentSequenceLength - 1; j >= 0; j--) {
          currentSequence[j] = dictionaryValues[q];
          q = dictionaryPrevCodes[q];
        }
      } else {
        currentSequence[currentSequenceLength++] = currentSequence[0];
      }
    } else if (code === 256) {
      codeLength = 9;
      nextCode = 258;
      currentSequenceLength = 0;
      prevCode = undefined;
      continue;
    } else {
      break;
    }

    if (hasPrev && nextCode < maxDictSize) {
      dictionaryPrevCodes[nextCode] = prevCode!;
      dictionaryLengths[nextCode] = dictionaryLengths[prevCode!] + 1;
      dictionaryValues[nextCode] = currentSequence[0];
      nextCode++;
      const threshold = nextCode + earlyChange;
      if ((threshold & (threshold - 1)) === 0) {
        codeLength = Math.min(((Math.log(threshold) / Math.LN2) | 0) + 1, 12);
      }
    }

    prevCode = code;

    for (let j = 0; j < currentSequenceLength; j++) {
      result.push(currentSequence[j]);
    }
  }

  return Uint8Array.from(result);
}

function findDataDirs(root: string) {
  const stack = [root];
  const dirs = [];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "data") {
          dirs.push(fullPath);
        }
        stack.push(fullPath);
      }
    }
  }
  return dirs.sort((a, b) => relativePath(a).localeCompare(relativePath(b)));
}

const labelFor = (dir: string, name: string) => `${relativePath(dir)}/${name}`;

function verifyAscii85(dir: string) {
  if (!existsSync(dir)) {
    skipped.push(`${relativePath(dir)} (missing)`);
    return;
  }
  const files = readdirSync(dir).filter((file) => file.endsWith(".encoded"));
  if (files.length === 0) {
    skipped.push(`${relativePath(dir)} (no encoded fixtures)`);
    return;
  }
  files.sort();
  for (const encoded of files) {
    const name = encoded.replace(/\.encoded$/, "");
    const encodedPath = join(dir, encoded);
    const decodedPath = join(dir, `${name}.decoded`);
    const actual = decodeAscii85(readFileSync(encodedPath, "utf8"));
    const expected = new Uint8Array(readFileSync(decodedPath));
    compareBuffers(labelFor(dir, name), actual, expected);
  }
}

function verifyAsciiHex(dir: string) {
  if (!existsSync(dir)) {
    skipped.push(`${relativePath(dir)} (missing)`);
    return;
  }
  const files = readdirSync(dir).filter((file) => file.endsWith(".encoded"));
  if (files.length === 0) {
    skipped.push(`${relativePath(dir)} (no encoded fixtures)`);
    return;
  }
  files.sort();
  for (const encoded of files) {
    const name = encoded.replace(/\.encoded$/, "");
    const encodedPath = join(dir, encoded);
    const decodedPath = join(dir, `${name}.decoded`);
    const actual = decodeAsciiHex(readFileSync(encodedPath, "utf8"));
    const expected = new Uint8Array(readFileSync(decodedPath));
    compareBuffers(labelFor(dir, name), actual, expected);
  }
}

function verifyRunLength(dir: string) {
  if (!existsSync(dir)) {
    skipped.push(`${relativePath(dir)} (missing)`);
    return;
  }
  const files = readdirSync(dir).filter((file) => file.endsWith(".encoded"));
  if (files.length === 0) {
    skipped.push(`${relativePath(dir)} (no encoded fixtures)`);
    return;
  }
  files.sort();
  for (const encoded of files) {
    const name = encoded.replace(/\.encoded$/, "");
    const encodedPath = join(dir, encoded);
    const decodedBytes = decodeRunLength(
      new Uint8Array(readFileSync(encodedPath)),
    );
    if (name === "empty") {
      compareBuffers(labelFor(dir, name), decodedBytes, new Uint8Array(0));
      continue;
    }
    const decodedPath = join(dir, `${name}.decoded`);
    const expected = new Uint8Array(readFileSync(decodedPath));
    compareBuffers(labelFor(dir, name), decodedBytes, expected);
  }
}

function verifyFlate(dir: string) {
  if (!existsSync(dir)) {
    skipped.push(`${relativePath(dir)} (missing)`);
    return;
  }
  const files = readdirSync(dir).filter((file) => file.endsWith(".encoded"));
  if (files.length === 0) {
    skipped.push(`${relativePath(dir)} (no encoded fixtures)`);
    return;
  }
  files.sort();
  for (const encoded of files) {
    const name = encoded.replace(/\.encoded$/, "");
    const encodedPath = join(dir, encoded);
    if (name.includes("corrupt")) {
      try {
        decodeFlate(readFileSync(encodedPath));
        throw new Error(`${labelFor(dir, name)}: expected decoder to throw`);
      } catch (err) {
        if (
          err instanceof Error &&
          /expected decoder to throw/.test(err.message)
        ) {
          throw err;
        }
        ok.push(`${labelFor(dir, name)} (expected failure)`);
      }
      continue;
    }
    const decodedPath = join(dir, `${name}.decoded`);
    const actual = decodeFlate(readFileSync(encodedPath));
    const expected = new Uint8Array(readFileSync(decodedPath));
    compareBuffers(labelFor(dir, name), actual, expected);
  }
}

function verifyLzw(dir: string) {
  if (!existsSync(dir)) {
    skipped.push(`${relativePath(dir)} (missing)`);
    return;
  }
  const files = readdirSync(dir).filter((file) => file.endsWith(".encoded"));
  if (files.length === 0) {
    skipped.push(`${relativePath(dir)} (no encoded fixtures)`);
    return;
  }
  files.sort();
  for (const encoded of files) {
    const name = encoded.replace(/\.encoded$/, "");
    const encodedPath = join(dir, encoded);
    const decodedPath = join(dir, `${name}.decoded`);
    const actual = decodeLzw(new Uint8Array(readFileSync(encodedPath)), 0);
    const expected = new Uint8Array(readFileSync(decodedPath));
    compareBuffers(labelFor(dir, name), actual, expected);
  }
}

function verifyStreamsData(dir: string) {
  verifyAscii85(join(dir, "ascii85"));
  verifyAsciiHex(join(dir, "asciihex"));
  verifyRunLength(join(dir, "runlength"));
  verifyFlate(join(dir, "flate"));
  verifyLzw(join(dir, "lzw"));
}

function verifyEmbeddersData(dir: string) {
  if (!existsSync(dir)) {
    skipped.push(`${relativePath(dir)} (missing)`);
    return;
  }
  const files = readdirSync(dir).filter((file) => file.endsWith(".cmap"));
  if (files.length === 0) {
    skipped.push(`${relativePath(dir)} (no cmap fixtures)`);
    return;
  }
  files.sort();
  for (const file of files) {
    const fontPath = cmapFontSources[file as keyof typeof cmapFontSources];
    if (!fontPath || !existsSync(fontPath)) {
      skipped.push(`${relativePath(dir)}/${file} (missing font source)`);
      continue;
    }
    const font = fontkit.create(readFileSync(fontPath));
    const glyphs = sortedUniq(
      font.characterSet
        .map((codePoint: number) => font.glyphForCodePoint(codePoint))
        .filter((glyph: any) => glyph)
        .sort(byAscendingId),
      (glyph: any) => glyph.id,
    );
    const cmap = createCmap(glyphs as any, (glyph: any) =>
      glyph ? glyph.id : -1,
    );
    const expected = readFileSync(join(dir, file), "utf8");
    compareBuffers(
      labelFor(dir, file),
      Buffer.from(cmap, "utf8"),
      Buffer.from(expected, "utf8"),
    );
  }
}

async function verifyParserData(dir: string) {
  if (!existsSync(dir)) {
    skipped.push(`${relativePath(dir)} (missing)`);
    return;
  }

  const readData = (file: string) =>
    new Uint8Array(readFileSync(join(dir, file)));

  const objectStreamFixtures = [
    { name: "object-stream1", dict: { N: 3, First: 18 }, expectedCount: 3 },
    {
      name: "object-stream2",
      dict: { N: 9, First: 44 },
      expectedCount: 9,
      validate: (context: any) => {
        const lookup = (num: number, type?: any) =>
          type
            ? context.lookup(PDFRef.of(num), type)
            : context.lookup(PDFRef.of(num));
        if (!(lookup(1) instanceof PDFDict)) {
          throw new Error("object-stream2: expected ref 1 to be PDFDict");
        }
        if (!(lookup(2) instanceof PDFArray)) {
          throw new Error("object-stream2: expected ref 2 to be PDFArray");
        }
        const name3 = lookup(3, PDFName);
        if (name3.decodeText() !== "QuxBaz") {
          throw new Error("object-stream2: expected ref 3 to be /QuxBaz");
        }
        if (!(lookup(4) instanceof PDFString)) {
          throw new Error("object-stream2: expected ref 4 to be PDFString");
        }
        const ref5 = context.lookup(PDFRef.of(5));
        if (ref5 !== PDFRef.of(21)) {
          throw new Error("object-stream2: expected ref 5 to equal 21 0 R");
        }
        if (!(lookup(6) instanceof PDFNumber)) {
          throw new Error("object-stream2: expected ref 6 to be PDFNumber");
        }
        if (!(lookup(7) instanceof PDFHexString)) {
          throw new Error("object-stream2: expected ref 7 to be PDFHexString");
        }
        if (context.lookup(PDFRef.of(8)) !== PDFBool.True) {
          throw new Error("object-stream2: expected ref 8 to be true");
        }
        if (context.lookup(PDFRef.of(9)) !== PDFNull) {
          throw new Error("object-stream2: expected ref 9 to be null");
        }
      },
    },
    {
      name: "object-stream3",
      dict: { N: 182, First: 1786 },
      expectedCount: 182,
    },
    {
      name: "object-stream4",
      dict: { Filter: "FlateDecode", N: 115, First: 924 },
      expectedCount: 115,
    },
    {
      name: "object-stream4",
      dict: { Filter: ["FlateDecode"], N: 115, First: 924 },
      expectedCount: 115,
      labelSuffix: "[array filter]",
    },
  ];

  for (const fixture of objectStreamFixtures) {
    if (!existsSync(join(dir, fixture.name))) {
      skipped.push(`${relativePath(dir)}/${fixture.name} (missing fixture)`);
      continue;
    }
    const context = PDFContext.create();
    const dict = context.obj(fixture.dict);
    const contents = readData(fixture.name);
    const stream = PDFRawStream.of(dict, contents);
    const parser = PDFObjectStreamParser.forStream(stream);
    await parser.parseIntoContext();
    const count = context.enumerateIndirectObjects().length;
    if (count !== fixture.expectedCount) {
      const label = labelFor(
        dir,
        fixture.labelSuffix
          ? `${fixture.name}${fixture.labelSuffix}`
          : fixture.name,
      );
      throw new Error(
        `${label}: expected ${fixture.expectedCount} objects, saw ${count}`,
      );
    }
    if (fixture.validate) {
      fixture.validate(context);
    }
    recordSuccess(
      labelFor(
        dir,
        fixture.labelSuffix
          ? `${fixture.name}${fixture.labelSuffix}`
          : fixture.name,
      ),
    );
  }

  const invalidPath = join(dir, "object-stream-invalid");
  if (existsSync(invalidPath)) {
    const invalidContext = PDFContext.create();
    const invalidDict = invalidContext.obj({ N: 1, First: 5 });
    const invalidStream = PDFRawStream.of(
      invalidDict,
      readData("object-stream-invalid"),
    );
    const invalidParser = PDFObjectStreamParser.forStream(invalidStream);
    let threw = false;
    try {
      await invalidParser.parseIntoContext();
    } catch {
      threw = true;
    }
    if (!threw) {
      throw new Error(
        `${labelFor(dir, "object-stream-invalid")}: expected parser to throw`,
      );
    }
    recordSuccess(
      `${labelFor(dir, "object-stream-invalid")} (expected failure)`,
    );
  } else {
    skipped.push(
      `${relativePath(dir)}/object-stream-invalid (missing fixture)`,
    );
  }

  const xrefFixtures = [
    {
      name: "xref-stream1",
      dict: {
        DecodeParms: { Columns: 4, Predictor: 12 },
        Filter: "FlateDecode",
        Length: 373,
        Size: 319,
        W: [1, 2, 1],
      },
      expected: { total: 319, normal: 51, deleted: 201, inObjectStream: 67 },
    },
    {
      name: "xref-stream2",
      dict: {
        DecodeParms: { Columns: 4, Predictor: 12 },
        Filter: "FlateDecode",
        Index: [
          1, 1, 16, 1, 18, 2, 25, 3, 30, 6, 50, 1, 78, 11, 90, 2, 95, 1, 119,
          19, 139, 1, 141, 1, 143, 11, 156, 61, 219, 2, 223, 9, 243, 2, 246, 13,
          282, 7, 290, 1, 308, 1, 319, 4,
        ],
        Length: 120,
        Size: 323,
        W: [1, 2, 1],
      },
      expected: { total: 160, normal: 32, deleted: 95, inObjectStream: 33 },
    },
    {
      name: "xref-stream3",
      dict: {
        DecodeParms: { Columns: 3, Predictor: 12 },
        Filter: ["FlateDecode"],
        Index: [32, 1, 291, 1, 308, 1, 323, 2],
        Length: 31,
        Size: 325,
        W: [1, 2, 0],
      },
      expected: { total: 5, normal: 3, deleted: 0, inObjectStream: 2 },
    },
    {
      name: "xref-stream4",
      dict: {
        Filter: "FlateDecode",
        Index: [0, 146],
        Length: 332,
        Size: 146,
        W: [1, 2, 2],
      },
      expected: { total: 146, normal: 30, deleted: 1, inObjectStream: 115 },
      checkReparse: true,
    },
  ];

  for (const fixture of xrefFixtures) {
    const path = join(dir, fixture.name);
    if (!existsSync(path)) {
      skipped.push(`${relativePath(dir)}/${fixture.name} (missing fixture)`);
      continue;
    }
    const context = PDFContext.create();
    const dict = context.obj(fixture.dict);
    const stream = PDFRawStream.of(dict, readData(fixture.name));
    const parser = PDFXRefStreamParser.forStream(stream);
    const entries = parser.parseIntoContext();
    const normal = entries.filter(
      (entry) => !entry.deleted && !entry.inObjectStream,
    ).length;
    const deleted = entries.filter((entry) => entry.deleted).length;
    const inObjectStream = entries.filter(
      (entry) => entry.inObjectStream,
    ).length;
    if (entries.length !== fixture.expected.total) {
      throw new Error(
        `${labelFor(dir, fixture.name)}: expected ${fixture.expected.total} entries, saw ${entries.length}`,
      );
    }
    if (normal !== fixture.expected.normal) {
      throw new Error(
        `${labelFor(dir, fixture.name)}: expected ${fixture.expected.normal} normal entries, saw ${normal}`,
      );
    }
    if (deleted !== fixture.expected.deleted) {
      throw new Error(
        `${labelFor(dir, fixture.name)}: expected ${fixture.expected.deleted} deleted entries, saw ${deleted}`,
      );
    }
    if (inObjectStream !== fixture.expected.inObjectStream) {
      throw new Error(
        `${labelFor(dir, fixture.name)}: expected ${fixture.expected.inObjectStream} object-stream entries, saw ${inObjectStream}`,
      );
    }
    recordSuccess(labelFor(dir, fixture.name));

    if (fixture.checkReparse) {
      const reparseContext = PDFContext.create();
      const reparseDict = reparseContext.obj(fixture.dict);
      const reparseStream = PDFRawStream.of(
        reparseDict,
        readData(fixture.name),
      );
      const reparseParser = PDFXRefStreamParser.forStream(reparseStream);
      reparseParser.parseIntoContext();
      let reparseThrew = false;
      try {
        reparseParser.parseIntoContext();
      } catch (error) {
        if (error instanceof ReparseError) {
          reparseThrew = true;
        } else {
          throw error;
        }
      }
      if (!reparseThrew) {
        throw new Error(
          `${labelFor(dir, fixture.name)}: expected reparse guard to throw`,
        );
      }
      recordSuccess(`${labelFor(dir, fixture.name)} (reparse guard)`);
    }
  }
}

async function verifyWritersData(dir: string) {
  if (!existsSync(dir)) {
    skipped.push(`${relativePath(dir)} (missing)`);
    return;
  }
  const pdfPath = join(dir, "stream-writer-1.pdf");
  if (!existsSync(pdfPath)) {
    skipped.push(`${relativePath(dir)}/stream-writer-1.pdf (missing fixture)`);
    return;
  }

  const expected = new Uint8Array(readFileSync(pdfPath));

  const context = PDFContext.create();

  const contentStreamText = `
  BT
    /F1 24 Tf
    100 100 Td
    (Hello World and stuff!) Tj
  ET
`;

  const contentStream = context.flateStream(contentStreamText);
  const contentStreamRef = PDFRef.of(9000);
  context.assign(contentStreamRef, contentStream);

  const fontDict = context.obj({
    Type: "Font",
    Subtype: "Type1",
    Name: "F1",
    BaseFont: "Helvetica",
    Encoding: "MacRomanEncoding",
  });
  const fontDictRef = context.register(fontDict);

  const page = context.obj({
    Type: "Page",
    MediaBox: [0, 0, 612, 792],
    Contents: contentStreamRef,
    Resources: { Font: { F1: fontDictRef } },
  });
  const pageRef = context.register(page);

  const pages = context.obj({
    Type: "Pages",
    Kids: [pageRef],
    Count: 1,
  });
  const pagesRef = context.register(pages);
  page.set(PDFName.of("Parent"), pagesRef);

  const catalog = context.obj({
    Type: "Catalog",
    Pages: pagesRef,
  });
  context.trailerInfo.Root = context.register(catalog);

  const buffer = await PDFStreamWriter.forContext(
    context,
    Infinity,
    false,
    2,
  ).serializeToBuffer();

  compareBuffers(labelFor(dir, "stream-writer-1.pdf"), buffer, expected);
}

function verifyUtilsData(dir: string) {
  if (!existsSync(dir)) {
    skipped.push(`${relativePath(dir)} (missing)`);
    return;
  }
  const files = readdirSync(dir).filter((file) => file.endsWith(".base64"));
  if (files.length === 0) {
    skipped.push(`${relativePath(dir)} (no base64 fixtures)`);
    return;
  }
  files.sort();
  for (const encoded of files) {
    const name = encoded.replace(/\.base64$/, "");
    const encodedPath = join(dir, encoded);
    const targetPath = join(dir, name);
    const actual = new Uint8Array(
      Buffer.from(readFileSync(encodedPath, "utf8"), "base64"),
    );
    const expected = new Uint8Array(readFileSync(targetPath));
    compareBuffers(labelFor(dir, name), actual, expected);
  }
}

async function main() {
  const dataDirs = findDataDirs(testRoot);
  for (const dir of dataDirs) {
    const rel = relativePath(dir);
    if (rel.endsWith("core/streams/data")) {
      verifyStreamsData(dir);
    } else if (rel.endsWith("core/embedders/data")) {
      verifyEmbeddersData(dir);
    } else if (rel.endsWith("core/parser/data")) {
      await verifyParserData(dir);
    } else if (rel.endsWith("core/writers/data")) {
      await verifyWritersData(dir);
    } else if (rel.endsWith("utils/data")) {
      verifyUtilsData(dir);
    } else {
      skipped.push(`${rel} (no verification logic)`);
    }
  }

  ok.forEach((label) => {
    console.log(`\u2713 ${label}`);
  });

  if (skipped.length > 0) {
    for (const note of skipped) {
      console.warn(`- skipped ${note}`);
    }
  }

  console.log(`Verified ${ok.length} fixture(s).`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
