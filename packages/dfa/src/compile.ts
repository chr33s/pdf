import buildDFA, { DFAState } from "./dfa.js";
import { parse as parseGrammar } from "./grammar.js";
import * as nodes from "./nodes.js";
import StateMachine, { StateMachineConfig } from "./state-machine.js";
import SymbolTable from "./symbol-table.js";

export type ExternalSymbols = Record<string, number>;

export function parse(
  source: string,
  externalSymbols: ExternalSymbols = {},
): SymbolTable {
  const ast = parseGrammar(source, { nodes });
  return new SymbolTable(ast, externalSymbols);
}

export function build(symbolTable: SymbolTable): StateMachine {
  const states: DFAState[] = buildDFA(symbolTable.main, symbolTable.size);

  const config: StateMachineConfig = {
    stateTable: states.map((state) => Array.from(state.transitions)),
    accepting: states.map((state) => state.accepting),
    tags: states.map((state) => Array.from(state.tags)),
  };

  return new StateMachine(config);
}

export default function compile(
  source: string,
  externalSymbols: ExternalSymbols = {},
): StateMachine {
  return build(parse(source, externalSymbols));
}
