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

- [ ] move packages/pdf/apps/* -> apps/
- [ ] remove @ts-nocheck
- [ ] Audit dependencies

npm rm node-html-better-parser && npm i -S node-html-parser
crypto-js -> crypto.subtle
deep-equal -> fast-deep-equal
tiny-inflate -> pako

- [ ] add vitest intergration tests for packages/pdf

- Run `npm run apps:node 'Preview'`
- Run `npm run apps:node 'Adobe Acrobat'`
- Run `npm run apps:deno 'Foxit Reader'`
- Run `npm run apps:web:mac` and test in Firefox
- Run `npm run apps:web:mac` and test in Chrome
- Run `npm run apps:web:mac` and test in Safari
- Run `npm run apps:rn:ios`
- Run `npm run apps:rn:android`

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
