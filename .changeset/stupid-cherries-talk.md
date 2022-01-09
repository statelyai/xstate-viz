---
'xstate-viz-app': patch
---

Self-transitions on the machine will no longer cause graph layout to fail:

```js
import { createMachine } from 'xstate';

const machine = createMachine({
  on: {
    // These will now display as expected
    LOAD: {},
    UPDATE: {},
  },
  states: {
    something: {},
  },
});
```
