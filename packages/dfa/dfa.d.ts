declare module "peggy" {
  export type OutputFormat = "parser" | "source";
  export type ModuleFormat = "es" | "commonjs" | "umd";

  export interface GenerateOptions {
    allowedStartRules?: string[];
    cache?: boolean;
    format?: ModuleFormat;
    output?: OutputFormat;
  }

  export interface PeggyParser {
    parse<T = unknown>(input: string, options?: unknown): T;
  }

  export interface PeggyApi {
    generate(grammar: string, options?: GenerateOptions): string | PeggyParser;
  }

  const peggy: PeggyApi;
  export default peggy;
}

declare module "graphviz" {
  export interface GraphAttributeMap {
    [key: string]: string | number | undefined;
  }

  export interface Edge {
    set(attribute: string, value: string): Edge;
  }

  export interface Node {
    set(attribute: string, value: string): void;
  }

  export interface Graph {
    set(attribute: string, value: string): void;
    addNode(id: string, attributes?: GraphAttributeMap): Node;
    addEdge(from: Node, to: Node, attributes?: GraphAttributeMap): Edge;
  }

  export function digraph(id: string): Graph;
}
