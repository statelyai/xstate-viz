import { StateNode, TransitionDefinition } from 'xstate';
import { flatten } from 'xstate/lib/utils';

export class DirectedGraphNode {
  public id: string;
  public data: StateNode;
  public children: DirectedGraphNode[];
  public ports: DirectedGraphPort[];
  public edges: DirectedGraphEdge[];

  /**
   * The position of the graph node (relative to parent)
   * and its dimensions
   */
  public layout?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /**
   * Gets the absolute position of the graph node
   */
  public get absolute(): Point | undefined {
    if (!this.parent) {
      return this.layout;
    }

    if (!this.layout) {
      return undefined;
    }

    return {
      x: this.layout.x + this.parent.absolute!.x,
      y: this.layout.y + this.parent.absolute!.y,
    };
  }

  constructor(
    config: DirectedGraphNodeConfig,
    public parent?: DirectedGraphNode,
  ) {
    this.id = config.id;
    this.data = config.stateNode;
    this.children = config.children;
    this.children.forEach((child) => {
      child.parent = this;
    });
    this.ports = config.ports;
    this.edges = config.edges.map((edgeConfig) => {
      return new DirectedGraphEdge(edgeConfig);
    });
  }

  public get level(): number {
    return (this.parent?.level ?? -1) + 1;
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
