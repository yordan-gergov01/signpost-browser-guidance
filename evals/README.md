# @hintora/evals

| file           | purpose                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `fixtures/`    | serialized PageMaps captured with Playwright, from the mock app and real third-party apps      |
| `intents.json` | labelled `{fixture, intent, expectedElementId, expectedStatus}`                                |
| `run.ts`       | accuracy, false-positive rate, abstention, latency, cost                                       |
| `mutations.ts` | DOM mutations vs fingerprint resolve rate, against naive CSS-selector and text-match baselines |
| `redteam.ts`   | injected instructions, decoys, sensitive pages                                                 |

Filled in by the `evals` phase.
