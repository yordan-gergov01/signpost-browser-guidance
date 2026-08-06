# Hintora PoC - browser-first, DOM-grounded product guidance

A user types what they want to do inside a web app. The system reads the current
page, works out the next concrete action, and highlights the exact button or
field to click, one step at a time.

The thesis: the DOM is semantic ground truth. Roles, accessible names,
enabled/disabled state and visibility are already there to be read. We do not
need to screenshot the screen and ask a vision model to guess at pixels. Reading
the DOM is cheaper, faster, deterministic, and verifiable - we can prove an
element exists before we point at it.

Core principle: we guide, we do not act. The overlay highlights and instructs;
the user performs every click.

## Layout

    packages/core     DOM to PageMap, fingerprints, redaction, safety
    packages/overlay  shadow-DOM spotlight and tooltip, vanilla TS
    packages/client   guidance loop, state machine, telemetry
    apps/extension    MV3 extension
    apps/sdk          embeddable <script> build
    apps/server       Fastify LLM proxy and flow cache
    apps/mock-app     Acme CRM, the demo and eval target
    evals             fixtures, scorer, mutation and red-team suites

## Quickstart

    npm install
    npm run dev

Work in progress. Full documentation lands with the docs phase:
`ARCHITECTURE.md`, `EVALS.md`, `SECURITY.md`, `NEXT.md`.
