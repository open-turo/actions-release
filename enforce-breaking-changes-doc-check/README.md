# GitHub Action Enforce Breaking Changes Doc Check

## Description

Github action that checks if it is a breaking change and prompts users to publish a breaking change doc.
If the breaking change document is not published, it posts a comment on the pull request with breaking change document template.
If the breaking change document is published, it posts a comment on the pull request with the breaking change document

## Configuration

### Step1: Set any [Semantic Release Configuration](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration) in your repository.

### Step2: [Add Secrets](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets) in your repository for the [Semantic Release Authentication](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/ci-configuration.md#authentication) Environment Variables.

### Step3: Add a [Workflow File](https://help.github.com/en/articles/workflow-syntax-for-github-actions) to your repository to create custom automated processes.

## Usage

```yaml
name: Enforce breaking changes doc check

on:
  # It's import that this runs on the push event, as semantic release will not run on pull_request events
  push:

jobs:
  enforce-breaking-changes-doc-check:
    name: Enforce breaking changes doc check
    steps:
      - uses: open-turo/actions-release/enforce-breaking-changes-doc-check@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| parameter        | description                                                                                                                                                               | required | default                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| extra-plugins    | Extra plugins for pre-install. You can also specify specifying version range for the extra plugins if you prefer. Defaults to install @open-turo/semantic-release-config. | `false`  | @open-turo/semantic-release-config@^1.4.0                                                        |
| github-token     | GitHub token that can checkout the repository as well as create tags/releases against it. e.g. 'secrets.GITHUB_TOKEN'                                                     | `true`   |                                                                                                  |
| semantic-version | Specify what version of semantic release to use                                                                                                                           | `false`  |                                                                                                  |
| template-url     | Breaking changes document template URL                                                                                                                                    | `false`  | 'https://raw.githubusercontent.com/open-turo/actions-release/main/templates/breaking-changes.md' |

## Outputs

N/A

## Runs

This action is an `composite` action.

## Notes

- By default, this action will perform actions/checkout as its first step.
