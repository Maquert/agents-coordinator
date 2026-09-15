# iCloud impact and versioning protocol

This protocol lets a release agent answer, before publishing a build, whether commits since the
last verified iCloud marker changed persistence or CloudKit behavior.

## Marker semantics

Use annotated, immutable tags in this namespace:

```text
icloud/vMAJOR.MINOR.PATCH
```

The marker is created on the exact release commit after all applicable Development and Production
schema checks pass. It means “this commit's iCloud contract was verified,” not merely “the model
compiled.” The tag is independent from the app's `MARKETING_VERSION`, build number, and ordinary
release tag.

Do not create a marker on a feature branch just because a model file changed. The release marker
must correspond to a coherent, validated release commit. Do not move an existing marker. If an
older repository uses another convention, preserve it and document the mapping before introducing
this namespace.

## Detect the change range

Run from the repository root:

```sh
git fetch --tags origin
last_icloud_tag="$(git tag --list 'icloud/v*' --sort=-v:refname | head -n 1)"
if [ -n "$last_icloud_tag" ]; then
  baseline="$last_icloud_tag"
else
  baseline="$(git rev-list --max-parents=0 HEAD | tail -n 1)"
fi
git log --oneline --decorate "$baseline"..HEAD
git diff --name-status "$baseline"..HEAD
```

Inspect changed content, not only filenames. Treat these paths or symbols as iCloud-impact signals:

- SwiftData: `@Model`, `@Attribute`, `@Relationship`, `VersionedSchema`,
  `SchemaMigrationPlan`, `ModelContainer`, `ModelConfiguration`.
- Core Data: `.xcdatamodel`, `.xcdatamodeld`, `NSPersistentCloudKitContainer`, store descriptions,
  persistent history, remote-change options, or migration mapping identifiers.
- CloudKit: `CKRecord`, `CKRecord.Reference`, `CKSyncEngine`, subscriptions, database scopes,
  schema definitions, `cktool`, CloudKit container IDs, queryable/sortable/searchable indexes.
- Project configuration: `.entitlements`, iCloud/CloudKit capabilities, remote notifications,
  App Group store locations, or build configuration that selects a container/environment.
- Commits whose message mentions iCloud, CloudKit, SwiftData, Core Data, schema, migration, sync,
  or persistence are a secondary signal and require content inspection.

The release agent must record the first and last affected commit, not only the latest file diff.
Use the exact candidate build and commit in the warning so a newer build cannot be mistaken for a
different source state.

## Required release warning

When the range has an iCloud signal, add this handoff block to the release report:

```text
iCloud impact: YES
iCloud baseline: <icloud/v... or no iCloud baseline tag>
Affected commits: <first>..<last>
Candidate: <commit>, build <build>
Impact: <major | minor | patch>
CloudKit schema deployment: <required and verified | not required | unknown>
Next action: <deploy/re-read Production | run sync smoke test | none>
```

The warning is mandatory even when the change is only a relationship rename, a default-value
change, an entitlement change, or a synchronization lifecycle fix. Explain whether the CloudKit
schema itself changed; do not call every iCloud-affecting change a schema deployment.

If the range contains persisted property, entity, relationship, index, field-type, or schema-file
changes and Production verification is unknown, stop publication of the client and request the
missing Console verification. A successful local build or Xcode Cloud build does not prove that
Production accepts the schema.

## Version selection

- Major: incompatible/destructive contract or coordinated data migration. Requires an explicit
  forward/recovery plan and compatibility window.
- Minor: additive persisted model or CloudKit schema change. Requires Development exercise,
  reviewed diff, Production deployment, and signed-device smoke testing.
- Patch: sync implementation, entitlement, container selection, lifecycle, logging, or other
  CloudKit-sensitive change without a schema change. Requires focused sync validation.

If several categories occur, use the highest category. Do not create the next marker until the
release commit and all required gates are complete. An absent tag is an explicit unknown baseline,
not proof that the current Production schema is current.

## Creating and verifying a marker

After the final applicable release gate and Production check:

```sh
git tag -a icloud/vX.Y.Z <validated-commit> \
  -m "Record verified iCloud contract vX.Y.Z"
git push origin icloud/vX.Y.Z
git rev-parse icloud/vX.Y.Z^{}
git ls-remote origin refs/tags/icloud/vX.Y.Z
```

Never force-update an iCloud marker. If the wrong commit was tagged, create a new patch version
with an explanation and leave the original tag intact. If a remote push fails, report the local
validated commit and the unpushed tag; never claim the marker is published.
