import concat from "concat-stream";
import EncodeStream from "../src/EncodeStream.js";

export function expectStream(
  stream: EncodeStream,
  assert: (buf: Buffer) => void | Promise<void>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const sink = concat({ encoding: "buffer" }, async (buf: Buffer) => {
      try {
        await assert(buf);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    stream.pipe(sink as unknown as NodeJS.WritableStream);
  });
}
