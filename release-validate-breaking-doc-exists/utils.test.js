import * as utils from "./utils.js";
import fs from "fs/promises";
import * as core from "@actions/core";

describe("check for breaking changes", () => {
  test("when current version is lower than next, expect true", () => {
    const inputs = {
      currentVersion: "1",
      nextVersion: "2",
    };

    const actual = utils.checkForBreakingChanges(inputs);
    expect(actual).toBe(true);
  });

  test("when current version is same as the next, expect false", () => {
    const inputs = {
      currentVersion: "1",
      nextVersion: "1",
    };

    const actual = utils.checkForBreakingChanges(inputs);
    expect(actual).toBe(false);
  });

  test("when current version is higher as the next, expect false", () => {
    const inputs = {
      currentVersion: "2",
      nextVersion: "1",
    };
    const actual = utils.checkForBreakingChanges(inputs);
    expect(actual).toBe(false);
  });
});

describe("checkFileExists", () => {
  test("should return true if the file exists", async () => {
    fs.access = jest.fn().mockResolvedValue(); // Correct way to mock fs.promises.access
    const result = await utils.checkFileExists("fakeFilePath");
    expect(result).toBe(true);
  });

  test("should return false if the file does not exist", async () => {
    fs.access = jest.fn().mockRejectedValue(new Error("File not found")); // Correct way to mock fs.promises.access
    const result = await utils.checkFileExists("fakeFilePath");
    expect(result).toBe(false);
  });
});

describe("readFile", () => {
  test("should read the file content", async () => {
    fs.readFile = jest.fn().mockResolvedValue("fakeContent"); // Correct way to mock fs.promises.readFile
    const content = await utils.readFile("fakeFilePath");
    expect(content).toBe("fakeContent");
  });

  test("should handle read file error and setFailed", async () => {
    const errorMessage = "File read error";
    fs.readFile = jest.fn().mockRejectedValue(new Error(errorMessage)); // Correct way to mock fs.promises.readFile
    await expect(utils.readFile("fakeFilePath")).rejects.toThrow(errorMessage);
    expect(core.setFailed).toHaveLength(1);
  });
});

describe("publishCommentOnPR", () => {
  beforeEach(() => {
    fetch.resetMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  test("when publishing, POSTs to the correct URL", async () => {
    const inputs = {
      repo: "fubar/repo",
      pullRequestId: "1",
      githubToken: "331334",
    };
    const commentContent = "fubar comment";

    fetch.mockResponseOnce(JSON.stringify({ data: "12345" }));

    await utils.publishCommentOnPR(commentContent, inputs);

    expect(fetch.mock.calls.length).toEqual(1);
    expect(fetch.mock.calls[0][1].method).toEqual("POST");
    expect(fetch.mock.calls[0][0]).toEqual(
      `https://api.github.com/repos/${inputs.repo}/issues/${inputs.pullRequestId}/comments`
    );
    expect(fetch.mock.calls[0][1].body).toEqual(
      JSON.stringify({ body: commentContent })
    );
  });
});

describe("deleteComments", () => {
  beforeEach(() => {
    fetch.resetMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  const inputs = {
    githubToken: "331334",
    repo: "fubar/repo",
    pullRequestId: "1",
  };
  test("deletes comments with matching string", async () => {
    const mockComments = [
      { id: 1, body: "Matching string found" },
      { id: 2, body: "Another comment" },
      { id: 3, body: "Matching string in this comment" },
    ];
    const matchCommentString = "Matching string";

    fetch.mockResolvedValue({ ok: true, json: () => mockComments });

    await utils.deleteComments(matchCommentString, inputs);

    expect(fetch.mock.calls.length).toEqual(3);
    expect(fetch.mock.calls[0][1].method).toEqual("GET");
    expect(fetch.mock.calls[0][0]).toEqual(
      `https://api.github.com/repos/${inputs.repo}/issues/${inputs.pullRequestId}/comments`
    );
    expect(fetch.mock.calls[1][1].method).toEqual("DELETE");
    expect(fetch.mock.calls[1][0]).toEqual(
      `https://api.github.com/repos/${inputs.repo}/issues/comments/${mockComments[0].id}`
    );
    expect(fetch.mock.calls[2][1].method).toEqual("DELETE");
    expect(fetch.mock.calls[2][0]).toEqual(
      `https://api.github.com/repos/${inputs.repo}/issues/comments/${mockComments[2].id}`
    );
  });
});
