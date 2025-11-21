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
      ubuntu_r: readFile("fonts/ubuntu/Ubuntu-R.ttf"),
      ubuntu_r_base64: String(readFile("fonts/ubuntu/Ubuntu-R.ttf.base64")),
      bio_rhyme_r: readFile("fonts/bio_rhyme/BioRhymeExpanded-Regular.ttf"),
      press_start_2p_r: readFile(
        "fonts/press_start_2p/PressStart2P-Regular.ttf",
      ),
      indie_flower_r: readFile("fonts/indie_flower/IndieFlower.ttf"),
      great_vibes_r: readFile("fonts/great_vibes/GreatVibes-Regular.ttf"),
      nunito: readFile("fonts/nunito/Nunito-Regular.ttf"),
    },
    otf: {
      fantasque_sans_mono_bi: readFile(
        "fonts/fantasque/OTF/FantasqueSansMono-BoldItalic.otf",
      ),
      apple_storm_r: readFile("fonts/apple_storm/AppleStormCBo.otf"),
      hussar_3d_r: readFile("fonts/hussar_3d/Hussar3DFour.otf"),
      source_hans_jp: readFile(
        "fonts/source_hans_jp/SourceHanSerifJP-Regular.otf",
      ),
    },
  },
  images: {
    jpg: {
      cat_riding_unicorn: readFile("images/cat_riding_unicorn.jpg"),
      cat_riding_unicorn_base64: String(
        readFile("images/cat_riding_unicorn.jpg.base64"),
      ),
      minions_laughing: readFile("images/minions_laughing.jpg"),
      cmyk_colorspace: readFile("images/cmyk_colorspace.jpg"),
    },
    png: {
      greyscale_bird: readFile("images/greyscale_bird.png"),
      greyscale_bird_base64_uri: String(
        readFile("images/greyscale_bird.png.base64.uri"),
      ),
      minions_banana_alpha: readFile("images/minions_banana_alpha.png"),
      minions_banana_no_alpha: readFile("images/minions_banana_no_alpha.png"),
      small_mario: readFile("images/small_mario.png"),
      etwe: readFile("images/etwe.png"),
      self_drive: readFile("images/self_drive.png"),
      mario_emblem: readFile("images/mario_emblem.png"),
    },
  },
  pdfs: {
    normal: readFile("pdfs/normal.pdf"),
    normal_base64: String(readFile("pdfs/normal.pdf.base64")),
    with_update_sections: readFile("pdfs/with_update_sections.pdf"),
    with_update_sections_base64_uri: String(
      readFile("pdfs/with_update_sections.pdf.base64.uri"),
    ),
    linearized_with_object_streams: readFile(
      "pdfs/linearized_with_object_streams.pdf",
    ),
    with_large_page_count: readFile("pdfs/with_large_page_count.pdf"),
    with_missing_endstream_eol_and_polluted_ctm: readFile(
      "pdfs/with_missing_endstream_eol_and_polluted_ctm.pdf",
    ),
    with_newline_whitespace_in_indirect_object_numbers: readFile(
      "pdfs/with_newline_whitespace_in_indirect_object_numbers.pdf",
    ),
    with_comments: readFile("pdfs/with_comments.pdf"),
    with_cropbox: readFile("pdfs/with_cropbox.pdf"),
    us_constitution: readFile("pdfs/us_constitution.pdf"),
    simple_pdf_2_example: readFile(
      "pdfs/pdf20examples/Simple PDF 2.0 file.pdf",
    ),
    with_combed_fields: readFile("pdfs/with_combed_fields.pdf"),
    dod_character: readFile("pdfs/dod_character.pdf"),
    with_xfa_fields: readFile("pdfs/with_xfa_fields.pdf"),
    fancy_fields: readFile("pdfs/fancy_fields.pdf"),
    form_to_flatten: readFile("pdfs/form_to_flatten.pdf"),
    with_annots: readFile("pdfs/with_annots.pdf"),
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
