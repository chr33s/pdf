import { describe, expect, test } from "vitest";

import { addNameTreeEntry, isWritableFlatNameTree } from "../../src/api/name-tree.js";
import { PDFArray, PDFContext, PDFHexString, PDFName, PDFRef } from "../../src/index.js";

const namesOf = (node: PDFArray): string[] => {
  const names: string[] = [];
  for (let idx = 0, len = node.size(); idx < len; idx += 2) {
    names.push(node.lookup(idx, PDFHexString).decodeText());
  }
  return names;
};

describe("name trees", () => {
  test("keeps entries sorted as they are added", () => {
    const context = PDFContext.create();
    const node = context.obj({});

    addNameTreeEntry(node, PDFHexString.fromText("zebra"), PDFRef.of(1));
    addNameTreeEntry(node, PDFHexString.fromText("apple"), PDFRef.of(2));
    addNameTreeEntry(node, PDFHexString.fromText("mango"), PDFRef.of(3));

    const names = node.lookup(PDFName.of("Names"), PDFArray);
    expect(namesOf(names)).toEqual(["apple", "mango", "zebra"]);
    expect(names.get(1)).toBe(PDFRef.of(2));
    expect(names.get(5)).toBe(PDFRef.of(1));
  });

  test("updates /Limits when the node declares them", () => {
    const context = PDFContext.create();
    const node = context.obj({
      Limits: [PDFHexString.fromText("mango"), PDFHexString.fromText("mango")],
      Names: [PDFHexString.fromText("mango"), PDFRef.of(1)],
    });

    addNameTreeEntry(node, PDFHexString.fromText("apple"), PDFRef.of(2));

    const limits = node.lookup(PDFName.of("Limits"), PDFArray);
    expect(limits.lookup(0, PDFHexString).decodeText()).toBe("apple");
    expect(limits.lookup(1, PDFHexString).decodeText()).toBe("mango");
  });

  test("leaves `/Kids` trees alone", () => {
    const context = PDFContext.create();
    const node = context.obj({ Kids: [PDFRef.of(9)] });

    expect(isWritableFlatNameTree(node)).toBe(false);
    expect(addNameTreeEntry(node, PDFHexString.fromText("apple"), PDFRef.of(1))).toBe(false);
    expect(node.has(PDFName.of("Names"))).toBe(false);
  });

  test("leaves malformed `/Names` arrays alone", () => {
    const context = PDFContext.create();
    const node = context.obj({ Names: [PDFHexString.fromText("apple")] });

    expect(isWritableFlatNameTree(node)).toBe(false);
    expect(addNameTreeEntry(node, PDFHexString.fromText("mango"), PDFRef.of(1))).toBe(false);
    expect(node.lookup(PDFName.of("Names"), PDFArray).size()).toBe(1);
  });
});
