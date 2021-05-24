import React, { useContext, useMemo } from 'react';
import { StateNodeViz } from './StateNodeViz';
import { useService } from '@xstate/react';
import { SimulationContext } from './App';
import { DirectedGraphNode } from '@xstate/graph';
import { getAllEdges } from './Graph';
import { TransitionViz } from './TransitionViz';

export const MachineViz: React.FC<{ digraph: DirectedGraphNode }> = ({
  digraph,
}) => {
  const simService = useContext(SimulationContext);
  const allEdges = useMemo(() => getAllEdges(digraph), [digraph]);

  return (
    <div style={{ opacity: 0.1 }}>
      <StateNodeViz stateNode={digraph.stateNode} />
      {allEdges.map((edge, i) => {
        return (
          <TransitionViz
            edge={edge}
            key={edge.id}
            index={i}
            position={
              edge.label && {
                x: (edge.label as any).x,
                y: (edge.label as any).y,
              }
            }
          />
        );
      })}
    </div>
  );
};
