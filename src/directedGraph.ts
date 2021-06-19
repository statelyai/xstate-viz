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
export type DirectedGraphEdgeConfig = {
  id: string;
  source: StateNode;
  target: StateNode;
  label: DirectedGraphLabel;
  transition: TransitionDefinition<any, any>;
  sections: ElkExtendedEdge['sections'];
};
export type DirectedGraphNodeConfig = {
  id: string;
  stateNode: StateNode;
  children: DirectedGraphNode[];
  ports: DirectedGraphPort[];
  /**
   * The edges representing all transitions from this `stateNode`.
   */
  edges: DirectedGraphEdge[];
};

export class DirectedGraphNode {
  public id: string;
  public data: StateNode;
  public children: DirectedGraphNode[];
  public ports: DirectedGraphPort[];
  public edges: DirectedGraphEdge[];
  public layout?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  constructor(config: DirectedGraphNodeConfig) {
    this.id = config.id;
    this.data = config.stateNode;
    this.children = config.children;
    this.ports = config.ports;
    this.edges = config.edges.map((edgeConfig) => {
      return new DirectedGraphEdge(edgeConfig);
    });
  }
}

export class DirectedGraphEdge {
  public id: string;
  public source: StateNode;
  public target: StateNode;
  public label: DirectedGraphLabel;
  public transition: TransitionDefinition<any, any>;
  public sections: ElkExtendedEdge['sections'];
  constructor(config: DirectedGraphEdgeConfig) {
    this.id = config.id;
    this.source = config.source;
    this.target = config.target;
    this.label = config.label;
    this.transition = config.transition;
    this.sections = config.sections;
  }
}

export function toDirectedGraph(stateNode: StateNode): DirectedGraphNode {
  const edges: DirectedGraphEdge[] = flatten(
    stateNode.transitions.map((t, transitionIndex) => {
      const targets = t.target ? t.target : [stateNode];

      return targets.map((target, targetIndex) => {
        const edge = new DirectedGraphEdge({
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
        });

        return edge;
      });
    }),
  );

  const graph = new DirectedGraphNode({
    id: stateNode.id,
    stateNode,
    children: getChildren(stateNode).map((sn) => toDirectedGraph(sn)),
    edges,
    ports: [],
  });

  return graph;
}
