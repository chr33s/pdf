import { describe, expect, test } from "vitest";

import { SimpleRNG } from "../../src/utils/rng.js";

describe("psuedo random numbers", () => {
  test("generates distinct numbers", () => {
    const rng = SimpleRNG.withSeed(1);
    expect(rng.nextInt()).not.toEqual(rng.nextInt());
  });

  test("generates the same number across different SimpleRNG", () => {
    const rng = SimpleRNG.withSeed(1);
    expect(rng.nextInt()).toEqual(0.7098480789645691);
    expect(rng.nextInt()).toEqual(0.9742682568175951);
  });
});
