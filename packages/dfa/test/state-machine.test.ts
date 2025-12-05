import { describe, expect, test } from "vitest";
import StateMachine, { FAIL_STATE, INITIAL_STATE } from "../src/state-machine.js";

describe("StateMachine", () => {
  describe("constants", () => {
    test("INITIAL_STATE is 1", () => {
      expect(INITIAL_STATE).toBe(1);
    });

    test("FAIL_STATE is 0", () => {
      expect(FAIL_STATE).toBe(0);
    });
  });

  describe("match", () => {
    test("should return empty matches for empty input", () => {
      const sm = new StateMachine({
        stateTable: [[], [0]],
        accepting: [false, true],
        tags: [[], []],
      });
      const matches = Array.from(sm.match([]));
      expect(matches).toEqual([]);
    });

    test("should handle no accepting states", () => {
      const sm = new StateMachine({
        stateTable: [[1], [1]],
        accepting: [false, false],
        tags: [[], []],
      });
      const matches = Array.from(sm.match([0, 0, 0]));
      expect(matches).toEqual([]);
    });

    test("should handle single accepting state at start", () => {
      const sm = new StateMachine({
        stateTable: [[], [2], [0]],
        accepting: [false, false, true],
        tags: [[], [], []],
      });
      const matches = Array.from(sm.match([0]));
      expect(matches).toEqual([[0, 0, []]]);
    });

    test("should handle multiple consecutive matches", () => {
      const sm = new StateMachine({
        stateTable: [[], [2], [0]],
        accepting: [false, false, true],
        tags: [[], [], []],
      });
      const matches = Array.from(sm.match([0, 0, 0]));
      expect(matches).toEqual([
        [0, 0, []],
        [1, 1, []],
        [2, 2, []],
      ]);
    });

    test("should return tags for accepting states", () => {
      const sm = new StateMachine({
        stateTable: [[], [2], [0]],
        accepting: [false, false, true],
        tags: [[], [], ["myTag"]],
      });
      const matches = Array.from(sm.match([0]));
      expect(matches).toEqual([[0, 0, ["myTag"]]]);
    });

    test("should handle undefined state transitions gracefully", () => {
      const sm = new StateMachine({
        stateTable: [[], [2], []],
        accepting: [false, false, true],
        tags: [[], [], []],
      });
      // Symbol 1 has no transition from state 1
      const matches = Array.from(sm.match([0, 1]));
      expect(matches).toEqual([[0, 0, []]]);
    });
  });

  describe("apply", () => {
    test("should call action handlers for each tag", () => {
      const sm = new StateMachine({
        stateTable: [[], [2], [0]],
        accepting: [false, false, true],
        tags: [[], [], ["action1"]],
      });

      const calls: Array<[string, number, number, number[]]> = [];
      sm.apply([0, 0], {
        action1: (start, end, slice) => calls.push(["action1", start, end, slice]),
      });

      expect(calls).toEqual([
        ["action1", 0, 0, [0]],
        ["action1", 1, 1, [0]],
      ]);
    });

    test("should not call missing action handlers", () => {
      const sm = new StateMachine({
        stateTable: [[], [2], [0]],
        accepting: [false, false, true],
        tags: [[], [], ["missingAction"]],
      });

      const calls: string[] = [];
      sm.apply([0], {
        otherAction: () => calls.push("called"),
      });

      expect(calls).toEqual([]);
    });

    test("should handle multiple tags on same match", () => {
      const sm = new StateMachine({
        stateTable: [[], [2], [0]],
        accepting: [false, false, true],
        tags: [[], [], ["tag1", "tag2"]],
      });

      const calls: string[] = [];
      sm.apply([0], {
        tag1: () => calls.push("tag1"),
        tag2: () => calls.push("tag2"),
      });

      expect(calls).toEqual(["tag1", "tag2"]);
    });
  });
});
