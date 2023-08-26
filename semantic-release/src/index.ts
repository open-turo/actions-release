import path from "node:path";
import { fileURLToPath } from "node:url";

import { error, info, setFailed, setOutput } from "@actions/core";
import { getExecOutput } from "@actions/exec";

// Hack to ensure that NCC and webpack don't replace the dynamic import
// See https://github.com/vercel/ncc/issues/935#issuecomment-1189850042
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const _import = new Function("p", "return import(p)");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// enum with the outputs that the action has. this should be the same as action.yaml
const OUTPUTS = {
  new_release_notes: "new-release-notes",
  new_release_published: "new-release-published",
} as const;

interface Inputs {
  branches?: string;
  ci: boolean;
  dryRun: boolean;
  extraPlugins: string[];
  semanticVersion?: string;
}

/**
 * Run NPM install inside the `semantic-release` directory
 * @param packages List of packages to install
 */
async function runNpmInstall(packages: string[]) {
  info(`Installing packages in ${path.resolve(__dirname, "..")}`);
  const silentFlag = process.env.RUNNER_DEBUG === "1" ? "" : "--silent";
  const data = await getExecOutput(
    "npm",
    ["install", ...packages, "--no-audit", silentFlag],
    {
      cwd: path.resolve(__dirname, ".."),
    },
  );
  if (data.stderr !== "") {
    error(data.stderr);
  }
  if (data.stdout !== "") {
    info(data.stdout);
  }
  if (data.exitCode > 0) {
    const npmInstallError = new Error(
      `npm install failed with exit code ${data.exitCode}`,
    );
    setFailed(npmInstallError);
    throw npmInstallError;
  }
}

/**
 * Get inputs from the environment
 */
function getInputs(): Inputs {
  return {
    branches: process.env.SEMANTIC_ACTION_BRANCHES || undefined,
    ci: process.env.SEMANTIC_ACTION_CI === "true",
    dryRun: process.env.SEMANTIC_ACTION_DRY_RUN === "true",
    extraPlugins: (process.env.SEMANTIC_ACTION_EXTRA_PLUGINS || "")
      .replaceAll(/["']/g, "")
      .replaceAll(/[\n\r]/g, " ")
      .trim()
      .split(" ")
      .filter((package_) => package_ !== ""),
    semanticVersion: process.env.SEMANTIC_ACTION_SEMANTIC_VERSION || undefined,
  };
}

/**
 * Given the semantic version input return the right semantic-release package
 * to install (with the version if provided)
 * @param semanticVersion Semantic version to install
 */
function getSemanticReleaseWithVersion(
  semanticVersion: Inputs["semanticVersion"],
): string {
  const semanticReleasePackage = "semantic-release";
  return semanticVersion
    ? `${semanticReleasePackage}@${semanticVersion}`
    : semanticReleasePackage;
}

/**
 * Install semantic release with any extra plugin and run it with the provided
 * configuration
 */
export async function main() {
  const inputs = getInputs();
  info(
    `Running semantic-release action with inputs: ${JSON.stringify(inputs)}`,
  );
  await runNpmInstall([
    getSemanticReleaseWithVersion(inputs.semanticVersion),
    ...inputs.extraPlugins,
  ]);
  try {
    const { default: semanticRelease } = (await _import(
      "semantic-release",
    )) as typeof import("semantic-release");
    const result = await semanticRelease({
      branches: inputs.branches,
      ci: inputs.ci,
      dryRun: inputs.dryRun,
    });
    if (result) {
      const { nextRelease } = result;
      if (nextRelease) {
        setOutput(OUTPUTS.new_release_published, "true");
        setOutput(OUTPUTS.new_release_notes, nextRelease.notes);
        info(
          `New release${inputs.dryRun ? " to be" : ""} published: ${
            nextRelease.version
          }`,
        );
      }
    }
  } catch (error: unknown) {
    setFailed(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

if (__filename === process.argv[1]) {
  // eslint-disable-next-line unicorn/prefer-top-level-await
  main().catch((error: Error) => {
    setFailed(error.message);
  });
}
