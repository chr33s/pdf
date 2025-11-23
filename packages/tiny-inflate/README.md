# @chr33s/tiny-inflate

This is a port of Joergen Ibsen's [tiny inflate](https://bitbucket.org/jibsen/tinf) to JavaScript.
Minified it is about 3KB, or 1.3KB gzipped. While being very small, it is also reasonably fast
(about 30% - 50% slower than [pako](https://github.com/nodeca/pako) on average), and should be
good enough for many applications. If you need the absolute best performance, however, you'll
need to use a larger library such as pako that contains additional optimizations.

## Installation

    npm install @chr33s/tiny-inflate

## Example

To use tiny-inflate, you need two things: a buffer of data compressed with deflate,
and the decompressed size (often stored in a file header) to allocate your output buffer.
Input and output buffers can be either Node.js `Buffer`s, or `Uint8Array`s.

```js
import inflate from "@chr33s/tiny-inflate";

const compressedBuffer = new Uint8Array([/* ... */]);
const decompressedSize = /* ... */;
const outputBuffer = new Uint8Array(decompressedSize);

inflate(compressedBuffer, outputBuffer);
```

## License

MIT
