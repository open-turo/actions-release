export interface Inputs {
  githubToken: string;
  repo: string;
  pullRequestId: string;
  currentVersion: string;
  nextVersion: string;
}

export interface GithubComment {
  id: number;
  body: string;
}

export interface FetchComments {
  comments: GithubComment[];
  errors: Error[];
}
