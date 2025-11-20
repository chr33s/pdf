import path from "node:path";
import { fileURLToPath } from "node:url";

let decompressed = false;

const decompressJsonFixtures = () => {
  if (decompressed) return;
  decompressed = true;

  // Historically this helper decompressed large JSON fixtures that were
  // committed in compressed form. The current test data ships decompressed,
  // so there is nothing to do here yet. The hook is left in place so older
  // test runners that import this module continue to work as expected.
};

export const here = (metaUrl: string) => {
  decompressJsonFixtures();
  return path.dirname(fileURLToPath(metaUrl));
};
