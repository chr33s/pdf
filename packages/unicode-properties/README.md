# @chr33s/unicode-properties

> Fast lookup of Unicode character metadata packaged as modern ES modules.

`@chr33s/unicode-properties` is part of the [`chr33s/pdf`](https://github.com/chr33s/pdf) monorepo and continues the
[Hopding/unicode-properties](https://github.com/Hopding/unicode-properties) fork of the original foliojs project. This
edition:

- ships native ES modules with NodeNext resolution (Node.js 18+ or a modern bundler required),
- is authored in TypeScript with generated declaration files, and
- keeps the compressed trie assets embedded for seamless usage across Node.js, browsers, and React Native.

# unicode-properties

Provides fast access to unicode character properties. Uses [unicode-trie](https://github.com/devongovett/unicode-trie) to compress the
properties for all code points into just 12KB.

## Usage

```ts
import unicodeProperties, {
	getCategory,
	getNumericValue,
} from "@chr33s/unicode-properties";

getCategory("2".codePointAt(0) ?? 0); //=> 'Nd'
getNumericValue("2".codePointAt(0) ?? 0); //=> 2

// The default export bundles all helpers together when that is convenient.
unicodeProperties.isDigit("9".codePointAt(0) ?? 0); //=> true
```

## Installation

```bash
# npm
npm install @chr33s/unicode-properties

# pnpm
pnpm add @chr33s/unicode-properties

# yarn
yarn add @chr33s/unicode-properties
```

The package is distributed as native ES modules. Use Node.js 18+ or configure your bundler to resolve NodeNext-style imports.

## API

### getCategory(codePoint)

Returns the unicode [general category](http://www.fileformat.info/info/unicode/category/index.htm) for the given code point.

### getScript(codePoint)

Returns the [script](http://unicode.org/standard/supported.html) for the given code point.

### getCombiningClass(codePoint)

Returns the [canonical combining class](http://unicode.org/glossary/#combining_class) for the given code point.

### getEastAsianWidth(codePoint)

Returns the [East Asian width](http://www.unicode.org/reports/tr11/tr11-28.html) for the given code point.

### getNumericValue(codePoint)

Returns the numeric value for the given code point, or null if there is no numeric value for that code point.

### isAlphabetic(codePoint)

Returns whether the code point is an alphabetic character.

### isDigit(codePoint)

Returns whether the code point is a digit.

### isPunctuation(codePoint)

Returns whether the code point is a punctuation character.

### isLowerCase(codePoint)

Returns whether the code point is lower case.

### isUpperCase(codePoint)

Returns whether the code point is upper case.

### isTitleCase(codePoint)

Returns whether the code point is title case.

### isWhiteSpace(codePoint)

Returns whether the code point is whitespace: specifically, whether the category is one of Zs, Zl, or Zp.

### isBaseForm(codePoint)

Returns whether the code point is a base form. A code point of base form does not graphically combine with preceding
characters.

### isMark(codePoint)

Returns whether the code point is a mark character (e.g. accent).

## License
[MIT](https://choosealicense.com/licenses/mit/)
