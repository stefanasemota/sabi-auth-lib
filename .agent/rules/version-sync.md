---
trigger: always_on
---

# Version Sync Rule
- **Constraint**: The `version` field in `package.json` must always stay in sync with the current Git tag.
- **Action**: Before any `git push` or `npm publish`, verify the version consistency.
- **Automation**: If a version bump is needed, use `npm version <patch|minor|major>` instead of manual edits to ensure Git tags and JSON stay coupled.