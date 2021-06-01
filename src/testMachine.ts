import { createMachine } from 'xstate';

export const xtestMachine = createMachine({
  id: 'm',
  delimiter: '_',
  initial: 'foo',
  states: {
    foo: {
      id: 'foo',
      on: { NEXT: 'bar' },
    },
    bar: {
      initial: 'one',
      states: {
        one: {
          on: {
            OUT: '#foo',
          },
        },
      },
    },
  },
});

// export const testMachine = createMachine({
//   initial: 'foo',
//   states: {
//     foo: {},
//   },
// });

export const testMachine = createMachine<{ count: number }>({
  schema: {
    events: {
      INC: {
        properties: {
          value: {
            type: 'number',
          },
        },
      },
    } as any,
  },
  context: {
    count: 0,
  },
  initial: 'simple',
  entry: ['rootAction1'],
  exit: ['rootAction1'],
  on: {
    'ROOT.EVENT': {},
  },
  states: {
    simple: {
      entry: ['action1', 'really long action', 'action3'],
      exit: ['anotherAction', 'action4'],
      on: {
        NEXT: 'compound',
        INC: [
          { target: 'compound', cond: (_, e) => e.value > 10 },
          { target: 'final' },
        ],
        EVENT: {
          target: 'final',
          cond: function somethingIsTrue() {
            return true;
          },
        },
        SELF: '.',
      },
    },
    compound: {
      invoke: {
        src: 'fooSrc',
        onDone: 'final',
        onError: 'failure',
      },
      initial: 'one',
      states: {
        one: {
          on: {
            NEXT: 'two',
          },
        },
        two: {
          on: {
            PREV: 'one',
            NEXT: 'three',
          },
        },
        three: {
          initial: 'atomic',
          always: {
            target: 'one',
            cond: () => false,
          },
          states: {
            atomic: {},
            history: {
              type: 'history',
            },
            deepHist: {
              type: 'history',
              history: 'deep',
            },
          },
          on: {
            TO_PARALLEL: '#parallel',
          },
        },
      },
      on: {
        SELF: '.',
      },
    },
    parallel: {
      id: 'parallel',
      type: 'parallel',
      states: {
        three: {
          on: {
            SELF: '.',
          },
        },
        four: {},
        five: {},
      },
    },
    final: {
      type: 'final',
    },
    failure: {},
  },
});
