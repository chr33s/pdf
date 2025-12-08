import buildDFA, { DFAState } from "./dfa.js";
import { parse as parseGrammar } from "./grammar.js";
import * as nodes from "./nodes.js";
import StateMachine, { StateMachineConfig } from "./state-machine.js";
import SymbolTable from "./symbol-table.js";

export type ExternalSymbols = Record<string, number>;

/**
 * Parses a DFA source grammar into a symbol table.
 * @param source The DFA source grammar string
 * @param externalSymbols Optional external symbol mappings
 */
export function parse(source: string, externalSymbols: ExternalSymbols = {}): SymbolTable {
  const ast = parseGrammar(source, { nodes });
  return new SymbolTable(ast, externalSymbols);
}

/**
 * Builds a StateMachine from a parsed symbol table.
 * @param symbolTable The parsed symbol table from parse()
 */
export function build(symbolTable: SymbolTable): StateMachine {
  const states: DFAState[] = buildDFA(symbolTable.main, symbolTable.size);

  const config: StateMachineConfig = {
    stateTable: states.map((state) => Array.from(state.transitions)),
    accepting: states.map((state) => state.accepting),
    tags: states.map((state) => Array.from(state.tags)),
  };

  return new StateMachine(config);
}

/**
 * Compiles a DFA source grammar directly into a StateMachine.
 * @param source The DFA source grammar string
 * @param externalSymbols Optional external symbol mappings
 */
export default function compile(
  source: string,
  externalSymbols: ExternalSymbols = {},
): StateMachine {
  return build(parse(source, externalSymbols));
}
