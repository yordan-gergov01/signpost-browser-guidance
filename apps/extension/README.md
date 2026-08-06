# @hintora/extension

MV3 extension: a content script that injects core plus overlay, and a React side
panel.

Permission posture is part of the design: no `<all_urls>`, `activeTab` plus
optional host permissions requested when the user starts a session.

Filled in by the `extension-shell` phase.
