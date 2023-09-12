# GitHub Action Semantic Release

## Description

GitHub Action for Semantic Release

## Configuration

### Step1: Set any [Semantic Release Configuration](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration) in your repository.

### Step2: [Add Secrets](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets) in your repository for the [Semantic Release Authentication](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/ci-configuration.md#authentication) Environment Variables.

### Step3: Add a [Workflow File](https://help.github.com/en/articles/workflow-syntax-for-github-actions) to your repository to create custom automated processes.

## Usage

```yaml
name: Semantic Release

on:
  push:
    branches: [main]

jobs:
  semantic-release:
    name: Release
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - uses: open-turo/actions-release/semantic-release@v2
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| parameter        | description                                                                                                                                                               | required | default                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------- |
| branches         | Override the branches where semantic release runs on                                                                                                                      | `false`  |                                           |
| ci               | Set to false to skip Continuous Integration environment verifications                                                                                                     | `false`  |                                           |
| dry-run          | Whether to run semantic release in `dry-run` mode. It will override the dryRun attribute in your configuration file                                                       | `false`  |                                           |
| extra-plugins    | Extra plugins for pre-install. You can also specify specifying version range for the extra plugins if you prefer. Defaults to install @open-turo/semantic-release-config. | `false`  | @open-turo/semantic-release-config@^1.4.0 |
| github-token     | GitHub token that can checkout the repository as well as create tags/releases against it. e.g. 'secrets.GITHUB_TOKEN'                                                     | `true`   |                                           |
| semantic-version | Specify what version of semantic release to use                                                                                                                           | `false`  |                                           |

## Outputs

| parameter                  | description                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| new-release-published      | Whether a new release was published                                                                              |
| new-release-notes          | The release notes for the new release if any                                                                     |
| new-release-version        | Version of the new release                                                                                       |
| new-release-major-version  | Major version of the new release                                                                                 |
| new-release-minor-version  | Minor version of the new release                                                                                 |
| new-release-patch-version  | Patch version of the new release                                                                                 |
| new-release-type           | Type of the new release: 'prerelease' \| 'prepatch' \| 'patch' \| 'preminor' \| 'minor' \| 'premajor' \| 'major' |
| last-release-version       | Version of the last release                                                                                      |
| last-release-major-version | Major version of the last release                                                                                |

## Runs

This action is an `composite` action.

## Notes

- By default, this action will perform actions/checkout as its first step.
