import { exec } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import { sep } from "node:path";
import readline from "node:readline";
import { promisify } from "node:util";

import test1 from "./tests/test1.js";
import test10 from "./tests/test10.js";
import test11 from "./tests/test11.js";
import test12 from "./tests/test12.js";
import test13 from "./tests/test13.js";
import test14 from "./tests/test14.js";
import test15 from "./tests/test15.js";
import test16 from "./tests/test16.js";
import test17 from "./tests/test17.js";
import test18 from "./tests/test18.js";
import test2 from "./tests/test2.js";
import test3 from "./tests/test3.js";
import test4 from "./tests/test4.js";
import test5 from "./tests/test5.js";
import test6 from "./tests/test6.js";
import test7 from "./tests/test7.js";
import test8 from "./tests/test8.js";
import test9 from "./tests/test9.js";

const cli = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = "Press <enter> to run the next test...";
const promptToContinue = () =>
  new Promise<void>((resolve) => cli.question(prompt, (_answer) => resolve()));

const execAsync = promisify(exec);

const assetUrl = (path: string) => new URL(`../../assets/${path}`, import.meta.url);
const readBinaryAsset = (path: string) => readFile(assetUrl(path));
const readTextAsset = (path: string) => readFile(assetUrl(path), "utf8");

const loadAssets = async () => ({
  fonts: {
    ttf: {
      "ubuntu-r": await readBinaryAsset("fonts/ubuntu/ubuntu-r.ttf"),
      "ubuntu-r_base64": await readTextAsset("fonts/ubuntu/ubuntu-r.ttf.base64"),
      "bio-rhyme-r": await readBinaryAsset("fonts/bio-rhyme/bio-rhyme-expanded-regular.ttf"),
      "press-start-2p-regular": await readBinaryAsset(
        "fonts/press-start-2p/press-start-2p-regular.ttf",
      ),
      "indie-flower": await readBinaryAsset("fonts/indie-flower/indie-flower.ttf"),
      "great-vibes-regular": await readBinaryAsset("fonts/great-vibes/great-vibes-regular.ttf"),
      "nunito-regular": await readBinaryAsset("fonts/nunito/nunito-regular.ttf"),
    },
    otf: {
      "fantasque-sans-mono_bi": await readBinaryAsset(
        "fonts/fantasque/otf/fantasque-sans-mono-bold-italic.otf",
      ),
      "apple-storm_r": await readBinaryAsset("fonts/apple-storm/apple-storm-c-bo.otf"),
      "hussar-3d_r": await readBinaryAsset("fonts/hussar-3d/hussar-3d-four.otf"),
      "source-hans-jp": await readBinaryAsset(
        "fonts/source-hans-jp/source-han-serif-jp-regular.otf",
      ),
    },
  },
  images: {
    jpg: {
      "cat-riding-unicorn": await readBinaryAsset("images/cat-riding-unicorn.jpg"),
      "cat-riding-unicorn_base64": await readTextAsset("images/cat-riding-unicorn.jpg.base64"),
      "minions-laughing": await readBinaryAsset("images/minions-laughing.jpg"),
      "cmyk-colorspace": await readBinaryAsset("images/cmyk-colorspace.jpg"),
    },
    png: {
      "greyscale-bird": await readBinaryAsset("images/greyscale-bird.png"),
      "greyscale-bird_base64_uri": await readTextAsset("images/greyscale-bird.png.base64.uri"),
      "minions-banana_alpha": await readBinaryAsset("images/minions-banana-alpha.png"),
      "minions-banana_no_alpha": await readBinaryAsset("images/minions-banana-no-alpha.png"),
      "small-mario": await readBinaryAsset("images/small-mario.png"),
      etwe: await readBinaryAsset("images/etwe.png"),
      "self-drive": await readBinaryAsset("images/self-drive.png"),
      "mario-emblem": await readBinaryAsset("images/mario-emblem.png"),
    },
  },
  pdfs: {
    normal: await readBinaryAsset("pdfs/normal.pdf"),
    normal_base64: await readTextAsset("pdfs/normal.pdf.base64"),
    with_update_sections: await readBinaryAsset("pdfs/with-update-sections.pdf"),
    with_update_sections_base64_uri: await readTextAsset(
      "pdfs/with-update-sections.pdf.base64.uri",
    ),
    linearized_with_object_streams: await readBinaryAsset(
      "pdfs/linearized-with-object-streams.pdf",
    ),
    with_large_page_count: await readBinaryAsset("pdfs/with-large-page-count.pdf"),
    with_missing_endstream_eol_and_polluted_ctm: await readBinaryAsset(
      "pdfs/with_missing_endstream_eol_and_polluted_ctm.pdf",
    ),
    with_newline_whitespace_in_indirect_object_numbers: await readBinaryAsset(
      "pdfs/with_newline_whitespace_in_indirect_object_numbers.pdf",
    ),
    with_comments: await readBinaryAsset("pdfs/with-comments.pdf"),
    with_cropbox: await readBinaryAsset("pdfs/with-cropbox.pdf"),
    "us-constitution": await readBinaryAsset("pdfs/us-constitution.pdf"),
    simple_pdf_2_example: await readBinaryAsset("pdfs/pdf20examples/simple-p-d-f-2.0-file.pdf"),
    with_combed_fields: await readBinaryAsset("pdfs/with-combed-fields.pdf"),
    dod_character: await readBinaryAsset("pdfs/dod-character.pdf"),
    with_xfa_fields: await readBinaryAsset("pdfs/with-xfa-fields.pdf"),
    fancy_fields: await readBinaryAsset("pdfs/fancy-fields.pdf"),
    form_to_flatten: await readBinaryAsset("pdfs/form-to-flatten.pdf"),
    with_annots: await readBinaryAsset("pdfs/with-annots.pdf"),
  },
});

