import { deflate } from "@chr33s/pdf-common";

import { Bin } from "./bin.js";
import { CRC } from "./crc.js";
import { Inflator } from "./inflator.js";
import { Quantizer } from "./quantizer.js";

/**
 * PNG/APNG encoder and decoder.
 * Supports encoding RGBA images to PNG with optional quantization and animation.
 */
export class UPNG {
  /**
   * Converts a decoded PNG image to an array of RGBA8 frames.
   * @param out The decoded PNG image
   */
  static toRGBA8(out: Image) {
    const w = out.width;
    const h = out.height;
    if (out.tabs.acTL == null) return [this.#decodeImage(out.data, w, h, out).buffer];

    const frms: ArrayBuffer[] = [];
    if (out.frames[0].data == null) out.frames[0].data = out.data;

    const len = w * h * 4;
    const img = new Uint8Array(len);
    const empty = new Uint8Array(len);
    const prev = new Uint8Array(len);
    for (let i = 0; i < out.frames.length; i++) {
      const frm = out.frames[i];
      const fx = frm.rect.x;
      const fy = frm.rect.y;
      const fw = frm.rect.width;
      const fh = frm.rect.height;
      const fdata = this.#decodeImage(frm.data!, fw, fh, out);

      if (i != 0) for (let j = 0; j < len; j++) prev[j] = img[j];

      if (frm.blend == 0) this.#copyTile(fdata, fw, fh, img, w, h, fx, fy, 0);
      else if (frm.blend == 1) this.#copyTile(fdata, fw, fh, img, w, h, fx, fy, 1);

      frms.push(img.buffer.slice(0));

      if (frm.dispose == 0) {
      } else if (frm.dispose == 1) this.#copyTile(empty, fw, fh, img, w, h, fx, fy, 0);
      else if (frm.dispose == 2) for (let j = 0; j < len; j++) img[j] = prev[j];
    }
    return frms;
  }

  static #decodeImage(data: Uint8Array, w: number, h: number, out: Image) {
    const area = w * h;
    const bpp = this.#getBPP(out);
    const bpl = Math.ceil((w * bpp) / 8); // bytes per line

    const bf = new Uint8Array(area * 4);
    const bf32 = new Uint32Array(bf.buffer);
    const ctype = out.ctype;
    const depth = out.depth;
    const rs = Bin.readUshort.bind(Bin);

    if (ctype == 6) {
      // RGB + alpha
      const qarea = area << 2;
      if (depth == 8)
        for (let i = 0; i < qarea; i += 4) {
          bf[i] = data[i];
          bf[i + 1] = data[i + 1];
          bf[i + 2] = data[i + 2];
          bf[i + 3] = data[i + 3];
        }
      if (depth == 16)
        for (let i = 0; i < qarea; i++) {
          bf[i] = data[i << 1];
        }
    } else if (ctype == 2) {
      // RGB
      const ts = out.tabs["tRNS"] as number[];
      if (ts == null) {
        if (depth == 8)
          for (let i = 0; i < area; i++) {
            const ti = i * 3;
            bf32[i] = (255 << 24) | (data[ti + 2] << 16) | (data[ti + 1] << 8) | data[ti];
          }
        if (depth == 16)
          for (let i = 0; i < area; i++) {
            const ti = i * 6;
            bf32[i] = (255 << 24) | (data[ti + 4] << 16) | (data[ti + 2] << 8) | data[ti];
          }
      } else {
        const tr = ts[0];
        const tg = ts[1];
        const tb = ts[2];
        if (depth == 8)
          for (let i = 0; i < area; i++) {
            const qi = i << 2;
            const ti = i * 3;
            bf32[i] = (255 << 24) | (data[ti + 2] << 16) | (data[ti + 1] << 8) | data[ti];
            if (data[ti] == tr && data[ti + 1] == tg && data[ti + 2] == tb) bf[qi + 3] = 0;
          }
        if (depth == 16)
          for (let i = 0; i < area; i++) {
            const qi = i << 2;
            const ti = i * 6;
            bf32[i] = (255 << 24) | (data[ti + 4] << 16) | (data[ti + 2] << 8) | data[ti];
            if (rs(data, ti) == tr && rs(data, ti + 2) == tg && rs(data, ti + 4) == tb)
              bf[qi + 3] = 0;
          }
      }
    } else if (ctype == 3) {
      // palette
      const p = out.tabs["PLTE"]!;
      const ap = out.tabs["tRNS"] as number[];
      const tl = ap ? ap.length : 0;
      if (depth == 1)
        for (let y = 0; y < h; y++) {
          const s0 = y * bpl;
          const t0 = y * w;
          for (let i = 0; i < w; i++) {
            const qi = (t0 + i) << 2;
            const j = (data[s0 + (i >> 3)] >> (7 - ((i & 7) << 0))) & 1;
            const cj = 3 * j;
            bf[qi] = p[cj];
            bf[qi + 1] = p[cj + 1];
            bf[qi + 2] = p[cj + 2];
            bf[qi + 3] = j < tl ? ap[j] : 255;
          }
        }
      if (depth == 2)
        for (let y = 0; y < h; y++) {
          const s0 = y * bpl;
          const t0 = y * w;
          for (let i = 0; i < w; i++) {
            const qi = (t0 + i) << 2;
            const j = (data[s0 + (i >> 2)] >> (6 - ((i & 3) << 1))) & 3;
            const cj = 3 * j;
            bf[qi] = p[cj];
            bf[qi + 1] = p[cj + 1];
            bf[qi + 2] = p[cj + 2];
            bf[qi + 3] = j < tl ? ap[j] : 255;
          }
        }
      if (depth == 4)
        for (let y = 0; y < h; y++) {
          const s0 = y * bpl;
          const t0 = y * w;
          for (let i = 0; i < w; i++) {
            const qi = (t0 + i) << 2;
            const j = (data[s0 + (i >> 1)] >> (4 - ((i & 1) << 2))) & 15;
            const cj = 3 * j;
            bf[qi] = p[cj];
            bf[qi + 1] = p[cj + 1];
            bf[qi + 2] = p[cj + 2];
            bf[qi + 3] = j < tl ? ap[j] : 255;
          }
        }
      if (depth == 8)
        for (let i = 0; i < area; i++) {
          const qi = i << 2;
          const j = data[i];
          const cj = 3 * j;
          bf[qi] = p[cj];
          bf[qi + 1] = p[cj + 1];
          bf[qi + 2] = p[cj + 2];
          bf[qi + 3] = j < tl ? ap[j] : 255;
        }
    } else if (ctype == 4) {
      // gray + alpha
      if (depth == 8)
        for (let i = 0; i < area; i++) {
          const qi = i << 2;
          const di = i << 1;
          const gr = data[di];
          bf[qi] = gr;
          bf[qi + 1] = gr;
          bf[qi + 2] = gr;
          bf[qi + 3] = data[di + 1];
        }
      if (depth == 16)
        for (let i = 0; i < area; i++) {
          const qi = i << 2;
          const di = i << 2;
          const gr = data[di];
          bf[qi] = gr;
          bf[qi + 1] = gr;
          bf[qi + 2] = gr;
          bf[qi + 3] = data[di + 2];
        }
    } else if (ctype == 0) {
      // gray
      const tr = out.tabs["tRNS"] !== undefined ? out.tabs["tRNS"] : -1;
      for (let y = 0; y < h; y++) {
        const off = y * bpl;
        const to = y * w;
        if (depth == 1)
          for (let x = 0; x < w; x++) {
            const gr = 255 * ((data[off + (x >>> 3)] >>> (7 - (x & 7))) & 1);
            const al = gr == (tr as number) * 255 ? 0 : 255;
            bf32[to + x] = (al << 24) | (gr << 16) | (gr << 8) | gr;
          }
        else if (depth == 2)
          for (let x = 0; x < w; x++) {
            const gr = 85 * ((data[off + (x >>> 2)] >>> (6 - ((x & 3) << 1))) & 3);
            const al = gr == (tr as number) * 85 ? 0 : 255;
            bf32[to + x] = (al << 24) | (gr << 16) | (gr << 8) | gr;
          }
        else if (depth == 4)
          for (let x = 0; x < w; x++) {
            const gr = 17 * ((data[off + (x >>> 1)] >>> (4 - ((x & 1) << 2))) & 15);
            const al = gr == (tr as number) * 17 ? 0 : 255;
            bf32[to + x] = (al << 24) | (gr << 16) | (gr << 8) | gr;
          }
        else if (depth == 8)
          for (let x = 0; x < w; x++) {
            const gr = data[off + x];
            const al = gr == tr ? 0 : 255;
            bf32[to + x] = (al << 24) | (gr << 16) | (gr << 8) | gr;
          }
        else if (depth == 16)
          for (let x = 0; x < w; x++) {
            const gr = data[off + (x << 1)];
            const al = rs(data, off + (x << 1)) == tr ? 0 : 255;
            bf32[to + x] = (al << 24) | (gr << 16) | (gr << 8) | gr;
          }
      }
    }
    return bf;
  }

