import path from "node:path";
import { fileURLToPath } from "node:url";

export const here = (metaUrl: string) => path.dirname(fileURLToPath(metaUrl));
