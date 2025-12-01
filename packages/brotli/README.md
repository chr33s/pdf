# @chr33s/brotli

> Modern ESM build of the Brotli decompression utilities 

## Installation

```bash
npm install @chr33s/brotli
```

## Usage

```ts
import { decompress } from "@chr33s/brotli";

const restored = decompress(compressed);
```

## API

- `decompress(input, outSize?)`: Accepts a `Uint8Array` (or any array-like of numbers) and returns a new `Uint8Array` with the decoded bytes. Provide `outSize` when the final length is known (for example when decoding WOFF2 glyph streams) to skip an extra allocation.

Both functions operate purely in memory and work the same across Node.js, browsers and React Native.

## Origin

The underlying decoder continues to come from Google’s Brotli reference implementation https://github.com/google/brotli/blob/master/js/

## License

[MIT](https://choosealicense.com/licenses/mit/)
