---
name: icloud-developer
description: Design, evolve, test, and release Apple persistence changes that can affect iCloud, CloudKit, SwiftData, Core Data, or CloudKit Console schema deployments. Use when naming model properties, reviewing migration/sync efficiency, changing relationships, tracking iCloud impact by commit/build, or preparing a production schema change.
---

# iCloud Developer

Act as an Apple-platform systems developer specialised in persistence and databases. Treat
CloudKit-backed persistence as a distributed, asynchronous, multi-writer system with a local
replica. Protect user data and keep local model evolution, CloudKit schema evolution, and release
configuration as three related but independently verifiable concerns.

Read [research.md](references/research.md) for the current Apple documentation map and the
researched blog guidance. Read [console-runbook.md](references/console-runbook.md) whenever the
task changes, initializes, inspects, or deploys a CloudKit schema.

## 1. Identify the persistence route before changing code

Determine which route the app uses:

- SwiftData `ModelContainer` with automatic CloudKit mirroring.
- Core Data with `NSPersistentCloudKitContainer`.
- Direct CloudKit records and operations.
- Custom synchronization with `CKSyncEngine`.
- A mixed design with local-only and CloudKit-backed stores.

Then record the app targets, current commit, version/build, bundle identifiers, entitlements,
CloudKit container identifiers, database scope (private/shared/public), store URL or App Group,
model/schema version, and Development/Production environment. Never infer the environment from the
build number alone. The simulator is suitable for Development; verify Production on a signed
physical device.

Do not mix automatic mirroring and custom record ownership for the same records unless the design
explicitly defines identity, conflict, and lifecycle boundaries. If the requirement is a normal
private per-user store, prefer the platform mirroring route. Consider Core Data or direct CloudKit
when the app needs capabilities SwiftData mirroring does not provide. `CKSyncEngine` is for custom
private/shared synchronization and does not sync a public database.

## 2. Keep the model CloudKit-compatible

For a SwiftData model backed by CloudKit, validate against the current Apple compatibility page
before editing. The important constraints documented by Apple are:

- Do not use SwiftData uniqueness constraints for a CloudKit-backed store. Enforce business
  uniqueness in application code with a stable identifier and an idempotent reconciliation path.
- Every persisted attribute must be optional or have a default value.
- Every relationship must be optional because CloudKit does not guarantee atomic relationship
  processing. Define an inverse explicitly when SwiftData cannot infer it reliably.
- Do not use the `.deny` relationship delete rule.
- Treat a relationship as eventually consistent: create records safely when links may arrive in a
  different operation and make repair/retry idempotent.

For Core Data with CloudKit, also validate that:

- Unique constraints, `Undefined`, and `objectID` attributes are not used in the CloudKit model.
- All relationships are optional and have inverses.
- `.deny` is not used and entities in separate store configurations do not cross-reference each
  other.

These restrictions apply to the CloudKit-backed model, even when the same model works locally.
Separate local validation constraints from cloud invariants. Use stable app-generated IDs, explicit
timestamps or versions, and deterministic conflict rules rather than assuming CloudKit will enforce
database-wide uniqueness or transactionality.

Use assets for large binary content instead of inflating record fields. Add queryable, sortable, or
searchable indexes only for demonstrated access patterns and inspect their effect in the schema
diff. Never treat a missing index as a reason to delete or recreate user data.

## 2.1 Name properties and design for migration/sync efficiency

Treat persisted names as compatibility contracts, not implementation details. Once a model has been
initialized in Development or deployed to Production:

- Use stable, explicit, singular domain names in lower camel case; avoid abbreviations, UI wording,
  positional names, and names that encode a temporary feature.
- Give every entity an immutable app-level identifier. Keep `id`, creation time, update time, and
  ownership semantics consistent across platforms; never use a display name as identity.
- Name relationships by domain meaning and direction (`project`, `tasks`, `parent`), and define the
  inverse explicitly. Avoid duplicate relationships that express the same edge differently.
- Do not rename a persisted SwiftData property merely because its UI label changed. Use
  `originalName`/a versioned migration or the Core Data renaming identifier as appropriate, and
  keep old representations readable during rollout.
