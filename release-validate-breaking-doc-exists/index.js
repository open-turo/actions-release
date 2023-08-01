import * as utils from "./utils.js";
import * as core from "@actions/core";

const matchCommentString = "Upgrade from v";
const pattern = /^(\d+)\./;

/**
 * Reads the inputs from the workflow file
 * @returns {{githubToken: string, repo: string, pullRequestId: string, nextVersion: string, currentVersion: string}}
 */
function getInputs() {
  const currentVersion = core
    .getInput("last-release-version")
    .match(pattern)[1];
  const nextVersion = core.getInput("new-release-version").match(pattern)[1];
  const repo = core.getInput("repo");
  const pullRequestId = core.getInput("pull-request-id");
  const githubToken = core.getInput("github-token");

  return { currentVersion, nextVersion, repo, pullRequestId, githubToken };
}

/**
 * Runs the action
 * @returns {Promise<void>}
 */
async function run() {
  try {
    const inputs = getInputs();
    const { currentVersion, nextVersion, repo, pullRequestId, githubToken } =
      inputs;
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
    core.setFailed(error.message);
  }
}

/**
 * Validates if the breaking change doc exists
 * @param {string} breakingChangeDocFilePath
 * @returns {Promise<boolean>}
 */
async function validateBreakingChangeDocExists(breakingChangeDocFilePath) {
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
async function doPost(inputs, contentFilePath, isCodeBlock) {
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

run();
