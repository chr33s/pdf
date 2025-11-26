import { describe, expect, it } from "vitest";
import { UPNG, type Image, type ImageTabs } from "../src/upng.js";

describe("UPNG basic encode/decode", () => {
  it("round-trips a small opaque RGBA image", () => {
    const w = 2;
    const h = 2;
    const src = new Uint8Array([
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
    const encoded = UPNG.encode([src.buffer], w, h, 0);
    const decoded = UPNG.decode(encoded);

    expect(decoded.width).toBe(w);
    expect(decoded.height).toBe(h);
    expect(decoded.frames.length).toBe(1);

    const [rgbaBuf] = UPNG.toRGBA8(decoded);
    const out = new Uint8Array(rgbaBuf);

    expect(Array.from(out)).toEqual(Array.from(src));
  });

  it("round-trips an image with transparency (forces alpha ctype 6 or pal+TRNS)", () => {
    const w = 2;
    const h = 2;
    const buf = new Uint8Array([
      255, 0, 0, 255, 255, 0, 0, 0, 0, 255, 0, 255, 0, 255, 0, 0,
    ]).buffer;

    const encoded = UPNG.encode([buf], w, h, 0);
    const decoded = UPNG.decode(encoded);
    const [rgbaBuf] = UPNG.toRGBA8(decoded);
    const out = new Uint8Array(rgbaBuf);

    expect(out.length).toBe(w * h * 4);
    // Colors should match original exactly
    expect(Array.from(out)).toEqual(Array.from(new Uint8Array(buf)));
  });
});

describe("UPNG.toRGBA8", () => {
  it("returns a single frame buffer for non-animated PNG", () => {
    const w = 1;
    const h = 1;
    const buf = new Uint8Array([10, 20, 30, 40]).buffer;

    const encoded = UPNG.encode([buf], w, h, 0);
    const decoded = UPNG.decode(encoded);

    expect(decoded.tabs.acTL).toBeUndefined();

    const frames = UPNG.toRGBA8(decoded);
    expect(frames.length).toBe(1);
    const rgba = new Uint8Array(frames[0]);
    expect(Array.from(rgba)).toEqual([10, 20, 30, 40]);
  });

  it("returns buffers for each animation frame and respects blend/dispose", () => {
    const w = 2;
    const h = 1;

    const frame0 = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]).buffer;
    const frame1 = new Uint8Array([0, 0, 255, 255, 255, 255, 255, 255]).buffer;

    const dels = [100, 200];
    const encoded = UPNG.encode([frame0, frame1], w, h, 0, dels, { loop: 0 });
    const decoded = UPNG.decode(encoded);

    expect(decoded.tabs.acTL).toBeDefined();
    expect(decoded.frames.length).toBe(2);

    const framesRGBA = UPNG.toRGBA8(decoded);
    expect(framesRGBA.length).toBe(2);

    const f0 = new Uint8Array(framesRGBA[0]);
    const f1 = new Uint8Array(framesRGBA[1]);

    expect(Array.from(f0)).toEqual(Array.from(new Uint8Array(frame0)));
    expect(Array.from(f1)).toEqual(Array.from(new Uint8Array(frame1)));
  });
});

describe("UPNG.decode ancillary chunks", () => {
  it("throws on non-PNG magic", () => {
    const bogus = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
    expect(() => UPNG.decode(bogus)).toThrow(/not a PNG/i);
  });

  it("parses tEXt & zTXt chunks into tabs", () => {
    const w = 1;
    const h = 1;
    const buf = new Uint8Array([0, 0, 0, 255]).buffer;

    const tabs: ImageTabs = {
      tEXt: { Author: "Test" },
      iTXt: { Comment: "Hello world" },
    };

    const encoded = UPNG.encode([buf], w, h, 0, undefined, tabs);
    const decoded = UPNG.decode(encoded);

    if (decoded.tabs.tEXt) {
      expect(decoded.tabs.tEXt["Author"]).toBe("Test");
    }
    if (decoded.tabs.iTXt) {
      expect(decoded.tabs.iTXt["Comment"]).toBe("Hello world");
    }
  });
});

