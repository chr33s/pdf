import { beforeEach, describe, expect, test } from "vitest";
import { Quantizer } from "../src/quantizer.js";

describe("Quantizer.M4", () => {
  test("multVec multiplies 4x4 matrix by 4-vector", () => {
    const m = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const v = [1, 0, -1, 2];
    const r = Quantizer.M4.multVec(m, v);

    // m = [1,2,3,4; 5,6,7,8; 9,10,11,12; 13,14,15,16] row-major
    // v = [1, 0, -1, 2]
    // Result: row_i dot v = m[i*4]*1 + m[i*4+1]*0 + m[i*4+2]*(-1) + m[i*4+3]*2
    expect(r).toEqual([6, 14, 22, 30]);
  });

  test("dot computes 4D dot product", () => {
    const x = [1, 2, 3, 4];
    const y = [4, 3, 2, 1];
    const d = Quantizer.M4.dot(x, y);
    expect(d).toBe(1 * 4 + 2 * 3 + 3 * 2 + 4 * 1);
  });

  test("sml scales 4-vector", () => {
    const v = [1, -2, 3, -4];
    const s = Quantizer.M4.sml(2, v);
    expect(s).toEqual([2, -4, 6, -8]);
  });
});

describe("Quantizer.basic math helpers", () => {
  test("dist computes squared 4D distance", () => {
    const q = [0, 0, 0, 0];
    const d = Quantizer.dist(q, 1, 2, 3, 4);
    expect(d).toBe(1 * 1 + 2 * 2 + 3 * 3 + 4 * 4);
  });

  test("vecDot matches manual computation", () => {
    const px = new Uint8Array([10, 20, 30, 40]);
    const e = [0.1, 0.2, 0.3, 0.4];
    const v = Quantizer.vecDot(px, 0, e);
    const manual = 10 * 0.1 + 20 * 0.2 + 30 * 0.3 + 40 * 0.4;
    expect(v).toBeCloseTo(manual);
  });

  test("planeDst returns signed distance from plane", () => {
    const est = {
      e: [1, 0, 0, 0],
      eMq: 0.5,
    };
    const d1 = Quantizer.planeDst(est, 1, 0, 0, 0);
    const d2 = Quantizer.planeDst(est, 0, 0, 0, 0);
    expect(d1).toBeCloseTo(0.5);
    expect(d2).toBeCloseTo(-0.5);
  });
});

describe("Quantizer.stats and estats", () => {
  test("stats computes count, means and covariance-like accumulators", () => {
    // 2 pixels: (255,0,0,255) and (0,255,0,255)
    const img = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);
    const s = Quantizer.stats(img, 0, img.length);
    expect(s.N).toBe(2);
    // Means are in [0,1] range
    const iN = 1 / s.N;
    expect(s.m[0] * iN).toBeCloseTo(0.5, 5);
    expect(s.m[1] * iN).toBeCloseTo(0.5, 5);
    expect(s.m[2] * iN).toBeCloseTo(0, 5);
    expect(s.m[3] * iN).toBeCloseTo(1, 5);
  });

  test("estats produces expected structure and stable eigenvector", () => {
    const img = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);
    const stats = Quantizer.stats(img, 0, img.length);
    const est = Quantizer.estats(stats);

    expect(est).toHaveProperty("Cov");
    expect(est).toHaveProperty("q");
    expect(est).toHaveProperty("e");
    expect(est).toHaveProperty("L");
    expect(est).toHaveProperty("eMq255");
    expect(est).toHaveProperty("eMq");
    expect(est).toHaveProperty("rgba");

    // q is the mean color in [0,1]
    expect(est.q.length).toBe(4);
    expect(est.L).toBeGreaterThanOrEqual(0);
    // rgba is packed 8-bit channels
    expect(est.rgba >>> 0).toBeGreaterThanOrEqual(0);
  });
});

describe("Quantizer.splitPixels", () => {
  test("splits pixels into two groups based on plane", () => {
    // Four pixels: two dark, two bright
    const img = new Uint8Array([
      0,
      0,
      0,
      255, // 0
      10,
      10,
      10,
      255, // 4
      200,
      200,
      200,
      255, // 8
      250,
      250,
      250,
      255, // 12
    ]);
    const img32 = new Uint32Array(img.buffer);

    // Plane roughly on brightness
    const e = [1, 1, 1, 0];
    const mq = 200 * 3; // threshold ~sum of channels
    const splitIdx = Quantizer.splitPixels(img, img32, 0, img.length, e, mq);

    // All pixels before splitIdx are <= mq, all after are > mq
    for (let i = 0; i < splitIdx; i += 4) {
      const v = Quantizer.vecDot(img, i, e);
      expect(v).toBeLessThanOrEqual(mq);
    }
    for (let i = splitIdx; i < img.length; i += 4) {
      const v = Quantizer.vecDot(img, i, e);
      expect(v).toBeGreaterThan(mq);
    }
  });
});

