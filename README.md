# @chr33s/pdf

> Modern ESM-only monorepo for PDF generation and manipulation in JavaScript.

This monorepo contains `@chr33s/pdf` and all its dependencies as native ES modules with full TypeScript support. It evolves from [pdf-lib](https://github.com/Hopding/pdf-lib) with modern tooling, SVG support, and up-to-date dependencies.

## Packages

| Package | Description |
|---------|-------------|
| [@chr33s/pdf](./packages/pdf/) | Create and modify PDF documents |
| [@chr33s/pdf-fontkit](./packages/fontkit/) | Advanced font engine for font embedding |
| [@chr33s/pdf-base64](./packages/base64/) | Base64 encoder and decoder |
| [@chr33s/pdf-brotli](./packages/brotli/) | Brotli decompression for WOFF2 fonts |
| [@chr33s/pdf-codepoints](./packages/codepoints/) | Unicode database parser (build-time only) |
| [@chr33s/pdf-compression](./packages/compression/) | Compression utilities (deflate, gzip, etc.) |
| [@chr33s/pdf-crypto](./packages/crypto/) | Cryptographic primitives for PDF encryption |
| [@chr33s/pdf-dfa](./packages/dfa/) | Deterministic finite automata compiler |
| [@chr33s/pdf-restructure](./packages/restructure/) | Binary encoding/decoding primitives |
| [@chr33s/pdf-standard-fonts](./packages/standard-fonts/) | Metrics for standard 14 PDF fonts |
| [@chr33s/pdf-unicode-properties](./packages/unicode-properties/) | Fast Unicode character metadata lookup |
| [@chr33s/pdf-unicode-trie](./packages/unicode-trie/) | Compressed Unicode trie data structure |
| [@chr33s/pdf-upng](./packages/upng/) | PNG/APNG encoder and decoder |

## Installation

```bash
npm install @chr33s/pdf
```

## Quick Start

```ts
import { PDFDocument } from "@chr33s/pdf";

const pdfDoc = await PDFDocument.create();
const page = pdfDoc.addPage();
page.drawText("Hello, World!");

const pdfBytes = await pdfDoc.save();
```

## Development

Requirements: Node.js ^22.18.0, npm 10+

```bash
# Install dependencies
npm install

# Build all packages
npm run workspace build

# Run tests
npm run workspace test

# Full pipeline (clean → build → check → test)
npm run all

# Format and lint
npm run check    # verify
npm run fix      # auto-fix
```

## License

[MIT](./LICENSE)
