import type { error, setFailed, setOutput } from "@actions/core";
import type { getExecOutput } from "@actions/exec";
import { afterEach, jest } from "@jest/globals";
import type semanticRelease from "semantic-release";

import type { main as Main } from "../src/index.js";

/**
 * Mock calls to npm install and semantic release as this is just a unit test of the action
 * Integration tests are part of the CI GHA workflow
 */

const getExecOutputMock = jest.fn() as jest.Mock<typeof getExecOutput>;
const semanticReleaseMock = jest.fn() as jest.Mock<typeof semanticRelease>;
const setOutputMock = jest.fn() as jest.Mock<typeof setOutput>;
const setFailedMock = jest.fn() as jest.Mock<typeof setFailed>;
const errorMock = jest.fn() as jest.Mock<typeof error>;

jest.unstable_mockModule("@actions/exec", () => ({
  getExecOutput: getExecOutputMock,
}));

jest.unstable_mockModule("semantic-release", () => ({
  default: semanticReleaseMock,
}));

jest.unstable_mockModule("@actions/core", () => ({
  error: errorMock,
  info: jest.fn(),
  setFailed: setFailedMock,
  setOutput: setOutputMock,
}));

type SemanticRelease = Awaited<ReturnType<typeof semanticRelease>>;

const mockRelease = (overrides: Partial<SemanticRelease> = {}) => {
  const lastRelease = {
    channels: [],
    gitHead: "test",
    gitTag: "test",
    name: "test",
    version: "1.2.3-test",
  };
  semanticReleaseMock.mockResolvedValue({
    commits: [],
    lastRelease,
    nextRelease: {
      ...lastRelease,
      channel: "test",
      notes: "New Release notes",
      type: "prerelease",
    },
    releases: [],
    ...overrides,
  });
};

const mockNpmInstall = (
  overrides: Partial<Awaited<ReturnType<typeof getExecOutput>>> = {},
) => {
  getExecOutputMock.mockResolvedValue({
    exitCode: 0,
    stderr: "",
    stdout: "",
    ...overrides,
  });
};

const callAction = async () => {
  const { main } = (await import("../src/index.js")) as { main: typeof Main };
  return main();
};

