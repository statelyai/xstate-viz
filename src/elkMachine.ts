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
      },
    },
  );

  return createMachine<typeof elkModel>({
    context: elkModel.initialContext,
    initial: 'loading',
    states: {
      loading: {
        entry: 'layoutPending',
        invoke: {
          src: (ctx) => getElkGraph(ctx.digraph),
          onDone: {
            target: 'success',
            actions: [
              assign({
                elkGraph: (_, e: DoneInvokeEvent<any>) => e.data,
              }),
              'layoutReady',
            ],
          },
        },
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
