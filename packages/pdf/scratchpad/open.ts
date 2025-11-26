import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export const Reader = {
  Preview: "Preview",
  Acrobat: "Adobe Acrobat",
  AcrobatReader: "Adobe Acrobat Reader DC",
  Foxit: "Foxit Reader",
  Chrome: "Google Chrome",
  Firefox: "Firefox",
} as const;

export const openPdf = async (path: string, reader = Reader.Preview) => {
  if (process.platform === "darwin") {
    await execAsync(`open -a "${reader}" ${path}`);
  } else {
    const msg1 =
      "Note: Automatically opening PDFs currently only works on Macs. If you're using a Windows or Linux machine, please consider contributing to expand support for this feature";
    const msg2 = "(https://github.com/Hopding/pdf/blob/master/apps/node/index.ts#L8-L17)\n";
    console.warn(msg1);
    console.warn(msg2);
  }
};
