# GitHub Action Semantic Release

<!-- prettier-ignore-start -->
<!-- action-docs-description -->
## Description

GitHub Action for Semantic Release
<!-- action-docs-description -->
<!-- prettier-ignore-end -->

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
      - uses: open-turo/actions-release/semantic-release@v3
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

<!-- prettier-ignore-start -->
<!-- action-docs-inputs -->
## Inputs

| parameter | description | required | default |
| --- | --- | --- | --- |
| github-token | GitHub token that can checkout the repository as well as create tags/releases against it. e.g. 'secrets.GITHUB_TOKEN' | `true` | ${{ github.token }} |
| branches | Override the branches where semantic release runs on. Accepts a string or a JSON object. | `false` |  |
| ci | Set to false to skip Continuous Integration environment verifications | `false` |  |
| dry-run | Whether to run semantic release in `dry-run` mode. It will override the dryRun attribute in your configuration file | `false` |  |
| extra-plugins | Extra plugins for pre-install. You can also specify specifying version range for the extra plugins if you prefer. | `false` |  |
| semantic-version | Specify what version of semantic release to use | `false` |  |
| override-github-ref-name | Allow for override of github ref-name for running pull and repository dispatch triggered events | `false` |  |
<!-- action-docs-inputs -->

<!-- action-docs-outputs -->
## Outputs

| parameter | description |
| --- | --- |
| new-release-published | Whether a new release was published |
| new-release-notes | The release notes for the new release if any |
| new-release-version | Version of the new release |
| new-release-major-version | Major version of the new release |
| new-release-minor-version | Minor version of the new release |
| new-release-patch-version | Patch version of the new release |
| new-release-type | Type of the new release: 'prerelease' | 'prepatch' | 'patch' | 'preminor' | 'minor' | 'premajor' | 'major' |
| last-release-version | Version of the last release |
| last-release-major-version | Major version of the last release |
<!-- action-docs-outputs -->

<!-- action-docs-runs -->
## Runs

This action is a `composite` action.
<!-- action-docs-runs -->

<!-- action-docs-usage  -->
<!-- action-docs-usage -->
<!-- prettier-ignore-end -->
