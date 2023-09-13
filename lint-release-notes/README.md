# GitHub Action Lint Release Notes

## Description

Github action that lints release notes. It generates release notes using semantic-release and posts them as a comment in
a pull request with the changes that would be included in the next version of the codebase if the pull request is
merged. It also will fail if there are breaking changes and no `v<major-version>.md` doc has been created.

## Configuration

### Step1: Set any [Semantic Release Configuration](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration) in your repository.

### Step2: [Add Secrets](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets) in your repository for the [Semantic Release Authentication](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/ci-configuration.md#authentication) Environment Variables.

### Step3: Add a [Workflow File](https://help.github.com/en/articles/workflow-syntax-for-github-actions) to your repository to create custom automated processes.

## Usage

```yaml
name: Release notes preview

on:
  # It's import that this runs on the push event, as semantic release will not run on pull_request events
  push:
    branches-ignore:
      - main

jobs:
  lint-release-notes:
    name: Lint release notes
    steps:
      - uses: open-turo/actions-release/lint-release-notes@v2
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| parameter                     | description                                                                                                                                                               | required | default                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------- |
| checkout-repo                 | Perform checkout as first step of action                                                                                                                                  | `false`  | true                                      |
| enforce-breaking-changes-docs | Ensure that an appropriate `v<major-version>.md` doc has been created if there are breaking changes in the PR. Fail if required and missing.                              | `false`  | `true`                                    |
| extra-plugins                 | Extra plugins for pre-install. You can also specify specifying version range for the extra plugins if you prefer. Defaults to install @open-turo/semantic-release-config. | `false`  | @open-turo/semantic-release-config@^1.4.0 |
| github-token                  | GitHub token that can checkout the repository as well as create tags/releases against it. e.g. 'secrets.GITHUB_TOKEN'                                                     | `true`   |                                           |
| semantic-version              | Specify what version of semantic release to use                                                                                                                           | `false`  |                                           |

## Outputs

N/A

## Runs

This action is an `composite` action.

## Notes

- By default, this action will perform actions/checkout as its first step.
