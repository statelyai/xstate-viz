import { DirectedGraphNode } from './directedGraph';
import { useMachine, useSelector } from '@xstate/react';
import { useEffect, useMemo, memo } from 'react';
import { MachineViz } from './MachineViz';
import { useCanvas } from './CanvasContext';
import { useSimulation } from './SimulationContext';
import { getAllEdges, StateElkNode } from './graphUtils';
