---
name: icloud-development
description: Develop, review, release, and diagnose Apple iCloud synchronization backed by CloudKit, Core Data, or SwiftData. Use for CloudKit schema evolution and Production promotion, container and entitlement changes, local-to-cloud migrations, multi-device merge behavior, sync startup failures, CloudKit/Core Data logs, fallback storage, retry behavior, or release validation across macOS, iPhone, and iPad.
---

# iCloud Development

Build iCloud synchronization as a multi-writer data system. Protect user data first, distinguish
CloudKit failures from application migration failures, and treat Production schema changes as a
release operation.

## Establish the active configuration

Before diagnosing or changing synchronization:

1. Identify the running app path, version, build number, source commit, bundle identifier, and
   CloudKit environment.
2. Confirm the container identifier, entitlements, model schema, store location, and whether the
   app is using CloudKit or local fallback.
3. Confirm every tested device is running the intended commit. A higher build number does not prove
   that a particular fix is present.
4. Preserve unrelated local changes and existing stores. Do not delete an app, store, zone, record
   type, or container as a diagnostic shortcut.
5. Obtain explicit user authorization immediately before mutating a Production schema or deleting
   Production CloudKit data.

## Diagnose from evidence

Read the narrowest recent logs for the current process. Correlate events by process ID and time so
old builds do not contaminate the diagnosis.

Separate these layers:

1. **Account and setup:** iCloud account status, user identity, entitlements, container selection,
   and mirroring-delegate setup.
2. **CloudKit operation:** import/export requests and their actual operation errors.
3. **Application migration:** local-to-cloud copy, reconciliation, integrity checks, markers, and
   fallback selection.
4. **Lifecycle fallout:** store removal, scheduler cancellation, and errors emitted after the app
   tears down a live mirroring store.

Interpret common evidence carefully:

- `Cannot create new type ... in production schema` means the application schema was not deployed
  to Production. Do not exclude a legitimate model merely to hide the error.
- `missing=0` with `unexpected>0` means the destination contains the full source plus cloud-only
  data. This is structurally acceptable in a multi-device system and must not fail migration.
  Inspect the extra record's stable ID, relationships, timestamps, and originating build before
  deciding whether it is intentional data or a duplicate; do not delete it automatically.
- A successful CloudKit modify operation followed by `NSCocoaErrorDomain 134407` usually means the
  app removed or replaced the store while the import/export event was finishing. Treat it as a
  lifecycle consequence, not proof that CloudKit rejected the records.
- Background-task registration or cancellation errors after store teardown are usually secondary
  noise. Find the first application or CloudKit error.
- Repeatedly pressing retry on an unfixed build can repeat migrations and amplify duplicate data.
  Stop retrying until the running build is confirmed.

State the root cause separately from downstream symptoms.

## Evolve the CloudKit schema safely

Treat schema deployment as part of shipping a model change:

1. Make model changes additive whenever possible.
2. Initialize and exercise the complete schema in Development.
3. Inspect the Development-to-Production diff, including record types, fields, indexes, and security
   roles.
4. Verify that no unexpected deletion, rename, or incompatible type change is implied.
5. Deploy the additive schema to Production before releasing a build that writes it.
6. Re-read the Production schema and confirm every required entity and index is present.
7. Launch a signed build against Production and verify a real import and export.

Do not assume Production permits just-in-time type or field creation. Do not promote a partial
schema when the application writes an atomic graph spanning multiple record types.

For destructive evolution, design an explicit versioned migration and rollback plan. Never delete
Production fields, record types, zones, or user records without separate authorization and a
verified backup.

## Define migration integrity correctly

Model local-to-cloud migration as reconciliation between two independently mutable graphs.

Require the destination to contain every source identity and relationship:

```swift
sourceIDs.isSubset(of: destinationIDs)
sourceEdges.isSubset(of: destinationEdges)
```

Apply this invariant to systems, settings, projects, tactics, paths, tasks, criteria, ownership
edges, and parent-child edges as appropriate.

- Preserve destination-only records created by another device or process.
- Copy or reconcile source-only records into the destination.
- Fail safely when any source record or required relationship is still missing.
- Compare stable identities and graph edges, not only aggregate counts.
- Make reconciliation idempotent: running it twice must not duplicate or delete data.
- Prefer deterministic conflict rules based on explicit versions or timestamps supplied by an
  injected runtime boundary.
- Back up the local source before the first migration.
- Write a completion marker only after integrity validation succeeds.
- Keep the local store intact until the cloud-backed store is demonstrably usable.

Never “repair” a mismatch by automatically deleting the larger side.

## Make fallback lifecycle-safe

Avoid destroying a CloudKit-backed container while its mirroring delegate is importing or
exporting.

Prefer one of these designs:

- Validate and reconcile with an isolated destination before exposing the live syncing container.
- Keep the cloud container alive and present a recoverable degraded state while synchronization
  finishes or shuts down.
- Explicitly quiesce synchronization before removing or replacing a store when the framework
  provides a supported boundary.

When fallback is required:

1. Preserve all local edits.
2. Record the first actionable error.
3. Avoid automatic retry loops.
4. Give the user one clear retry action.
5. Keep detailed IDs and counts in logs; show concise localized guidance in the UI.

## Test the migration matrix

Add focused automated coverage for:

- Empty local store → populated cloud store.
- Populated local store → empty cloud store.
- Cloud destination containing extra records and relationships.
- Local source containing new offline records.
- Missing destination records or edges.
- Concurrent changes from macOS and iOS.
- Repeated startup and repeated retry idempotency.
- Interrupted migration and restart recovery.
- Parent-child relationship preservation and cycle rules.
- Multiple systems and partially overlapping graphs.
- Container creation without unintended CloudKit enrollment in unit tests.
- Production configuration selecting the intended container and environment.

Use in-memory stores for graph behavior, persistent temporary stores for restart behavior, and a
signed Production smoke test only when the user has authorized the required credentials and
external mutations.

## Validate with a release ladder

Run the narrowest useful validation first:

1. Integrity-unit test reproducing the reported graph.
2. Migration and container smoke tests.
3. Full logical unit suite.
4. Signed macOS Production smoke test.
5. One-device macOS import/export verification.
6. iPhone and iPad verification from the same source commit.
7. Two-device edit and convergence check.

Do not mask a sync defect by accepting new snapshot baselines or weakening unrelated assertions.
Document environment-specific failures separately from logical test results.

## Release and recovery runbook

For a release that changes iCloud behavior:

1. Back up important user data.
2. Deploy and verify the additive Production schema.
3. Merge the validated synchronization change.
4. Build macOS and iOS from the same `main` revision.
5. Open macOS first and wait for synchronization to settle.
6. Verify representative systems, relationships, and recent edits.
7. Open iOS next and wait before editing.
8. Make one test edit on each platform and confirm convergence.
9. Stop retries and collect current-process logs if either device falls back.

If a bad build shipped, preserve both local and cloud stores, identify which side contains each
unique record, and ship a forward repair. Prefer recovery code over manual Production deletion.

## Report the result

Include:

- Running app path, version/build, and tested commit.
- Container and Development/Production environment.
- First root-cause error.
- Whether CloudKit operations succeeded or failed.
- Source/destination missing and extra identities.
- Storage mode after startup.
- Validation performed on macOS, iPhone, and iPad.
- Any Production mutation performed and its authorization.
- Safe next action and explicit actions to avoid.
