# Release Process

This document describes the process used to release a new version of pdf-lib. It serves as a useful reference for maintainers when they release a new version. Users and contributors may also find it useful to understand the process.

## Checklist

1. Run `git checkout master && git pull`
2. Update version number in `package.json`
3. Run `rm -rf node_modules && npm run install`
4. Run `npm run release:prep`
5. Run integration tests:
   - Run `npm run apps:node 'Preview'`
   - Run `npm run apps:node 'Adobe Acrobat'`
   - Run `npm run apps:deno 'Foxit Reader'`
   - Run `npm run apps:web:mac` and test in Firefox
   - Run `npm run apps:web:mac` and test in Chrome
   - Run `npm run apps:web:mac` and test in Safari
   - Run `npm run apps:rn:ios`
   - Run `npm run apps:rn:android`
6. Run `git commit -am 'Bump version to X.Y.Z'`
7. Run `npm run release:next` or `npm run release:latest`
8. If you used `release:latest`:
   - Edit the [release notes](https://github.com/Hopding/pdf-lib/releases)
   - Attach the release's `.tgz`
