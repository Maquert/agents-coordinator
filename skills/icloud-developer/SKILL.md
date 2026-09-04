---
name: icloud-developer
description: Design, evolve, test, and release Apple persistence changes that can affect iCloud, CloudKit, SwiftData, Core Data, or CloudKit Console schema deployments. Use when a database/model, entitlement, container, migration, sync, or production schema change needs developer-focused guidance.
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
- First root-cause evidence and which downstream symptoms were excluded.
- IDs/edges missing from the destination and destination-only IDs preserved.
- Storage mode and sync state after startup.
- Focused and broadened validation, including device matrix.
- Any Production mutation, its authorization, and its verification result.
- Safe next action and actions explicitly avoided.
