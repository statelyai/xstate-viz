import { DirectedGraphNode } from '@xstate/graph';
import * as React from 'react';
import { CanvasContainer } from './CanvasContainer';
import { Graph } from './Graph';
import { MachineViz } from './MachineViz';

export const CanvasPanel: React.FC<{ digraph: DirectedGraphNode }> = ({
  digraph,
}) => {
  return (
    <CanvasContainer>
      <MachineViz digraph={digraph} />
      <Graph digraph={digraph} />
    </CanvasContainer>
  );
};
