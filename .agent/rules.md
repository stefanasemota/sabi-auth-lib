# Custom Skills
- **/ship**: When I use this command, the agent must:
  1. Run `npm test` and ensure all tests pass.
  2. Ask: "Should this be a patch, minor, or major version bump?"
  3. Execute `npm version <choice> -m "Release %s"`.
  4. Run `git push origin $(git branch --show-current) --tags`.