import { ElkExtendedEdge } from 'elkjs';
import { StateNode, TransitionDefinition } from 'xstate';
import { flatten } from 'xstate/lib/utils';
import { getChildren } from './utils';

export type DirectedGraphLabel = {
  text: string;
  x: number;
  y: number;
};
export type DirectedGraphPort = {
  id: string;
};
export type DirectedGraphEdge = {
  id: string;
  source: StateNode;
  target: StateNode;
  label: DirectedGraphLabel;
  transition: TransitionDefinition<any, any>;
  sections: ElkExtendedEdge['sections'];
};
export type DirectedGraphNode = {
  id: string;
  stateNode: StateNode;
  children: DirectedGraphNode[];
  ports: DirectedGraphPort[];
  /**
   * The edges representing all transitions from this `stateNode`.
   */
  edges: DirectedGraphEdge[];
};

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
            x: 0,
            y: 0,
          },
          sections: [],
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
    ports: [],
  };

  return graph;
}
