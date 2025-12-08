import BBox from "./b-box.js";
import Glyph, { type CanvasContextLike } from "./glyph.js";

type RGBAColor = {
  red: number;
  green: number;
  blue: number;
  alpha: number;
};

type LayerRecord = {
  gid: number;
  paletteIndex: number;
};

type BaseGlyphRecord = {
  gid: number;
  firstLayerIndex: number;
  numLayers: number;
};

class COLRLayer {
  glyph: Glyph;
  color: RGBAColor;

  constructor(glyph: Glyph, color: RGBAColor) {
    this.glyph = glyph;
    this.color = color;
  }
}

/**
 * Represents a color (e.g. emoji) glyph in Microsoft's COLR format.
 * Each glyph in this format contain a list of colored layers, each
 * of which  is another vector glyph.
 */
export default class COLRGlyph extends Glyph {
  async _getBBox(): Promise<BBox> {
    let bbox = new BBox();
    const layers = await this.getLayers();
    for (let i = 0; i < layers.length; i++) {
      let layer = layers[i];
      let b = await layer.glyph.getBBox();
      bbox.addPoint(b.minX, b.minY);
      bbox.addPoint(b.maxX, b.maxY);
    }

    return bbox;
  }

  /**
   * Returns an array of objects containing the glyph and color for
   * each layer in the composite color glyph.
   * @type {object[]}
   */
  async getLayers(): Promise<COLRLayer[]> {
    const cpal = this._font.CPAL as { colorRecords: RGBAColor[] };
    const colr = this._font.COLR as {
      baseGlyphRecord: BaseGlyphRecord[];
      layerRecords: LayerRecord[];
    };
    let low = 0;
    let high = colr.baseGlyphRecord.length - 1;
    let baseLayer: BaseGlyphRecord | null = null;

    while (low <= high) {
      let mid = (low + high) >> 1;
      const rec = colr.baseGlyphRecord[mid];

      if (this.id < rec.gid) {
        high = mid - 1;
      } else if (this.id > rec.gid) {
        low = mid + 1;
      } else {
        baseLayer = rec;
        break;
      }
    }

    // if base glyph not found in COLR table,
    // default to normal glyph from glyf or CFF
    if (baseLayer == null) {
      const g = (await this._font._getBaseGlyph(this.id)) as Glyph;
      const color: RGBAColor = {
        red: 0,
        green: 0,
        blue: 0,
        alpha: 255,
      };

      return [new COLRLayer(g, color)];
    }

    // otherwise, return an array of all the layers
    let layers: COLRLayer[] = [];
    for (
      let i = baseLayer.firstLayerIndex;
      i < baseLayer.firstLayerIndex + baseLayer.numLayers;
      i++
    ) {
      const rec = colr.layerRecords[i];
      const color = cpal.colorRecords[rec.paletteIndex];
      const g = (await this._font._getBaseGlyph(rec.gid)) as Glyph;
      layers.push(new COLRLayer(g, color));
    }

    return layers;
  }

  async render(
    ctx: CanvasContextLike & {
      fillColor(color: number[], alpha: number): void;
    },
    size: number,
  ): Promise<void> {
    const layers = await this.getLayers();
    for (let { glyph, color } of layers) {
      ctx.fillColor([color.red, color.green, color.blue], (color.alpha / 255) * 100);
      await glyph.render(ctx, size);
    }

    return;
  }
}
