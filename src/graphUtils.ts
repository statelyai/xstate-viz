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
