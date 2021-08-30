import { createMachine } from 'xstate';

export const appMachine = createMachine({
  id: 'app',
  initial: 'panels',
  states: {
    panels: {
      initial: 'expanded',
      states: {
        expanded: {
          on: {
            'PANELS.TOGGLE': 'collapsed',
          },
        },
        collapsed: {
          on: {
            'PANELS.TOGGLE': 'expanded',
          },
        },
      },
    },
  },
});
