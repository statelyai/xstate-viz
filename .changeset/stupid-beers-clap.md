---
'xstate-viz-app': patch
---

Multiple actors are now correctly visualized in the actors panel. This includes actors that are:

- Created with `createMachine(...)` (automatically interpreted by default)
- Invoked with `invoke: { ... }`
- Spawned with `spawn(...)`
