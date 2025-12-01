# Modern ESM only port pdf-lib & dependency tree

- [@chr33s/brotli](./packages/brotli/)
- [@chr33s/codepoints](./packages/codepoints/)
- [@chr33s/compression](./packages/compression/)
- [@chr33s/crypto](./packages/crypto/)
- [@chr33s/dfa](./packages/dfa/)
- [@chr33s/font-kit](./packages/fontkit/)
- [@chr33s/pdf](./packages/pdf/)
- [@chr33s/restructure](./packages/restructure/)
- [@chr33s/standard-fonts](./packages/standard-fonts/)
- [@chr33s/unicode-properties](./packages/unicode-properties/)
- [@chr33s/unicode-trie](./packages/unicode-trie/)
- [@chr33s/upng](./packages/upng/)

## TODO

- [ ] Audit dependencies

node-html-better-parser -> node-html-parser   
deep-equal -> fast-deep-equal   

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
