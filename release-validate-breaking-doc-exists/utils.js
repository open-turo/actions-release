import fs from "fs/promises"; // Use fs.promises for promise-based API
import fetch from "node-fetch";
import * as core from "@actions/core";

/**
 * Checks if the next version is a breaking change
 * @param {{ currentVersion: string, nextVersion: string }} inputs
 * @returns {boolean}
 */
export function checkForBreakingChanges(inputs) {
  const actual = Number(inputs.currentVersion) + 1;
  const expected = Number(inputs.nextVersion);
  if (actual === expected) {
    core.info("It is a breaking change");
    return true;
  }
  return false;
}

/**
 * Checks if the file exists
 * @param filePath
 * @returns {Promise<boolean>}
 */
export async function checkFileExists(filePath) {
  core.debug("Checking if file exists: " + filePath);
  try {
    await fs.access(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Reads the file
 * @param filename
 * @returns {Promise<Buffer>}
 */
export async function readFile(filename) {
  core.debug("Reading from file: " + filename);
  try {
    return await fs.readFile(filename, "utf8");
  } catch (error) {
    core.setFailed(error.message);
    throw error; // Re-throw the error to propagate it
  }
}

/**
 * Publishes the comment on the PR
 * @param commentContent
 * @param {{ githubToken: string, repo: string, pullRequestId: string }} inputs
 * @returns {Promise<void>}
 */
export async function publishCommentOnPR(commentContent, inputs) {
  const apiUrl = `https://api.github.com/repos/${inputs.repo}/issues/${inputs.pullRequestId}/comments`;
  const headers = {
    Authorization: `Bearer ${inputs.githubToken}`,
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({ body: commentContent });

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      core.setFailed(`Failed to publish comment.`);
    } else {
      core.debug(`Comment published successfully.`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

/**
 * Deletes the matching comments on the PR
 * @param commentBodyInclude
 * @param {{ githubToken: string, repo: string, pullRequestId: string }} inputs
 * @returns {Promise<void>}
 */
export async function deleteComments(commentBodyInclude, inputs) {
  try {
    const url = `https://api.github.com/repos/${inputs.repo}/issues/${inputs.pullRequestId}/comments`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${inputs.githubToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      core.setFailed(`Failed to fetch comments.`);
      return;
    }

    const comments = await response.json();

    if (comments.length === 0) {
      core.info("No comments found");
      return;
    }

    for (const comment of comments) {
      if (comment.body.includes(commentBodyInclude)) {
        const deleteUrl = `https://api.github.com/repos/${inputs.repo}/issues/comments/${comment.id}`;
        const deleteResponse = await fetch(deleteUrl, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${inputs.githubToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!deleteResponse.ok) {
          core.setFailed(`Failed to delete comment ${comment.id}.`);
        } else {
          core.debug(`Comment ${comment.id} deleted successfully.`);
        }
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}