  /**
   * Decodes PNG/APNG data from a buffer.
   * @param buff The PNG data buffer
   */
  static decode(buff: ArrayBuffer) {
    const data = new Uint8Array(buff);
    const rUs = Bin.readUshort.bind(Bin);
    const rUi = Bin.readUint.bind(Bin);
    let offset = 8;
    const out: Image = { tabs: {}, frames: [] } as any;
    const dd = new Uint8Array(data.length);
    let doff = 0;
    let fd = new Uint8Array(0);
    let foff = 0;

    const mgck = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < 8; i++) if (data[i] != mgck[i]) throw "The input is not a PNG file!";

    while (offset < data.length) {
      const len = Bin.readUint(data, offset);
      offset += 4;
      const type = Bin.readASCII(data, offset, 4);
      offset += 4;

      if (type == "IHDR") {
        this.#IHDR(data, offset, out);
      } else if (type == "iCCP") {
        let off = offset;
        while (data[off] != 0) off++;
        const fil = data.slice(off + 2, offset + len);
        let res = null;
        try {
          res = this.#inflate(fil);
        } catch {
          res = Inflator.inflateRaw(fil);
        }
        out.tabs[type] = res;
      } else if (type == "CgBI") {
        out.tabs[type] = data.slice(offset, offset + 4);
      } else if (type == "IDAT") {
        for (let i = 0; i < len; i++) dd[doff + i] = data[offset + i];
        doff += len;
      } else if (type == "acTL") {
        out.tabs[type] = {
          num_frames: rUi(data, offset),
          num_plays: rUi(data, offset + 4),
        };
        fd = new Uint8Array(data.length);
      } else if (type == "fcTL") {
        if (foff != 0) {
          const fr = out.frames[out.frames.length - 1];
          fr.data = this.#decompress(out, fd.slice(0, foff), fr.rect.width, fr.rect.height);
          foff = 0;
        }
        const rct = {
          x: rUi(data, offset + 12),
          y: rUi(data, offset + 16),
          width: rUi(data, offset + 4),
          height: rUi(data, offset + 8),
        };
        let del = rUs(data, offset + 22);
        del = rUs(data, offset + 20) / (del == 0 ? 100 : del);
        const frm = {
          rect: rct,
          delay: Math.round(del * 1000),
          dispose: data[offset + 24],
          blend: data[offset + 25],
        };
        out.frames.push(frm);
      } else if (type == "fdAT") {
        for (let i = 0; i < len - 4; i++) fd[foff + i] = data[offset + i + 4];
        foff += len - 4;
      } else if (type == "pHYs") {
        out.tabs[type] = [
          Bin.readUint(data, offset),
          Bin.readUint(data, offset + 4),
          data[offset + 8],
        ];
      } else if (type == "cHRM") {
        out.tabs[type] = [];
        for (let i = 0; i < 8; i++) out.tabs[type]!.push(Bin.readUint(data, offset + i * 4));
      } else if (type == "tEXt" || type == "zTXt") {
        if (out.tabs[type] == null) out.tabs[type] = {};
        const nz = Bin.nextZero(data, offset);
        const keyw = Bin.readASCII(data, offset, nz - offset);
        let text;
        const tl = offset + len - nz - 1;
        if (type == "tEXt") text = Bin.readASCII(data, nz + 1, tl);
        else {
          const bfr = this.#inflate(data.slice(nz + 2, nz + 2 + tl));
          text = Bin.readUTF8(bfr, 0, bfr.length);
        }
        out.tabs[type]![keyw] = text;
      } else if (type == "iTXt") {
        if (out.tabs[type] == null) out.tabs[type] = {};
        let nz = 0;
        let off = offset;
        nz = Bin.nextZero(data, off);
        const keyw = Bin.readASCII(data, off, nz - off);
        off = nz + 1;
        const cflag = data[off];
        off += 2;
        nz = Bin.nextZero(data, off);
        off = nz + 1;
        nz = Bin.nextZero(data, off);
        off = nz + 1;
        let text;
        const tl = len - (off - offset);
        if (cflag == 0) text = Bin.readUTF8(data, off, tl);
        else {
          const bfr = this.#inflate(data.slice(off, off + tl));
          text = Bin.readUTF8(bfr, 0, bfr.length);
        }
        out.tabs[type]![keyw] = text;
      } else if (type == "PLTE") {
        out.tabs[type] = Bin.readBytes(data, offset, len);
      } else if (type == "hIST") {
        const pl = out.tabs["PLTE"]!.length / 3;
        out.tabs[type] = [];
        for (let i = 0; i < pl; i++) out.tabs[type]!.push(rUs(data, offset + i * 2));
      } else if (type == "tRNS") {
        if (out.ctype == 3) out.tabs[type] = Bin.readBytes(data, offset, len);
        else if (out.ctype == 0) out.tabs[type] = rUs(data, offset);
        else if (out.ctype == 2)
          out.tabs[type] = [rUs(data, offset), rUs(data, offset + 2), rUs(data, offset + 4)];
      } else if (type == "gAMA") out.tabs[type] = Bin.readUint(data, offset) / 100000;
      else if (type == "sRGB") out.tabs[type] = data[offset];
      else if (type == "bKGD") {
        if (out.ctype == 0 || out.ctype == 4) out.tabs[type] = [rUs(data, offset)];
        else if (out.ctype == 2 || out.ctype == 6)
          out.tabs[type] = [rUs(data, offset), rUs(data, offset + 2), rUs(data, offset + 4)];
        else if (out.ctype == 3) out.tabs[type] = data[offset];
      } else if (type == "IEND") {
        break;
      }
      offset += len;
      const _crc = Bin.readUint(data, offset);
      offset += 4;
    }
    if (foff != 0) {
      const fr = out.frames[out.frames.length - 1];
      fr.data = this.#decompress(out, fd.slice(0, foff), fr.rect.width, fr.rect.height);
      foff = 0;
    }
    out.data = this.#decompress(out, dd, out.width, out.height);

