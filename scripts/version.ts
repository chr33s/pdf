import { spawn } from "node:child_process";
import { readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs, type ParseArgsOptionsConfig } from "node:util";

const options: ParseArgsOptionsConfig = {
  version: {
    default: "patch",
    short: "v",
    type: "string",
  },
};

const args = parseArgs({
  allowPositionals: true,
  options,
});

const versions = ["patch", "minor", "major"] as const;
const version = (args.positionals[0] ?? args.values.version) as (typeof versions)[number];
if (!versions.includes(version)) {
  throw new Error(`Invalid version type: ${String(version)} (allowed: ${versions.join(", ")})`);
}

const root = resolve(import.meta.dirname, "..");
const dir = resolve(root, "./packages");
const files = [
  resolve(root, "package.json"),
  ...(await readdir(dir)).map((path) => resolve(dir, path, "package.json")),
];
for (const file of files) {
  const pkg = await import(file, { with: { type: "json" } }).then((mod) => mod.default);

  const parts = pkg.version.split(".").map((n: string) => parseInt(n, 10));
  switch (version) {
    case "patch":
      parts[2] += 1;
      break;
    case "minor":
      parts[1] += 1;
      parts[2] = 0;
      break;
    case "major":
      parts[0] += 1;
      parts[1] = 0;
      parts[2] = 0;
      break;
  }
  pkg.version = parts.join(".");

  for (const dependency of ["dependencies", "devDependencies", "peerDependencies"]) {
    for (const dep in pkg[dependency] ?? {}) {
      if (!dep.startsWith("@chr33s/pdf")) continue;
      pkg[dependency][dep] = pkg.version;
    }
  }

  await writeFile(file, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
}

await $(`npm install`);

async function $(cmd: string): Promise<{
  code: number;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve, reject) => {
    const command = spawn(cmd, {
      shell: true,
      stdio: "inherit",
    });
    command.on("close", (code) =>
      resolve({
        code: code ?? 1,
        stderr: Buffer.concat(stderr).toString(),
        stdout: Buffer.concat(stdout).toString(),
      }),
    );
    command.on("error", (error) => reject(error));

    const stdout: Buffer[] = [];
    command.stdout?.on("data", (chunk) => stdout.push(chunk));

    const stderr: Buffer[] = [];
    command.stderr?.on("data", (chunk) => stderr.push(chunk));
  });
}
