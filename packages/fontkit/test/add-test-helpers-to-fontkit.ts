import fs from "node:fs";
import fontkit from "../src/index.js";

type PostscriptName = string | Record<string, unknown> | null | undefined;
type FontInstance = ReturnType<typeof fontkit.create>;
type AsyncCallback = (err: Error | null, font?: FontInstance) => void;

type FontkitWithHelpers = typeof fontkit & {
  openSync: (filename: string, postscriptName?: PostscriptName) => FontInstance;
  open: (
    filename: string,
    postscriptNameOrCallback: PostscriptName | AsyncCallback,
    maybeCallback?: AsyncCallback,
  ) => void;
};

const fontkitWithHelpers = fontkit as FontkitWithHelpers;

fontkitWithHelpers.openSync = (filename, postscriptName) => {
  const buffer = fs.readFileSync(filename);
  return fontkitWithHelpers.create(buffer, postscriptName ?? undefined);
};

fontkitWithHelpers.open = (
  filename,
  postscriptNameOrCallback,
  maybeCallback,
) => {
  const callback: AsyncCallback =
    typeof postscriptNameOrCallback === "function"
      ? postscriptNameOrCallback
      : (maybeCallback ?? (() => undefined));

  const postscriptName =
    typeof postscriptNameOrCallback === "function"
      ? undefined
      : postscriptNameOrCallback;

  fs.readFile(filename, (err, buffer) => {
    if (err) {
      callback(err);
      return;
    }

    try {
      const loadedFont = fontkitWithHelpers.create(
        buffer,
        postscriptName ?? undefined,
      );
      callback(null, loadedFont);
    } catch (error) {
      callback(error as Error);
    }
  });
};

export default fontkitWithHelpers;
