import type { error, setFailed, setOutput } from "@actions/core";
import type { getExecOutput } from "@actions/exec";
import type semanticRelease from "semantic-release";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

/**
 * Mock calls to npm install and semantic release as this is just a unit test of the action
 * Integration tests are part of the CI GHA workflow
 */

// Use vi.hoisted to ensure mock functions are available when vi.mock is hoisted
const { errorMock, getExecOutputMock, setFailedMock, setOutputMock } =
  vi.hoisted(() => ({
    errorMock: vi.fn<typeof error>(),
    getExecOutputMock: vi.fn<typeof getExecOutput>(),
    setFailedMock: vi.fn<typeof setFailed>(),
    setOutputMock: vi.fn<typeof setOutput>(),
  }));

const semanticReleaseMock = vi.fn<typeof semanticRelease>();

vi.mock("@actions/exec", () => ({
  getExecOutput: getExecOutputMock,
}));

vi.mock("@actions/core", () => ({
  error: errorMock,
  info: vi.fn(),
  setFailed: setFailedMock,
  setOutput: setOutputMock,
}));

// Import after mocks are set up
const { _resetImport, _setImport, main } = await import("../src/index.js");

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

describe("semantic-release", () => {
  beforeEach(() => {
    // Mock the dynamic import for semantic-release
    _setImport(() => Promise.resolve({ default: semanticReleaseMock }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    _resetImport();
    delete process.env.SEMANTIC_ACTION_BRANCHES;
    delete process.env.SEMANTIC_ACTION_CI;
    delete process.env.SEMANTIC_ACTION_DRY_RUN;
    delete process.env.SEMANTIC_ACTION_EXTRA_PLUGINS;
    delete process.env.SEMANTIC_ACTION_SEMANTIC_VERSION;
  });

  test("runs semantic release", async () => {
    mockNpmInstall();
    mockRelease();
    await main();
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
    expect(options).toHaveProperty("cwd", expect.stringContaining("/src"));
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
    mockRelease({ lastRelease: undefined });
    await main();
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
    await main();
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
    await main();
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
    await main();
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
    await main();
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

  test("propagates npm install errors", async () => {
    mockNpmInstall({
      exitCode: 1,
      stderr: "Error installing semantic-release",
    });
    await expect(main()).rejects.toMatchInlineSnapshot(
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
    await expect(main()).rejects.toMatchInlineSnapshot(
      `[Error: Semantic release failed]`,
    );
    expect(setFailedMock).toHaveBeenCalled();
  });
});
