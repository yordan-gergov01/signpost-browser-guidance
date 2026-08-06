# @hintora/core

Pure logic. Reads the DOM, never writes to it, so every module is unit-testable
against a fixture.

No barrel file. Consumers import the concrete module:
`import { distill } from '@hintora/core/distiller/distill'`.

| directory          | responsibility                                                          | phase                |
| ------------------ | ----------------------------------------------------------------------- | -------------------- |
| `src/types/`       | shared zod schemas                                                      | done                 |
| `src/distiller/`   | DOM to PageMap                                                          | done                 |
| `src/redaction/`   | PII scrubbing before anything leaves the page                           | redaction-and-safety |
| `src/safety/`      | injection heuristics, sensitive-page circuit breaker, action classifier | redaction-and-safety |
| `src/fingerprint/` | element identity and weighted resolver                                  | fingerprint-resolver |
| `src/config/`      | models, resolver weights, budgets                                       | llm-loop             |

## Distiller

`distill(document)` returns a `PageMap`: page context plus a bounded, ranked list
of interactive elements described by role, accessible name and state.

Rules worth knowing before changing it:

- **Modal narrowing.** When a dialog is open the map contains only what is inside
  it. Detection uses semantic visibility, not the container's own box, because
  portals and `display: contents` wrappers are legitimately zero-sized.
- **Document coordinates.** The off-canvas filter runs in document space. An
  element scrolled above the fold is kept and simply marked `inViewport: false`;
  only the `left: -9999px` parking pattern is dropped.
- **Values never leave.** Free-text input values become `[redacted]`,
  `contenteditable` content is not read at all, and only `select` state survives
  because a chosen option is page meaning rather than user input.
- **Geometry is not sent.** `bbox` exists for the overlay. `toPromptPageMap`
  strips it on the way to the model.
- **Ids are snapshot-scoped.** Anything persisted stores a fingerprint instead.

`src/testing/` holds test-only helpers. happy-dom has no layout engine, so
`stubLayout` assigns deterministic rects rather than introducing a test-only
visibility strategy, which keeps one production code path.