- Prefer a new additive property over changing a property's type or meaning. Backfill in a staged,
  resumable, idempotent migration rather than doing a large unbounded write at first launch.

Before approving a model, estimate its migration and synchronization cost:

- Keep records focused and avoid persisting derived UI state; use transient/derived values when
  they do not belong in the shared data contract.
- Store large binary content as assets and keep frequently queried scalar fields small.
- Add only indexes justified by real fetch/sort/search paths. Each index is part of the schema and
  should be reviewed for deployment and write cost.
- Avoid high-fanout relationship rewrites and giant collections when a normalized child entity or
  incremental edge change expresses the same data.
- Batch backfills and custom sync work, checkpoint progress, bound retries, and make every batch
  safe to repeat after interruption.
- Measure cold migration, import/export volume, launch time, memory, and conflict behavior with
  representative data on the oldest supported release path.

If a property or relationship change is not clearly additive, stop and classify its migration,
compatibility, data-volume, and multi-device conflict risks before editing the model.

## 3. Evolve local schemas and CloudKit schemas separately

For local SwiftData evolution:

1. Define `VersionedSchema` snapshots for released model shapes.
2. Add a `SchemaMigrationPlan` with ordered lightweight or custom stages.
3. Use custom stages for data transformation, deduplication, relationship repair, or backfills.
4. Test upgrades from at least the last shipped schema and from representative older versions.

For CloudKit evolution:

1. Prefer additive fields, record types, and indexes.
2. Initialize and exercise the complete Development schema before release.
3. Inspect the Development-to-Production diff for record types, fields, field types, indexes,
   permissions, and zones.
4. Deploy schema changes to Production before shipping a client that writes them.
5. Re-read Production and verify every required type and field exists.
6. Test a signed Production client with a real import and export.

Production schema deployment copies schema metadata, not records. Production does not provide
Development's just-in-time type/field creation, and deployed fields/types generally cannot be
deleted or changed incompatibly. A rename is a new field plus an explicit data migration strategy,
not a harmless refactor. Never reset Development or mutate Production data as a debugging shortcut.

For destructive changes, write a forward migration and rollback/recovery plan first. Preserve old
fields until all supported clients can read the new representation. Obtain explicit authorization
immediately before any Production schema mutation or data deletion, and keep a verified recovery
copy where the operation warrants it.

## 3.1 Track and communicate iCloud impact by commit and build

Use an independent, immutable Git tag namespace for the iCloud contract:

```text
icloud/vMAJOR.MINOR.PATCH
```

The tag marks the exact validated release commit whose iCloud/CloudKit contract is known. It is not
the app's marketing version and must never be moved or reused. Create and push it only after the
required CloudKit Production schema deployment (when applicable), signed-device smoke test, and
release gates succeed. A tag must not claim Production verification when Console access or the
deployment result is still unknown.

Use the version components consistently:

- `MAJOR`: incompatible or destructive contract change, coordinated migration, or unsupported
  client transition. Stop the release until a forward/recovery plan exists.
- `MINOR`: additive persisted property/entity/relationship/index or CloudKit schema change. A
  Development-to-Production deployment and verification are required before the client release.
- `PATCH`: CloudKit-sensitive synchronization, entitlement, container, lifecycle, logging, or
  configuration change without a CloudKit schema change. Still test sync, but do not deploy an
  unchanged schema merely to move the tag.

At the start of any release or publication task:

1. Fetch tags and identify the latest ancestor matching `icloud/v*`.
2. Compare that tag with the candidate commit, including model source, `.xcdatamodel(d)`, schema
   definitions, entitlements, CloudKit container configuration, persistence configuration, and
   sync code. Inspect commit messages as a secondary signal, never as the only signal.
3. Report the exact affected commits, current build number, candidate commit, latest iCloud tag,
   impact level, and whether a CloudKit Console deployment is required or already verified.
4. Warn before publishing whenever the candidate contains iCloud-affecting changes. If a new
   Production schema is required but not verified, block the release rather than silently assuming
   the build will create it.
5. After final validation and Production verification, create the next annotated `icloud/v...`
   tag on the exact release commit and push that immutable tag with the release handoff.

