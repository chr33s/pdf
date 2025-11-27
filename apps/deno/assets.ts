const assetUrl = (file: string) => new URL(`../../packages/pdf/assets/${file}`, import.meta.url);
const readBinaryAsset = (file: string) => Deno.readFile(assetUrl(file));
const readTextAsset = (file: string) => Deno.readTextFile(assetUrl(file));

const loadAssets = async () => ({
  fonts: {
    ttf: {
      ubuntu_r: await readBinaryAsset("fonts/ubuntu/ubuntu-r.ttf"),
      ubuntu_r_base64: await readTextAsset("fonts/ubuntu/ubuntu-r.ttf.base64"),
      "bio-rhyme_r": await readBinaryAsset("fonts/bio-rhyme/bio-rhyme-expanded-regular.ttf"),
      "press-start-2p_r": await readBinaryAsset("fonts/press-start-2p/press-start2-p-regular.ttf"),
      "indie-flower_r": await readBinaryAsset("fonts/indie-flower/indie-flower.ttf"),
      "great-vibes_r": await readBinaryAsset("fonts/great-vibes/great-vibes-regular.ttf"),
      nunito: await readBinaryAsset("fonts/nunito/nunito-regular.ttf"),
    },
    otf: {
      "fantasque-sans-mono_bi": await readBinaryAsset(
        "fonts/fantasque/otf/fantasque-sans-mono-bold-italic.otf",
      ),
      "apple-storm_r": await readBinaryAsset("fonts/apple-storm/apple-storm-c-bo.otf"),
      "hussar-3d_r": await readBinaryAsset("fonts/hussar-3d/hussar3-d-four.otf"),
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
      "pdfs/with-missing-endstream-eol-and-polluted-ctm.pdf",
    ),
    with_newline_whitespace_in_indirect_object_numbers: await readBinaryAsset(
      "pdfs/with-newline-whitespace-in-indirect-object-numbers.pdf",
    ),
    with_comments: await readBinaryAsset("pdfs/with-comments.pdf"),
    with_cropbox: await readBinaryAsset("pdfs/with-cropbox.pdf"),
    "us-constitution": await readBinaryAsset("pdfs/us-constitution.pdf"),
    simple_pdf_2_example: await readBinaryAsset("pdfs/pdf20examples/simple-pdf-2.0-file.pdf"),
    with_combed_fields: await readBinaryAsset("pdfs/with-combed-fields.pdf"),
    dod_character: await readBinaryAsset("pdfs/dod-character.pdf"),
    with_xfa_fields: await readBinaryAsset("pdfs/with-xfa-fields.pdf"),
    fancy_fields: await readBinaryAsset("pdfs/fancy-fields.pdf"),
    form_to_flatten: await readBinaryAsset("pdfs/form-to-flatten.pdf"),
    with_annots: await readBinaryAsset("pdfs/with-annots.pdf"),
  },
});

export const assets = await loadAssets();

export type Assets = typeof assets;