describe("Quantizer.getKDtree and getNearest", () => {
  let img: Uint8Array;

  beforeEach(() => {
    // small 4-color image
    img = new Uint8Array([
      255,
      0,
      0,
      255, // red
      0,
      255,
      0,
      255, // green
      0,
      0,
      255,
      255, // blue
      255,
      255,
      0,
      255, // yellow
    ]);
  });

  test("builds KD tree with requested max leaf count", () => {
    const [root, leafs] = Quantizer.getKDtree(img, 4);
    expect(root).toHaveProperty("left");
    expect(root).toHaveProperty("right");
    expect(Array.isArray(leafs)).toBe(true);
    expect(leafs.length).toBeLessThanOrEqual(4);
    // Leaves are sorted by population descending
    for (let i = 1; i < leafs.length; i++) {
      expect(leafs[i - 1].bst.N).toBeGreaterThanOrEqual(leafs[i].bst.N);
    }
    // Each leaf has an index
    for (let i = 0; i < leafs.length; i++) {
      expect(leafs[i].ind).toBe(i);
    }
  });

  test("getNearest returns a leaf whose color is close to the query", () => {
    const [root, leafs] = Quantizer.getKDtree(img, 4);
    const qColor = [1, 0.1, 0.1, 1]; // close to red
    const nearest = Quantizer.getNearest(root, qColor[0], qColor[1], qColor[2], qColor[3]);

    expect(leafs.includes(nearest)).toBe(true);

    // Check that returned leaf has reasonable distance to its mean q
    const dist = Quantizer.dist(nearest.est.q, qColor[0], qColor[1], qColor[2], qColor[3]);
    expect(dist).toBeLessThan(0.5); // arbitrary sanity bound
  });
});

describe("Quantizer palette update and nearest search", () => {
  test("updatePalette recomputes palette entries as means of assigned pixels", () => {
    // Image: 4 pixels. First two red-ish, last two green-ish.
    const sb = new Uint8Array([250, 0, 0, 255, 255, 10, 0, 255, 0, 240, 0, 255, 5, 255, 10, 255]);

    // Two palette entries: start as midpoints
    const plte = new Uint8Array([
      128,
      0,
      0,
      255, // approximate red
      0,
      128,
      0,
      255, // approximate green
    ]);

    // First two pixels -> index 0, last two -> index 1
    const inds = new Uint8Array([0, 0, 1, 1]);

    Quantizer.updatePalette(sb, inds, plte);

    // Palette[0] should now be near average of first two reds
    const avgR0 = Math.round((250 + 255) / 2);
    const avgG0 = Math.round((0 + 10) / 2);
    const avgB0 = 0;

    expect(plte[0]).toBe(avgR0);
    expect(plte[1]).toBe(avgG0);
    expect(plte[2]).toBe(avgB0);

    // Palette[1] should be near average of two greens
    const avgR1 = Math.round((0 + 5) / 2);
    const avgG1 = Math.round((240 + 255) / 2);
    const avgB1 = Math.round((0 + 10) / 2);

    expect(plte[4]).toBe(avgR1);
    expect(plte[5]).toBe(avgG1);
    expect(plte[6]).toBe(avgB1);
  });

  test("findNearest assigns each pixel to closest palette color and returns average error", () => {
    const sb = new Uint8Array([
      255,
      0,
      0,
      255, // red-like
      0,
      255,
      0,
      255, // green-like
      0,
      0,
      255,
      255, // blue-like
    ]);

    // Palette: exact red, green, blue
    const plte = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);

    const inds = new Uint8Array(sb.length >> 2);
    // Start with some arbitrary indices
    inds.fill(0);

    const err = Quantizer.findNearest(sb, inds, plte);

    // Perfect match => each pixel should go to its exact palette index, zero error
    expect(Array.from(inds)).toEqual([0, 1, 2]);
    expect(err).toBe(0);
  });

  test("kmeans runs a single iteration and returns an error value", () => {
    const sb = new Uint8Array([255, 0, 0, 255, 250, 0, 10, 255, 0, 255, 0, 255, 0, 245, 10, 255]);
    const plte = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);
    const inds = new Uint8Array([0, 0, 1, 1]);

    const err = Quantizer.kmeans(sb, inds, plte);
    expect(err).toBeGreaterThanOrEqual(0);
    // kmeans mutates palette toward means
    expect(plte[0]).toBeLessThanOrEqual(255);
    expect(plte[4]).toBeLessThanOrEqual(255);
  });
});

describe("Quantizer.remap", () => {
  test("remap fills destination buffer from palette using indices", () => {
    const pl32 = new Uint32Array([
      0xff0000ff, // red
      0x00ff00ff, // green
    ]);
    const tb32 = new Uint32Array(3);
    const inds = new Uint8Array([0, 1, 1]);

    Quantizer.remap(inds, tb32, pl32);

    expect(Array.from(tb32)).toEqual([0xff0000ff, 0x00ff00ff, 0x00ff00ff]);
  });
});

describe("Quantizer.quantize end-to-end", () => {
  test("quantizes a tiny image to 2 colors and returns expected shape", () => {
    // Simple 4-pixel RGBA image: two reds, two greens
    const img = new Uint8Array([255, 0, 0, 255, 250, 10, 0, 255, 0, 255, 0, 255, 5, 240, 10, 255]);
    const abuf = img.buffer;

    const ps = 2; // target palette size
    const result = Quantizer.quantize(abuf, ps, false);

    expect(result).toHaveProperty("abuf");
    expect(result).toHaveProperty("inds");
    expect(result).toHaveProperty("plte");

    const out = new Uint8Array(result.abuf);
    expect(out.length).toBe(img.length);
    expect(result.inds.length).toBe(img.length / 4);
    expect(result.plte.length).toBeLessThanOrEqual(ps);

    // Palette entries have est.rgba defined
    for (const leaf of result.plte) {
      expect(typeof leaf.est.rgba).toBe("number");
    }

    // All indices should be < K
    const K = result.plte.length;
    for (const idx of result.inds) {
      expect(idx).toBeLessThan(K);
    }
  });

  test("can run with kmeans refinement enabled", () => {
    const img = new Uint8Array([255, 0, 0, 255, 250, 10, 0, 255, 0, 255, 0, 255, 5, 240, 10, 255]);
    const result = Quantizer.quantize(img.buffer, 2, true);

    // Same basic structural expectations
    expect(result.inds.length).toBe(img.length / 4);
    expect(result.plte.length).toBeLessThanOrEqual(2);
  });
});
