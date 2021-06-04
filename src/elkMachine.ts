import { assign, createMachine, DoneInvokeEvent } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { DirectedGraphNode } from './directedGraph';
import { getElkGraph } from './Graph';

export const createElkMachine = (digraph: DirectedGraphNode) => {
  const elkModel = createModel({
    digraph,
    elkGraph: undefined as any,
  });

  return createMachine<typeof elkModel>({
    context: {
      digraph,
      elkGraph: undefined,
    },
    initial: 'loading',
    states: {
      loading: {
        invoke: {
          src: (ctx) => getElkGraph(ctx.digraph),
          onDone: {
            target: 'success',
            actions: assign({
              elkGraph: (_, e: DoneInvokeEvent<any>) => e.data,
            }),
          },
        },
      },
      success: {},
    },
  });
};
