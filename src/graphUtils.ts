import {
  DigraphBackLinkMap,
  DirectedGraphEdge,
  DirectedGraphNode,
  getBackLinkMap,
} from './directedGraph';
import type {
  ELK,
  ElkEdgeSection,
  ElkExtendedEdge,
  ElkNode,
  LayoutOptions,
} from 'elkjs/lib/main';
import { Point } from './pathUtils';
import { StateNode } from 'xstate';

declare global {
  export const ELK: typeof import('elkjs/lib/main').default;
}

let elk: ELK;

if (typeof ELK !== 'undefined') {
  elk = new ELK();
}

const rootLayoutOptions: LayoutOptions = {
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.algorithm': 'layered',
  'elk.layered.considerModelOrder': 'NODES_AND_EDGES',
  'elk.layered.wrapping.strategy': 'MULTI_EDGE',
  'elk.layered.compaction.postCompaction.strategy': 'LEFT',
  'elk.aspectRatio': '2',
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

/**
 * Returns the node that contains the `source` and `target` of the edges, which may be
 * the `source` or `target` itself.
 *
 * See https://www.eclipse.org/elk/documentation/tooldevelopers/graphdatastructure/coordinatesystem.html
 *
 * @param edge
 * @returns containing node
 */
function getContainingNode(edge: DirectedGraphEdge): StateNode | undefined {
  const { source: sourceNode, target: targetNode } = edge;
  if (sourceNode === targetNode) {
    return sourceNode.parent;
  }

  const set = new Set([sourceNode]);

  let marker = sourceNode.parent;

  while (marker) {
    set.add(marker);
    marker = marker.parent;
  }

  marker = targetNode;

  while (marker) {
    if (set.has(marker)) {
      return marker;
    }
    marker = marker.parent;
  }

  return sourceNode.machine; // root
}

function getRelativeNodeEdgeMap(
  digraph: DirectedGraphNode,
): RelativeNodeEdgeMap {
  const edges = getAllEdges(digraph);

  const map: RelativeNodeEdgeMap[0] = new Map();
  const edgeMap: RelativeNodeEdgeMap[1] = new Map();

  edges.forEach((edge) => {
    const containingNode = getContainingNode(edge);

    if (!map.has(containingNode)) {
      map.set(containingNode, []);
    }

    map.get(containingNode)!.push(edge);
    edgeMap.set(edge.id, containingNode);
  });

  return [map, edgeMap];
}
