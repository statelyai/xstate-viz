import React from 'react';
import { EdgeViz } from './EdgeViz';
import { getAllEdges } from './Graph';
import { DirectedGraphNode } from './directedGraph';

export const Edges: React.FC<{ digraph: DirectedGraphNode }> = ({
  digraph,
}) => {
  const edges = getAllEdges(digraph);
  return (
    <svg
      style={{
        position: 'absolute',
        height: '100vh',
        width: '100vw',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      {edges.map((edge, i) => {
        return <EdgeViz edge={edge} order={i} />;
      })}
    </svg>
  );
};
