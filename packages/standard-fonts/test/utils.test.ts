import { describe, expect, test } from "vitest";
import { decompressJson, padStart } from "../src/utils.js";

describe("utils", () => {
  describe("padStart", () => {
    test("should pad string to specified length", () => {
      expect(padStart("42", 4, "0")).toBe("0042");
    });

    test("should not pad if string is already long enough", () => {
      expect(padStart("1234", 4, "0")).toBe("1234");
    });

    test("should not pad if string is longer than specified length", () => {
      expect(padStart("12345", 4, "0")).toBe("12345");
    });

    test("should handle empty string", () => {
      expect(padStart("", 3, "x")).toBe("xxx");
    });

    test("should handle single character padding", () => {
      expect(padStart("a", 5, "-")).toBe("----a");
    });
  });

  describe("decompressJson", () => {
    // Note: This test requires a valid compressed JSON string
    // The actual compressed format is base64-encoded deflated data
    test("should be a function", () => {
      expect(typeof decompressJson).toBe("function");
    });
  });
});
