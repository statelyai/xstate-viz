import React, { useContext, useMemo } from 'react';
import { StateNodeViz } from './StateNodeViz';
import { SimulationContext } from './App';
import { DirectedGraphNode } from './directedGraph';
import { getAllEdges } from './Graph';
import { TransitionViz } from './TransitionViz';

export const MachineViz: React.FC<{ digraph: DirectedGraphNode }> = ({
  digraph,
}) => {
  const allEdges = useMemo(() => getAllEdges(digraph), [digraph]);

  return (
    <div style={{ opacity: 0.001 }}>
      <StateNodeViz stateNode={digraph.stateNode} />
      {allEdges.map((edge, i) => {
        return (
          <TransitionViz
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
};
