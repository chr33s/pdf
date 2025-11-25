import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import { sep } from "node:path";
import readline from "node:readline";

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

// This needs to be more sophisticated to work on Linux as well.
const openPdf = (path: string, _reader?: string) => {
  if (process.platform === "darwin") {
    execSync(`open -a "${_reader || "Preview"}" '${path}'`);
    // execSync(`open -a "Preview" '${path}'`);
    // execSync(`open -a "Adobe Acrobat" '${path}'`);
    // execSync(`open -a "Foxit Reader" '${path}'`);
    // execSync(`open -a "Google Chrome" '${path}'`);
    // execSync(`open -a "Firefox" '${path}'`);
  } else if (process.platform === "win32") {
    // Opens with the default PDF Reader, has room for improvement
    execSync(`start ${path}`);
  } else if (process.platform === "linux") {
    execSync(`xdg-open ${path}`);
  } else {
    console.warn(
      `No script found for ${process.platform} platform. Please report this.`,
    );
  }
};

const writePdfToTmp = (pdf: Uint8Array) => {
  const path = `${os.tmpdir()}${sep}${Date.now()}.pdf`;
  fs.writeFileSync(path, pdf);
  return path;
};

const readFile = (path: string) => fs.readFileSync(`../../assets/${path}`);

const assets = {
  fonts: {
    ttf: {
      "ubuntu-r": readFile("fonts/ubuntu/ubuntu-r.ttf"),
      "ubuntu-r_base64": String(readFile("fonts/ubuntu/ubuntu-r.ttf.base64")),
      "bio-rhyme-r": readFile("fonts/bio-rhyme/bio-rhyme-expanded-regular.ttf"),
      "press-start-2p-regular": readFile(
        "fonts/press-start-2p/press-start-2p-regular.ttf",
      ),
      "indie-flower": readFile("fonts/indie-flower/indie-flower.ttf"),
      "great-vibes-regular": readFile(
        "fonts/great-vibes/great-vibes-regular.ttf",
      ),
      "nunito-regular": readFile("fonts/nunito/nunito-regular.ttf"),
    },
    otf: {
      "fantasque-sans-mono_bi": readFile(
        "fonts/fantasque/otf/fantasque-sans-mono-bold-italic.otf",
      ),
      "apple-storm_r": readFile("fonts/apple-storm/apple-storm-c-bo.otf"),
      "hussar-3d_r": readFile("fonts/hussar-3d/hussar-3d-four.otf"),
      "source-hans-jp": readFile(
        "fonts/source-hans-jp/source-han-serif-jp-regular.otf",
      ),
    },
  },
  images: {
    jpg: {
      "cat-riding-unicorn": readFile("images/cat-riding-unicorn.jpg"),
      "cat-riding-unicorn_base64": String(
        readFile("images/cat-riding-unicorn.jpg.base64"),
      ),
      "minions-laughing": readFile("images/minions-laughing.jpg"),
      "cmyk-colorspace": readFile("images/cmyk-colorspace.jpg"),
    },
    png: {
      "greyscale-bird": readFile("images/greyscale-bird.png"),
      "greyscale-bird_base64_uri": String(
        readFile("images/greyscale-bird.png.base64.uri"),
      ),
      "minions-banana_alpha": readFile("images/minions-banana-alpha.png"),
      "minions-banana_no_alpha": readFile("images/minions-banana-no-alpha.png"),
      "small-mario": readFile("images/small-mario.png"),
      etwe: readFile("images/etwe.png"),
      "self-drive": readFile("images/self-drive.png"),
      "mario-emblem": readFile("images/mario-emblem.png"),
    },
  },
  pdfs: {
    normal: readFile("pdfs/normal.pdf"),
    normal_base64: String(readFile("pdfs/normal.pdf.base64")),
    with_update_sections: readFile("pdfs/with-update-sections.pdf"),
    with_update_sections_base64_uri: String(
      readFile("pdfs/with-update-sections.pdf.base64.uri"),
    ),
    linearized_with_object_streams: readFile(
      "pdfs/linearized-with-object-streams.pdf",
    ),
    with_large_page_count: readFile("pdfs/with-large-page-count.pdf"),
    with_missing_endstream_eol_and_polluted_ctm: readFile(
      "pdfs/with_missing_endstream_eol_and_polluted_ctm.pdf",
    ),
    with_newline_whitespace_in_indirect_object_numbers: readFile(
      "pdfs/with_newline_whitespace_in_indirect_object_numbers.pdf",
    ),
    with_comments: readFile("pdfs/with-comments.pdf"),
    with_cropbox: readFile("pdfs/with-cropbox.pdf"),
    "us-constitution": readFile("pdfs/us-constitution.pdf"),
    simple_pdf_2_example: readFile(
      "pdfs/pdf20examples/simple-p-d-f-2.0-file.pdf",
    ),
    with_combed_fields: readFile("pdfs/with-combed-fields.pdf"),
    dod_character: readFile("pdfs/dod-character.pdf"),
    with_xfa_fields: readFile("pdfs/with-xfa-fields.pdf"),
    fancy_fields: readFile("pdfs/fancy-fields.pdf"),
    form_to_flatten: readFile("pdfs/form-to-flatten.pdf"),
    with_annots: readFile("pdfs/with-annots.pdf"),
  },
};

export type Assets = typeof assets;

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
      const path = writePdfToTmp(pdfBytes);
      console.log(`> PDF file written to: ${path}`);

      openPdf(path, reader);
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
