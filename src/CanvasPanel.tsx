import { DirectedGraphNode } from './directedGraph';
import * as React from 'react';
import { CanvasContainer } from './CanvasContainer';
import { Graph } from './Graph';

export const CanvasPanel: React.FC<{ digraph: DirectedGraphNode }> = ({
  digraph,
}) => {
  return (
    <CanvasContainer>
      <Graph digraph={digraph} />
    </CanvasContainer>
  );
};