    if (out.frames.length === 0) {
      out.frames.push({
        rect: { x: 0, y: 0, width: out.width, height: out.height },
        delay: 0,
        dispose: 0,
        blend: 0,
        data: out.data,
      });
    } else if (out.frames[0].data == null) {
      out.frames[0].data = out.data;
    }

    delete out.compress;
    delete out.interlace;
    delete out.filter;
    return out;
  }

  static #decompress(out: Image, dd: Uint8Array, w: number, h: number) {
    const bpp = this.#getBPP(out);
    const bpl = Math.ceil((w * bpp) / 8);
    const buff = new Uint8Array((bpl + 1 + (out.interlace || 0)) * h);
    if (out.tabs["CgBI"]) dd = Inflator.inflateRaw(dd, buff);
    else dd = this.#inflate(dd, buff);

    if (out.interlace == 0) dd = this.#filterZero(dd, out, 0, w, h);
    else if (out.interlace == 1) dd = this.#readInterlace(dd, out);
    return dd;
  }

  static #inflate(data: Uint8Array, buff?: Uint8Array) {
    const out = Inflator.inflateRaw(new Uint8Array(data.buffer, 2, data.length - 6), buff);
    return out;
  }

  static #readInterlace(data: Uint8Array, out: Image) {
    const w = out.width;
    const h = out.height;
    const bpp = this.#getBPP(out);
    const cbpp = bpp >> 3;
    const bpl = Math.ceil((w * bpp) / 8);
    const img = new Uint8Array(h * bpl);
    let di = 0;

    const starting_row = [0, 0, 4, 0, 2, 0, 1];
    const starting_col = [0, 4, 0, 2, 0, 1, 0];
    const row_increment = [8, 8, 8, 4, 4, 2, 2];
    const col_increment = [8, 8, 4, 4, 2, 2, 1];

    let pass = 0;
    while (pass < 7) {
      const ri = row_increment[pass];
      const ci = col_increment[pass];
      let sw = 0;
      let sh = 0;
      let cr = starting_row[pass];
      while (cr < h) {
        cr += ri;
        sh++;
      }
      let cc = starting_col[pass];
      while (cc < w) {
        cc += ci;
        sw++;
      }
      const bpll = Math.ceil((sw * bpp) / 8);
      this.#filterZero(data, out, di, sw, sh);

      let y = 0;
      let row = starting_row[pass];
      while (row < h) {
        let col = starting_col[pass];
        let cdi = (di + y * bpll) << 3;

        while (col < w) {
          if (bpp == 1) {
            let val = data[cdi >> 3];
            val = (val >> (7 - (cdi & 7))) & 1;
            img[row * bpl + (col >> 3)] |= val << (7 - ((col & 7) << 0));
          }
          if (bpp == 2) {
            let val = data[cdi >> 3];
            val = (val >> (6 - (cdi & 7))) & 3;
            img[row * bpl + (col >> 2)] |= val << (6 - ((col & 3) << 1));
          }
          if (bpp == 4) {
            let val = data[cdi >> 3];
            val = (val >> (4 - (cdi & 7))) & 15;
            img[row * bpl + (col >> 1)] |= val << (4 - ((col & 1) << 2));
          }
          if (bpp >= 8) {
            const ii = row * bpl + col * cbpp;
            for (let j = 0; j < cbpp; j++) img[ii + j] = data[(cdi >> 3) + j];
          }
          cdi += bpp;
          col += ci;
        }
        y++;
        row += ri;
      }
      if (sw * sh != 0) di += sh * (1 + bpll);
      pass = pass + 1;
    }
    return img;
  }

  static #getBPP(out: Image) {
    const noc = [1, null, 3, 1, 2, null, 4][out.ctype];
    return (noc as number) * out.depth;
  }

  static #filterZero(data: Uint8Array, out: Image, off: number, w: number, h: number) {
    let bpp = this.#getBPP(out);
    const bpl = Math.ceil((w * bpp) / 8);
    bpp = Math.ceil(bpp / 8);

    let i, di;
    let type = data[off];
    let x = 0;

    if (type > 1) data[off] = [0, 0, 1][type - 2];
    if (type == 3)
      for (x = bpp; x < bpl; x++) data[x + 1] = (data[x + 1] + (data[x + 1 - bpp] >>> 1)) & 255;

    for (let y = 0; y < h; y++) {
      i = off + y * bpl;
      di = i + y + 1;
      type = data[di - 1];
      x = 0;

      if (type == 0) for (; x < bpl; x++) data[i + x] = data[di + x];
      else if (type == 1) {
        for (; x < bpp; x++) data[i + x] = data[di + x];
        for (; x < bpl; x++) data[i + x] = data[di + x] + data[i + x - bpp];
      } else if (type == 2) {
        for (; x < bpl; x++) data[i + x] = data[di + x] + data[i + x - bpl];
      } else if (type == 3) {
        for (; x < bpp; x++) data[i + x] = data[di + x] + (data[i + x - bpl] >>> 1);
        for (; x < bpl; x++)
          data[i + x] = data[di + x] + ((data[i + x - bpl] + data[i + x - bpp]) >>> 1);
      } else {
        for (; x < bpp; x++) data[i + x] = data[di + x] + this.#paeth(0, data[i + x - bpl], 0);
        for (; x < bpl; x++)
          data[i + x] =
            data[di + x] +
            this.#paeth(data[i + x - bpp], data[i + x - bpl], data[i + x - bpp - bpl]);
      }
    }
    return data;
  }

  static #paeth(a: number, b: number, c: number) {
    const p = a + b - c;
    const pa = p - a;
    const pb = p - b;
    const pc = p - c;
    if (pa * pa <= pb * pb && pa * pa <= pc * pc) return a;
    else if (pb * pb <= pc * pc) return b;
    return c;
  }

  static #IHDR(data: Uint8Array, offset: number, out: Image) {
    out.width = Bin.readUint(data, offset);
    offset += 4;
    out.height = Bin.readUint(data, offset);
    offset += 4;
    out.depth = data[offset];
    offset++;
    out.ctype = data[offset];
    offset++;
    out.compress = data[offset];
    offset++;
    out.filter = data[offset];
    offset++;
    out.interlace = data[offset];
    offset++;
  }

  static #copyTile(
    sb: Uint8Array,
    sw: number,
    sh: number,
    tb: Uint8Array,
    tw: number,
    th: number,
    xoff: number,
    yoff: number,
    mode: number,
  ) {
    const w = Math.min(sw, tw);
    const h = Math.min(sh, th);
    let si = 0;
    let ti = 0;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (xoff >= 0 && yoff >= 0) {
          si = (y * sw + x) << 2;
          ti = ((yoff + y) * tw + xoff + x) << 2;
        } else {
          si = ((-yoff + y) * sw - xoff + x) << 2;
          ti = (y * tw + x) << 2;
        }

        if (mode == 0) {
          tb[ti] = sb[si];
          tb[ti + 1] = sb[si + 1];
          tb[ti + 2] = sb[si + 2];
          tb[ti + 3] = sb[si + 3];
        } else if (mode == 1) {
          const fa = sb[si + 3] * (1 / 255);
          const fr = sb[si] * fa;
          const fg = sb[si + 1] * fa;
          const fb = sb[si + 2] * fa;
          const ba = tb[ti + 3] * (1 / 255);
          const br = tb[ti] * ba;
          const bg = tb[ti + 1] * ba;
          const bb = tb[ti + 2] * ba;

          const ifa = 1 - fa;
          const oa = fa + ba * ifa;
          const ioa = oa == 0 ? 0 : 1 / oa;
          tb[ti + 3] = 255 * oa;
          tb[ti + 0] = (fr + br * ifa) * ioa;
          tb[ti + 1] = (fg + bg * ifa) * ioa;
          tb[ti + 2] = (fb + bb * ifa) * ioa;
        } else if (mode == 2) {
          // copy only differences, otherwise zero
          const fa = sb[si + 3];
          const fr = sb[si];
          const fg = sb[si + 1];
          const fb = sb[si + 2];
          const ba = tb[ti + 3];
          const br = tb[ti];
          const bg = tb[ti + 1];
          const bb = tb[ti + 2];
          if (fa == ba && fr == br && fg == bg && fb == bb) {
            tb[ti] = 0;
            tb[ti + 1] = 0;
            tb[ti + 2] = 0;
            tb[ti + 3] = 0;
          } else {
            tb[ti] = fr;
            tb[ti + 1] = fg;
            tb[ti + 2] = fb;
            tb[ti + 3] = fa;
          }
        } else if (mode == 3) {
          // check if can be blended
          const fa = sb[si + 3];
          const fr = sb[si];
          const fg = sb[si + 1];
          const fb = sb[si + 2];
          const ba = tb[ti + 3];
          const br = tb[ti];
          const bg = tb[ti + 1];
          const bb = tb[ti + 2];
          if (fa == ba && fr == br && fg == bg && fb == bb) continue;
          //if(fa!=255 && ba!=0) return false;
          if (fa < 220 && ba > 20) return false;
        }
      }
    return true;
  }

  // --- ENCODING METHODS ---

  static #addErr(er: number[], tg: Uint8Array | Int16Array, ti: number, f: number) {
    tg[ti] += (er[0] * f) >> 4;
    tg[ti + 1] += (er[1] * f) >> 4;
    tg[ti + 2] += (er[2] * f) >> 4;
    tg[ti + 3] += (er[3] * f) >> 4;
  }
  static #N(x: number) {
    return Math.max(0, Math.min(255, x));
  }
  static #Dist(a: number[], b: number[]) {
    const dr = a[0] - b[0];
    const dg = a[1] - b[1];
    const db = a[2] - b[2];
    const da = a[3] - b[3];
    return dr * dr + dg * dg + db * db + da * da;
  }

  static #dither(
    sb: Uint8Array,
    w: number,
    h: number,
    plte: number[],
    tb: Uint8Array,
    oind: Uint8Array,
    MTD?: number,
  ) {
    if (MTD == null) MTD = 1;

    const pc = plte.length;
    const nplt = [];
    for (let i = 0; i < pc; i++) {
      const c = plte[i];
      nplt.push([(c >>> 0) & 255, (c >>> 8) & 255, (c >>> 16) & 255, (c >>> 24) & 255]);
    }

    const tb32 = new Uint32Array(tb.buffer);
    const err = new Int16Array(w * h * 4);

    const S = 4;
    const M = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let i = 0; i < M.length; i++) M[i] = 255 * (-0.5 + (M[i] + 0.5) / (S * S));

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;

        let cc;
        if (MTD != 2)
          cc = [
            this.#N(sb[i] + err[i]),
            this.#N(sb[i + 1] + err[i + 1]),
            this.#N(sb[i + 2] + err[i + 2]),
            this.#N(sb[i + 3] + err[i + 3]),
          ];
        else {
          const ce = M[(y & (S - 1)) * S + (x & (S - 1))];
          cc = [
            this.#N(sb[i] + ce),
            this.#N(sb[i + 1] + ce),
            this.#N(sb[i + 2] + ce),
            this.#N(sb[i + 3] + ce),
          ];
        }

        let ni = 0;
        let nd = 0xffffff;
        for (let j = 0; j < pc; j++) {
          const cd = this.#Dist(cc, nplt[j]);
          if (cd < nd) {
            nd = cd;
            ni = j;
          }
        }

        const nc = nplt[ni];
        const er = [cc[0] - nc[0], cc[1] - nc[1], cc[2] - nc[2], cc[3] - nc[3]];

        if (MTD == 1) {
          if (x != w - 1) this.#addErr(er, err, i + 4, 7);
          if (y != h - 1) {
            if (x != 0) this.#addErr(er, err, i + 4 * w - 4, 3);
            this.#addErr(er, err, i + 4 * w, 5);
            if (x != w - 1) this.#addErr(er, err, i + 4 * w + 4, 1);
          }
        }
        oind[i >> 2] = ni;
        tb32[i >> 2] = plte[ni];
      }
    }
  }

  /**
   * Encodes RGBA8 image data to PNG format.
   * @param bufs Array of RGBA8 buffers (one per frame for animations)
   * @param w Image width
   * @param h Image height
   * @param cnum Number of colors for quantization (0 for lossless)
   * @param dels Optional delays for animation frames in ms
   */
  static async encode(
    bufs: ArrayBuffer[],
    w: number,
    h: number,
    cnum: number,
    dels?: number[],
    tabs?: ImageTabs,
    forbidPlte?: boolean,
  ) {
    if (cnum == null) cnum = 0;
    if (forbidPlte == null) forbidPlte = false;

    const compressed = this.#compress(bufs, w, h, cnum, [
      false,
      false,
      false,
      0,
      forbidPlte,
      false,
    ]);
    const nimg: Image & { plte: number[] } = {
      width: w,
      height: h,
      depth: compressed.depth,
      ctype: compressed.ctype,
      frames: compressed.frames,
      tabs: {},
      data: new Uint8Array(0),
      plte: compressed.plte,
    };

    await this.#compressPNG(nimg, -1);

    return await this.#main(nimg, w, h, dels, tabs);
  }

  static async encodeLL(
    bufs: ArrayBuffer[],
    w: number,
    h: number,
    cc: number,
    ac: number,
    depth: number,
    dels?: number[],
    tabs?: ImageTabs,
  ) {
    if (!Number.isInteger(cc) || cc <= 0) {
      throw new Error("Total channel count must be a positive integer");
    }
    if (!Number.isInteger(ac) || ac < 0 || ac > 1) {
      throw new Error("Alpha channel count must be 0 or 1");
    }

    const alphaChannels = ac;
    let colorChannels = cc;
    if (colorChannels !== 1 && colorChannels !== 3) {
      colorChannels = cc - alphaChannels;
    }
    if (colorChannels !== 1 && colorChannels !== 3) {
      throw new Error("Color channel count must be 1 (gray) or 3 (RGB)");
    }

    const samplesPerPixel = colorChannels + alphaChannels;
    const hasAlpha = alphaChannels === 1;
    const isGray = colorChannels === 1;

    const baseTabs = tabs ? { ...tabs } : {};
    const nimg: Image & { plte: number[] } = {
      width: w,
      height: h,
      depth,
      ctype: (isGray ? 0 : 2) + (hasAlpha ? 4 : 0),
      frames: [],
      tabs: baseTabs,
      data: new Uint8Array(0),
      plte: [],
    };

    const bipp = samplesPerPixel * depth;
    const bipl = bipp * w;
    const frameRowBytes = Math.ceil(bipl / 8);
    for (let i = 0; i < bufs.length; i++) {
      const img = this.#prepareInputBuffer(
        bufs[i],
        w,
        h,
        samplesPerPixel,
        colorChannels,
        alphaChannels,
        depth,
      );
      nimg.frames.push({
        rect: { x: 0, y: 0, width: w, height: h },
        img,
        blend: 0,
        dispose: 1,
        delay: dels?.[i] ?? 0,
        bpp: Math.ceil(bipp / 8),
        bpl: frameRowBytes,
      });
    }

    await this.#compressPNG(nimg, 0, true);

    const out = await this.#main(nimg, w, h, dels, tabs);
    return out;
  }

  static #prepareInputBuffer(
    buf: ArrayBuffer,
    w: number,
    h: number,
    samplesPerPixel: number,
    colorChannels: number,
    alphaChannels: number,
    depth: number,
  ) {
    const data = new Uint8Array(buf);
    const rowBits = samplesPerPixel * depth * w;
    const expectedLength = Math.ceil(rowBits / 8) * h;
    if (data.length === expectedLength) {
      return data;
    }

    if (depth !== 8) {
      throw new Error(
        `Unexpected raw frame length ${data.length}; expected ${expectedLength} for depth ${depth}.`,
      );
    }

    const rgbaLength = w * h * 4;
    if (data.length === rgbaLength) {
      return this.#rgbaToChannels(data, w * h, colorChannels, alphaChannels);
    }

    throw new Error(
      `Unexpected raw frame length ${data.length}; expected ${expectedLength}${
        rgbaLength !== expectedLength ? ` or ${rgbaLength}` : ""
      }.`,
    );
  }

  static #rgbaToChannels(
    rgba: Uint8Array,
    pixels: number,
    colorChannels: number,
    alphaChannels: number,
  ) {
    const samplesPerPixel = colorChannels + alphaChannels;
    const out = new Uint8Array(pixels * samplesPerPixel);
    for (let i = 0; i < pixels; i++) {
      const src = i * 4;
      let dst = i * samplesPerPixel;
      if (colorChannels === 1) {
        const r = rgba[src];
        const g = rgba[src + 1];
        const b = rgba[src + 2];
        out[dst++] = Math.round((299 * r + 587 * g + 114 * b) / 1000);
      } else {
        out[dst++] = rgba[src];
        out[dst++] = rgba[src + 1];
        out[dst++] = rgba[src + 2];
      }

      if (alphaChannels === 1) {
        out[dst] = rgba[src + 3];
      }
    }

    return out;
  }

  static async #main(nimg: Image, w: number, h: number, dels?: number[], tabs?: ImageTabs) {
    if (tabs == null) tabs = {};
    const wUi = Bin.writeUint.bind(Bin);
    const wUs = Bin.writeUshort.bind(Bin);
    const wAs = Bin.writeASCII.bind(Bin);
    let offset = 8;
    const anim = nimg.frames.length > 1;
    let pltAlpha = false;

    let cicc: Uint8Array | undefined;

    let leng = 8 + (16 + 5 + 4) + (anim ? 20 : 0);
    if (tabs["sRGB"] != null) leng += 8 + 1 + 4;
    if (tabs["pHYs"] != null) leng += 8 + 9 + 4;
    if (tabs["iCCP"] != null) {
      cicc = await deflate(tabs["iCCP"]);
      leng += 8 + 11 + 2 + cicc.length + 4;
    }
    if (nimg.ctype == 3) {
      const dl = (nimg as any).plte.length;
      for (let i = 0; i < dl; i++) if ((nimg as any).plte[i] >>> 24 != 255) pltAlpha = true;
      leng += 8 + dl * 3 + 4 + (pltAlpha ? 8 + dl * 1 + 4 : 0);
    }
    for (let j = 0; j < nimg.frames.length; j++) {
      const fr = nimg.frames[j];
      if (anim) leng += 38;
      leng += fr.cimg!.length + 12;
      if (j != 0) leng += 4;
    }
    leng += 12;

    const data = new Uint8Array(leng);
    const wr = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < 8; i++) data[i] = wr[i];

    wUi(data, offset, 13);
    offset += 4;
    wAs(data, offset, "IHDR");
    offset += 4;
    wUi(data, offset, w);
    offset += 4;
    wUi(data, offset, h);
    offset += 4;
    data[offset] = nimg.depth;
    offset++; // depth
    data[offset] = nimg.ctype;
    offset++; // ctype
    data[offset] = 0;
    offset++; // compress
    data[offset] = 0;
    offset++; // filter
    data[offset] = 0;
    offset++; // interlace
    wUi(data, offset, CRC.crc(data, offset - 17, 17));
    offset += 4; // crc

    if (tabs["sRGB"] != null) {
      wUi(data, offset, 1);
      offset += 4;
      wAs(data, offset, "sRGB");
      offset += 4;
      data[offset] = tabs["sRGB"]!;
      offset++;
      wUi(data, offset, CRC.crc(data, offset - 5, 5));
      offset += 4; // crc
    }
    if (tabs["iCCP"] != null) {
      const sl = 11 + 2 + cicc!.length;
      wUi(data, offset, sl);
      offset += 4;
      wAs(data, offset, "iCCP");
      offset += 4;
      wAs(data, offset, "ICC profile");
      offset += 11;
      offset += 2;
      data.set(cicc!, offset);
      offset += cicc!.length;
      wUi(data, offset, CRC.crc(data, offset - (sl + 4), sl + 4));
      offset += 4; // crc
    }
    if (tabs["pHYs"] != null) {
      wUi(data, offset, 9);
      offset += 4;
      wAs(data, offset, "pHYs");
      offset += 4;
      wUi(data, offset, tabs["pHYs"]![0]);
      offset += 4;
      wUi(data, offset, tabs["pHYs"]![1]);
      offset += 4;
      data[offset] = tabs["pHYs"]![2];
      offset++;
      wUi(data, offset, CRC.crc(data, offset - 13, 13));
      offset += 4; // crc
    }

    if (anim) {
      wUi(data, offset, 8);
      offset += 4;
      wAs(data, offset, "acTL");
      offset += 4;
      wUi(data, offset, nimg.frames.length);
      offset += 4;
      wUi(data, offset, tabs["loop"] != null ? tabs["loop"] : 0);
      offset += 4;
      wUi(data, offset, CRC.crc(data, offset - 12, 12));
      offset += 4; // crc
    }

    if (nimg.ctype == 3) {
      const dl = (nimg as any).plte.length;
      wUi(data, offset, dl * 3);
      offset += 4;
      wAs(data, offset, "PLTE");
      offset += 4;
      for (let i = 0; i < dl; i++) {
        const ti = i * 3;
        const c = (nimg as any).plte[i];
        const r = c & 255;
        const g = (c >>> 8) & 255;
        const b = (c >>> 16) & 255;
        data[offset + ti + 0] = r;
        data[offset + ti + 1] = g;
        data[offset + ti + 2] = b;
      }
      offset += dl * 3;
      wUi(data, offset, CRC.crc(data, offset - dl * 3 - 4, dl * 3 + 4));
      offset += 4; // crc

      if (pltAlpha) {
        wUi(data, offset, dl);
        offset += 4;
        wAs(data, offset, "tRNS");
        offset += 4;
        for (let i = 0; i < dl; i++) data[offset + i] = ((nimg as any).plte[i] >>> 24) & 255;
        offset += dl;
        wUi(data, offset, CRC.crc(data, offset - dl - 4, dl + 4));
        offset += 4; // crc
      }
    }

    let fi = 0;
    for (let j = 0; j < nimg.frames.length; j++) {
      const fr = nimg.frames[j];
      if (anim) {
        wUi(data, offset, 26);
        offset += 4;
        wAs(data, offset, "fcTL");
        offset += 4;
        wUi(data, offset, fi++);
        offset += 4;
        wUi(data, offset, fr.rect.width);
        offset += 4;
        wUi(data, offset, fr.rect.height);
        offset += 4;
        wUi(data, offset, fr.rect.x);
        offset += 4;
        wUi(data, offset, fr.rect.y);
        offset += 4;
        wUs(data, offset, dels![j]);
        offset += 2;
        wUs(data, offset, 1000);
        offset += 2;
        data[offset] = fr.dispose;
        offset++; // dispose
        data[offset] = fr.blend;
        offset++; // blend
        wUi(data, offset, CRC.crc(data, offset - 30, 30));
        offset += 4; // crc
      }

      const imgd = fr.cimg!;
      const dl = imgd.length;
      wUi(data, offset, dl + (j == 0 ? 0 : 4));
      offset += 4;
      const ioff = offset;
      wAs(data, offset, j == 0 ? "IDAT" : "fdAT");
      offset += 4;
      if (j != 0) {
        wUi(data, offset, fi++);
        offset += 4;
      }
      data.set(imgd, offset);
      offset += dl;
      wUi(data, offset, CRC.crc(data, ioff, offset - ioff));
      offset += 4; // crc
    }

    wUi(data, offset, 0);
    offset += 4;
    wAs(data, offset, "IEND");
    offset += 4;
    wUi(data, offset, CRC.crc(data, offset - 4, 4));
    offset += 4; // crc

    return data.buffer;
  }

  static async #compressPNG(out: Image, filter: number, levelZero?: boolean) {
    for (let i = 0; i < out.frames.length; i++) {
      const frm = out.frames[i];
      const nh = frm.rect.height;
      const fdata = new Uint8Array(nh * frm.bpl! + nh);
      frm.cimg = await this.#encodeFilterZero(
        frm.img!,
        nh,
        frm.bpp!,
        frm.bpl!,
        fdata,
        filter,
        levelZero,
      );
    }
  }

  static #compress(bufs: ArrayBuffer[], w: number, h: number, ps: number, prms: any[]) {
    const onlyBlend = prms[0];
    const evenCrd = prms[1];
    const forbidPrev = prms[2];
    const minBits = prms[3];
    const forbidPlte = prms[4];
    const dith = prms[5];

    let ctype = 6;
    let depth = 8;
    let alphaAnd = 255;

    for (let j = 0; j < bufs.length; j++) {
      const img = new Uint8Array(bufs[j]);
      const ilen = img.length;
      for (let i = 0; i < ilen; i += 4) alphaAnd &= img[i + 3];
    }
    const gotAlpha = alphaAnd != 255;

    const frms = this.#framize(bufs, w, h, onlyBlend, evenCrd, forbidPrev);

    const cmap: any = {};
    const plte: number[] = [];
    const inds: Uint8Array[] = [];

    if (ps != 0) {
      const nbufs: ArrayBufferLike[] = [];
      for (let i = 0; i < frms.length; i++) nbufs.push(frms[i].img!.buffer);

      const abuf = this.#concatRGBA(nbufs);
      const qres = Quantizer.quantize(abuf, ps);

      for (let i = 0; i < qres.plte.length; i++) plte.push(qres.plte[i].est.rgba);

      let cof = 0;
      for (let i = 0; i < frms.length; i++) {
        const frm = frms[i];
        const bln = frm.img!.length;
        const ind = new Uint8Array(qres.inds.buffer, cof >> 2, bln >> 2);
        inds.push(ind);
        const bb = new Uint8Array(qres.abuf, cof, bln);

        if (dith) this.#dither(frm.img!, frm.rect.width, frm.rect.height, plte, bb, ind);
        frm.img!.set(bb);
        cof += bln;
      }
    } else {
      for (let j = 0; j < frms.length; j++) {
        const frm = frms[j];
        const img32 = new Uint32Array(frm.img!.buffer);
        const nw = frm.rect.width;
        const ilen = img32.length;
        const ind = new Uint8Array(ilen);
        inds.push(ind);
        for (let i = 0; i < ilen; i++) {
          const c = img32[i];
          if (i != 0 && c == img32[i - 1]) ind[i] = ind[i - 1];
          else if (i > nw && c == img32[i - nw]) ind[i] = ind[i - nw];
          else {
            let cmc = cmap[c];
            if (cmc == null) {
              cmap[c] = cmc = plte.length;
              plte.push(c);
              if (plte.length >= 300) break;
            }
            ind[i] = cmc;
          }
        }
      }
    }

    const cc = plte.length;
    if (cc <= 256 && forbidPlte == false) {
      if (cc <= 2) depth = 1;
      else if (cc <= 4) depth = 2;
      else if (cc <= 16) depth = 4;
      else depth = 8;
      depth = Math.max(depth, minBits);
    }

    for (let j = 0; j < frms.length; j++) {
      const frm = frms[j];
      const nw = frm.rect.width;
      const nh = frm.rect.height;
      let cimg = frm.img!;
      let bpl = 4 * nw;
      let bpp = 4;
      if (cc <= 256 && forbidPlte == false) {
        bpl = Math.ceil((depth * nw) / 8);
        const nimg = new Uint8Array(bpl * nh);
        const inj = inds[j];
        for (let y = 0; y < nh; y++) {
          const i = y * bpl;
          const ii = y * nw;
          if (depth == 8) for (let x = 0; x < nw; x++) nimg[i + x] = inj[ii + x];
          else if (depth == 4)
            for (let x = 0; x < nw; x++) nimg[i + (x >> 1)] |= inj[ii + x] << (4 - (x & 1) * 4);
          else if (depth == 2)
            for (let x = 0; x < nw; x++) nimg[i + (x >> 2)] |= inj[ii + x] << (6 - (x & 3) * 2);
          else if (depth == 1)
            for (let x = 0; x < nw; x++) nimg[i + (x >> 3)] |= inj[ii + x] << (7 - (x & 7) * 1);
        }
        cimg = nimg;
        ctype = 3;
        bpp = 1;
      } else if (gotAlpha == false && frms.length == 1) {
        const nimg = new Uint8Array(nw * nh * 3);
        const area = nw * nh;
        for (let i = 0; i < area; i++) {
          const ti = i * 3;
          const qi = i * 4;
          nimg[ti] = cimg[qi];
          nimg[ti + 1] = cimg[qi + 1];
          nimg[ti + 2] = cimg[qi + 2];
        }
        cimg = nimg;
        ctype = 2;
        bpp = 3;
        bpl = 3 * nw;
      }
      frm.img = cimg;
      frm.bpl = bpl;
      frm.bpp = bpp;
    }

    return { ctype: ctype, depth: depth, plte: plte, frames: frms };
  }

  static #framize(
    bufs: ArrayBuffer[],
    w: number,
    h: number,
    alwaysBlend: boolean,
    evenCrd: boolean,
    forbidPrev: boolean,
  ) {
    const frms: ImageFrame[] = [];
    for (let j = 0; j < bufs.length; j++) {
      const cimg = new Uint8Array(bufs[j]);
      const cimg32 = new Uint32Array(cimg.buffer);
      let nimg: Uint8Array;

      let nx = 0;
      let ny = 0;
      let nw = w;
      let nh = h;
      let blend = alwaysBlend ? 1 : 0;
      if (j != 0) {
        const tlim = forbidPrev || alwaysBlend || j == 1 || frms[j - 2].dispose != 0 ? 1 : 2;
        let tstp = 0;
        let tarea = 1e9;
        for (let it = 0; it < tlim; it++) {
          const p32 = new Uint32Array(bufs[j - 1 - it]);
          let mix = w;
          let miy = h;
          let max = -1;
          let may = -1;
          for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++) {
              const i = y * w + x;
              if (cimg32[i] != p32[i]) {
                if (x < mix) mix = x;
                if (x > max) max = x;
                if (y < miy) miy = y;
                if (y > may) may = y;
              }
            }
          if (max == -1) mix = miy = max = may = 0;
          if (evenCrd) {
            if ((mix & 1) == 1) mix--;
            if ((miy & 1) == 1) miy--;
          }
          const sarea = (max - mix + 1) * (may - miy + 1);
          if (sarea < tarea) {
            tarea = sarea;
            tstp = it;
            nx = mix;
            ny = miy;
            nw = max - mix + 1;
            nh = may - miy + 1;
          }
        }

        const pimg = new Uint8Array(bufs[j - 1 - tstp]);
        if (tstp == 1) frms[j - 1].dispose = 2;

        nimg = new Uint8Array(nw * nh * 4);
        this.#copyTile(pimg, w, h, nimg, nw, nh, -nx, -ny, 0);

        blend = this.#copyTile(cimg, w, h, nimg, nw, nh, -nx, -ny, 3) ? 1 : 0;
        if (blend == 1)
          this.#prepareDiff(cimg, w, h, nimg, {
            x: nx,
            y: ny,
            width: nw,
            height: nh,
          });
        else this.#copyTile(cimg, w, h, nimg, nw, nh, -nx, -ny, 0);
      } else nimg = cimg.slice(0);

      frms.push({
        rect: { x: nx, y: ny, width: nw, height: nh },
        img: nimg,
        blend: blend,
        dispose: 0,
        delay: 0,
      });
    }

    if (alwaysBlend)
      for (let j = 0; j < frms.length; j++) {
        const frm = frms[j];
        if (frm.blend == 1) continue;
        const r0 = frm.rect;
        const r1 = frms[j - 1].rect;
        const miX = Math.min(r0.x, r1.x);
        const miY = Math.min(r0.y, r1.y);
        const maX = Math.max(r0.x + r0.width, r1.x + r1.width);
        const maY = Math.max(r0.y + r0.height, r1.y + r1.height);
        const r = { x: miX, y: miY, width: maX - miX, height: maY - miY };

        frms[j - 1].dispose = 1;
        if (j - 1 != 0) this.#updateFrame(bufs, w, h, frms, j - 1, r, evenCrd);
        this.#updateFrame(bufs, w, h, frms, j, r, evenCrd);
      }
    return frms;
  }

  static #updateFrame(
    bufs: ArrayBuffer[],
    w: number,
    h: number,
    frms: ImageFrame[],
    i: number,
    r: { x: number; y: number; width: number; height: number },
    evenCrd: boolean,
  ) {
    const U8 = Uint8Array;
    const U32 = Uint32Array;
    const pimg = new U8(bufs[i - 1]);
    const pimg32 = new U32(bufs[i - 1]);
    const nimg = i + 1 < bufs.length ? new U8(bufs[i + 1]) : null;
    const cimg = new U8(bufs[i]);
    const cimg32 = new U32(cimg.buffer);

    let mix = w;
    let miy = h;
    let max = -1;
    let may = -1;
    for (let y = 0; y < r.height; y++)
      for (let x = 0; x < r.width; x++) {
        const cx = r.x + x;
        const cy = r.y + y;
        const j = cy * w + cx;
        const cc = cimg32[j];
        if (
          cc == 0 ||
          (frms[i - 1].dispose == 0 &&
            pimg32[j] == cc &&
            (nimg == null || (nimg as any)[j * 4 + 3] != 0))
        ) {
        } else {
          if (cx < mix) mix = cx;
          if (cx > max) max = cx;
          if (cy < miy) miy = cy;
          if (cy > may) may = cy;
        }
      }
    if (max == -1) mix = miy = max = may = 0;
    if (evenCrd) {
      if ((mix & 1) == 1) mix--;
      if ((miy & 1) == 1) miy--;
    }
    r = { x: mix, y: miy, width: max - mix + 1, height: may - miy + 1 };

    const fr = frms[i];
    fr.rect = r;
    fr.blend = 1;
    fr.img = new Uint8Array(r.width * r.height * 4);
    if (frms[i - 1].dispose == 0) {
      this.#copyTile(pimg, w, h, fr.img, r.width, r.height, -r.x, -r.y, 0);
      this.#prepareDiff(cimg, w, h, fr.img, r);
    } else this.#copyTile(cimg, w, h, fr.img, r.width, r.height, -r.x, -r.y, 0);
  }

  static #prepareDiff(
    cimg: Uint8Array,
    w: number,
    h: number,
    nimg: Uint8Array,
    rec: { x: number; y: number; width: number; height: number },
  ) {
    this.#copyTile(cimg, w, h, nimg, rec.width, rec.height, -rec.x, -rec.y, 2);
  }

  static async #encodeFilterZero(
    img: Uint8Array,
    h: number,
    bpp: number,
    bpl: number,
    data: Uint8Array,
    filter: number,
    _levelZero?: boolean,
  ) {
    const fls: Uint8Array[] = [];
    let ftry = [0, 1, 2, 3, 4];
    if (filter != -1) ftry = [filter];
    else if (h * bpl > 500000 || bpp == 1) ftry = [0];

    for (let i = 0; i < ftry.length; i++) {
      for (let y = 0; y < h; y++) this.#filterLine(data, img, y, bpl, bpp, ftry[i]);
      // Use level 0 for fast compression when levelZero is set
      // Web CompressionStream doesn't support compression levels, so we always use default
      fls.push(await deflate(data));
    }

    let ti = 0;
    let tsize = 1e9;
    for (let i = 0; i < fls.length; i++)
      if (fls[i].length < tsize) {
        ti = i;
        tsize = fls[i].length;
      }
    return fls[ti];
  }

  static #filterLine(
    data: Uint8Array,
    img: Uint8Array,
    y: number,
    bpl: number,
    bpp: number,
    type: number,
  ) {
    const i = y * bpl;
    let di = i + y;
    data[di] = type;
    di++;

    if (type == 0) {
      if (bpl < 500) for (let x = 0; x < bpl; x++) data[di + x] = img[i + x];
      else data.set(new Uint8Array(img.buffer, i, bpl), di);
    } else if (type == 1) {
      for (let x = 0; x < bpp; x++) data[di + x] = img[i + x];
      for (let x = bpp; x < bpl; x++) data[di + x] = (img[i + x] - img[i + x - bpp] + 256) & 255;
    } else if (y == 0) {
      for (let x = 0; x < bpp; x++) data[di + x] = img[i + x];

      if (type == 2) for (let x = bpp; x < bpl; x++) data[di + x] = img[i + x];
      if (type == 3)
        for (let x = bpp; x < bpl; x++)
          data[di + x] = (img[i + x] - (img[i + x - bpp] >> 1) + 256) & 255;
      if (type == 4)
        for (let x = bpp; x < bpl; x++)
          data[di + x] = (img[i + x] - this.#paeth(img[i + x - bpp], 0, 0) + 256) & 255;
    } else {
      if (type == 2) {
        for (let x = 0; x < bpl; x++) data[di + x] = (img[i + x] + 256 - img[i + x - bpl]) & 255;
      }
      if (type == 3) {
        for (let x = 0; x < bpp; x++)
          data[di + x] = (img[i + x] + 256 - (img[i + x - bpl] >> 1)) & 255;
        for (let x = bpp; x < bpl; x++)
          data[di + x] = (img[i + x] + 256 - ((img[i + x - bpl] + img[i + x - bpp]) >> 1)) & 255;
      }
      if (type == 4) {
        for (let x = 0; x < bpp; x++)
          data[di + x] = (img[i + x] + 256 - this.#paeth(0, img[i + x - bpl], 0)) & 255;
        for (let x = bpp; x < bpl; x++)
          data[di + x] =
            (img[i + x] +
              256 -
              this.#paeth(img[i + x - bpp], img[i + x - bpl], img[i + x - bpp - bpl])) &
            255;
      }
    }
  }

  static #concatRGBA(bufs: ArrayBufferLike[]) {
    let tlen = 0;
    for (let i = 0; i < bufs.length; i++) tlen += bufs[i].byteLength;
    const nimg = new Uint8Array(tlen);
    let noff = 0;
    for (let i = 0; i < bufs.length; i++) {
      const img = new Uint8Array(bufs[i]);
      const il = img.length;
      for (let j = 0; j < il; j += 4) {
        let r = img[j];
        let g = img[j + 1];
        let b = img[j + 2];
        let a = img[j + 3];
        if (a == 0) r = g = b = 0;
        nimg[noff + j] = r;
        nimg[noff + j + 1] = g;
        nimg[noff + j + 2] = b;
        nimg[noff + j + 3] = a;
      }
      noff += il;
    }
    return nimg.buffer;
  }
}

export interface ImageFrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageFrame {
  rect: ImageFrameRect;
  delay: number;
  dispose: number;
  blend: number;
  data?: Uint8Array; // Decoded data
  img?: Uint8Array; // Raw buffer for encoding
  cimg?: Uint8Array; // Compressed data for encoding
  bpp?: number;
  bpl?: number;
}

export interface ImageTabACTL {
  num_frames: number;
  num_plays: number;
}

export interface ImageTabText {
  [key: string]: string;
}

export interface ImageTabs {
  acTL?: ImageTabACTL;
  pHYs?: number[];
  cHRM?: number[];
  tEXt?: ImageTabText;
  iTXt?: ImageTabText;
  PLTE?: number[];
  hIST?: number[];
  tRNS?: number | number[]; // Depends on ctype
  gAMA?: number;
  sRGB?: number;
  bKGD?: number | number[]; // Depends on ctype
  loop?: number;
  iCCP?: Uint8Array;
  CgBI?: Uint8Array;
  [key: string]: any; // Allow other chunks
}

export interface Image {
  width: number;
  height: number;
  depth: number;
  ctype: number;
  frames: ImageFrame[];
  tabs: ImageTabs;
  data: Uint8Array;
  interlace?: number; // Internal use during decode
  compress?: number;
  filter?: number;
}
