import { DirectedGraphEdge, DirectedGraphNode } from './directedGraph';
import { useMachine, useSelector } from '@xstate/react';
import ELK, {
  ElkEdgeSection,
  ElkExtendedEdge,
  ElkNode,
  LayoutOptions,
} from 'elkjs/lib/main';
import { useEffect, useMemo, memo } from 'react';
import { Edges } from './Edges';
import { deleteRect, getRect, onRect, readRect } from './getRect';
import { Point } from './pathUtils';
import { StateNodeViz } from './StateNodeViz';
import { TransitionViz } from './TransitionViz';
import { createElkMachine } from './elkMachine';
import { StateNode } from 'xstate';
import { MachineViz } from './MachineViz';
import { useCanvas } from './CanvasContext';
const elk = new ELK({
  defaultLayoutOptions: {
    // algorithm: 'layered',
    // 'elk.spacing.labelEdge': '1000',
    // 'elk.edgeRouting': 'ORTHOGONAL',
    // 'elk.edgeLabels.inline': 'true',
    // hierarchyHandling: 'INCLUDE_CHILDREN',
  },
});

const rootLayoutOptions: LayoutOptions = {
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.algorithm': 'layered',
  'elk.layered.crossingMinimization.semiInteractive': 'true',
  // 'elk.layering.strategy': 'NIKOLOV',
  // 'elk.wrapping.strategy': 'SINGLE_EDGE',
  // 'elk.direction': 'DOWN',
};