const assets = await loadAssets();
export type Assets = typeof assets;

// This needs to be more sophisticated to work on Linux as well.
const openPdf = async (path: string, _reader?: string) => {
  if (process.platform === "darwin") {
    await execAsync(`open -a "${_reader || "Preview"}" '${path}'`);
    // await execAsync(`open -a "Preview" '${path}'`);
    // await execAsync(`open -a "Adobe Acrobat" '${path}'`);
    // await execAsync(`open -a "Foxit Reader" '${path}'`);
    // await execAsync(`open -a "Google Chrome" '${path}'`);
    // await execAsync(`open -a "Firefox" '${path}'`);
  } else if (process.platform === "win32") {
    // Opens with the default PDF Reader, has room for improvement
    await execAsync(`start ${path}`);
  } else if (process.platform === "linux") {
    await execAsync(`xdg-open ${path}`);
  } else {
    console.warn(`No script found for ${process.platform} platform. Please report this.`);
  }
};

const writePdfToTmp = async (pdf: Uint8Array) => {
  const path = `${os.tmpdir()}${sep}${Date.now()}.pdf`;
  await writeFile(path, pdf);
  return path;
};

// This script can be executed with 0, 1, or 2 CLI arguments:
//   $ node index.js
//   $ node index.js 3
//   $ node index.js 'Adobe Acrobat'
//   $ node index.js 3 'Adobe Acrobat'
const loadCliArgs = (): { testIdx?: number; reader?: string } => {
  const [, , ...args] = process.argv;

  if (args.length === 0) return {};

  if (args.length === 1) {
    if (isFinite(Number(args[0]))) return { testIdx: Number(args[0]) };
    else return { reader: args[0] };
  }

  return { testIdx: Number(args[0]), reader: args[1] };
};

const main = async () => {
  try {
    const { testIdx, reader } = loadCliArgs();

    // prettier-ignore
    const allTests = [
      test1, test2, test3, test4, test5, test6, test7, test8, test9, test10,
      test11, test12, test13, test14, test15, test16, test17, test18,
    ];

    const tests = testIdx ? [allTests[testIdx - 1]] : allTests;

    let idx = testIdx || 1;
    for (const test of tests) {
      console.log(`Running test #${idx}`);
      const pdfBytes = await test(assets);
      const path = await writePdfToTmp(pdfBytes);
      console.log(`> PDF file written to: ${path}`);

      await openPdf(path, reader);
      idx += 1;
      await promptToContinue();
      console.log();
    }

    console.log("Done!");
  } finally {
    cli.close();
  }
};

void main();
