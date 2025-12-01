import { env } from "cloudflare:test";

interface Env {
  ASSETS: Fetcher;
}

async function readBinaryAsset(path: string): Promise<Uint8Array> {
  const testEnv = env as Env;
  const response = await testEnv.ASSETS.fetch(`http://assets/${path}`);
  if (!response.ok) {
    throw new Error(`Asset not found: ${path} (${response.status})`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function readTextAsset(path: string): Promise<string> {
  const testEnv = env as Env;
  const response = await testEnv.ASSETS.fetch(`http://assets/${path}`);
  if (!response.ok) {
    throw new Error(`Asset not found: ${path} (${response.status})`);
  }
  return response.text();
}

export const assets = {
  fonts: {
    ttf: {
      ubuntu: () => readBinaryAsset("fonts/ubuntu/ubuntu-r.ttf"),
      ubuntuBase64: () => readTextAsset("fonts/ubuntu/ubuntu-r.ttf.base64"),
      bioRhyme: () => readBinaryAsset("fonts/bio-rhyme/bio-rhyme-expanded-regular.ttf"),
      pressStart2p: () => readBinaryAsset("fonts/press-start-2p/press-start2-p-regular.ttf"),
      indieFlower: () => readBinaryAsset("fonts/indie-flower/indie-flower.ttf"),
      greatVibes: () => readBinaryAsset("fonts/great-vibes/great-vibes-regular.ttf"),
      nunito: () => readBinaryAsset("fonts/nunito/nunito-regular.ttf"),
    },
    otf: {
      fantasque: () => readBinaryAsset("fonts/fantasque/otf/fantasque-sans-mono-bold-italic.otf"),
      appleStorm: () => readBinaryAsset("fonts/apple-storm/apple-storm-c-bo.otf"),
      hussar3d: () => readBinaryAsset("fonts/hussar-3d/hussar3-d-four.otf"),
      sourceHansJp: () => readBinaryAsset("fonts/source-hans-jp/source-han-serif-jp-regular.otf"),
    },
  },
  images: {
    jpg: {
      catRidingUnicorn: () => readBinaryAsset("images/cat-riding-unicorn.jpg"),
      catRidingUnicornBase64: () => readTextAsset("images/cat-riding-unicorn.jpg.base64"),
      minionsLaughing: () => readBinaryAsset("images/minions-laughing.jpg"),
      cmykColorspace: () => readBinaryAsset("images/cmyk-colorspace.jpg"),
    },
    png: {
      greyscaleBird: () => readBinaryAsset("images/greyscale-bird.png"),
      greyscaleBirdBase64Uri: () => readTextAsset("images/greyscale-bird.png.base64.uri"),
      minionsBananaAlpha: () => readBinaryAsset("images/minions-banana-alpha.png"),
      minionsBananaNoAlpha: () => readBinaryAsset("images/minions-banana-no-alpha.png"),
      smallMario: () => readBinaryAsset("images/small-mario.png"),
      etwe: () => readBinaryAsset("images/etwe.png"),
      selfDrive: () => readBinaryAsset("images/self-drive.png"),
      marioEmblem: () => readBinaryAsset("images/mario-emblem.png"),
      pngSuite: (name: string) => readBinaryAsset(`images/pngsuite/${name}`),
    },
  },
  pdfs: {
    normal: () => readBinaryAsset("pdfs/normal.pdf"),
    normalBase64: () => readTextAsset("pdfs/normal.pdf.base64"),
    withUpdateSections: () => readBinaryAsset("pdfs/with-update-sections.pdf"),
    withUpdateSectionsBase64Uri: () => readTextAsset("pdfs/with-update-sections.pdf.base64.uri"),
    linearizedWithObjectStreams: () => readBinaryAsset("pdfs/linearized-with-object-streams.pdf"),
    withLargePageCount: () => readBinaryAsset("pdfs/with-large-page-count.pdf"),
    withMissingEndstreamEol: () =>
      readBinaryAsset("pdfs/with-missing-endstream-eol-and-polluted-ctm.pdf"),
    withNewlineWhitespace: () =>
      readBinaryAsset("pdfs/with-newline-whitespace-in-indirect-object-numbers.pdf"),
    withComments: () => readBinaryAsset("pdfs/with-comments.pdf"),
    withCropbox: () => readBinaryAsset("pdfs/with-cropbox.pdf"),
    usConstitution: () => readBinaryAsset("pdfs/us-constitution.pdf"),
    simplePdf2Example: () => readBinaryAsset("pdfs/pdf20examples/simple-pdf-2.0-file.pdf"),
    withCombedFields: () => readBinaryAsset("pdfs/with-combed-fields.pdf"),
    dodCharacter: () => readBinaryAsset("pdfs/dod-character.pdf"),
    withXfaFields: () => readBinaryAsset("pdfs/with-xfa-fields.pdf"),
    fancyFields: () => readBinaryAsset("pdfs/fancy-fields.pdf"),
    formToFlatten: () => readBinaryAsset("pdfs/form-to-flatten.pdf"),
    withAnnots: () => readBinaryAsset("pdfs/with-annots.pdf"),
  },
};

export type Assets = typeof assets;
