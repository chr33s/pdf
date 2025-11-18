# Purpose of this Fork
This project is a fork of https://github.com/foliojs/brotli.js created for use in https://github.com/Hopding/pdf-lib.

Listed below are changes that have been made in this fork:

* Removed unused imports of the `fs` module
  * [cd0984d#2d28deb](https://github.com/Hopding/brotli.js/commit/cd0984d7debbfc3e68a1330cbbdce43f89562d3a#diff-2d28debfa8437e92c4c28e7c28e54ec1L2)
* Always import the compressed dictionary data, whether in node or the browser
  * [cd0984d#c81cbd3](https://github.com/Hopding/brotli.js/commit/cd0984d7debbfc3e68a1330cbbdce43f89562d3a#diff-c81cbd3b2324d056c65f99b22ce700cfR18)
  * [2a62381#b9cfc7f](https://github.com/Hopding/brotli.js/commit/2a623817f6bd8d1f7f528f69ac8ce8067b3383fb#diff-b9cfc7f2cdf78a7f4b91a753d10865a2L28)
* Removed circular dependency so module can be bundled with rollup
  * [0350970#a60c93c](https://github.com/Hopding/brotli.js/commit/0350970de946950ce47c1948913827931d88fc11#diff-a60c93c22e22541b9a682c371e7ab9caR938)
  * [0350970#2d28deb](https://github.com/Hopding/brotli.js/commit/0350970de946950ce47c1948913827931d88fc11#diff-2d28debfa8437e92c4c28e7c28e54ec1R10)
  * [0350970#c81cbd3](https://github.com/Hopding/brotli.js/commit/0350970de946950ce47c1948913827931d88fc11#diff-c81cbd3b2324d056c65f99b22ce700cfR19)
* Released to NPM as `@chr33s/brotli.js`
  * [130cea7](https://github.com/Hopding/brotli.js/commit/130cea7ebf011608946f35294863a557220680df)

Also see
* https://github.com/Hopding/fontkit
* https://github.com/Hopding/unicode-properties
* https://github.com/Hopding/restructure
* https://github.com/Hopding/png-ts

# Brotli.js

Brotli.js is port of the [Brotli](http://tools.ietf.org/html/draft-alakuijala-brotli-01) compression algorithm (as used in the [WOFF2](http://www.w3.org/TR/WOFF2/) font format) to JavaScript. The decompressor is hand ported, and the compressor is ported with Emscripten.  The original C++ source code can be found [here](http://github.com/google/brotli).

## Installation
### NPM Module
To install the latest stable version:
```bash
# With npm
npm install --save @chr33sbrotli.js

# With yarn
yarn add @chr33s/brotli.js
```
This assumes you're using [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/lang/en/) as your package manager.

### UMD Module
You can build this fork using [Rollup](https://rollupjs.org/guide/en) for use in the browser, or other JS environments, if you are not using a package manager.


## Importing
In node, or in browserify, you can load brotli in the standard way:

```js
// ES6
import brotli from 'brotli';

// CommonJS
const brotli = require('brotli');
```

You can also import just the `decompress` of `compress` functions. For example, here's how you'd import just the `decompress` function.

```js
// ES6
import decompress from 'brotli/decompress';

// CommonJS
const decompress = require('brotli/decompress');
```

## API

### brotli.decompress(buffer, [outSize])

Decompresses the given buffer to produce the original input to the compressor.
The `outSize` parameter is optional, and will be computed by the decompressor
if not provided. Inside a WOFF2 file, this can be computed from the WOFF2 directory.

```javascript
// decode a buffer where the output size is known
brotli.decompress(compressedData, uncompressedLength);

// decode a buffer where the output size is not known
brotli.decompress(fs.readFileSync('compressed.bin'));
```

### brotli.compress(buffer, isText = false)

Compresses the given buffer. Pass optional parameters as the second argument.

```javascript
// encode a buffer of binary data
brotli.compress(fs.readFileSync('myfile.bin'));

// encode some data with options (default options shown)
brotli.compress(fs.readFileSync('myfile.bin'), {
  mode: 0, // 0 = generic, 1 = text, 2 = font (WOFF2)
  quality: 11, // 0 - 11
  lgwin: 22 // window size
});
```

## License
[MIT](https://choosealicense.com/licenses/mit/)
