import { useService } from '@xstate/react';
import React, { useContext, useMemo } from 'react';
import { SimulationContext } from './App';
import { useGetRect } from './getRect';
import { getPath, pathToD } from './pathUtils';
import type { Edge } from './utils';
import './EdgeViz.scss';
import { ArrowMarker } from './ArrowMarker';
import { DirectedGraphEdge } from '@xstate/graph';

export const EdgeViz: React.FC<{ edge: DirectedGraphEdge; order: number }> = ({
  edge,
  order,
}) => {
  const transition = edge.transition;
  const service = useContext(SimulationContext);
  const [state, send] = useService(service);
  const sourceRect = useGetRect(`${edge.source.id}`);
  const edgeRect = useGetRect(edge.id);
  const targetRect = useGetRect(`${edge.target.id}`);

  const isActive = useMemo(() => {
    return state.context.state.configuration.includes(edge.source) || undefined;
  }, [state]);

  if (!sourceRect || !targetRect || !edgeRect) {
    return null;
  }

  const edgeCenterY = edgeRect.top + edgeRect.height / 2;

  const path = getPath(sourceRect, edgeRect, targetRect);

  const markerId = `${edge.source.order}-${order}`;

  // const path = [
  //   `M ${sourceRect.right},${edgeCenterY}`,
  //   `L ${edgeRect.left},${edgeCenterY}`,
  //   `M ${edgeRect.right},${edgeCenterY}`,
  //   `L ${edgeRect.right + 10},${edgeCenterY}`,
  //   `L ${targetRect.left},${targetRect.top}`,
  // ];

  return path ? (
    <g data-viz="edgeGroup" data-viz-active={isActive}>
      <defs>
        <ArrowMarker id={markerId} />
      </defs>
      <path
        stroke="#fff4"
        strokeWidth={2}
        fill="none"
        d={pathToD(path)}
        data-viz="edge"
        markerEnd={`url(#${markerId})`}
      ></path>
    </g>
  ) : null;
};
