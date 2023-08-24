import { doPost } from "../src";

describe("do post", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const inputs = {
    currentVersion: "1",
    nextVersion: "2",
    githubToken: "gh_token",
    pullRequestId: "1",
    repo: "test",
  };

  test("when is code block expect to contain backticks", async () => {
    const startCodeBlock = "```\\n";
    const endCodeBlock = "\\n```";

    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
      })
    ) as jest.Mock;
    global.fetch = fetchMock;

    await doPost(inputs, "../templates/breaking-changes.md", true);

    expect(fetchMock.mock.calls.length).toEqual(1);

    const call = fetchMock.mock.calls[0];

    expect(call[1]?.method).toEqual("POST");
    expect(call[0]).toEqual(
      `https://api.github.com/repos/${inputs.repo}/issues/${inputs.pullRequestId}/comments`
    );
    expect(call[1]?.body).toContain(startCodeBlock);
    expect(call[1]?.body).toContain(endCodeBlock);
  });
});
