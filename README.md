# Monorepo of Modern ESM only pdf-lib & dependency tree

- [@chr33s/brotli](./packages/brotli/)
- [@chr33s/codepoints](./packages/codepoints/)
- [@chr33s/dfa](./packages/dfa/)
- [@chr33s/font-kit](./packages/fontkit/)
- [@chr33s/pdf](./packages/pdf/)
- [@chr33s/restructure](./packages/restructure/)
- [@chr33s/standard-fonts](./packages/standard-fonts/)
- [@chr33s/tiny-inflate](./packages/tiny-inflate/)
- [@chr33s/unicode-properties](./packages/unicode-properties/)
- [@chr33s/unicode-trie](./packages/unicode-trie/)
- [@chr33s/upng](./packages/upng/)

## TODO

- [ ] update packages/*/packages.json from #main,#types to use the modern exports {}
- [ ] tsdown esm .min version for packages/[fontkit,pdf] as exports#browser and use in apps/*
- [ ] Audit dependencies

node-html-better-parser -> node-html-parser
crypto-js -> crypto.subtle
deep-equal -> fast-deep-equal
tiny-inflate -> pako | fflate
pako -> fflate | DecompressionStream (!support:react-native)
brotli -> https://github.com/google/brotli/blob/master/js/

## Notes

Monorepo migration

```sh
git remote add unicode-trie https://github.com/foliojs/unicode-trie
git fetch unicode-trie
git merge --allow-unrelated-histories unicode-trie/master
git mv ...
```

```sh
npm -ws --if-present run test
```

```sh
cd packages/brotli/vendor/brotli
git fetch --tags
git checkout v1.2.0 
```