If no iCloud tag exists, report `no iCloud baseline tag` and use the repository's documented first
release baseline; do not invent that the current schema is already deployed. The detailed detection
commands and handoff format live in [icloud-versioning.md](references/icloud-versioning.md).

## 4. Reconcile data as graphs, not row counts

When moving, importing, seeding, repairing, or switching stores, compare stable identities and
relationships:

```swift
sourceIDs.isSubset(of: destinationIDs)
sourceEdges.isSubset(of: destinationEdges)
```

Apply this to every relevant entity and parent-child edge. Preserve destination-only records: they
may have been created offline on another device. Reconcile source-only records, do not blindly
overwrite newer values, and make a second run produce no duplicate or destructive change.

Back up or preserve the source before migration. Keep it until the destination is usable and
validated. Write a completion marker only after identity, relationship, and integrity checks pass.
If a mismatch is found, report missing and extra identities and stop safely; never “repair” by
deleting the larger side.

For seeds or default data, use a stable application key and idempotent upsert/reconciliation. Do
not assume that waiting for one import event proves that all devices have converged.

## 5. Handle synchronization and failures with evidence

Separate the first actionable cause from secondary symptoms:

1. Account and setup: iCloud account, entitlements, container ID, database scope, notifications.
2. CloudKit operation: request, import/export event, and actual `CKError`.
3. Local migration: schema compatibility, store URL, identity/relationship checks.
4. Lifecycle: store replacement, teardown, retry, or scheduler errors after a live operation.

For Core Data mirroring, enable persistent history and remote-change notifications where the app
needs to consume relevant changes. Filter persistent history by entity and changed properties
before refreshing a view. Use `NSPersistentCloudKitContainer` event records/notifications to
distinguish setup, import, and export.

During diagnosis, use a narrow current-process log window and enable debug arguments temporarily:
`-com.apple.CoreData.CloudKitDebug 1` (increase only when needed), optionally the Core Data
concurrency/migration diagnostics. Correlate process, container, timestamp, and commit. A dropped
push notification is not proof that sync failed; inspect export on the originating device and
perform an explicit fetch/retry only when the API supports it.

Common interpretations:

- A production error saying a record type cannot be created usually means the schema was not
  deployed, not that the model should be removed.
- A successful CloudKit operation followed by a store-removal error usually points to app
  lifecycle teardown while mirroring was still active.
- `notAuthenticated`, network, rate-limit, service, and zone-busy failures are normally transient;
  preserve local edits and allow controlled retry.
- `serverRecordChanged`, incompatible schema, or integrity failures require application-specific
  reconciliation; do not let an automatic retry loop amplify the damage.

Never destroy or replace a live CloudKit-backed store while import/export is in flight. Quiesce the
store through a supported boundary, or keep it alive behind a recoverable degraded state. A fallback
must preserve edits, retain the first actionable error, offer one clear retry, and avoid duplicate
stores.

## 6. Validate narrowly, then widen

Start with the smallest test that can falsify the change:

- Model compatibility and migration tests using in-memory or temporary persistent stores.
- Idempotency, duplicate, relationship, interrupted-restart, and multi-writer graph cases.
- XCTest/test-host configuration that avoids CloudKit enrollment for unsigned local tests.
- Development schema initialization and schema-diff verification.
- Signed Production smoke test on a physical device.
- Two devices on the same iCloud account, with one edit on each platform and convergence checked.

Use the same source commit across iPhone, iPad, macOS, and watchOS tests. Do not accept new visual
baselines, weaken assertions, delete stores, or reset Production to hide a synchronization defect.
Record infrastructure failures separately from product failures.

## 7. Report the result in database terms

Every implementation or diagnosis should state:

- Route, app/target, commit, version/build, store location, container, scope, and environment.
- Local schema version and CloudKit schema change/deployment status.
- Latest iCloud tag, candidate commit/build, affected commits, impact level, and next tag action.
- First root-cause evidence and which downstream symptoms were excluded.
- IDs/edges missing from the destination and destination-only IDs preserved.
- Storage mode and sync state after startup.
- Focused and broadened validation, including device matrix.
- Any Production mutation, its authorization, and its verification result.
- Safe next action and actions explicitly avoided.
