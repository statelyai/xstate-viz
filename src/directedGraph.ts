import { DirectedGraphNode, DirectedGraphEdge } from '@xstate/graph';
import { StateNode } from 'xstate';
import { flatten } from 'xstate/lib/utils';
import { getChildren } from './utils';

export function toDirectedGraph(stateNode: StateNode): DirectedGraphNode {
  const edges: DirectedGraphEdge[] = flatten(
    stateNode.transitions.map((t, transitionIndex) => {
      const targets = t.target ? t.target : [stateNode];

      return targets.map((target, targetIndex) => {
        const edge: DirectedGraphEdge = {
          id: `${stateNode.id}:${transitionIndex}:${targetIndex}`,
          source: stateNode,
          target,
          transition: t,
          label: {
            text: t.eventType,
            toJSON: () => ({ text: t.eventType }),
          },
          toJSON: () => {
            const { label } = edge;

            return { source: stateNode.id, target: target.id, label };
          },
        };

        return edge;
      });
    }),
  );

  const graph = {
    id: stateNode.id,
    stateNode,
    children: getChildren(stateNode).map((sn) => toDirectedGraph(sn)),
    edges,
    toJSON: () => {
      const { id, children, edges: graphEdges } = graph;
      return { id, children, edges: graphEdges };
    },
  };

  return graph;
}
