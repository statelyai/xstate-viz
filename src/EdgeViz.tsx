import { useService } from '@xstate/react';
import React, { useContext, useMemo } from 'react';
import { SimulationContext } from './App';
import { useGetRect } from './getRect';
import { getPath, pathToD } from './pathUtils';
import type { Edge } from './utils';
import './EdgeViz.scss';
import { ArrowMarker } from './ArrowMarker';

export const EdgeViz: React.FC<{ edge: Edge<any, any, any> }> = ({ edge }) => {
  const service = useContext(SimulationContext);
  const [state, send] = useService(service);
  const sourceRect = useGetRect(`${edge.source.id}`);
  const edgeRect = useGetRect(`${edge.source.id}:${edge.order}`);
  const targetRect = useGetRect(`${edge.target.id}`);

  const isActive = useMemo(() => {
    return state.context.state.configuration.includes(edge.source) || undefined;
  }, [state]);

  if (!sourceRect || !targetRect || !edgeRect) {
    return null;
  }

  const edgeCenterY = edgeRect.top + edgeRect.height / 2;

  const path = getPath(edgeRect, targetRect);

  const markerId = edge.event + edge.order;

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
