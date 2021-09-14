import { StateNode } from 'xstate';

export class DirectedGraphNode {
  public data: StateNode;
}

export function toDirectedGraph(stateNode: StateNode): void {
  flatten(
    stateNode.transitions.map((t, transitionIndex) => {
      const targets = t.target ? t.target : [stateNode];

      targets.map((target, targetIndex) => {
        new DirectedGraphEdge();
      });
    }),
  );
}
