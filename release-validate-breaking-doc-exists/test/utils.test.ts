import * as utils from "../src/utils";
import * as core from "@actions/core";
import { promises as fs } from "fs";

import { Inputs } from "../src/types";

describe("check for breaking changes", () => {
  test("when current version is lower than next, expect true", async () => {
    const inputs = {
      currentVersion: "1",
      nextVersion: "2",
    } as Inputs;

    const actual = await utils.checkForBreakingChanges(inputs);
    expect(actual).toBe(true);
  });

  test("when current version is same as the next, expect false", async () => {
    const inputs = {
      currentVersion: "1",
      nextVersion: "1",
    } as Inputs;

    const actual = await utils.checkForBreakingChanges(inputs);
    expect(actual).toBe(false);
  });

  test("when current version is higher as the next, expect false", async () => {
    const inputs = {
      currentVersion: "2",
      nextVersion: "1",
    } as Inputs;
    const actual = await utils.checkForBreakingChanges(inputs);
    expect(actual).toBe(false);
  });
});

describe("checkFileExists", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should return true if the file exists", async () => {
    jest.spyOn(fs, "access").mockImplementation(jest.fn());
    const result = await utils.checkFileExists("fakeFilePath");
    expect(result).toBe(true);
  });

  test("should return false if the file does not exist", async () => {
    jest.spyOn(fs, "access").mockImplementation(
      jest.fn(() => {
        throw new Error("file not found");
      })
    );
    const result = await utils.checkFileExists("fakeFilePath");
    expect(result).toBe(false);
  });
});

describe("readFile", () => {
  test("should read the file content", async () => {
    const readFileResults = Promise.resolve("fakeContent");
    jest
      .spyOn(fs, "readFile")
      .mockImplementation(jest.fn(() => readFileResults) as jest.Mock);
    const content = await utils.readFile("fakeFilePath");
    expect(content).toBe("fakeContent");
  });

  test("should handle read file error and setFailed", async () => {
    const errorMessage = "Cannot read file";
    jest.spyOn(fs, "readFile").mockImplementation(
      jest.fn(() => {
        throw new Error(errorMessage);
      })
    );
    await expect(utils.readFile("fakeFilePath")).rejects.toThrow(errorMessage);
    expect(core.setFailed).toHaveLength(1);
  });
});

describe("publishCommentOnPR", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  test("when publishing, POSTs to the correct URL", async () => {
    const inputs = {
      repo: "fubar/repo",
      pullRequestId: "1",
      githubToken: "331334",
    } as Inputs;
    const commentContent = "fubar comment";

    const response: Promise<Response> = Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ comments: commentContent }),
    } as Response);

    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => response,
      })
    ) as jest.Mock;
    global.fetch = fetchMock;

    await utils.publishCommentOnPR(commentContent, inputs);

    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][1]?.method).toEqual("POST");
    expect(fetchMock.mock.calls[0][0]).toEqual(
      `https://api.github.com/repos/${inputs.repo}/issues/${inputs.pullRequestId}/comments`
    );
    expect(fetchMock.mock.calls[0][1]?.body).toEqual(
      JSON.stringify({ body: commentContent })
    );
  });
});

describe("deleteComments", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  const inputs = {
    githubToken: "331334",
    repo: "fubar/repo",
    pullRequestId: "1",
  } as Inputs;
  test("deletes comments with matching string", async () => {
    const mockComments = [
      { id: 1, body: "Matching string found" },
      { id: 2, body: "Another comment" },
      { id: 3, body: "Matching string in this comment" },
    ];
    const matchCommentString = "Matching string";

    const result = Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ comments: mockComments }),
    });

    const fetchMock = jest.fn(() => result) as jest.Mock;
    global.fetch = fetchMock;

    await utils.deleteComments(matchCommentString, inputs);

    expect(fetchMock.mock.calls.length).toEqual(3);
    expect(fetchMock.mock.calls[0][1]?.method).toEqual("GET");
    expect(fetchMock.mock.calls[0][0]).toEqual(
      `https://api.github.com/repos/${inputs.repo}/issues/${inputs.pullRequestId}/comments`
    );
    expect(fetchMock.mock.calls[1][1]?.method).toEqual("DELETE");
    expect(fetchMock.mock.calls[1][0]).toEqual(
      `https://api.github.com/repos/${inputs.repo}/issues/comments/${mockComments[0].id}`
    );
    expect(fetchMock.mock.calls[2][1]?.method).toEqual("DELETE");
    expect(fetchMock.mock.calls[2][0]).toEqual(
      `https://api.github.com/repos/${inputs.repo}/issues/comments/${mockComments[2].id}`
    );
  });
});
