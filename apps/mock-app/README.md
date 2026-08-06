# @hintora/mock-app

"Acme CRM": a deterministic target for the demos and eval fixtures. Seed data is
fixed so captured PageMaps reproduce.

    src/app/       shell and route table
    src/pages/     route entry points, one feature component each
    src/features/  self-contained slices: components/, data/, types/, utils/, hooks/
    src/shared/    ui primitives and helpers used across features

Conventions:

- no barrel files, import the concrete module
- `@/` alias instead of deep relative paths, enforced by ESLint
- components PascalCase, everything else camelCase

Deliberate properties the guidance layer is tested against:

- two buttons labelled exactly `Export` on `/contacts`, in different regions
- `Delete account` in Settings, for the action safety classifier
- real `role="dialog"`, `role="tablist"` and named region landmarks
- client-side navigation via pushState, no document reload
