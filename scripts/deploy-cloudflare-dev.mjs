import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const branch = execFileSync("git", ["branch", "--show-current"], {
  cwd: root,
  encoding: "utf8",
}).trim();

const ciBranch = process.env.WORKERS_CI_BRANCH;
if ((ciBranch ?? branch) !== "dev" || (branch && branch !== "dev")) {
  console.error("Deployment Cloudflare hanya diizinkan dari branch dev.");
  process.exit(1);
}

const flags = process.argv.slice(2);
if (flags.some((flag) => !["--dry-run", "--prebuilt"].includes(flag))) {
  console.error("Opsi yang didukung: --dry-run, --prebuilt.");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    fileURLToPath(new URL("../node_modules/cf/bin/cf", import.meta.url)),
    "deploy",
    "--no-provision",
    ...flags,
  ],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_API_BASE_URL: "https://api-colabora.anargya.fun",
    },
  },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
