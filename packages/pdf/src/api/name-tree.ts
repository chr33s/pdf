import { PDFArray, PDFDict, PDFHexString, PDFName, PDFObject, PDFString } from "../core/index.js";

const compareBytes = (left: Uint8Array, right: Uint8Array): number => {
  const length = Math.min(left.length, right.length);
  for (let idx = 0; idx < length; idx++) {
    if (left[idx] !== right[idx]) return left[idx] - right[idx];
  }
  return left.length - right.length;
};

const isNameTreeKey = (object: PDFObject): object is PDFString | PDFHexString =>
  object instanceof PDFString || object instanceof PDFHexString;

/**
 * True when `node` is a flat leaf name tree node that can safely be rewritten.
 * Returns false for `/Kids` trees (or nodes mixing `/Kids` and `/Names`), and
 * for malformed `/Names` arrays - those are left untouched.
 */
export const isWritableFlatNameTree = (node: PDFDict): boolean => {
  if (node.has(PDFName.of("Kids"))) return false;

  if (!node.has(PDFName.of("Names"))) return true;

  const names = node.lookup(PDFName.of("Names"));
  if (!(names instanceof PDFArray) || names.size() % 2 !== 0) return false;

  for (let idx = 0, len = names.size(); idx < len; idx += 2) {
    if (!isNameTreeKey(names.get(idx))) return false;
  }

  return true;
};

/** Sorts a flat name tree `/Names` array in place, in byte order. */
export const sortNameTreeNames = (names: PDFArray): void => {
  const pairs: { key: PDFString | PDFHexString; value: PDFObject }[] = [];

  for (let idx = 0, len = names.size(); idx < len; idx += 2) {
    const key = names.get(idx);
    if (!isNameTreeKey(key)) return;
    pairs.push({ key, value: names.get(idx + 1) });
  }

  pairs.sort((a, b) => compareBytes(a.key.asBytes(), b.key.asBytes()));

  for (let idx = 0, len = pairs.length; idx < len; idx++) {
    names.set(idx * 2, pairs[idx].key);
    names.set(idx * 2 + 1, pairs[idx].value);
  }
};

const syncLimitsIfPresent = (node: PDFDict, names: PDFArray): void => {
  if (!node.has(PDFName.of("Limits")) || names.size() === 0) return;

  const limits = node.lookup(PDFName.of("Limits"));
  if (!(limits instanceof PDFArray) || limits.size() < 2) return;

  limits.set(0, names.get(0));
  limits.set(1, names.get(names.size() - 2));
};

/**
 * Appends `key` / `value` to a flat name tree node, keeping `/Names` sorted as
 * the PDF spec requires (7.9.6) so readers can binary search the tree.
 *
 * @returns `true` when the entry was registered, `false` when the node uses
 * `/Kids` or another structure this helper leaves alone.
 */
export const addNameTreeEntry = (
  node: PDFDict,
  key: PDFString | PDFHexString,
  value: PDFObject,
): boolean => {
  if (!isWritableFlatNameTree(node)) return false;

  if (!node.has(PDFName.of("Names"))) {
    node.set(PDFName.of("Names"), node.context.obj([]));
  }

  const names = node.lookup(PDFName.of("Names"), PDFArray);
  names.push(key);
  names.push(value);
  sortNameTreeNames(names);
  syncLimitsIfPresent(node, names);

  return true;
};
