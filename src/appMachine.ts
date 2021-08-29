import { createMachine } from 'xstate';

export const appMachine = createMachine({
  id: 'app',
  type: 'parallel',
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
