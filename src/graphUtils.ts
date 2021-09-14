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
