import { describe, expect, test } from "vitest";
import UPNG from "../src/index.js";

describe("UPNG public API", () => {
  test("exposes encode/decode helpers", () => {
    expect(typeof UPNG.encode).toBe("function");
    expect(typeof UPNG.decode).toBe("function");
  });
});