type RelativeNodeEdgeMap = [
  Map<StateNode | undefined, DirectedGraphEdge[]>,
  Map<string, StateNode | undefined>,
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

  const getLCA = (a: StateNode, b: StateNode): StateNode | undefined => {
    if (a === b) {
      return a.parent;
    }

    const set = new Set();

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

function getElkEdge(edge: DirectedGraphEdge) {
  const edgeRect = readRect(edge.id);

  return {
    id: edge.id,
    sources: [edge.source.id],
    targets: [edge.target.id],
    labels: [
      {
        id: edge.id + '--label',
        width: edgeRect?.width ?? 0,
        height: edgeRect?.height ?? 100,
        text: edge.label.text || 'always',
        layoutOptions: {
          'edgeLabels.inline': 'true',
          'edgeLabels.placement': 'CENTER',
        },
      },
    ],
    edge,
    sections: [],
  };
}

function getElkChild(
  node: DirectedGraphNode,
  rMap: RelativeNodeEdgeMap,
): StateElkNode {
  const nodeRect = getRect(node.id);
  const contentRect = readRect(`${node.id}:content`);

  const edges = rMap[0].get(node.data) || [];

  return {
    id: node.id,
    ...(!node.children.length
      ? {
          width: nodeRect?.width!,
          height: nodeRect?.height!,
        }
      : undefined),
    // width: node.rects.full.width,
    // height: node.rects.full.height,

    node,
    ...(node.children.length
      ? { children: getElkChildren(node, rMap) }
      : undefined),
    absolutePosition: { x: 0, y: 0 },
    edges: edges.map((edge) => {
      return getElkEdge(edge);
    }),
    layoutOptions: {
      'elk.padding': `[top=${
        (contentRect?.height || 0) + 30
      }, left=30, right=30, bottom=30]`,
      hierarchyHandling: 'INCLUDE_CHILDREN',
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
  node: DirectedGraphNode;
  absolutePosition: Point;
  edges: StateElkEdge[];
}
interface StateElkEdge extends ElkExtendedEdge {
  edge: DirectedGraphEdge;
}

const GraphNode: React.FC<{ elkNode: StateElkNode }> = ({ elkNode }) => {
  return <StateNodeViz stateNode={elkNode.node.data} node={elkNode.node} />;
};

function sleep(ms: number) {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
}

export async function getElkGraph(
  digraphNode: DirectedGraphNode,
): Promise<ElkNode> {
  // The below timeout allows for the layout to change so we can measure the DOM nodes
  await sleep(20); // TODO: temporary fix
  await new Promise((res) => {
    onRect(digraphNode.id, (data) => {
      res(void 0);
    });
  });

  const rMap = getRelativeNodeEdgeMap(digraphNode);
  const rootEdges = rMap[0].get(undefined) || [];
  const elkNode: ElkNode = {
    id: 'root',
    edges: rootEdges.map(getElkEdge),
    children: [getElkChild(digraphNode, rMap)],
    layoutOptions: rootLayoutOptions,
  };

  const layoutElkNode = await elk.layout(elkNode);

  const stateNodeToElkNodeMap = new Map<StateNode, StateElkNode>();

  const setEdgeLayout = (edge: StateElkEdge) => {
    const lca = rMap[1].get(edge.id);
    const elkLca = lca && stateNodeToElkNodeMap.get(lca)!;

    const translatedSections: ElkEdgeSection[] = elkLca
      ? edge.sections.map((section) => {
          return {
            ...section,
            startPoint: {
              x: section.startPoint.x + elkLca.absolutePosition.x,
              y: section.startPoint.y + elkLca.absolutePosition.y,
            },
            endPoint: {
              x: section.endPoint.x + elkLca.absolutePosition.x,
              y: section.endPoint.y + elkLca.absolutePosition.y,
            },
            bendPoints:
              section.bendPoints?.map((bendPoint) => {
                return {
                  x: bendPoint.x + elkLca.absolutePosition.x,
                  y: bendPoint.y + elkLca.absolutePosition.y,
                };
              }) ?? [],
          };
        })
      : edge.sections;

    edge.edge.sections = translatedSections;
    edge.edge.label.x =
      (edge.labels?.[0].x || 0) + (elkLca?.absolutePosition.x || 0);
    edge.edge.label.y =
      (edge.labels?.[0].y || 0) + (elkLca?.absolutePosition.y || 0);
  };

  const setLayout = (
    elkNode: StateElkNode,
    parent: StateElkNode | undefined,
  ) => {
    stateNodeToElkNodeMap.set(elkNode.node.data, elkNode);
    elkNode.absolutePosition = {
      x: (parent?.absolutePosition.x ?? 0) + elkNode.x!,
      y: (parent?.absolutePosition.y ?? 0) + elkNode.y!,
    };

    elkNode.node.layout = {
      width: elkNode.width!,
      height: elkNode.height!,
      x: elkNode.x!,
      y: elkNode.y!,
    };

    elkNode.edges?.forEach((edge) => {
      setEdgeLayout(edge);
    });

    elkNode.children?.forEach((cn) => {
      setLayout(cn as StateElkNode, elkNode);
    });
  };

  (layoutElkNode.edges as StateElkEdge[])?.forEach(setEdgeLayout);

  const rootElkNode = layoutElkNode.children![0] as StateElkNode;

  setLayout(rootElkNode, undefined);

  return rootElkNode;
}

const MemoizedEdges = memo(Edges);
const MemoizedGraphNode = memo(GraphNode);
const MemoizedTransitionViz = memo(TransitionViz);
const MemoizedMachineViz = memo(MachineViz);

export const Graph: React.FC<{ digraph: DirectedGraphNode }> = ({
  digraph,
}) => {
  const [state, send] = useMachine(() => createElkMachine(digraph));
  const canvasService = useCanvas();
  const { pan, zoom } = useSelector(canvasService, (s) => s.context);

  useEffect(() => {
    send({ type: 'GRAPH_UPDATED', digraph });
  }, [digraph, send]);

  useEffect(() => {
    return () => {
      deleteRect(digraph.id);
    };
  }, [digraph.id]);

  const allEdges = useMemo(() => getAllEdges(digraph), [digraph]);

  if (state.matches('success')) {
    return (
      <div
        style={{
          transform: `translate3d(${pan.dx}px, ${pan.dy}px, 0) scale(${zoom})`,
        }}
      >
        <MemoizedEdges digraph={digraph} />
        <MemoizedGraphNode elkNode={state.context.elkGraph} />
        {allEdges.map((edge, i) => {
          return (
            <MemoizedTransitionViz
              edge={edge}
              key={edge.id}
              index={i}
              position={
                edge.label && {
                  x: edge.label.x,
                  y: edge.label.y,
                }
              }
            />
          );
        })}
      </div>
    );
  }

  return <MemoizedMachineViz digraph={digraph} />;
};
