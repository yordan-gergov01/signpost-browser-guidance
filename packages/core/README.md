# @hintora/core

Pure logic. Reads the DOM, never writes to it, so every module is unit-testable
against a fixture.

No barrel file. Consumers import the concrete module:
`import { distill } from '@hintora/core/distiller/distill'`.

| directory          | responsibility                                                          | phase                |
| ------------------ | ----------------------------------------------------------------------- | -------------------- |
| `src/types/`       | shared zod schemas                                                      | dom-distiller        |
| `src/distiller/`   | DOM to PageMap                                                          | dom-distiller        |
| `src/redaction/`   | PII scrubbing before anything leaves the page                           | redaction-and-safety |
| `src/safety/`      | injection heuristics, sensitive-page circuit breaker, action classifier | redaction-and-safety |
| `src/fingerprint/` | element identity and weighted resolver                                  | fingerprint-resolver |
| `src/config/`      | models, resolver weights, budgets                                       | llm-loop             |
