import { SEP, dirname } from "https://deno.land/std@0.212.0/path/mod.ts";
import { TextLineStream } from "https://deno.land/std@0.212.0/streams/text_line_stream.ts";

import { default as test1 } from "./tests/test1.ts";
import { default as test10 } from "./tests/test10.ts";
import { default as test11 } from "./tests/test11.ts";
import { default as test12 } from "./tests/test12.ts";
import { default as test13 } from "./tests/test13.ts";
import { default as test14 } from "./tests/test14.ts";
import { default as test15 } from "./tests/test15.ts";
import { default as test16 } from "./tests/test16.ts";
import { default as test17 } from "./tests/test17.ts";
import { default as test18 } from "./tests/test18.ts";
import { default as test2 } from "./tests/test2.ts";
import { default as test3 } from "./tests/test3.ts";
import { default as test4 } from "./tests/test4.ts";
import { default as test5 } from "./tests/test5.ts";
import { default as test6 } from "./tests/test6.ts";
import { default as test7 } from "./tests/test7.ts";
import { default as test8 } from "./tests/test8.ts";
import { default as test9 } from "./tests/test9.ts";

const textEncoder = new TextEncoder();
const stdinLineStream = Deno.stdin.readable
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new TextLineStream());
const stdinLineIterator = (stdinLineStream as unknown as AsyncIterable<string>)[
  Symbol.asyncIterator
]();

const promptToContinue = () => {
  const prompt = "Press <enter> to run the next test...";
  Deno.stdout.write(textEncoder.encode(prompt));
  return stdinLineIterator.next();
};

// This needs to be more sophisticated to work on Linux as well.
const openPdf = (path: string, reader: string = "") => {
  const runCommand = (command: string, args: string[]) => {
    const cmd = new Deno.Command(command, {
      args,
      stdin: "null",
      stdout: "null",
      stderr: "null",
    });
    void cmd.spawn();
  };

  if (Deno.build.os === "darwin") {
    runCommand("open", ["-a", reader || "Preview", path]);
    // Deno.run({ cmd: ['open', '-a', 'Preview', path] });
    // Deno.run({ cmd: ['open', '-a', 'Adobe Acrobat', path] });
    // Deno.run({ cmd: ['open', '-a', 'Foxit Reader', path] });
    // Deno.run({ cmd: ['open', '-a', 'Google Chrome', path] });
    // Deno.run({ cmd: ['open', '-a', 'Firefox', path] });
  } else if (Deno.build.os === "windows") {
    // Opens with the default PDF Reader, has room for improvment
    runCommand("cmd", ["/c", "start", "", path]);
  } else {
    const msg1 =
      "Note: Automatically opening PDFs currently only works on Macs and Windows. If you're using a Linux machine, please consider contributing to expand support for this feature";
    const msg2 =
      "(https://github.com/Hopding/pdf-lib/blob/master/apps/node/index.ts#L8-L17)\n";
    console.warn(msg1);
    console.warn(msg2);
  }
};

const tempDir = () => dirname(Deno.makeTempDirSync());

const writePdfToTmp = (pdf: Uint8Array) => {
  const path = `${tempDir()}${SEP}${Date.now()}.pdf`;
  Deno.writeFileSync(path, pdf);
  return path;
};

const readFile = (file: string) => Deno.readFileSync(`../../assets/${file}`);

const decoder = new TextDecoder("utf-8");
const readBase64Font = (font: string) => decoder.decode(readFile(font));
const readBase64Image = (image: string) => decoder.decode(readFile(image));
const readBase64Pdf = (pdf: string) => decoder.decode(readFile(pdf));

