import React, { useState, useEffect, createContext } from 'react';

import './base.scss';

import Editor from '@monaco-editor/react';
import {
  AnyEventObject,
  assign,
  createMachine,
  createSchema,
  interpret,
  Interpreter,
  send,
  State,
  StateMachine,
} from 'xstate';
import { useInterpret, useMachine } from '@xstate/react';
import { createModel } from 'xstate/lib/model';
import { MachineViz } from './MachineViz';

const testMachine = createMachine({
  schema: {
    events: {
      INC: {
        properties: {
          value: {
            type: 'number',
          },
        },
      },
    },
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
      previewEvent: undefined as string | undefined,
    },
    {
      events: {
        'STATE.UPDATE': (state: State<any, any, any, any>) => ({ state }),
        EVENT: (event: AnyEventObject) => ({ event }),
        'MACHINE.UPDATE': () => ({}),
        'EVENT.PREVIEW': (eventType: string) => ({ eventType }),
        'PREVIEW.CLEAR': () => ({}),
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
          'EVENT.PREVIEW': {
            actions: simModel.assign({
              previewEvent: (_, event) => event.eventType,
            }),
          },
          'PREVIEW.CLEAR': {
            actions: simModel.assign({ previewEvent: undefined }),
          },
        },
      },
    },
    on: {
      'STATE.UPDATE': {
        actions: assign({ state: (_, e) => e.state }),
      },

      EVENT: {
        actions: send(
          (ctx, e) => {
            const eventSchema = ctx.machine.schema?.events?.[e.event.type];
            const eventToSend = { ...e.event };

            if (eventSchema) {
              Object.keys(eventSchema.properties).forEach((prop) => {
                const value = prompt(
                  `Enter value for "${prop}" (${eventSchema.properties[prop].type}):`,
                );

                eventToSend[prop] = value;
              });
            }
            return eventToSend;
          },
          { to: 'machine' },
        ),
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
