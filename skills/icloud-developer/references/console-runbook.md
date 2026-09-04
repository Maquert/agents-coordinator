# CloudKit Console deployment runbook

Use this runbook for any model or schema change that can affect a CloudKit-backed app.

## Before touching the console

- Confirm the exact container identifier, app bundle IDs, team, target(s), and entitlements.
- Confirm whether the client uses SwiftData mirroring, Core Data mirroring, direct CloudKit, or
  `CKSyncEngine`.
- Capture the current local model/schema version and the app commit that will ship.
- Determine whether Development or Production is the intended environment.
- Preserve existing user data and do not reset an environment merely to make a new build start.

## Development schema

1. Run the intended Development build with a CloudKit-compatible model.
2. Exercise every new record type, field, relationship, index, and relevant permission path.
3. Inspect the Development schema in CloudKit Console.
4. If using text-based schemas, download the current schema first; edit and validate the downloaded
   definition rather than reconstructing a live schema by hand.
5. Test representative records, relationships, imports, exports, account changes, and retries.

## Review the deployment diff

Before deployment, inspect:

- New record types and fields.
- Field data types and optionality.
- Reference/relationship targets and zones.
- Queryable, sortable, and searchable indexes.
- Roles, read/create/write permissions, and database scope.
- Any deletion, rename, type conversion, or other potentially destructive change.

If the diff is not clearly additive and compatible with supported client versions, stop and design a
versioned forward migration. Do not deploy a partial schema when one client save can involve several
record types.

## Production deployment

1. Obtain the required administrator authorization immediately before the mutation.
2. In CloudKit Console, choose the container and `Deploy Schema Changes`.
3. Read the pending diff and deploy only the reviewed change.
4. Remember that schema metadata is copied; Development records are not copied to Production.
5. Re-open Production and verify every required type, field, index, and permission.
6. Test a signed Production build on a physical device. Confirm both a local export and a remote
   import using representative data.

Do not delete Production record types/fields, reset Production, or bulk-delete user records as a
diagnostic action. Those are separate, high-risk operations requiring explicit scope, authorization,
and a recovery plan.

## Release gate

The release is not ready when only the local build passes. Record all of the following:

- The client commit/version/build and the Production container/environment.
- The exact schema diff deployed and its verification result.
- A successful signed-device import and export.
- Two-device convergence for a representative create, update, relationship change, and delete.
- Any remaining transient, infrastructure, or account limitations.
