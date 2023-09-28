import path from "node:path";
import { fileURLToPath } from "node:url";

import { error, info, setFailed, setOutput } from "@actions/core";
import { getExecOutput } from "@actions/exec";
import semver from "semver";

// Hack to ensure that NCC and webpack don't replace the dynamic import
// See https://github.com/vercel/ncc/issues/935#issuecomment-1189850042
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const _import = new Function("p", "return import(p)");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// enum with the outputs that the action has. this should be the same as action.yaml
const OUTPUTS = {
  last_release_major_version: "last-release-major-version",
  last_release_version: "last-release-version",
  new_release_notes: "new-release-notes",
  new_release_published: "new-release-published",
  new_release_version: "new-release-version",
  new_release_major_version: "new-release-major-version",
  new_release_minor_version: "new-release-minor-version",
  new_release_patch_version: "new-release-patch-version",
  new_release_type: "new-release-type",
} as const;

interface Inputs {
  branches?: string | JSON;
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
  let branches: string | JSON | undefined;
  try {
    branches =
      process.env.SEMANTIC_ACTION_BRANCHES &&
      (JSON.parse(process.env.SEMANTIC_ACTION_BRANCHES) as JSON);
  } catch {
    branches = process.env.SEMANTIC_ACTION_BRANCHES;
  }
  return {
    branches: branches || undefined,
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
    const result = await semanticRelease(
      // Remove any input that is undefined or null to not mess with config in files
      Object.fromEntries(
        Object.entries({
          branches: inputs.branches,
          ci: inputs.ci,
          dryRun: inputs.dryRun,
        }).filter(([, value]) => value !== undefined && value !== null),
      ),
    );
    if (result) {
      const { lastRelease, nextRelease } = result;
      setOutput(OUTPUTS.last_release_version, lastRelease.version);
      setOutput(
        OUTPUTS.last_release_major_version,
        semver.major(lastRelease.version),
      );
      if (nextRelease) {
        setOutput(OUTPUTS.new_release_published, "true");
        setOutput(OUTPUTS.new_release_type, nextRelease.type);
        setOutput(OUTPUTS.new_release_notes, nextRelease.notes);
        setOutput(OUTPUTS.new_release_version, nextRelease.version);
        setOutput(
          OUTPUTS.new_release_major_version,
          semver.major(nextRelease.version),
        );
        setOutput(
          OUTPUTS.new_release_minor_version,
          semver.minor(nextRelease.version),
        );
        setOutput(
          OUTPUTS.new_release_patch_version,
          semver.patch(nextRelease.version),
        );
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