const assets = {
  fonts: {
    ttf: {
      ubuntu_r: readFile("ubuntu-r.ttf"),
      ubuntu_r_base64: readBase64Font("ubuntu-R.ttf.base64"),
      "bio-rhyme_r": readFile("bio-rhyme-expanded-regular.ttf"),
      "press-start-2p_r": readFile("press-start-2p-regular.ttf"),
      "indie-flower_r": readFile("indie-flower.ttf"),
      "great-vibes_r": readFile("great-vibes-regular.ttf"),
      nunito: readFile("nunito-regular.ttf"),
    },
    otf: {
      "fantasque-sans-mono_bi": readFile("fantasque-sans-mono-bold-italic.otf"),
      "apple-storm_r": readFile("apple-storm-c-bo.otf"),
      "hussar-3d_r": readFile("hussar-3d-four.otf"),
      "source-hans-jp": readFile("source-han-serif-jp-regular.otf"),
    },
  },
  images: {
    jpg: {
      "cat-riding-unicorn": readFile("cat-riding-unicorn.jpg"),
      "cat-riding-unicorn_base64": readBase64Image(
        "cat-riding-unicorn.jpg.base64",
      ),
      "minions-laughing": readFile("minions-laughing.jpg"),
      "cmyk-colorspace": readFile("cmyk-colorspace.jpg"),
    },
    png: {
      "greyscale-bird": readFile("greyscale-bird.png"),
      "greyscale-bird_base64_uri": readBase64Image(
        "greyscale-bird.png.base64.uri",
      ),
      "minions-banana_alpha": readFile("minions-banana-alpha.png"),
      "minions-banana_no_alpha": readFile("minions-banana-no-alpha.png"),
      "small-mario": readFile("small-mario.png"),
      etwe: readFile("etwe.png"),
      "self-drive": readFile("self-drive.png"),
      "mario-emblem": readFile("mario-emblem.png"),
    },
  },
  pdfs: {
    normal: readFile("normal.pdf"),
    normal_base64: readBase64Pdf("normal.pdf.base64"),
    with_update_sections: readFile("with-update-sections.pdf"),
    with_update_sections_base64_uri: readBase64Pdf(
      "with_update_sections.pdf.base64.uri",
    ),
    linearized_with_object_streams: readFile(
      "linearized-with-object-streams.pdf",
    ),
    with_large_page_count: readFile("with-large-page-count.pdf"),
    with_missing_endstream_eol_and_polluted_ctm: readFile(
      "with_missing_endstream_eol_and_polluted_ctm.pdf",
    ),
    with_newline_whitespace_in_indirect_object_numbers: readFile(
      "with_newline_whitespace_in_indirect_object_numbers.pdf",
    ),
    with_comments: readFile("with-comments.pdf"),
    with_cropbox: readFile("with-cropbox.pdf"),
    "us-constitution": readFile("us-constitution.pdf"),
    simple_pdf_2_example: readFile("pdf20examples/simple-p-d-f-2.0-file.pdf"),
    with_combed_fields: readFile("with-combed-fields.pdf"),
    dod_character: readFile("dod-character.pdf"),
    with_xfa_fields: readFile("with-xfa-fields.pdf"),
    fancy_fields: readFile("fancy-fields.pdf"),
    form_to_flatten: readFile("form-to-flatten.pdf"),
    with_annots: readFile("with-annots.pdf"),
  },
};

export type Assets = typeof assets;
// export type Assets = any;

// This script can be executed with 0, 1, or 2 CLI arguments:
//   $ deno index.ts
//   $ deno index.ts 3
//   $ deno index.ts 'Adobe Acrobat'
//   $ deno index.ts 3 'Adobe Acrobat'
const loadCliArgs = (): { testIdx?: number; reader?: string } => {
  const { args } = Deno;

  if (args.length === 0) return {};

  if (args.length === 1) {
    if (isFinite(Number(args[0]))) return { testIdx: Number(args[0]) };
    else return { reader: args[0] };
  }

  return { testIdx: Number(args[0]), reader: args[1] };
};

const main = async () => {
  const { testIdx, reader } = loadCliArgs();

  // prettier-ignore
  const allTests = [
      test1, test2, test3, test4, test5, test6, test7, test8, test9, test10,
      test11, test12, test13, test14, test15, test16, test17, test18
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
};

void main();
