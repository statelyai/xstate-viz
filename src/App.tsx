import React, { createContext, useContext, useMemo } from 'react';

import './base.scss';

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
import { toDirectedGraph } from '@xstate/graph';
import { MachineViz } from './MachineViz';
import { getAllEdges } from './utils';
import { EditorPanel } from './EditorPanel';
import { EdgeViz } from './EdgeViz';
import './Graph';
import { getElkGraph, Graph } from './Graph';

const testMachine = createMachine<{ count: number }>({
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
    failure: {},
  },
});

interface Point {
  x: number;
  y: number;
}

const model = createModel(
  {
    zoom: 1,
    pan: {
      dx: 0,
      dy: 0,
    },
    initialPosition: { x: 0, y: 0 },
  },
  {
    events: {
      'ZOOM.OUT': () => ({}),
      'ZOOM.IN': () => ({}),
      'POSITION.SET': ({ x, y }: Point) => ({ position: { x, y } }),
      PAN: (dx: number, dy: number) => ({ dx, dy }),
    },
  },
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
        'MACHINE.UPDATE': (machine: StateMachine<any, any, any>) => ({
          machine,
        }),
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
              simModel.assign({
                machine: (_, e) => e.machine,
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

type InterpreterOf<T> = T extends StateMachine<infer C, any, infer E>
  ? Interpreter<C, any, E>
  : never;

export const SimulationContext = createContext<
  InterpreterOf<ReturnType<typeof createSimulationMachine>>
>(null as any);

const canvasMachine = createMachine<typeof model>({
  context: model.initialContext,
  on: {
    'ZOOM.OUT': {
      actions: model.assign({ zoom: (ctx) => ctx.zoom - 0.1 }),
      cond: (ctx) => ctx.zoom > 0.5,
    },
    'ZOOM.IN': {
      actions: model.assign({ zoom: (ctx) => ctx.zoom + 0.1 }),
    },
    PAN: {
      actions: model.assign({
        pan: (ctx, e) => {
          return {
            dx: ctx.pan.dx - e.dx,
            dy: ctx.pan.dy - e.dy,
          };
        },
      }),
    },
    'POSITION.SET': {
      actions: model.assign({
        initialPosition: (_, e) => e.position,
      }),
    },
  },
});

function Edges() {
  const service = useContext(SimulationContext);
  const [state] = useService(service);
  const digraph = toDirectedGraph(state.context.machine);

  const edges = getAllEdges(state.context.machine);
  return (
    <svg
      style={{
        position: 'fixed',
        height: '100%',
        width: '100%',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    >
      {edges.map((edge, i) => {
        return <EdgeViz edge={edge} />;
      })}
    </svg>
  );
}

function App() {
  const [state, send] = useMachine(canvasMachine);
  const simService = useInterpret(createSimulationMachine(testMachine));
  const digraph = useMemo(() => toDirectedGraph(testMachine), []);

  const [graphState] = useMachine(
    createMachine({
      context: {
        elkGraph: undefined,
      },
      initial: 'loading',
      states: {
        loading: {
          invoke: {
            src: () => getElkGraph(digraph),
            onDone: {
              target: 'success',
              actions: assign({
                elkGraph: (_, e) => e.data,
              }),
            },
          },
        },
        success: {},
      },
    }),
  );

  return (
    <SimulationContext.Provider value={simService as any}>
      <main data-viz="app" data-viz-theme="dark">
        <div
          data-panel="viz"
          onWheel={(e) => {
            send(model.events.PAN(e.deltaX, e.deltaY));
          }}
        >
          <div>
            <button onClick={() => send('ZOOM.OUT')}>-</button>
            <button onClick={() => send('ZOOM.IN')}>+</button>
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
          <div
            style={{
              transform: `translate(${state.context.pan.dx}px, ${state.context.pan.dy}px) scale(${state.context.zoom})`,
            }}
          >
            <MachineViz />
            <Graph digraph={digraph} />
          </div>
          <Edges />
        </div>
        <EditorPanel
          onChange={(machines) => {
            simService.send({
              type: 'MACHINE.UPDATE',
              machine: machines[0],
            });
            console.log(machines);
          }}
        />
      </main>
    </SimulationContext.Provider>
  );
}

export default App;
