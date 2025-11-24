import { describe, expect, test } from "vitest";
import compile from "../src/compile.js";

describe("state machine compiler", () => {
  test("should compile a state machine with a single literal", () => {
    const stateMachine = compile("a = 0; b = 1; main = a;");
    const matches = Array.from(stateMachine.match([0, 0, 1, 0]));
    expect(matches).toEqual([
      [0, 0, []],
      [1, 1, []],
      [3, 3, []],
    ]);
  });

  test("should compile a state machine with a concatenation", () => {
    const stateMachine = compile("a = 0; b = 1; main = a b;");
    const matches = Array.from(stateMachine.match([0, 0, 1, 1, 0, 1, 0]));
    expect(matches).toEqual([
      [1, 2, []],
      [4, 5, []],
    ]);
  });

  test("should compile a state machine with an alternation", () => {
    const stateMachine = compile("a = 0; b = 1; main = (a b) | (b a);");
    const matches = Array.from(stateMachine.match([0, 0, 1, 1, 0, 1, 0]));
    expect(matches).toEqual([
      [1, 2, []],
      [3, 4, []],
      [5, 6, []],
    ]);
  });

  test("should compile a state machine with a repeat", () => {
    const stateMachine = compile("a = 0; b = 1; main = (a b)+;");
    const matches = Array.from(stateMachine.match([0, 0, 1, 0, 1, 1, 0, 1]));
    expect(matches).toEqual([
      [1, 4, []],
      [6, 7, []],
    ]);
  });

  test("should compile a state machine with an optional repeat", () => {
    const stateMachine = compile("a = 0; b = 1; main = b a (a b)*;");
    const matches = Array.from(
      stateMachine.match([0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0]),
    );
    expect(matches).toEqual([
      [2, 7, []],
      [9, 10, []],
    ]);
  });

  test("should compile a state machine with an optional group", () => {
    const stateMachine = compile("a = 0; b = 1; main = b a (a b)?;");
    const matches = Array.from(
      stateMachine.match([0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0]),
    );
    expect(matches).toEqual([
      [2, 5, []],
      [9, 10, []],
    ]);
  });

  test("should compile a state machine with an exact repetition", () => {
    const stateMachine = compile("a = 0; b = 1; main = a{3} b;");
    const matches = Array.from(
      stateMachine.match([0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    );
    expect(matches).toEqual([[3, 6, []]]);
  });

  test("should compile a state machine with a minimum repetition", () => {
    const stateMachine = compile("a = 0; b = 1; main = a{3,} b;");
    const matches = Array.from(
      stateMachine.match([0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    );
    expect(matches).toEqual([
      [3, 6, []],
      [7, 11, []],
    ]);
  });

  test("should compile a state machine with a maximum repetition", () => {
    const stateMachine = compile("a = 0; b = 1; main = a{,3} b;");
    const matches = Array.from(
      stateMachine.match([0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1]),
    );
    expect(matches).toEqual([
      [0, 2, []],
      [3, 6, []],
      [10, 11, []],
      [12, 12, []],
    ]);
  });

  test("should compile a state machine with a minimum and maximum repetition", () => {
    const stateMachine = compile("a = 0; b = 1; main = a{3,5} b;");
    const matches = Array.from(
      stateMachine.match([
        0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1,
      ]),
    );
    expect(matches).toEqual([
      [3, 6, []],
      [7, 11, []],
    ]);
  });

  test("should compile a state machine with tags", () => {
    const stateMachine = compile("a = 0; b = 1; main = x:(b a) | y:(a b);");
    const input = [1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0];
    const matches = Array.from(stateMachine.match(input));
    expect(matches).toEqual([
      [2, 3, ["x"]],
      [4, 5, ["y"]],
      [6, 7, ["y"]],
      [9, 10, ["x"]],
    ]);

    const applied: Array<[string, number, number, number[]]> = [];
    stateMachine.apply(input, {
      x: (start: number, end: number, slice: number[]) =>
        applied.push(["x", start, end, slice]),
      y: (start: number, end: number, slice: number[]) =>
        applied.push(["y", start, end, slice]),
    });

    expect(applied).toEqual([
      ["x", 2, 3, [1, 0]],
      ["y", 4, 5, [0, 1]],
      ["y", 6, 7, [0, 1]],
      ["x", 9, 10, [1, 0]],
    ]);
  });

  test("should compile a state machine with external symbols", () => {
    const stateMachine = compile("main = a b;", { a: 0, b: 1 });
    const matches = Array.from(stateMachine.match([0, 0, 1, 1, 0, 1, 0]));
    expect(matches).toEqual([
      [1, 2, []],
      [4, 5, []],
    ]);
  });
});
