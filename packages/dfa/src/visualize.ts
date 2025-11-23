import graphviz from "graphviz";
import { build, ExternalSymbols, parse } from "./compile.js";
import { FAIL_STATE, INITIAL_STATE } from "./StateMachine.js";

type SymbolLookup = Record<number, string>;

export default function visualize(
  pattern: string,
  externalSymbols: ExternalSymbols = {},
): graphviz.Graph {
  const symbolTable = parse(pattern, externalSymbols);
  const dfa = build(symbolTable);

  const graph = graphviz.digraph("G");
  graph.set("rankdir", "LR");

  const symbols: SymbolLookup = {};
  for (const [name, value] of Object.entries(symbolTable.symbols)) {
    symbols[value] = name;
  }

  const startNode = graph.addNode("");
  startNode.set("shape", "none");

  const nodes: graphviz.Node[] = [];
  for (let i = 1; i < dfa.stateTable.length; i++) {
    const labelSuffix = dfa.tags[i]?.length
      ? ` (${dfa.tags[i].join(",")})`
      : "";
    const node = graph.addNode(`${i}${labelSuffix}`);
    node.set("shape", dfa.accepting[i] ? "doublecircle" : "circle");

    if (i === INITIAL_STATE) {
      graph.addEdge(startNode, node);
    }

    nodes.push(node);
  }

  for (let i = 1; i < dfa.stateTable.length; i++) {
    const state = dfa.stateTable[i];
    for (let j = 0; j < state.length; j++) {
      const transition = state[j];
      if (transition !== FAIL_STATE) {
        graph
          .addEdge(nodes[i - 1], nodes[transition - 1])
          .set("label", symbols[j] ?? String(j));
      }
    }
  }

  return graph;
}
