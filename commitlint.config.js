module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'build',    // Changes that affect the build system or external dependencies (example scopes: webpack, npm)
        'chore',    // Changes that aren't user-facing
        'ci',       // Changes that affect CI configuration files and scripts (example scopes: azuredevops.yaml, workflows.yml)
        'docs',     // Changes that affect the documentation
        'feat',     // Changes that introduce a new feature
        'fix',      // Changes that patch a bug
        'perf',     // Changes which improve performance
        'refactor', // Changes which neither fix a bug nor add a feature
        'revert',   // Changes that revert a previous commit
        'style',    // Changes that don't affect code logic, such as white-spaces, formatting, missing semi-colons
        'test'      // Changes that add missing tests or correct existing tests
      ],
    ]
  }
};