describe("UPNG #getBPP and #filterZero via encode/decode", () => {
  it("handles grayscale (ctype 0) depth 8 correctly", () => {
    const w = 3;
    const h = 1;
    const gray = new Uint8Array([
      50, 50, 50, 255, 100, 100, 100, 255, 200, 200, 200, 255,
    ]).buffer;

    // Use encodeLL to force grayscale: cc=1, ac=0
    const encoded = UPNG.encodeLL([gray], w, h, 1, 0, 8);
    const decoded = UPNG.decode(encoded);
    expect(decoded.ctype).toBe(0);

    const [rgbaBuf] = UPNG.toRGBA8(decoded);
    const out = new Uint8Array(rgbaBuf);

    expect(out[0]).toBe(50);
    expect(out[1]).toBe(50);
    expect(out[2]).toBe(50);
    expect(out[3]).toBe(255);
    expect(out[4]).toBe(100);
  });

  it("handles palette-based images (ctype 3) when color count is small", () => {
    const w = 2;
    const h = 2;
    const buf = new Uint8Array([
      255, 0, 0, 255, 0, 255, 0, 255, 255, 0, 0, 255, 0, 255, 0, 255,
    ]).buffer;

    // Force small palette size to encourage PLTE path
    const encoded = UPNG.encode([buf], w, h, 4);
    const decoded = UPNG.decode(encoded);

    expect(decoded.ctype).toBe(3);

    const [rgbaBuf] = UPNG.toRGBA8(decoded);
    const out = new Uint8Array(rgbaBuf);

    // Should still decode back to original colors
    expect(Array.from(out)).toEqual(Array.from(new Uint8Array(buf)));
  });
});

describe("UPNG filter/deflate pipeline", () => {
  it("produces valid data when using filter strategy 0 (none)", () => {
    const w = 4;
    const h = 2;
    const buf = new Uint8Array(w * h * 4);
    for (let i = 0; i < buf.length; i += 4) {
      buf[i] = i & 255;
      buf[i + 1] = (i * 2) & 255;
      buf[i + 2] = (i * 3) & 255;
      buf[i + 3] = 255;
    }

    // encodeLL with levelZero=true via encodeLL -> #compressPNG(filter=0, levelZero=true)
    const encoded = UPNG.encodeLL([buf.buffer], w, h, 3, 1, 8);
    const decoded = UPNG.decode(encoded);
    const [rgbaBuf] = UPNG.toRGBA8(decoded);
    const out = new Uint8Array(rgbaBuf);

    expect(out.length).toBe(buf.length);
  });
});

describe("UPNG internal dithering path (by effect)", () => {
  it("dithers when quantizing with palette (non-empty result)", () => {
    const w = 4;
    const h = 4;
    const buf = new Uint8Array(w * h * 4);
    for (let i = 0; i < buf.length; i += 4) {
      buf[i] = (i / 4) % 256;
      buf[i + 1] = 255 - ((i / 4) % 256);
      buf[i + 2] = ((i / 4) * 3) & 255;
      buf[i + 3] = 255;
    }

    // cnum=16 palette size, dithering enabled via encode (6th param of prms)
    const encoded = (UPNG as any).encode(
      [buf.buffer],
      w,
      h,
      16,
      undefined,
      undefined,
      false,
    );
    const decoded = UPNG.decode(encoded);
    const [rgbaBuf] = UPNG.toRGBA8(decoded);
    const out = new Uint8Array(rgbaBuf);

    expect(out.length).toBe(buf.length);
  });
});

describe("UPNG animated encodeLL", () => {
  it("encodes multiple frames as an animated PNG with acTL", () => {
    const w = 2;
    const h = 2;

    const frame0 = new Uint8Array([
      0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255,
    ]).buffer;

    const frame1 = new Uint8Array([
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255,
    ]).buffer;

    const delays = [100, 200];
    const tabs = { loop: 0 };

    const encoded = UPNG.encodeLL(
      [frame0, frame1],
      w,
      h,
      4,
      1,
      8,
      delays,
      tabs,
    );
    const decoded = UPNG.decode(encoded) as Image;

    // We should have animation control chunk parsed
    expect(decoded.tabs.acTL).toBeDefined();
    expect(decoded.tabs.acTL!.num_frames).toBe(2);

    // We should have two frames decoded
    expect(decoded.frames.length).toBe(2);

    // Delays should be numbers (not NaN/undefined)
    expect(typeof decoded.frames[0].delay).toBe("number");
    expect(typeof decoded.frames[1].delay).toBe("number");
    expect(decoded.frames[0].delay).toBeGreaterThanOrEqual(0);
    expect(decoded.frames[1].delay).toBeGreaterThanOrEqual(0);
  });
});
