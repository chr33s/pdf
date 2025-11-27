const fetchBinaryAsset = (asset: string) =>
  fetch(`/packages/pdf/assets/${asset}`).then((res) => res.arrayBuffer());

const fetchStringAsset = (asset: string) =>
  fetch(`/packages/pdf/assets/${asset}`).then((res) => res.text());

export const assets = {
  fetchBinary: fetchBinaryAsset,
  fetchString: fetchStringAsset,
  fonts: {
    ttf: {
      ubuntu: () => fetchBinaryAsset("fonts/ubuntu/ubuntu-r.ttf"),
      bioRhyme: () => fetchBinaryAsset("fonts/bio-rhyme/bio-rhyme-expanded-regular.ttf"),
      pressStart2p: () => fetchBinaryAsset("fonts/press-start-2p/press-start2-p-regular.ttf"),
      indieFlower: () => fetchBinaryAsset("fonts/indie-flower/indie-flower.ttf"),
      greatVibes: () => fetchBinaryAsset("fonts/great-vibes/great-vibes-regular.ttf"),
      nunito: () => fetchBinaryAsset("fonts/nunito/nunito-regular.ttf"),
    },
    otf: {
      fantasque: () => fetchBinaryAsset("fonts/fantasque/otf/fantasque-sans-mono-bold-italic.otf"),
      appleStorm: () => fetchBinaryAsset("fonts/apple-storm/apple-storm-c-bo.otf"),
      hussar3d: () => fetchBinaryAsset("fonts/hussar-3d/hussar3-d-four.otf"),
      sourceHansJp: () => fetchBinaryAsset("fonts/source-hans-jp/source-han-serif-jp-regular.otf"),
    },
  },
  images: {
    jpg: {
      catRidingUnicorn: () => fetchBinaryAsset("images/cat-riding-unicorn.jpg"),
      catRidingUnicornBase64: () => fetchStringAsset("images/cat-riding-unicorn.jpg.base64"),
      minionsLaughing: () => fetchBinaryAsset("images/minions-laughing.jpg"),
      cmykColorspace: () => fetchBinaryAsset("images/cmyk-colorspace.jpg"),
    },
    png: {
      greyscaleBird: () => fetchBinaryAsset("images/greyscale-bird.png"),
      greyscaleBirdBase64Uri: () => fetchStringAsset("images/greyscale-bird.png.base64.uri"),
      minionsBananaAlpha: () => fetchBinaryAsset("images/minions-banana-alpha.png"),
      minionsBananaNoAlpha: () => fetchBinaryAsset("images/minions-banana-no-alpha.png"),
      smallMario: () => fetchBinaryAsset("images/small-mario.png"),
      etwe: () => fetchBinaryAsset("images/etwe.png"),
      selfDrive: () => fetchBinaryAsset("images/self-drive.png"),
      marioEmblem: () => fetchBinaryAsset("images/mario-emblem.png"),
      pngSuite: (name: string) => fetchBinaryAsset(`images/pngsuite/${name}`),
    },
  },
  pdfs: {
    normal: () => fetchBinaryAsset("pdfs/normal.pdf"),
    normalBase64: () => fetchStringAsset("pdfs/normal.pdf.base64"),
    withUpdateSections: () => fetchBinaryAsset("pdfs/with-update-sections.pdf"),
    withUpdateSectionsBase64Uri: () => fetchStringAsset("pdfs/with-update-sections.pdf.base64.uri"),
    linearizedWithObjectStreams: () => fetchBinaryAsset("pdfs/linearized-with-object-streams.pdf"),
    withLargePageCount: () => fetchBinaryAsset("pdfs/with-large-page-count.pdf"),
    withMissingEndstreamEol: () =>
      fetchBinaryAsset("pdfs/with-missing-endstream-eol-and-polluted-ctm.pdf"),
    withNewlineWhitespace: () =>
      fetchBinaryAsset("pdfs/with-newline-whitespace-in-indirect-object-numbers.pdf"),
    withComments: () => fetchBinaryAsset("pdfs/with-comments.pdf"),
    withCropbox: () => fetchBinaryAsset("pdfs/with-cropbox.pdf"),
    usConstitution: () => fetchBinaryAsset("pdfs/us-constitution.pdf"),
    simplePdf2Example: () => fetchBinaryAsset("pdfs/pdf20examples/simple-pdf-2.0-file.pdf"),
    withCombedFields: () => fetchBinaryAsset("pdfs/with-combed-fields.pdf"),
    dodCharacter: () => fetchBinaryAsset("pdfs/dod-character.pdf"),
    withXfaFields: () => fetchBinaryAsset("pdfs/with-xfa-fields.pdf"),
    fancyFields: () => fetchBinaryAsset("pdfs/fancy-fields.pdf"),
    formToFlatten: () => fetchBinaryAsset("pdfs/form-to-flatten.pdf"),
    withAnnots: () => fetchBinaryAsset("pdfs/with-annots.pdf"),
  },
};
