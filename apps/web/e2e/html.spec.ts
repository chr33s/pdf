import { expect, test } from "@playwright/test";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = fileURLToPath(new URL(".", import.meta.url));
const publicDir = resolve(currentDir, "../public");
const htmlFixtures = readdirSync(publicDir)
  .filter((fileName) => fileName.endsWith(".test.html"))
  .sort((a, b) => {
    const getIndex = (name: string) => Number(name.split(".")[0]) || 0;
    return getIndex(a) - getIndex(b);
  });

test.describe("public example pages", () => {
  for (const fixture of htmlFixtures) {
    test(`${fixture} completes without runtime errors`, async ({ page }) => {
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      page.on("pageerror", (err) => {
        pageErrors.push(err.message);
      });
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      const response = await page.goto(`/${fixture}`);
      expect(response?.ok(), `Failed to load ${fixture}`).toBeTruthy();

      await page.waitForFunction(
        () => typeof (globalThis as { test?: unknown }).test === "function",
      );
      await page.waitForFunction(
        () => (globalThis as { PDFLibScriptLoaded?: boolean }).PDFLibScriptLoaded === true,
      );
      const pdfLibStatusHandle = await page.waitForFunction(() => {
        const global = globalThis as { PDFLib?: unknown; PDFLibLoadError?: { message?: string } };
        if (global.PDFLib) {
          return { status: "loaded" };
        }
        if (global.PDFLibLoadError) {
          return {
            status: "error",
            message: global.PDFLibLoadError?.message ?? global.PDFLibLoadError,
          };
        }
        return null;
      });
      const pdfLibStatus = (await pdfLibStatusHandle.jsonValue()) as {
        status: string;
        message?: string;
      };
      expect(pdfLibStatus.status, pdfLibStatus.message ?? "PDFLib failed to load").toBe("loaded");

      const runTestButton = page.getByRole("button", { name: /run test/i });
      await expect(runTestButton, `Missing Run Test button on ${fixture}`).toBeVisible();
      await runTestButton.click();

      const iframe = page.locator("#iframe");
      await expect(iframe).toHaveAttribute("src", /blob:/, { timeout: 120000 });

      expect(pageErrors, `Runtime errors on ${fixture}: ${pageErrors.join("; ")}`).toHaveLength(0);
      expect(
        consoleErrors,
        `Console errors on ${fixture}: ${consoleErrors.join("; ")}`,
      ).toHaveLength(0);
    });
  }
});
