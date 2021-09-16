---
'xstate-viz-app': patch
---
pr: #214

Multiple actors are now correctly visualized in the actors panel. This includes actors that are:

- Created with `createMachine(...)` (automatically interpreted by default)
- Invoked with `invoke: { ... }`
- Spawned with `spawn(...)`

<img width="935" alt="Screenshot showing multiple actors visible in the actors panel" src="https://user-images.githubusercontent.com/1093738/133617666-e36d525b-37b2-49a7-9354-92b7d3cd62ac.png">
