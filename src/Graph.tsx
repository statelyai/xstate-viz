import { DirectedGraphNode } from './directedGraph';
import { useMachine, useSelector } from '@xstate/react';
import { useEffect, useMemo, memo } from 'react';
import { Edges } from './Edges';
import { StateNodeViz } from './StateNodeViz';
import { TransitionViz } from './TransitionViz';
import { createElkMachine } from './elkMachine';
import { MachineViz } from './MachineViz';
import { useCanvas } from './CanvasContext';
import { useSimulation } from './SimulationContext';
import { getAllEdges, StateElkNode } from './graphUtils';

const GraphNode: React.FC<{ elkNode: StateElkNode }> = ({ elkNode }) => {
  return <StateNodeViz stateNode={elkNode.node.data} node={elkNode.node} />;
};

const MemoizedEdges = memo(Edges);
const MemoizedGraphNode = memo(GraphNode);
const MemoizedTransitionViz = memo(TransitionViz);
const MemoizedMachineViz = memo(MachineViz);
