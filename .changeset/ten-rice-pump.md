---
'xstate-viz-app': minor
---

author: @davidkpiano
pr: #192

Sometimes, initial states will end up in an unexpected place, such as all the way to the right of the graph. This was due to the graph layout algorithm trying to prioritize _all_ transitions to point to the right, even transitions cycling back to the initial state. Now, transitions coming from the initial state are prioritized over all others, to ensure that the initial state ends up in an expected top-left placement.
