import { describe, expect, test } from "vitest";
import { addAll, equal, union } from "../src/utils.js";

describe("utils", () => {
  describe("union", () => {
    test("should return union of two sets", () => {
      const a = new Set([1, 2, 3]);
      const b = new Set([3, 4, 5]);
      const result = union(a, b);
      expect(result).toEqual(new Set([1, 2, 3, 4, 5]));
    });

    test("should not modify original sets", () => {
      const a = new Set([1, 2]);
      const b = new Set([3, 4]);
      union(a, b);
      expect(a).toEqual(new Set([1, 2]));
      expect(b).toEqual(new Set([3, 4]));
    });

    test("should handle empty sets", () => {
      const a = new Set<number>();
      const b = new Set([1, 2]);
      expect(union(a, b)).toEqual(new Set([1, 2]));
      expect(union(b, a)).toEqual(new Set([1, 2]));
    });

    test("should handle both empty sets", () => {
      const a = new Set<number>();
      const b = new Set<number>();
      expect(union(a, b)).toEqual(new Set());
    });

    test("should work with iterable as second argument", () => {
      const a = new Set([1, 2]);
      const b = [3, 4];
      const result = union(a, b);
      expect(result).toEqual(new Set([1, 2, 3, 4]));
    });
  });

  describe("addAll", () => {
    test("should add all items from source to target", () => {
      const target = new Set([1, 2]);
      const source = new Set([3, 4]);
      addAll(target, source);
      expect(target).toEqual(new Set([1, 2, 3, 4]));
    });

    test("should handle duplicates", () => {
      const target = new Set([1, 2, 3]);
      const source = new Set([2, 3, 4]);
      addAll(target, source);
      expect(target).toEqual(new Set([1, 2, 3, 4]));
    });

    test("should handle empty source", () => {
      const target = new Set([1, 2]);
      const source = new Set<number>();
      addAll(target, source);
      expect(target).toEqual(new Set([1, 2]));
    });

    test("should work with array as source", () => {
      const target = new Set([1, 2]);
      const source = [3, 4, 5];
      addAll(target, source);
      expect(target).toEqual(new Set([1, 2, 3, 4, 5]));
    });
  });

  describe("equal", () => {
    test("should return true for identical sets", () => {
      const a = new Set([1, 2, 3]);
      expect(equal(a, a)).toBe(true);
    });

    test("should return true for equal sets with same elements", () => {
      const a = new Set([1, 2, 3]);
      const b = new Set([1, 2, 3]);
      expect(equal(a, b)).toBe(true);
    });

    test("should return true for equal sets with different insertion order", () => {
      const a = new Set([1, 2, 3]);
      const b = new Set([3, 2, 1]);
      expect(equal(a, b)).toBe(true);
    });

    test("should return false for sets with different sizes", () => {
      const a = new Set([1, 2, 3]);
      const b = new Set([1, 2]);
      expect(equal(a, b)).toBe(false);
    });

    test("should return false for sets with different elements", () => {
      const a = new Set([1, 2, 3]);
      const b = new Set([1, 2, 4]);
      expect(equal(a, b)).toBe(false);
    });

    test("should return true for empty sets", () => {
      const a = new Set<number>();
      const b = new Set<number>();
      expect(equal(a, b)).toBe(true);
    });
  });
});
