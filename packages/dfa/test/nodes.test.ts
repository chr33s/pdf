import { describe, expect, test } from "vitest";
import {
  Alternation,
  Assignment,
  buildRepetition,
  Comment,
  Concatenation,
  EndMarker,
  Literal,
  Repeat,
  Tag,
  Variable,
} from "../src/nodes.js";

describe("nodes", () => {
  describe("Variable", () => {
    test("should store name", () => {
      const v = new Variable("test");
      expect(v.name).toBe("test");
    });

    test("should throw on nullable access", () => {
      const v = new Variable("test");
      expect(() => v.nullable).toThrow("Variable nodes must be resolved before evaluation");
    });

    test("should throw on firstpos access", () => {
      const v = new Variable("test");
      expect(() => v.firstpos).toThrow("Variable nodes must be resolved before evaluation");
    });

    test("should throw on lastpos access", () => {
      const v = new Variable("test");
      expect(() => v.lastpos).toThrow("Variable nodes must be resolved before evaluation");
    });

    test("should copy correctly", () => {
      const v = new Variable("test");
      const copy = v.copy();
      expect(copy.name).toBe("test");
      expect(copy).not.toBe(v);
    });
  });

  describe("Comment", () => {
    test("should store value", () => {
      const c = new Comment("this is a comment");
      expect(c.value).toBe("this is a comment");
    });
  });

  describe("Assignment", () => {
    test("should store variable and expression", () => {
      const variable = new Variable("x");
      const expr = new Literal(42);
      const assign = new Assignment(variable, expr);
      expect(assign.variable).toBe(variable);
      expect(assign.expression).toBe(expr);
    });
  });

  describe("Alternation", () => {
    test("should be nullable if either child is nullable", () => {
      const a = new Literal(1);
      const b = new Repeat(new Literal(2), "?");
      const alt = new Alternation(a, b);
      expect(alt.nullable).toBe(true);
    });

    test("should not be nullable if both children are not nullable", () => {
      const a = new Literal(1);
      const b = new Literal(2);
      const alt = new Alternation(a, b);
      expect(alt.nullable).toBe(false);
    });

    test("should compute firstpos as union of children", () => {
      const a = new Literal(1);
      const b = new Literal(2);
      const alt = new Alternation(a, b);
      expect(alt.firstpos.size).toBe(2);
      expect(alt.firstpos.has(a)).toBe(true);
      expect(alt.firstpos.has(b)).toBe(true);
    });

    test("should compute lastpos as union of children", () => {
      const a = new Literal(1);
      const b = new Literal(2);
      const alt = new Alternation(a, b);
      expect(alt.lastpos.size).toBe(2);
      expect(alt.lastpos.has(a)).toBe(true);
      expect(alt.lastpos.has(b)).toBe(true);
    });

    test("should copy correctly", () => {
      const a = new Literal(1);
      const b = new Literal(2);
      const alt = new Alternation(a, b);
      const copy = alt.copy();
      expect(copy).not.toBe(alt);
      expect((copy.a as Literal).value).toBe(1);
      expect((copy.b as Literal).value).toBe(2);
    });
  });

  describe("Concatenation", () => {
    test("should be nullable only if both children are nullable", () => {
      const a = new Repeat(new Literal(1), "?");
      const b = new Repeat(new Literal(2), "?");
      const concat = new Concatenation(a, b);
      expect(concat.nullable).toBe(true);
    });

    test("should not be nullable if one child is not nullable", () => {
      const a = new Literal(1);
      const b = new Repeat(new Literal(2), "?");
      const concat = new Concatenation(a, b);
      expect(concat.nullable).toBe(false);
    });

    test("should compute firstpos including second child if first is nullable", () => {
      const a = new Repeat(new Literal(1), "?");
      const b = new Literal(2);
      const concat = new Concatenation(a, b);
      expect(concat.firstpos.size).toBe(2);
    });

    test("should compute firstpos only from first child if not nullable", () => {
      const a = new Literal(1);
      const b = new Literal(2);
      const concat = new Concatenation(a, b);
      expect(concat.firstpos.size).toBe(1);
      expect(concat.firstpos.has(a)).toBe(true);
    });

    test("should compute lastpos including first child if second is nullable", () => {
      const a = new Literal(1);
      const b = new Repeat(new Literal(2), "?");
      const concat = new Concatenation(a, b);
      expect(concat.lastpos.size).toBe(2);
    });

    test("should copy correctly", () => {
      const a = new Literal(1);
      const b = new Literal(2);
      const concat = new Concatenation(a, b);
      const copy = concat.copy();
      expect(copy).not.toBe(concat);
    });

    test("should calculate followpos correctly", () => {
      const a = new Literal(1);
      const b = new Literal(2);
      const concat = new Concatenation(a, b);
      concat.calcFollowpos();
      expect(a.followpos.has(b)).toBe(true);
    });
  });

  describe("Repeat", () => {
    test("should be nullable for * operator", () => {
      const r = new Repeat(new Literal(1), "*");
      expect(r.nullable).toBe(true);
    });

    test("should be nullable for ? operator", () => {
      const r = new Repeat(new Literal(1), "?");
      expect(r.nullable).toBe(true);
    });

    test("should not be nullable for + operator", () => {
      const r = new Repeat(new Literal(1), "+");
      expect(r.nullable).toBe(false);
    });

    test("should compute firstpos from expression", () => {
      const lit = new Literal(1);
      const r = new Repeat(lit, "*");
      expect(r.firstpos.has(lit)).toBe(true);
    });

    test("should compute lastpos from expression", () => {
      const lit = new Literal(1);
      const r = new Repeat(lit, "*");
      expect(r.lastpos.has(lit)).toBe(true);
    });

    test("should calculate followpos for * operator", () => {
      const lit = new Literal(1);
      const r = new Repeat(lit, "*");
      r.calcFollowpos();
      expect(lit.followpos.has(lit)).toBe(true);
    });

    test("should calculate followpos for + operator", () => {
      const lit = new Literal(1);
      const r = new Repeat(lit, "+");
      r.calcFollowpos();
      expect(lit.followpos.has(lit)).toBe(true);
    });

    test("should not calculate followpos for ? operator", () => {
      const lit = new Literal(1);
      const r = new Repeat(lit, "?");
      r.calcFollowpos();
      expect(lit.followpos.size).toBe(0);
    });

    test("should copy correctly", () => {
      const r = new Repeat(new Literal(1), "*");
      const copy = r.copy();
      expect(copy).not.toBe(r);
      expect(copy.op).toBe("*");
    });
  });

  describe("Literal", () => {
    test("should store value", () => {
      const lit = new Literal(42);
      expect(lit.value).toBe(42);
    });

    test("should not be nullable", () => {
      const lit = new Literal(42);
      expect(lit.nullable).toBe(false);
    });

    test("should have itself in firstpos", () => {
      const lit = new Literal(42);
      expect(lit.firstpos.has(lit)).toBe(true);
    });

    test("should have itself in lastpos", () => {
      const lit = new Literal(42);
      expect(lit.lastpos.has(lit)).toBe(true);
    });

    test("should copy to new instance with same value", () => {
      const lit = new Literal(42);
      const copy = lit.copy();
      expect(copy).not.toBe(lit);
      expect(copy.value).toBe(42);
    });
  });

  describe("EndMarker", () => {
    test("should not be nullable", () => {
      const em = new EndMarker();
      expect(em.nullable).toBe(false);
    });

    test("should have itself in firstpos", () => {
      const em = new EndMarker();
      expect(em.firstpos.has(em)).toBe(true);
    });

    test("should have itself in lastpos", () => {
      const em = new EndMarker();
      expect(em.lastpos.has(em)).toBe(true);
    });
  });

  describe("Tag", () => {
    test("should store name", () => {
      const t = new Tag("myTag");
      expect(t.name).toBe("myTag");
    });

    test("should be nullable", () => {
      const t = new Tag("myTag");
      expect(t.nullable).toBe(true);
    });

    test("should have itself in firstpos", () => {
      const t = new Tag("myTag");
      expect(t.firstpos.has(t)).toBe(true);
    });

    test("should have itself in lastpos", () => {
      const t = new Tag("myTag");
      expect(t.lastpos.has(t)).toBe(true);
    });

    test("should copy to new instance with same name", () => {
      const t = new Tag("myTag");
      const copy = t.copy();
      expect(copy).not.toBe(t);
      expect(copy.name).toBe("myTag");
    });
  });

  describe("buildRepetition", () => {
    test("should throw for negative min", () => {
      expect(() => buildRepetition(new Literal(1), -1, 5)).toThrow("Invalid repetition range");
    });

    test("should throw when min > max", () => {
      expect(() => buildRepetition(new Literal(1), 5, 3)).toThrow("Invalid repetition range");
    });

    test("should build exact repetition (min = max)", () => {
      const result = buildRepetition(new Literal(1), 3, 3);
      // Should be Concatenation(Concatenation(Literal, Literal), Literal)
      expect(result).toBeInstanceOf(Concatenation);
    });

    test("should build unbounded repetition (max = Infinity)", () => {
      const result = buildRepetition(new Literal(1), 2, Infinity);
      // Should include a Repeat with *
      expect(result).toBeInstanceOf(Concatenation);
    });

    test("should build range repetition", () => {
      const result = buildRepetition(new Literal(1), 1, 3);
      expect(result).toBeInstanceOf(Concatenation);
    });

    test("should build optional repetition (min = 0, max = 1)", () => {
      const result = buildRepetition(new Literal(1), 0, 1);
      expect(result).toBeInstanceOf(Repeat);
      expect((result as Repeat).op).toBe("?");
    });
  });
});
