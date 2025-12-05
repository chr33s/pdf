import { describe, expect, test } from "vitest";
import { Assignment, Literal, Variable } from "../src/nodes.js";
import SymbolTable from "../src/symbol-table.js";

describe("SymbolTable", () => {
  test("should process assignments and store variables", () => {
    const statements = [
      new Assignment(new Variable("a"), new Literal(0)),
      new Assignment(new Variable("main"), new Variable("a")),
    ];

    const table = new SymbolTable(statements);
    expect(table.variables.a).toBeInstanceOf(Literal);
    expect((table.variables.a as Literal).value).toBe(0);
  });

  test("should throw when main is not declared", () => {
    const statements = [new Assignment(new Variable("a"), new Literal(0))];

    expect(() => new SymbolTable(statements)).toThrow("No main variable declaration found");
  });

  test("should throw for undeclared identifiers", () => {
    const statements = [new Assignment(new Variable("main"), new Variable("undeclared"))];

    expect(() => new SymbolTable(statements)).toThrow("Undeclared identifier undeclared");
  });

  test("should resolve variable references", () => {
    const statements = [
      new Assignment(new Variable("a"), new Literal(0)),
      new Assignment(new Variable("b"), new Variable("a")),
      new Assignment(new Variable("main"), new Variable("b")),
    ];

    const table = new SymbolTable(statements);
    expect(table.main).toBeInstanceOf(Literal);
    expect((table.main as Literal).value).toBe(0);
  });

  test("should add external symbols", () => {
    const statements = [new Assignment(new Variable("main"), new Variable("external"))];

    const table = new SymbolTable(statements, { external: 42 });
    expect(table.symbols.external).toBe(42);
    expect(table.main).toBeInstanceOf(Literal);
    expect((table.main as Literal).value).toBe(42);
  });

  test("should track symbol count", () => {
    const statements = [
      new Assignment(new Variable("a"), new Literal(0)),
      new Assignment(new Variable("b"), new Literal(1)),
      new Assignment(new Variable("main"), new Variable("a")),
    ];

    const table = new SymbolTable(statements);
    // Size counts all literal assignments: a=0, b=1, and the resolved main=a (which is 0)
    expect(table.size).toBe(3);
  });

  test("should include external symbols in size count", () => {
    const statements = [new Assignment(new Variable("main"), new Variable("ext"))];

    const table = new SymbolTable(statements, { ext: 0 });
    // Size counts: external symbol ext=0, and the resolved main (which is also a literal)
    expect(table.size).toBe(2);
  });
});
