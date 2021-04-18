import React, { useState, useEffect, createContext, useContext } from 'react';

import './base.scss';

import Editor from '@monaco-editor/react';
import { StateNodeViz } from './StateNodeViz';
import {
  AnyEventObject,
  assign,
  createMachine,
  interpret,
  Interpreter,
  send,
  State,
  StateMachine,
} from 'xstate';
import { useInterpret, useMachine, useService } from '@xstate/react';
import { createModel } from 'xstate/lib/model';

const testMachine = createMachine({
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
      },
    },
    compound: {
      invoke: {
        src: 'fooSrc',
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
          },
        },
        three: {
          initial: 'atomic',
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
        },
      },
    },
    parallel: {
      type: 'parallel',
      states: {
        three: {},
        four: {},
        five: {},
      },
    },
    final: {
      type: 'final',
    },
  },
});

const model = createModel({
  zoom: 1,
});

export const SimulationContext = createContext(
  (null as any) as Interpreter<
    {
      state: State<any, any, any, any>;
      machine: any;
    },
    any
  >,
);

const createSimModel = (machine: StateMachine<any, any, any>) =>
  createModel(
    {
      state: machine.initialState,
      machine,
    },
    {
      events: {
        'STATE.UPDATE': (state: State<any, any, any, any>) => ({ state }),
        EVENT: (event: AnyEventObject) => ({ event }),
        'MACHINE.UPDATE': () => ({}),
      },
    },
  );

const createSimulationMachine = (machine: StateMachine<any, any, any>) => {
  const simModel = createSimModel(machine);
  return createMachine<typeof simModel>({
    context: simModel.initialContext,
    initial: 'active',

    states: {
      active: {
        invoke: {
          id: 'machine',
          src: (ctx) => (sendBack, onReceive) => {
            console.log('starting again');
            const service = interpret(ctx.machine)
              .onTransition((state) => {
                sendBack({
                  type: 'STATE.UPDATE',
                  state,
                });
              })
              .start();

            onReceive((event) => {
              service.send(event);
            });

            return () => {
              service.stop();
            };
          },
        },
        on: {
          'MACHINE.UPDATE': {
            target: 'active',
            internal: false,
            actions: [
              assign({
                machine: createMachine({
                  initial: 'foo',
                  states: {
                    foo: {
                      on: {
                        NEXT: 'bar',
                      },
                    },
                    bar: {
                      on: {
                        NEXT: 'foo',
                      },
                    },
                  },
                }),
              }),
            ],
          },
        },
      },
    },
    on: {
      'STATE.UPDATE': {
        actions: assign({ state: (_, e) => e.state }),
      },

      EVENT: {
        actions: send((ctx, e) => e.event, { to: 'machine' }),
      },
    },
  });
};

const canvasMachine = createMachine({
  context: model.initialContext,
  on: {
    'ZOOM.OUT': {
      actions: model.assign({ zoom: (ctx) => ctx.zoom - 0.1 }),
      cond: (ctx) => ctx.zoom > 0.5,
    },
  },
});

const MachineViz = () => {
  const simService = useContext(SimulationContext);
  const [state, send] = useService(simService);

  return <StateNodeViz definition={state.context.machine.definition} />;
};

function App() {
  const [state, send] = useMachine(canvasMachine);
  const simService = useInterpret(createSimulationMachine(testMachine));

  return (
    <SimulationContext.Provider value={simService}>
      <main data-viz="app" data-viz-theme="dark">
        <div
          style={{
            transform: `scale(${state.context.zoom})`,
          }}
        >
          <div>
            <button onClick={() => send('ZOOM.OUT')}>-</button>
            <button
              onClick={() =>
                simService.send({
                  type: 'EVENT',
                  event: { type: 'NEXT' },
                })
              }
            >
              NEXT
            </button>
            <button onClick={() => simService.send('MACHINE.UPDATE')}>
              MACHINE
            </button>
          </div>
          <MachineViz />
        </div>
        <Editor
          height="90vh"
          defaultLanguage="javascript"
          defaultValue="// some comment"
        />
      </main>
    </SimulationContext.Provider>
  );
}

export default App;
