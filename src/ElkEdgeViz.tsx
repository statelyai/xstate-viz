import React from 'react';
import { EdgeViz } from './EdgeViz';
import { StateElkEdge } from './graphUtils';

export const ElkEdgeViz: React.FC<{ elkEdge: StateElkEdge }> = ({
  elkEdge,
}) => {
  if (elkEdge.type === 'self') {
    return null;
  }
  return (
    <g data-viz="elkEdge">
      {elkEdge.labels.map((label, i) => {
        return <EdgeViz key={label.edge.id} edge={label.edge} order={i} />;
      })}
    </g>
  );
};
