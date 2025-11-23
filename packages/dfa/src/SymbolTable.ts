import {
  Assignment,
  ExpressionNode,
  Literal,
  Node,
  Variable,
} from "./nodes.js";

export type SymbolTableStatement = Node;
export type ExternalSymbolMap = Record<string, number>;

/**
 * Processes a list of statements into a symbol table
 */
export default class SymbolTable {
  readonly variables: Record<string, ExpressionNode>;
  readonly symbols: Record<string, number>;
  main: ExpressionNode;
  size: number;

  constructor(
    statements: SymbolTableStatement[],
    externalSymbols: ExternalSymbolMap = {},
  ) {
    this.variables = {};
    this.symbols = {};
    this.main = undefined as unknown as ExpressionNode;
    this.size = 0;

    this.addExternalSymbols(externalSymbols);
    this.process(statements);
  }

  private addExternalSymbols(externalSymbols: ExternalSymbolMap): void {
    for (const [key, value] of Object.entries(externalSymbols)) {
      const literal = new Literal(value);
      this.variables[key] = literal;
      this.symbols[key] = value;
      this.size++;
    }
  }

  private process(statements: SymbolTableStatement[]): void {
    for (const statement of statements) {
      if (statement instanceof Assignment) {
        const resolved = this.processExpression(statement.expression);
        this.variables[statement.variable.name] = resolved;
        statement.expression = resolved;

        if (resolved instanceof Literal) {
          this.symbols[statement.variable.name] = resolved.value;
          this.size++;
        }
      }
    }

    const main = this.variables.main;
    if (!main) {
      throw new Error("No main variable declaration found");
    }

    this.main = main;
  }

  private processExpression(expr: ExpressionNode): ExpressionNode {
    // Process children
    for (const key of Object.keys(expr)) {
      const recordExpr = expr as unknown as Record<string, unknown>;
      const value = recordExpr[key];
      if (value instanceof Node) {
        recordExpr[key] = this.processExpression(value as ExpressionNode);
      }
    }

    // Replace variable references with their values
    if (expr instanceof Variable) {
      const value = this.variables[expr.name];
      if (value == null) {
        throw new Error(`Undeclared identifier ${expr.name}`);
      }

      return this.processExpression(value.copy());
    }

    return expr;
  }
}
