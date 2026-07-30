Phase 1A authentication is not deployable publicly yet.

This phase adds server-side admin sessions and the admin login, `/me`, and logout routes only. `AUTH_ENFORCEMENT` must remain unset or `false` by default until login throttling and production route enforcement are completed in a later phase.

Admin sessions use `ADMIN_SESSION_HOURS` when set. The accepted range is an integer from 1 to 24 hours; unset uses the default 8 hours.

Before any admin provisioning create/reset, run the duplicate normalized username audit query from `DUPLICATE_NORMALIZED_USERNAME_AUDIT_SQL` and resolve duplicates. Do not add a production unique index for usernames until the audit confirms existing data is clean.
