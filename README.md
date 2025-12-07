# @chr33s/pdf

> Modern ESM-only monorepo for PDF generation and manipulation in JavaScript.

This monorepo contains `@chr33s/pdf` and all its dependencies as native ES modules with full TypeScript support. It evolves from [pdf-lib](https://github.com/Hopding/pdf-lib) with modern tooling, SVG support, and up-to-date dependencies.

## Packages

| Package | Description |
|---------|-------------|
| [@chr33s/pdf](./packages/pdf/) | Create and modify PDF documents |
| [@chr33s/pdf-fontkit](./packages/fontkit/) | Advanced font engine for font embedding |
| [@chr33s/pdf-codepoints](./packages/codepoints/) | Unicode database parser (build-time only) |
| [@chr33s/pdf-common](./packages/common/) | Common utilities (crypto, deflate, gzip, etc.) |
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

## Benchmark

### Size

| Name | Size | min | min.gz |
|------|------|-----|--------|
| @chr33s/pdf | 1.06 MB | 479.37 KB | 209.10 KB |
| pdf-lib | 2.01 MB | 511.15 KB | 201.13 KB |
| Δ | 975.89 KB (-47.3%) | 31.78 KB (-6.2%) | +7.96 KB (+4.0%) | +0 (+0.0%) |
| @chr33s/pdf-fontkit | 797.67 KB | 455.47 KB | 179.04 KB |
| @pdf-lib/fontkit | 1.87 MB | 697.61 KB | 316.54 KB |
| Δ | 1.09 MB (-58.4%) | 242.14 KB (-34.7%) | 137.50 KB (-43.4%) | +0 (+0.0%) |

### Performance

| Name | cold avg (ms) | warm avg (ms) | warm median (ms) | warm p95 (ms) | warm rss Δ avg | warm throughput (ops/s) | peak RSS | peak heap |
|------|---------------|---------------|------------------|---------------|----------------|-------------------------|----------|-----------|
| @chr33s/pdf | 70.14 | 1.78 | 1.70 | 2.38 | 4.23 KB | 560.87 | 124.86 MB | 16.28 MB |
| pdf-lib | 49.62 | 1.88 | 1.77 | 2.63 | 2.63 KB | 532.31 | 121.33 MB | 19.80 MB |
| Δ | +41.4% | -5.1% | -3.9% | -9.3% | +1.60 KB (+61.0%) | +5.4% | +3.53 MB (+2.9%) | 3.52 MB (-17.8%) |
| @chr33s/pdf-fontkit | 105.18 | 12.66 | 12.35 | 16.30 | 29.08 KB | 78.98 | 139.94 MB | 25.65 MB |
| @pdf-lib/fontkit | 97.00 | 16.01 | 16.31 | 18.45 | 24.34 KB | 62.46 | 143.69 MB | 25.55 MB |
| Δ | +8.4% | -20.9% | -24.3% | -11.6% | +4.75 KB (+19.5%) | +26.4% | 3.75 MB (-2.6%) | +104.91 KB (+0.4%) |
