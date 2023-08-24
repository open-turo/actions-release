# GitHub Action Release Lint

## Description

Github action is combination of two actions:

- [release-notes-preview](../release-notes-preview/README.md)
- [enforce-breaking-changes-doc-check](../enforce-breaking-changes-doc-check/README.md)

It has input variable which can be used to enable/disable the enforce-breaking-changes-doc-check action.

## Configuration

### Step1: Set any [Semantic Release Configuration](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration) in your repository.

### Step2: [Add Secrets](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets) in your repository for the [Semantic Release Authentication](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/ci-configuration.md#authentication) Environment Variables.

### Step3: Add a [Workflow File](https://help.github.com/en/articles/workflow-syntax-for-github-actions) to your repository to create custom automated processes.

## Usage

```yaml
name: Release lint

on:
  # It's import that this runs on the push event, as semantic release will not run on pull_request events
  push:

jobs:
  release-lint:
    name: Release lint
    steps:
      - uses: open-turo/actions-release/release-lint@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| parameter                    | description                                                                                                           | required | default |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| enforce-breaking-changes-doc | Enforce breaking changes document check.                                                                              | `false`  | 'true'  |
| github-token                 | GitHub token that can checkout the repository as well as create tags/releases against it. e.g. 'secrets.GITHUB_TOKEN' | `true`   |         |

## Outputs

N/A

## Runs

This action is an `composite` action.

## Notes

- By default, this action will perform actions/checkout as its first step.
