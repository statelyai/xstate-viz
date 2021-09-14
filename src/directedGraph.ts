import { StateNode } from 'xstate';

export function toDirectedGraph(stateNode: StateNode): void {
  stateNode.transitions.map((t) => {
    const targets = t.target ? t.target : [stateNode];

    targets.map((target) => {});
  });
}
