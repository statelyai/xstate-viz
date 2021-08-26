import { assign, createMachine, DoneInvokeEvent } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { DirectedGraphNode } from './directedGraph';
import { getElkGraph } from './Graph';

export const createElkMachine = (digraph: DirectedGraphNode) => {
  const elkModel = createModel(
    {
      digraph,
      elkGraph: undefined as any,
    },
    {
      events: {
        GRAPH_UPDATED: (digraph: DirectedGraphNode) => ({ digraph }),
        LAYOUT_READY: () => ({}),
      },
    },
  );

  return createMachine<typeof elkModel>({
    context: elkModel.initialContext,
    initial: 'loading',
    states: {
      loading: {
        initial: 'waiting_for_layout',
        states: {
          waiting_for_layout: {
            entry: 'notifyLayoutPending',
            on: {
              LAYOUT_READY: 'elking',
            },
          },
          elking: {
            invoke: {
              src: (ctx) => getElkGraph(ctx.digraph),
              onDone: {
                target: 'elk_done',
                actions: [
                  assign({
                    elkGraph: (_, e: DoneInvokeEvent<any>) => e.data,
                  }),
                  'notifyLayoutReady',
                ],
              },
            },
          },
          elk_done: {
            type: 'final',
          },
        },
        onDone: 'success',
      },
      success: {
        on: {
          GRAPH_UPDATED: {
            target: 'loading',
            actions: [
              elkModel.assign({
                digraph: (_, e) => e.digraph,
              }),
            ],
          },
        },
      },
    },
  });
};
