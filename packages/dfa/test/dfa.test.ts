import { describe, expect, test } from "vitest";
import buildDFA from "../src/dfa.js";
import { Alternation, Concatenation, Literal, Repeat, Tag } from "../src/nodes.js";

describe("buildDFA", () => {
  test("should build DFA for single literal", () => {
    const root = new Literal(0);
    const states = buildDFA(root, 1);

    // Should have fail state (0), initial state (1), and at least one accepting state
    expect(states.length).toBeGreaterThanOrEqual(2);
    expect(states[0].accepting).toBe(false); // Fail state
  });

  test("should build DFA for concatenation", () => {
    const root = new Concatenation(new Literal(0), new Literal(1));
    const states = buildDFA(root, 2);

    expect(states.length).toBeGreaterThanOrEqual(2);
    // Verify there's at least one accepting state
    const hasAccepting = states.some((s) => s.accepting);
    expect(hasAccepting).toBe(true);
  });

  test("should build DFA for alternation", () => {
    const root = new Alternation(new Literal(0), new Literal(1));
    const states = buildDFA(root, 2);

    expect(states.length).toBeGreaterThanOrEqual(2);
    const hasAccepting = states.some((s) => s.accepting);
    expect(hasAccepting).toBe(true);
  });

  test("should build DFA for repeat *", () => {
    const root = new Repeat(new Literal(0), "*");
    const states = buildDFA(root, 1);

    expect(states.length).toBeGreaterThanOrEqual(2);
  });

  test("should build DFA for repeat +", () => {
    const root = new Repeat(new Literal(0), "+");
    const states = buildDFA(root, 1);

    expect(states.length).toBeGreaterThanOrEqual(2);
  });

  test("should build DFA for repeat ?", () => {
    const root = new Repeat(new Literal(0), "?");
    const states = buildDFA(root, 1);

    expect(states.length).toBeGreaterThanOrEqual(2);
  });

  test("should build DFA with tags", () => {
    const lit = new Literal(0);
    const tag = new Tag("myTag");
    const root = new Concatenation(tag, lit);
    const states = buildDFA(root, 1);

    // Find state with the tag
    const statesWithTags = states.filter((s) => s.tags.size > 0);
    expect(statesWithTags.length).toBeGreaterThan(0);
    expect(statesWithTags.some((s) => s.tags.has("myTag"))).toBe(true);
  });

  test("should have fail state with no transitions", () => {
    const root = new Literal(0);
    const states = buildDFA(root, 1);

    const failState = states[0];
    expect(failState.accepting).toBe(false);
    expect(failState.transitions.every((t) => t === 0)).toBe(true);
  });

  test("should handle complex nested expression", () => {
    // ((a | b) c)+
    const inner = new Alternation(new Literal(0), new Literal(1));
    const concat = new Concatenation(inner, new Literal(2));
    const root = new Repeat(concat, "+");
    const states = buildDFA(root, 3);

    expect(states.length).toBeGreaterThanOrEqual(2);
    const hasAccepting = states.some((s) => s.accepting);
    expect(hasAccepting).toBe(true);
  });
});
