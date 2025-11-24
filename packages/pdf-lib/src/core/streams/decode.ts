import {
  UnexpectedObjectTypeError,
  UnsupportedEncodingError,
} from "../errors.js";
import PDFArray from "../objects/pdf-array.js";
import PDFDict from "../objects/pdf-dict.js";
import PDFName from "../objects/pdf-name.js";
import PDFNull from "../objects/pdf-null.js";
import PDFNumber from "../objects/pdf-number.js";
import PDFRawStream from "../objects/pdf-raw-stream.js";
import Ascii85Stream from "./ascii85-stream.js";
import AsciiHexStream from "./ascii-hex-stream.js";
import FlateStream from "./flate-stream.js";
import LZWStream from "./lzw-stream.js";
import RunLengthStream from "./run-length-stream.js";
import Stream, { StreamType } from "./stream.js";

const decodeStream = (
  stream: StreamType,
  encoding: PDFName,
  params: undefined | typeof PDFNull | PDFDict,
) => {
  if (encoding === PDFName.of("FlateDecode")) {
    return new FlateStream(stream);
  }
  if (encoding === PDFName.of("LZWDecode")) {
    let earlyChange = 1;
    if (params instanceof PDFDict) {
      const EarlyChange = params.lookup(PDFName.of("EarlyChange"));
      if (EarlyChange instanceof PDFNumber) {
        earlyChange = EarlyChange.asNumber();
      }
    }
    return new LZWStream(stream, undefined, earlyChange as 0 | 1);
  }
  if (encoding === PDFName.of("ASCII85Decode")) {
    return new Ascii85Stream(stream);
  }
  if (encoding === PDFName.of("ASCIIHexDecode")) {
    return new AsciiHexStream(stream);
  }
  if (encoding === PDFName.of("RunLengthDecode")) {
    return new RunLengthStream(stream);
  }
  throw new UnsupportedEncodingError(encoding.asString());
};

export const decodePDFRawStream = ({
  dict,
  contents,
  transform,
}: PDFRawStream) => {
  let stream: StreamType = new Stream(contents);

  if (transform) {
    stream = transform.createStream(stream, contents.length);
  }

  const Filter = dict.lookup(PDFName.of("Filter"));
  const DecodeParms = dict.lookup(PDFName.of("DecodeParms"));

  if (Filter instanceof PDFName) {
    stream = decodeStream(
      stream,
      Filter,
      DecodeParms as PDFDict | typeof PDFNull | undefined,
    );
  } else if (Filter instanceof PDFArray) {
    for (let idx = 0, len = Filter.size(); idx < len; idx++) {
      stream = decodeStream(
        stream,
        Filter.lookup(idx, PDFName),
        DecodeParms && (DecodeParms as PDFArray).lookupMaybe(idx, PDFDict),
      );
    }
  } else if (Filter) {
    throw new UnexpectedObjectTypeError([PDFName, PDFArray], Filter);
  }

  return stream;
};
