import { addAll, union } from "./utils.js";

export type RepeatOperator = "*" | "?" | "+";

export type PositionNode = Literal | Tag | EndMarker;

export type ExpressionNode =
  | Alternation
  | Concatenation
  | Repeat
  | Literal
  | Tag
  | EndMarker
  | Variable;

/**
 * Base AST node
 */
export class Node {
  readonly followpos: Set<PositionNode>;

  constructor() {
    const followpos = new Set<PositionNode>();
    this.followpos = followpos;
    Object.defineProperty(this, "followpos", {
      value: followpos,
    });
  }

  calcFollowpos(): void {
    for (const key of Object.keys(this)) {
      const value = (this as Record<string, unknown>)[key];
      if (value instanceof Node) {
        value.calcFollowpos();
      }
    }
  }
}

/**
 * Represents a variable reference
 */
export class Variable extends Node {
  readonly name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  get nullable(): boolean {
    throw new Error("Variable nodes must be resolved before evaluation");
  }

  get firstpos(): Set<PositionNode> {
    throw new Error("Variable nodes must be resolved before evaluation");
  }

  get lastpos(): Set<PositionNode> {
    throw new Error("Variable nodes must be resolved before evaluation");
  }

  copy(): Variable {
    return new Variable(this.name);
  }
}

/**
 * Represents a comment
 */
export class Comment extends Node {
  readonly value: string;

  constructor(value: string) {
    super();
    this.value = value;
  }
}

/**
 * Represents an assignment statement.
 * e.g. `variable = expression;`
 */
export class Assignment extends Node {
  readonly variable: Variable;
  expression: ExpressionNode;

  constructor(variable: Variable, expression: ExpressionNode) {
    super();
    this.variable = variable;
    this.expression = expression;
  }
}

/**
 * Represents an alternation.
 * e.g. `a | b`
 */
export class Alternation extends Node {
  readonly a: ExpressionNode;
  readonly b: ExpressionNode;

  constructor(a: ExpressionNode, b: ExpressionNode) {
    super();
    this.a = a;
    this.b = b;
  }

  get nullable(): boolean {
    return this.a.nullable || this.b.nullable;
  }

  get firstpos(): Set<PositionNode> {
    return union(this.a.firstpos, this.b.firstpos);
  }

  get lastpos(): Set<PositionNode> {
    return union(this.a.lastpos, this.b.lastpos);
  }

  copy(): Alternation {
    return new Alternation(this.a.copy(), this.b.copy());
  }
}

/**
 * Represents a concatenation, or chain.
 * e.g. `a b c`
 */
export class Concatenation extends Node {
  readonly a: ExpressionNode;
  readonly b: ExpressionNode;

  constructor(a: ExpressionNode, b: ExpressionNode) {
    super();
    this.a = a;
    this.b = b;
  }

  get nullable(): boolean {
    return this.a.nullable && this.b.nullable;
  }

  get firstpos(): Set<PositionNode> {
    let s = this.a.firstpos;
    if (this.a.nullable) {
      s = union(s, this.b.firstpos);
    }

    return s;
  }

  get lastpos(): Set<PositionNode> {
    let s = this.b.lastpos;
    if (this.b.nullable) {
      s = union(s, this.a.lastpos);
    }

    return s;
  }

  calcFollowpos(): void {
    super.calcFollowpos();
    for (const n of this.a.lastpos) {
      addAll(n.followpos, this.b.firstpos);
    }
  }

  copy(): Concatenation {
    return new Concatenation(this.a.copy(), this.b.copy());
  }
}

/**
 * Represents a repetition.
 * e.g. `a+`, `b*`, or `c?`
 */
export class Repeat extends Node {
  readonly expression: ExpressionNode;
  readonly op: RepeatOperator;

  constructor(expression: ExpressionNode, op: RepeatOperator) {
    super();
    this.expression = expression;
    this.op = op;
  }

  get nullable(): boolean {
    return this.op === "*" || this.op === "?";
  }

  get firstpos(): Set<PositionNode> {
    return this.expression.firstpos;
  }

  get lastpos(): Set<PositionNode> {
    return this.expression.lastpos;
  }

  calcFollowpos(): void {
    super.calcFollowpos();
    if (this.op === "*" || this.op === "+") {
      for (const n of this.lastpos) {
        addAll(n.followpos, this.firstpos);
      }
    }
  }

  copy(): Repeat {
    return new Repeat(this.expression.copy(), this.op);
  }
}

export function buildRepetition(
  expression: ExpressionNode,
  min = 0,
  max = Infinity,
): ExpressionNode {
  if (min < 0 || min > max) {
    throw new Error(`Invalid repetition range: ${min} ${max}`);
  }

  let res: ExpressionNode | null = null;
  for (let i = 0; i < min; i++) {
    res = concat(res, expression.copy());
  }

  if (max === Infinity) {
    res = concat(res, new Repeat(expression.copy(), "*"));
  } else {
    for (let i = min; i < max; i++) {
      res = concat(res, new Repeat(expression.copy(), "?"));
    }
  }

  return res ?? expression.copy();
}

function concat(a: ExpressionNode | null, b: ExpressionNode): ExpressionNode {
  if (!a) {
    return b;
  }

  return new Concatenation(a, b);
}

/**
 * Base class for leaf nodes
 */
class Leaf extends Node {
  copy(): this {
    return this;
  }

  get nullable(): boolean {
    return false;
  }

  get firstpos(): Set<PositionNode> {
    return new Set([this as PositionNode]);
  }

  get lastpos(): Set<PositionNode> {
    return new Set([this as PositionNode]);
  }
}

/**
 * Represents a literal value, e.g. a number
 */
export class Literal extends Leaf {
  readonly value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  copy(): this {
    return new Literal(this.value) as this;
  }
}

/**
 * Marks the end of an expression
 */
export class EndMarker extends Leaf {}

/**
 * Represents a tag
 * e.g. `a:(a b)`
 */
export class Tag extends Leaf {
  readonly name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  get nullable(): boolean {
    return true;
  }

  copy(): this {
    return new Tag(this.name) as this;
  }
}
