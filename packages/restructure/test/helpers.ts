import type { Done } from 'mocha';
import concat from 'concat-stream';
import EncodeStream from '../src/EncodeStream';

export function expectStream(stream: EncodeStream, done: Done, assert: (buf: Buffer) => void): void {
  const sink = concat({ encoding: 'buffer' }, (buf: Buffer) => {
    try {
      assert(buf);
      done();
    } catch (error) {
      done(error as Error);
    }
  });

  stream.pipe(sink as unknown as NodeJS.WritableStream);
}
