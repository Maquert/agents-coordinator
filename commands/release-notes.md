Use the `release-notes` skill.

- The app uses semver and is still on `0.x`.
- New features bump the minor version; fixes bump the patch version; majors are not allowed.
- Compare against the last `release_notes` git tag.
- Filter out technical-only changes.
- Rewrite user-visible changes so they are customer-facing and readable.
- Remove stale release notes using the existing release note strings and from the `Localizable` strings catalog.
- Create the new release note list.
- "Commit the changes" means create the local commit.
- Tag the release commit with the current release.
- Maintain exactly one `release_notes` tag and keep it on the newest release-notes commit.
- Push to the remote.
- Create a PR.
- Finish on `main` only after the work is safely committed elsewhere or fully finished.
- Finish with the message: `RELEASE NOTES CREATED AT <CURRENT DATE>` where the timestamp includes day, month, year, hour, and minute.
