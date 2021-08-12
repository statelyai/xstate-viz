import {
  DigraphBackLinkMap,
  DirectedGraphEdge,
  DirectedGraphNode,
  getBackLinkMap,
} from './directedGraph';
import { useMachine, useSelector } from '@xstate/react';
import type {
  ElkEdgeSection,
  ElkExtendedEdge,
  ElkNode,
  LayoutOptions,
} from 'elkjs/lib/main';
import { useEffect, useMemo, memo } from 'react';
import { Edges } from './Edges';
import { Point } from './pathUtils';
import { StateNodeViz } from './StateNodeViz';
import { TransitionViz } from './TransitionViz';
import { createElkMachine } from './elkMachine';
import { StateNode } from 'xstate';
import { MachineViz } from './MachineViz';
import { useCanvas } from './CanvasContext';

declare global {
  export const ELK: typeof import('elkjs/lib/main').default;
}

const elk = new ELK();

const rootLayoutOptions: LayoutOptions = {
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.algorithm': 'layered',
  'elk.layered.considerModelOrder': 'NODES_AND_EDGES',
  'elk.layered.wrapping.strategy': 'MULTI_EDGE',
  'elk.layered.compaction.postCompaction.strategy': 'LEFT',
  'elk.aspectRatio': '1',
  'elk.direction': 'RIGHT',
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

function getElkEdge(
  edge: DirectedGraphEdge,
  rectMap: DOMRectMap,
): ElkExtendedEdge & { edge: any } {
  const edgeRect = rectMap.get(edge.id)!;
  const targetPortId = getPortId(edge);
  const isSelfEdge = edge.source === edge.target;

  const sources = [edge.source.id];
  const targets = isSelfEdge ? [getSelfPortId(edge.target.id)] : [targetPortId];

  return {
    id: edge.id,
    sources,
    targets,

    labels: [
      {
        id: 'label:' + edge.id,
        width: edgeRect.width,
        height: edgeRect.height,
        text: edge.label.text || 'always',
        layoutOptions: {
          'edgeLabels.inline': !isSelfEdge ? 'true' : 'false',
          'edgeLabels.placement': 'CENTER',
          'edgeLabels.centerLabelPlacementStrategy': 'TAIL_LAYER',
        },
      },
    ],
    edge,
    sections: [],
    layoutOptions: {},
  };
}

function getPortId(edge: DirectedGraphEdge): string {
  return `port:${edge.id}`;
}

function getSelfPortId(nodeId: string): string {
  return `self:${nodeId}`;
}

function getElkId(id: string): string {
  return id.replaceAll('.', '_').replaceAll(':', '__');
}

type DOMRectMap = Map<string, DOMRect>;

const getRectMap = (): DOMRectMap => {
  const rectMap: DOMRectMap = new Map();
  document.querySelectorAll('[data-rect-id]').forEach((el) => {
    const rectId = (el as HTMLElement).dataset.rectId!;
    const rect = el.getBoundingClientRect();
    rectMap.set(rectId, rect);
  });
  return rectMap;
};

function getDeepestNodeLevel(node: DirectedGraphNode): number {
  if (!node.children.length) {
    return node.level;
  }
  return Math.max(
    ...node.children.map((childNode) => getDeepestNodeLevel(childNode)),
  );
}

function getElkChild(
  node: DirectedGraphNode,
  rMap: RelativeNodeEdgeMap,
  backLinkMap: DigraphBackLinkMap,
  rectMap: DOMRectMap,
): StateElkNode {
  const nodeRect = rectMap.get(node.id)!;
  const contentRect = rectMap.get(`${node.id}:content`)!;

  // Edges whose source is this node
  const edges = rMap[0].get(node.data) || [];
  // Edges whose target is this node
  const backEdges = Array.from(backLinkMap.get(node.data) ?? []);

  const hasSelfEdges = backEdges.some((edge) => edge.source === edge.target);

  // Nodes should only wrap if they have non-atomic child nodes
  const shouldWrap = getDeepestNodeLevel(node) > node.level + 1;

  return {
    id: node.id,
    ...(!node.children.length
      ? {
          width: nodeRect.width,
          height: nodeRect.height,
        }
      : undefined),
    node,
    children: getElkChildren(node, rMap, backLinkMap, rectMap),
    absolutePosition: { x: 0, y: 0 },
    edges: edges.map((edge) => {
      return getElkEdge(edge, rectMap);
    }),
    ports: backEdges
      .map((backEdge) => {
        return {
          id: getPortId(backEdge),
          width: 5, // TODO: don't hardcode, find way to reference arrow marker size
          height: 5,
          layoutOptions: {},
        };
      })
      .concat(
        hasSelfEdges
          ? [
              {
                id: getSelfPortId(node.id),
                width: 5,
                height: 5,
                layoutOptions: {},
              },
            ]
          : [],
      ),
    layoutOptions: {
      'elk.padding': `[top=${
        contentRect.height + 30
      }, left=30, right=30, bottom=30]`,
      'elk.spacing.labelLabel': '10',
      ...(shouldWrap && {
        'elk.aspectRatio': '2',
        'elk.layered.wrapping.strategy': 'MULTI_EDGE',
        'elk.layered.compaction.postCompaction.strategy': 'LEFT',
      }),
    },
  };
}
function getElkChildren(
  node: DirectedGraphNode,
  rMap: RelativeNodeEdgeMap,
  backLinkMap: DigraphBackLinkMap,
  rectMap: DOMRectMap,
): ElkNode[] {
  return node.children.map((childNode) => {
    return getElkChild(childNode, rMap, backLinkMap, rectMap);
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

export function isStateElkNode(node: ElkNode): node is StateElkNode {
  return 'absolutePosition' in node;
}

function elkJSON(elkNode: StateElkNode): any {
  const { id, layoutOptions, width, height, children, edges, ports } = elkNode;

  return {
    id: getElkId(id),
    layoutOptions,
    width,
    height,
    children: children?.map((node) => elkJSON(node as StateElkNode)),
    ports: ports?.map((port) => ({
      id: getElkId(port.id),
      width: port.width,
      height: port.height,
    })),
    edges: edges.map((edge) => {
      return {
        id: getElkId(edge.id),
        labels: edge.labels?.map((label) => ({
          id: getElkId(label.id),
          width: label.width,
          height: label.height,
          text: label.text,
          layoutOptions: label.layoutOptions,
        })),
        layoutOptions: edge.layoutOptions,
        sources: edge.sources?.map((id) => getElkId(id)),
        targets: edge.targets?.map((id) => getElkId(id)),
      };
    }),
  };
}

const GraphNode: React.FC<{ elkNode: StateElkNode }> = ({ elkNode }) => {
  return <StateNodeViz stateNode={elkNode.node.data} node={elkNode.node} />;
};

export async function getElkGraph(
  rootDigraphNode: DirectedGraphNode,
): Promise<ElkNode> {
  const rectMap = getRectMap();
  const relativeNodeEdgeMap = getRelativeNodeEdgeMap(rootDigraphNode);
  const backlinkMap = getBackLinkMap(rootDigraphNode);
  const rootEdges = relativeNodeEdgeMap[0].get(undefined) || [];

  // The root node is an invisible node; the machine node is a direct child of this node.
  // It is wrapped so we can have self-loops, which cannot be placed in the root node.
  const elkNode: ElkNode = {
    id: 'root',
    edges: rootEdges.map((edge) => getElkEdge(edge, rectMap)),
    children: [
      getElkChild(rootDigraphNode, relativeNodeEdgeMap, backlinkMap, rectMap),
    ],
    layoutOptions: rootLayoutOptions,
  };

  const rootElkNode = await elk.layout(elkNode);

  const stateNodeToElkNodeMap = new Map<StateNode, StateElkNode>();

  const setEdgeLayout = (edge: StateElkEdge) => {
    const lca = relativeNodeEdgeMap[1].get(edge.id);
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
      if (isStateElkNode(cn)) {
        setLayout(cn, elkNode);
      }
    });
  };

  (rootElkNode.edges as StateElkEdge[])?.forEach(setEdgeLayout);

  if (process.env.NODE_ENV !== 'production') {
    console.log(JSON.stringify(elkJSON(rootElkNode as StateElkNode), null, 2));
  }

  // unwrap from the "fake" ancestor node created in the `elkNode` structure
  const machineElkNode = rootElkNode.children![0] as StateElkNode;

  setLayout(machineElkNode, undefined);

  return machineElkNode;
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

  const allEdges = useMemo(() => getAllEdges(digraph), [digraph]);

  if (state.matches('success')) {
    return (
      <div
        data-testid="canvas-graph"
        style={{
          transformOrigin: '0 0', // Since our layout is LTR, it's more predictable for zoom to happen from top left point
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