describe("semantic-release", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    delete process.env.SEMANTIC_ACTION_BRANCHES;
    delete process.env.SEMANTIC_ACTION_CI;
    delete process.env.SEMANTIC_ACTION_DRY_RUN;
    delete process.env.SEMANTIC_ACTION_EXTRA_PLUGINS;
    delete process.env.SEMANTIC_ACTION_SEMANTIC_VERSION;
  });

  test("runs semantic release", async () => {
    mockNpmInstall();
    mockRelease();
    await callAction();
    expect(getExecOutputMock).toHaveBeenCalledTimes(1);
    const [cmd, arguments_, options] = getExecOutputMock.mock.calls[0];
    expect(cmd).toMatchInlineSnapshot(`"npm"`);
    expect(arguments_).toMatchInlineSnapshot(`
      [
        "install",
        "semantic-release",
        "--no-audit",
        "--silent",
      ]
    `);
    expect(options).toHaveProperty("cwd", expect.any(String));
    expect(semanticReleaseMock).toHaveBeenCalledTimes(1);
    expect(semanticReleaseMock.mock.calls[0][0]).toMatchInlineSnapshot(`
      {
        "ci": false,
        "dryRun": false,
      }
    `);
    expect(setOutputMock.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "last-release-version",
          "1.2.3-test",
        ],
        [
          "last-release-major-version",
          1,
        ],
        [
          "new-release-published",
          "true",
        ],
        [
          "new-release-type",
          "prerelease",
        ],
        [
          "new-release-notes",
          "New Release notes",
        ],
        [
          "new-release-version",
          "1.2.3-test",
        ],
        [
          "new-release-major-version",
          1,
        ],
        [
          "new-release-minor-version",
          2,
        ],
        [
          "new-release-patch-version",
          3,
        ],
      ]
    `);
  });

  test("doesn't set last release outputs if there is no last release", async () => {
    mockNpmInstall();
    mockRelease({ lastRelease: false } as unknown as SemanticRelease);
    await callAction();
    expect(setOutputMock.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "new-release-published",
          "true",
        ],
        [
          "new-release-type",
          "prerelease",
        ],
        [
          "new-release-notes",
          "New Release notes",
        ],
        [
          "new-release-version",
          "1.2.3-test",
        ],
        [
          "new-release-major-version",
          1,
        ],
        [
          "new-release-minor-version",
          2,
        ],
        [
          "new-release-patch-version",
          3,
        ],
      ]
    `);
  });

  test("runs semantic release with the extra options", async () => {
    process.env.SEMANTIC_ACTION_BRANCHES = "test";
    process.env.SEMANTIC_ACTION_CI = "true";
    process.env.SEMANTIC_ACTION_DRY_RUN = "true";
    mockNpmInstall();
    mockRelease({ nextRelease: undefined });
    await callAction();
    expect(semanticReleaseMock).toHaveBeenCalledTimes(1);
    expect(semanticReleaseMock.mock.calls[0][0]).toMatchInlineSnapshot(`
      {
        "branches": "test",
        "ci": true,
        "dryRun": true,
      }
    `);
  });

  test("supports JSON `branches` input", async () => {
    process.env.SEMANTIC_ACTION_BRANCHES =
      '["test", {"name": "test-branch", "channel": "next"}]';
    process.env.SEMANTIC_ACTION_CI = "true";
    process.env.SEMANTIC_ACTION_DRY_RUN = "true";
    mockNpmInstall();
    mockRelease({ nextRelease: undefined });
    await callAction();
    expect(semanticReleaseMock).toHaveBeenCalledTimes(1);
    expect(semanticReleaseMock.mock.calls[0][0]).toMatchInlineSnapshot(`
      {
        "branches": [
          "test",
          {
            "channel": "next",
            "name": "test-branch",
          },
        ],
        "ci": true,
        "dryRun": true,
      }
    `);
  });

  test("installs the specified version of semantic release", async () => {
    process.env.SEMANTIC_ACTION_SEMANTIC_VERSION = "1.0.0";
    mockNpmInstall();
    mockRelease({ nextRelease: undefined });
    await callAction();
    expect(getExecOutputMock).toHaveBeenCalledTimes(1);
    const [cmd, arguments_] = getExecOutputMock.mock.calls[0];
    expect(cmd).toMatchInlineSnapshot(`"npm"`);
    expect(arguments_).toMatchInlineSnapshot(`
      [
        "install",
        "semantic-release@1.0.0",
        "--no-audit",
        "--silent",
      ]
    `);
  });

  test("installs extra plugins", async () => {
    process.env.SEMANTIC_ACTION_EXTRA_PLUGINS = "test@1.0.0\n'test-2'";
    mockNpmInstall();
    mockRelease({ nextRelease: undefined });
    await callAction();
    expect(getExecOutputMock).toHaveBeenCalledTimes(1);
    const [cmd, arguments_] = getExecOutputMock.mock.calls[0];
    expect(cmd).toMatchInlineSnapshot(`"npm"`);
    expect(arguments_).toMatchInlineSnapshot(`
      [
        "install",
        "semantic-release",
        "test@1.0.0",
        "test-2",
        "--no-audit",
        "--silent",
      ]
    `);
  });

  test("pins @open-turo/semantic-release-config if asked as extra plugin", async () => {
    process.env.SEMANTIC_ACTION_EXTRA_PLUGINS =
      "@open-turo/semantic-release-config";
    mockNpmInstall();
    mockRelease({ nextRelease: undefined });
    await callAction();
    expect(getExecOutputMock).toHaveBeenCalledTimes(1);
    const [cmd, arguments_] = getExecOutputMock.mock.calls[0];
    expect(cmd).toMatchInlineSnapshot(`"npm"`);
    expect(arguments_).toMatchInlineSnapshot(`
      [
        "install",
        "semantic-release",
        "@open-turo/semantic-release-config@6.1.2",
        "--no-audit",
        "--silent",
      ]
    `);
  });

  test("propagates npm install errors", async () => {
    mockNpmInstall({
      exitCode: 1,
      stderr: "Error installing semantic-release",
    });
    await expect(callAction()).rejects.toMatchInlineSnapshot(
      `[Error: npm install failed with exit code 1]`,
    );
    expect(errorMock).toHaveBeenCalled();
    expect(setFailedMock).toHaveBeenCalled();
    expect(errorMock.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "Error installing semantic-release",
      ]
    `);
  });

  test("propagates any semantic release error", async () => {
    mockNpmInstall();
    semanticReleaseMock.mockRejectedValue(new Error("Semantic release failed"));
    await expect(callAction()).rejects.toMatchInlineSnapshot(
      `[Error: Semantic release failed]`,
    );
    expect(setFailedMock).toHaveBeenCalled();
  });
});
