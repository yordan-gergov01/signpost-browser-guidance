# @hintora/client

The orchestrator shared by both distribution targets. The extension and the
embeddable SDK differ only in how they load it.

    observe -> propose next step -> highlight -> wait for user -> detect change

Owns the guidance state machine, change detection, flow cache replay and
client-side telemetry.

Filled in by the `llm-loop` phase.
