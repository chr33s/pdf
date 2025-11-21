import { describe, expect, it } from "vitest";
import UPNG from "../src/index.js";

describe("UPNG public API", () => {
  it("exposes encode/decode helpers", () => {
    expect(typeof UPNG.encode).toBe("function");
    expect(typeof UPNG.decode).toBe("function");
  });
});
