# @chr33s/pdf-unicode-trie

> A data structure for fast Unicode character metadata lookup, ported from ICU.

`@chr33s/pdf-unicode-trie` lives in the [`chr33s/pdf`](https://github.com/chr33s/pdf) monorepo and provides native ES modules with TypeScript declarations.

## Background

When implementing many Unicode algorithms such as text segmentation,
normalization, bidi processing, etc., fast access to character metadata
is crucial to good performance.  There over a million code points in the
Unicode standard, many of which produce the same result when looked up,
so an array or hash table is not appropriate - those data structures are
fast but would require a lot of memory.  The data is generally
grouped in ranges, so you could do a binary search, but that is not
fast enough for some applications.

The [International Components for Unicode](http://site.icu-project.org) (ICU) project
came up with a data structure based on a [Trie](http://en.wikipedia.org/wiki/Trie) that provides fast access
to Unicode metadata.  The range data is precompiled to a serialized
and flattened trie, which is then used at runtime to lookup the necessary
data.  According to my own tests, this is generally at least 50% faster
than binary search, with not too much additional memory required.

## Installation

    npm install @chr33s/pdf-unicode-trie

## Building a Trie

Unicode Tries are generally precompiled from data in the Unicode database
for faster runtime performance.  To build a Unicode Trie, use the
`UnicodeTrieBuilder` class.

```js
import { writeFileSync } from "node:fs";
import { builder as UnicodeTrieBuilder } from "@chr33s/pdf-unicode-trie";

// create a trie
let builder = new UnicodeTrieBuilder();

// optional parameters for default value, and error value
// if not provided, both are set to 0
builder = new UnicodeTrieBuilder(10, 999);

// set individual values and ranges
builder.set(0x4567, 99);
builder.setRange(0x40, 0xe7, 0x1234);

// you can lookup a value if you like
builder.get(0x4567); // => 99

// get a compiled trie (returns a UnicodeTrie object)
const trie = builder.freeze();

// write compressed trie to a binary file
writeFileSync("data.trie", builder.toBuffer());
```

## Using a precompiled Trie

Once you've built a precompiled trie, you can load it into the
`UnicodeTrie` class, which is a readonly representation of the
trie.  From there, you can lookup values.

```js
import { readFileSync } from "node:fs";
import UnicodeTrie from "@chr33s/pdf-unicode-trie";

// load serialized trie from binary file
const data = readFileSync("data.trie");
const trie = new UnicodeTrie(data);

// lookup a value
trie.get(0x4567); // => 99
```

## License

MIT
