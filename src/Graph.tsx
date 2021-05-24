import { DirectedGraphEdge, DirectedGraphNode } from '@xstate/graph';
import { useMachine } from '@xstate/react';
import ELK, { ElkEdge, ElkNode } from 'elkjs/lib/main';
import { createMachine, StateNode, TransitionDefinition } from 'xstate';
import { assign } from 'xstate/lib/actions';
import { getRect, onRect, readRect, rectMap } from './getRect';
import { Point } from './pathUtils';
import { StateNodeViz } from './StateNodeViz';
const elk = new ELK();

type RelativeNodeEdgeMap = [
  Map<StateNode<any, any>, DirectedGraphEdge[]>,
  Map<string, StateNode<any, any>>,
];

export function getAllEdges(digraph: DirectedGraphNode): DirectedGraphEdge[] {
  const edges: DirectedGraphEdge[] = [];
  const getEdgesRecursive = (dnode: DirectedGraphNode) => {
    edges.push(...dnode.edges);

    dnode.children.forEach(getEdgesRecursive);
  };
  getEdgesRecursive(digraph);

  return edges;
}

function getRelativeNodeEdgeMap(
  digraph: DirectedGraphNode,
): RelativeNodeEdgeMap {
  const edges = getAllEdges(digraph);

  const map: RelativeNodeEdgeMap[0] = new Map();
  const edgeMap: RelativeNodeEdgeMap[1] = new Map();

  const getLCA = (
    a: StateNode<any, any>,
    b: StateNode<any, any>,
  ): StateNode<any, any> => {
    if (a === b) {
      return a;
    }

    const set = new Set([a]);

    let m = a.parent;

    while (m) {
      set.add(m);
      m = m.parent;
    }

    m = b;

    while (m) {
      if (set.has(m)) {
        return m;
      }
      m = m.parent;
    }

    return a.machine; // root
  };

  edges.forEach((edge) => {
    const lca = getLCA(edge.source, edge.target);
    if (!map.has(lca)) {
      map.set(lca, []);
    }

    map.get(lca)!.push(edge);
    edgeMap.set(edge.id, lca);
  });

  return [map, edgeMap];
}

function getElkChild(
  node: DirectedGraphNode,
  rMap: RelativeNodeEdgeMap,
): StateElkNode {
  const nodeRect = getRect(node.id);
  const contentRect = readRect(`${node.id}:content`);

  const edges = rMap[0].get(node.stateNode) || [];

  return {
    id: node.id,
    ...(!node.children.length
      ? {
          width: nodeRect?.width,
          height: nodeRect?.height,
        }
      : undefined),
    // width: node.rects.full.width,
    // height: node.rects.full.height,

    node: node.stateNode,
    ...(node.children.length
      ? { children: getElkChildren(node, rMap) }
      : undefined),
    absolutePosition: { x: 0, y: 0 },
    edges: edges.map((edge) => {
      const edgeRect = readRect(edge.id);

      if (!edgeRect) {
        console.log('not found', edge.id);
      }

      return {
        id: edge.id,
        sources: [edge.source.id],
        targets: [edge.target.id],
        labels: [
          {
            id: edge.id,
            width: edgeRect?.width ?? 0,
            height: edgeRect?.height ?? 0,
            text: edge.label.text,
          },
        ],
        edge,
      };
    }),

    layoutOptions: {
      algorithm: 'layered',
      'elk.padding': `[top=${
        (contentRect?.height || 0) + 30
      }, left=30, right=30, bottom=30]`,
      'elk.spacing.nodeNode': '70.0',
      'elk.edgeRouting': 'POLYLINE',
      // 'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      // 'elk.padding': `[top=${
      //   node.rects.self.height + 30
      // }, right=30, bottom=30, left=30]`,
    },
  };
}
function getElkChildren(
  node: DirectedGraphNode,
  rMap: RelativeNodeEdgeMap,
): ElkNode[] {
  return node.children.map((childNode) => {
    return getElkChild(childNode, rMap);
  });
}

interface StateElkNode extends ElkNode {
  node: StateNode<any, any, any>;
  absolutePosition: Point;
  edges: StateElkEdge[];
}
interface StateElkEdge extends ElkEdge {
  edge: DirectedGraphEdge;
}

const GraphNode: React.FC<{ elkNode: StateElkNode }> = ({ elkNode }) => {
  return <StateNodeViz stateNode={elkNode.node} />;
};

export async function getElkGraph(
  digraph: DirectedGraphNode,
): Promise<ElkNode> {
  await new Promise((res) => {
    onRect(digraph.id, (data) => {
      res(void 0);
    });
  });

  const rMap = getRelativeNodeEdgeMap(digraph);
  const elkNode = getElkChild(digraph, rMap);
  const layoutElkNode = await elk.layout(elkNode);
  const stateNodeToElkNodeMap = new Map<StateNode<any, any>, StateElkNode>();

  const setLayout = (n: StateElkNode, parent: StateElkNode | undefined) => {
    stateNodeToElkNodeMap.set(n.node, n);
    n.absolutePosition = {
      x: (parent?.absolutePosition.x ?? 0) + n.x!,
      y: (parent?.absolutePosition.y ?? 0) + n.y!,
    };
    n.node.version = `${Math.random()}`;
    n.node.meta = {
      layout: {
        width: n.width!,
        height: n.height!,
        x: n.x!,
        y: n.y!,
      },
    };

    n.edges?.forEach((edge) => {
      const lca = rMap[1].get(edge.id);

      if (lca) {
        const elkLca = stateNodeToElkNodeMap.get(lca);
        (edge.edge.label as any).x =
          (edge.labels?.[0].x || 0) + (elkLca!.absolutePosition.x || 0);
        (edge.edge.label as any).y =
          (edge.labels?.[0].y || 0) + (elkLca!.absolutePosition.y || 0);
      }
    });

    n.children?.forEach((cn) => {
      setLayout(cn as StateElkNode, n);
    });
  };

  setLayout(layoutElkNode as StateElkNode, undefined);

  return layoutElkNode;
}

export const Graph: React.FC<{ digraph: DirectedGraphNode }> = ({
  digraph,
}) => {
  const [state] = useMachine(
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

  console.log(state.context.elkGraph);

  if (state.matches('success')) {
    return <GraphNode elkNode={state.context.elkGraph as any} />;
  }

  return null;
};
