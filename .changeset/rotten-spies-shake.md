---
'xstate-viz-app': patch
---

author: @davidkpiano
pr: #195

The graph layout algorithm (using ELK) is now more resilient to layout failures caused by some layout options (such as compaction), so heuristics have been applied that make it more resilient to potential layout failures.
