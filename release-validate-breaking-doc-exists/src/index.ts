import * as utils from "./utils";
import * as core from "@actions/core";
import { Inputs } from "./types";

const matchCommentString = "Upgrade from v";

/**
 * Reads the inputs from the workflow file
 * @returns {{githubToken: string, repo: string, pullRequestId: string, nextVersion: string, currentVersion: string}}
 */
export function getInputs(): Inputs {
  const currentVersion = core.getInput("last-release-version");
  const nextVersion = core.getInput("new-release-version");
  const repo = core.getInput("repo");
  const pullRequestId = core.getInput("pull-request-id");
  const githubToken = core.getInput("github-token");

  return { currentVersion, nextVersion, repo, pullRequestId, githubToken };
}

/**
 * Validates if the breaking change doc exists
 * @param {string} breakingChangeDocFilePath
 * @returns {Promise<boolean>}
 */
export async function validateBreakingChangeDocExists(
  breakingChangeDocFilePath: string
): Promise<boolean> {
  return await utils.checkFileExists(breakingChangeDocFilePath);
}

/**
 * Reads file from filePath argument and publishes its content as comment on the PR
 * if isCodeBlock is true, then the content is published as code block
 * @param {{ currentVersion: string, nextVersion: string, githubToken: string, repo: string, pullRequestId: string }} inputs
 * @param {string} contentFilePath
 * @param {boolean} isCodeBlock
 * @returns {Promise<void>}
 */
export async function doPost(
  inputs: Inputs,
  contentFilePath: string,
  isCodeBlock: boolean
): Promise<void> {
  let content = await utils.readFile(contentFilePath);

  if (isCodeBlock) {
    content =
      "## Missing breaking change document " +
      "\n Use the below template and create the document at: " +
      `./docs/breaking-changes/v${inputs.nextVersion}.md` +
      "\n ```\n" +
      content +
      "\n```";
  }

  await utils.publishCommentOnPR(content, inputs);
}

/**
 * Runs the action
 * @returns {Promise<void>}
 */
async function run(): Promise<void> {
  try {
    const inputs = getInputs();
    const { nextVersion } = inputs;
    const breakingChangeDocFilePath = `${process.env.GITHUB_WORKSPACE}/docs/breaking-changes/v${nextVersion}.md`;
    const breakingChangeTemplateDocFilePath = `${process.env.GITHUB_ACTION_PATH}/../templates/breaking-changes.md`;

    const isBreakingChange = utils.checkForBreakingChanges(inputs);
    if (!isBreakingChange) {
      core.info("It is not a breaking change");
      return;
    }

    core.debug(
      "Deleting previous breaking change template/doc comment on the PR"
    );
    await utils.deleteComments(matchCommentString, inputs);

    const breakingChangeExists = await validateBreakingChangeDocExists(
      breakingChangeDocFilePath
    );
    const contentFilePath = breakingChangeExists
      ? breakingChangeDocFilePath
      : breakingChangeTemplateDocFilePath;
    const isCodeBlock = !breakingChangeExists;

    core.debug(
      `Publishing ${isCodeBlock ? "template" : "doc"} comment on the PR`
    );
    await doPost(inputs, contentFilePath, isCodeBlock);

    if (!breakingChangeExists) {
      core.setFailed("Breaking change doc does not exist");
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
