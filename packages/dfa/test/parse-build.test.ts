import { describe, expect, test } from "vitest";
import { build, parse } from "../src/compile.js";
import StateMachine from "../src/state-machine.js";

describe("parse", () => {
  test("should parse simple grammar", () => {
    const table = parse("a = 0; main = a;");
    expect(table.symbols.a).toBe(0);
    expect(table.main).toBeDefined();
  });

  test("should parse grammar with external symbols", () => {
    const table = parse("main = a;", { a: 42 });
    expect(table.symbols.a).toBe(42);
  });

  test("should parse complex grammar", () => {
    const table = parse("a = 0; b = 1; main = (a b)+ | a*;");
    expect(table.symbols.a).toBe(0);
    expect(table.symbols.b).toBe(1);
    expect(table.main).toBeDefined();
  });

  test("should parse grammar with tags", () => {
    const table = parse("a = 0; main = x:(a);");
    expect(table.main).toBeDefined();
  });
});

describe("build", () => {
  test("should build state machine from symbol table", () => {
    const table = parse("a = 0; main = a;");
    const sm = build(table);
    expect(sm).toBeInstanceOf(StateMachine);
  });

  test("should build working state machine", () => {
    const table = parse("a = 0; b = 1; main = a b;");
    const sm = build(table);
    const matches = Array.from(sm.match([0, 1]));
    expect(matches).toEqual([[0, 1, []]]);
  });

  test("should build state machine with tags", () => {
    const table = parse("a = 0; main = x:(a);");
    const sm = build(table);
    const matches = Array.from(sm.match([0]));
    expect(matches).toEqual([[0, 0, ["x"]]]);
  });
});
