#!/usr/bin/env node
/**
 * Post-process TypeDoc output to rename files with PascalCase directory prefixes.
 * Converts @chr33s.packagename.Type.Name.md -> Packagename.Type.Name.md
 */

import { readdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DOCS_DIR = "./docs";

// Map package names to PascalCase
const packageNameMap = {
  brotli: "Brotli",
  codepoints: "Codepoints",
  compression: "Compression",
  crypto: "Crypto",
  dfa: "Dfa",
  fontkit: "Fontkit",
  pdf: "Pdf",
  restructure: "Restructure",
  "standard-fonts": "StandardFonts",
  "unicode-properties": "UnicodeProperties",
  "unicode-trie": "UnicodeTrie",
  upng: "Upng",
};

async function main() {
  const files = await readdir(DOCS_DIR);
  const renames = new Map();

  // First pass: build rename map
  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    // Match @chr33s.packagename.rest pattern
    const match = file.match(/^@chr33s\.([^.]+)\.(.+)$/);
    if (match) {
      const [, pkgName, rest] = match;
      const pascalPkg = packageNameMap[pkgName];
      if (pascalPkg) {
        const newName = `${pascalPkg}.${rest}`;
        renames.set(file, newName);
      }
    } else if (file.match(/^@chr33s\.([^.]+)\.md$/)) {
      // Package index files like @chr33s.pdf.md -> Pdf.md
      const match = file.match(/^@chr33s\.([^.]+)\.md$/);
      if (match) {
        const pkgName = match[1];
        const pascalPkg = packageNameMap[pkgName];
        if (pascalPkg) {
          renames.set(file, `${pascalPkg}.md`);
        }
      }
    }
  }

  // Second pass: update links in all files
  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const filePath = join(DOCS_DIR, file);
    let content = await readFile(filePath, "utf-8");
    let modified = false;

    // Replace all @chr33s.xxx references with PascalCase versions
    for (const [oldName, newName] of renames) {
      const oldBase = oldName.replace(/\.md$/, "");
      const newBase = newName.replace(/\.md$/, "");

      // Replace in wiki links: ../wiki/@chr33s.xxx -> ../wiki/Xxx
      const wikiRegex = new RegExp(`\\.\\./wiki/${oldBase.replace(/\./g, "\\.")}`, "g");
      if (wikiRegex.test(content)) {
        content = content.replace(wikiRegex, `../wiki/${newBase}`);
        modified = true;
      }

      // Replace direct references
      const directRegex = new RegExp(`\\(${oldBase.replace(/\./g, "\\.")}\\)`, "g");
      if (directRegex.test(content)) {
        content = content.replace(directRegex, `(${newBase})`);
        modified = true;
      }
    }

    if (modified) {
      await writeFile(filePath, content);
    }
  }

  // Third pass: rename files
  for (const [oldName, newName] of renames) {
    await rename(join(DOCS_DIR, oldName), join(DOCS_DIR, newName));
    console.log(`${oldName} -> ${newName}`);
  }

  // Update Home.md and _Sidebar.md
  for (const indexFile of ["Home.md", "_Sidebar.md"]) {
    const filePath = join(DOCS_DIR, indexFile);
    let content = await readFile(filePath, "utf-8");

    for (const [oldName, newName] of renames) {
      const oldBase = oldName.replace(/\.md$/, "");
      const newBase = newName.replace(/\.md$/, "");
      content = content.replaceAll(oldBase, newBase);
    }

    await writeFile(filePath, content);
  }

  console.log(`\nRenamed ${renames.size} files`);
}

main().catch(console.error);
