# @chr33s/upng

> Small, fast, and modernized PNG/APNG encoder and decoder for the `@chr33s/pdf` ecosystem.

This package wraps the excellent [`UPNG.js`](https://github.com/photopea/UPNG.js) library and keeps it maintained and
published for `@chr33s/pdf-lib` and related tools. Key differences from upstream distributions include:

- native ES module output targeting NodeNext (Node.js 18+ or a modern bundler required),
- TypeScript source with generated declaration files bundled in the package, and
- continuous maintenance inside the [`chr33s/pdf`](https://github.com/chr33s/pdf) monorepo alongside other PDF
dependencies.

## Example of `UPNG.toRGBA8`
```ts
import UPNG from "@chr33s/upng";

const pngImage = UPNG.decode(/* Uint8Array containing bytes of PNG image */);

// `pixels` is a 1D array (in RGBA order) of decoded pixel data
const pixels = UPNG.toRGBA8(pngImage)[0];
```

## Installation

```bash
# npm
npm install @chr33s/upng

# pnpm
pnpm add @chr33s/upng

# yarn
yarn add @chr33s/upng
```

Package consumers should run on Node.js 18+ or enable NodeNext-compatible module resolution in their bundler configuration.


## Encoder

UPNG.js supports APNG and the interface expects "frames". Regular PNG is just a single-frame animation (single-item array).

#### `UPNG.encode(imgs, w, h, cnum, [dels])`
* `imgs`: array of frames. A frame is an ArrayBuffer containing the pixel data (RGBA, 8 bits per channel)
* `w`, `h` : width and height of the image
* `cnum`: number of colors in the result;  0: all colors (lossless PNG)
* `dels`: array of millisecond delays for each frame (only when 2 or more frames)
* returns an ArrayBuffer with binary data of a PNG file

UPNG.js can do a lossy minification of PNG files, similar to [TinyPNG](https://tinypng.com/) and other tools. It performed quantization with [k-means algorithm](https://en.wikipedia.org/wiki/K-means_clustering) in the past, but now we use [K-d trees](https://en.wikipedia.org/wiki/K-d_tree).

Lossy compression is allowed by the last parameter `cnum`. Set it to zero for a lossless compression, or write the number of allowed colors in the image. Smaller values produce smaller files. **Or just use 0 for lossless / 256 for lossy.**

    // Read RGBA from canvas and encode with UPNG
    var dta = ctx.getImageData(0,0,200,300).data;  // ctx is Context2D of a Canvas
    //  dta = new Uint8Array(200 * 300 * 4);       // or generate pixels manually
    var png = UPNG.encode([dta.buffer], 200, 300, 0);   console.log(new Uint8Array(png));

#### `UPNG.encodeLL(imgs, w, h, cc, ac, depth, [dels])` - low-level encode
* `imgs`: array of frames. A frame is an ArrayBuffer containing the pixel data (corresponding to following parameters)
* `w`, `h` : width and height of the image
* `cc`, `ac`: number of color channels (1 or 3) and alpha channels (0 or 1)
* `depth`: bit depth of pixel data (1, 2, 4, 8, 16)
* `dels`: array of millisecond delays for each frame (only when 2 or more frames)
* returns an ArrayBuffer with binary data of a PNG file

This function does not do any optimizations, it just stores what you give it. There are two cases when it is useful:
* saving 16-bit colors (note, that PNG is big-endian, unlike Uint16Array in JS)
* your image is too large, and "expanding" to 8-bit RGBA would use too much memory (e.g. 4-bit grayscale 50,000 x 50,000 = 1.25 GB, 8-bit RGBA would be 10 GB)

## Decoder

Supports all color types (including Grayscale and Palettes), all channel depths (1, 2, 4, 8, 16), interlaced images etc. Opens PNGs which other libraries can not open (tested with [PngSuite](http://www.schaik.com/pngsuite/)).

#### `UPNG.decode(buffer)`
* `buffer`: ArrayBuffer containing the PNG file
* returns an image object with following properties:
* * `width`: the width of the image
* * `height`: the height of the image
* * `depth`: number of bits per channel
* * `ctype`: color type of the file (Truecolor, Grayscale, Palette ...)
* * `frames`: additional info about frames (frame delays etc.)
* * `tabs`: additional chunks of the PNG file
* * `data`: pixel data of the image

PNG files may have a various number of channels and a various color depth. The interpretation of `data` depends on the current color type and color depth (see the [PNG specification](https://www.w3.org/TR/PNG/)).

#### `UPNG.toRGBA8(img)`
* `img`: PNG image object (returned by UPNG.decode())
* returns an array of frames. A frame is ArrayBuffer of the image in RGBA format, 8 bits per channel.

### Example
    var img  = UPNG.decode(buff);        // put ArrayBuffer of the PNG file into UPNG.decode
    var rgba = UPNG.toRGBA8(img)[0];     // UPNG.toRGBA8 returns array of frames, size: width * height * 4 bytes.

PNG format uses the Inflate algorithm. Right now, UPNG.js calls [Pako.js](https://github.com/nodeca/pako) for the Inflate and Deflate method.

## Quantizer

UPNG.js contains a very good Quantizer of 4-component 8-bit vectors (i.e. pixels). It can be used to generate nice color palettes (e.g. Photopea uses UPNG.js to make palettes for GIF images).

Quantization consists of two important steps: Finding a nice palette and Finding the closest color in the palette for each sample (non-trivial for large palettes). UPNG perfroms both steps.

    var res  = UPNG.quantize(data, psize);

* `data`: ArrayBuffer of samples (byte length is a multiple of four)
* `psize` : Palette size (how many colors you want to have)

The result object "res" has following properties:

* `abuf`: ArrayBuffer corresponding to `data`, where colors are remapped by a palette
* `inds`: Uint8Array : the index of a color for each sample (only when `psize`<=256)
* `plte`: Array : the Palette - a list of colors, `plte[i].est.q` and `plte[i].est.rgba` is the color value

### FAQ

- To get one common palette for multiple images (e.g. frames of the animation), concatenate them into one array `data`.
- When working with less than four components, set the remaining components to a constant value (e.g. to zero)
- When working with transparency, premultiply color components by transparency (otherwise, rgba(1,1,1,0) would be closer to rgba(1,1,1,1) than to rgba(0,0,0,0) - transparent mapped to white instead of transparent)
