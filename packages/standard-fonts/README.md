# @chr33s/standard-fonts

> Collection of metrics and encodings for the standard 14 PDF fonts

This project is a fork of [`afm`](https://github.com/chbrown/afm) and was created for use in [`@chr33s/pdf-lib`](https://github.com/chr33s/pdf). This forks exists for two primary reasons:

1. The original project did not include mappings from Unicode to WinAnsi/ZapfDingbats/Symbol encodings.
2. The font metrics included in the original project were uncompressed (not ideal for usage in `pdf-lib`).

## Usage
```js
import { Font, FontNames, Encodings } from '@chr33s/standard-fonts';

const codePoint = '∑'.charCodeAt(0);

const glyph = Encodings.Symbol.encodeUnicodeCodePoint(codePoint);
glyph // => { code: 229, name: 'summation' }

const font = Font.load(FontNames.Symbol);
const width = font.getWidthOfGlyph(glyph.name);
width // => 713
```

## Installation
### NPM Module
To install the latest stable version:
```bash
# With npm
npm install --save @chr33s/standard-fonts

# With yarn
yarn add @chr33s/standard-fonts
```
This assumes you're using [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/lang/en/) as your package manager.

### ESM Build
`@chr33s/standard-fonts` now ships only native ES modules compiled from the TypeScript sources. The published entry point is `dist/index.js`, which also ships bundled type declarations in `dist/index.d.ts`. Use Node 18+ or a modern bundler (Vite, Rollup, Webpack, etc.) to consume the package, and bundle it for browsers as needed.

## License
[MIT](https://choosealicense.com/licenses/mit/)

## Original Repo's License

Copyright 2015–2018 Christopher Brown.
[MIT Licensed](https://chbrown.github.io/licenses/MIT/#2015-2018).
