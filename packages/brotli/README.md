# @chr33s/brotli

> Modern ESM build of the Brotli compression utilities used by `@chr33s/pdf-lib` and the rest of this monorepo.

This package lives in the [`chr33s/pdf`](https://github.com/chr33s/pdf) workspace and is derived from the
[Hopding/brotli.js](https://github.com/Hopding/brotli.js) fork of Google's original Brotli encoder/decoder.
Compared to the historical release this build:

- ships native ES modules with NodeNext resolution (Node.js 18+ or a modern bundler required),
- is authored in TypeScript and publishes type declarations alongside the compiled code,
- inlines the dictionary assets so no file system access is required in browser contexts, and
- exposes the compressor and decompressor as named exports for granular tree-shaking.

## Installation

```bash
# npm
npm install @chr33s/brotli

# pnpm
pnpm add @chr33s/brotli

# yarn
yarn add @chr33s/brotli
```

## Usage

```ts
import { compress, decompress } from "@chr33s/brotli";

const compressed = compress(new Uint8Array([1, 2, 3]));
const restored = decompress(compressed);
```

## API

- `decompress(input, outSize?)`: Accepts a `Uint8Array` (or any array-like of numbers) and returns a new `Uint8Array` with the decoded bytes. Provide `outSize` when the final length is known (for example when decoding WOFF2 glyph streams) to skip an extra allocation.
- `compress(input, options?)`: Compresses a `Uint8Array` (or any array-like buffer) and returns the encoded `Uint8Array`, or `null` if encoding fails. The optional `options` object supports:
  - `quality` (0–11, default 11)
  - `mode` (`0` generic, `1` text, `2` font)
  - `lgwin` (window size, default 22)

Both functions operate purely in memory and work the same across Node.js, browsers, and React Native.

## Origin

The underlying encoder/decoder continues to come from Google’s Brotli reference implementation. This package builds on the work done in [Hopding/brotli.js](https://github.com/Hopding/brotli.js) and keeps the same MIT license.

## License

[MIT](https://choosealicense.com/licenses/mit/)
