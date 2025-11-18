# Purpose of this Fork
This project is a fork of https://github.com/foliojs/unicode-properties created for use in https://github.com/Hopding/pdf-lib.

Listed below are changes that have been made in this fork:

* Store binary data as compressed base64 JSON so the `fs` module isn't needed to read it back:
  * [13160b](https://github.com/Hopding/unicode-properties/commit/13160bd299525fd4effd867e9020c955ce8e07d3)
  * [d97bf46](https://github.com/Hopding/unicode-properties/commit/d97bf46ebdcef78f838f0803ec3643e608410add)
  * [e95c52f](https://github.com/Hopding/unicode-properties/commit/e95c52f1c98e82bf159e4a9daf5452a09c0a3c44)
* Update to Babel 7, replace Browserify with Rollup, and build UMDs
  * [3db56ad](https://github.com/Hopding/unicode-properties/commit/3db56ad605cb1517e64874f80a0f915c64538707)
* Build non-rolled-up ES6 and CommonJS in `es/` and `lib/` directories:
  * [cae7a5b](https://github.com/Hopding/unicode-properties/commit/cae7a5b0ca4f8f0a95b2f1f0592f55c93057166d)
* Released to NPM as `@chr33s/unicode-properties`
  * [a2d46c4](https://github.com/Hopding/unicode-properties/commit/a2d46c4f8cb837e24fdc8d298a8bff756e58bef3)

Also see
* https://github.com/Hopding/fontkit
* https://github.com/Hopding/brotli.js
* https://github.com/Hopding/restructure
* https://github.com/Hopding/png-ts

# unicode-properties

Provides fast access to unicode character properties. Uses [unicode-trie](https://github.com/devongovett/unicode-trie) to compress the
properties for all code points into just 12KB.

## Usage

```js
import unicode from '@chr33s/unicode-properties';

unicode.getCategory('2'.charCodeAt()) //=> 'Nd'
unicode.getNumericValue('2'.charCodeAt()) //=> 2
```

## Installation
### NPM Module
To install the latest stable version:
```bash
# With npm
npm install --save @chr33s/unicode-properties

# With yarn
yarn add  @chr33s/unicode-properties
```
This assumes you're using [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/lang/en/) as your package manager.

### UMD Module
You can also download `@chr33s/unicode-properties` as a UMD module from [unpkg](https://unpkg.com/#/). The UMD builds have been compiled to ES5, so they should work [in any modern browser](https://caniuse.com/#feat=es5). UMD builds are useful if you aren't using a package manager or module bundler. For example, you can use them directly in the `<script>` tag of an HTML page.

The following builds are available:

* https://unpkg.com/@chr33s/unicode-properties/dist/unicode-properties.js
* https://unpkg.com/@chr33s/unicode-properties/dist/unicode-properties.min.js

When using a UMD build, you will have access to a global `window.UnicodeProperties` variable. This variable contains the object exported by `@chr33s/unicode-properties`. For example:

```javascript
// NPM module
import unicode from '@chr33s/unicode-properties';

// UMD module
var unicode = window.UnicodeProperties;
```

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
