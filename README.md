# Monorepo of Modern ESM only pdf-lib & dependency tree

- [@chr33s/brotli](./packages/brotli/)
- [@chr33s/font-kit](./packages/fontkit/)
- [@chr33s/pdf-lib](./packages/pdf-lib/)
- [@chr33s/restructure](./packages/restructure/)
- [@chr33s/standard-fonts](./packages/standard-fonts/)
- [@chr33s/unicode-properties](./packages/unicode-properties/)
- [@chr33s/upng](./packages/upng/)

## TODO

- [ ] migrate to monorepo

- [@chr33s/codepoints](./packages/codepoints)
- [@chr33s/tiny-inflate](./packages/tiny-inflate)
- [@chr33s/unicode-trie](./packages/unicode-trie)
- [@chr33s/dfa](./packages/dfa)

- [ ] replace *Sync() -> promises (e.g. readFileSync())
- [ ] Audit dependencies

npm rm node-html-better-parser && npm i -S node-html-parser
crypto-js -> crypto.subtle
deep-equal -> fast-deep-equal

- [ ] remove @ts-nocheck
- [ ] ensure [scripts,test] are typechecked

## Notes

Monorepo migration

```sh
git remote add codepoints https://github.com/foliojs/codepoints
git fetch codepoints
git merge --allow-unrelated-histories codepoints/master
git mv ...
```
