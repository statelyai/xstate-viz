import { useService } from '@xstate/react';
import React, { useContext, useMemo } from 'react';
import { SimulationContext } from './App';
import { useGetRect } from './getRect';
import { getPath, pathToD, Point, SvgPath } from './pathUtils';
import './EdgeViz.scss';
import { ArrowMarker } from './ArrowMarker';
import { DirectedGraphEdge } from '@xstate/graph';

function translatePoint(point: Point, vector: Point): Point {
  return {
    x: point.x + vector.x,
    y: point.y + vector.y,
  };
}

function translate(path: SvgPath, vector: Point): SvgPath {
  return path.map((cmd) => {
    switch (cmd[0]) {
      case 'M':
        return ['M', translatePoint(cmd[1], vector)];
      case 'L':
        return ['L', translatePoint(cmd[1], vector)];
      default:
        return cmd;
    }
  }) as SvgPath;
}

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

  // elk
  const { elkEdge } = edge as any;
  let path: SvgPath | undefined;

  if (elkEdge && elkEdge.sections?.length) {
    const section = elkEdge.sections[0];

    path = [
      ['M', section.startPoint],
      ...(section.bendPoints?.map((point: Point) => ['L', point]) || []),
      ['L', section.endPoint],
    ];
    if ((edge as any).lcaPosition) {
      path = translate(path, (edge as any).lcaPosition);
    }
  } else {
    path = getPath(sourceRect, edgeRect, targetRect);
  }

  const edgeCenterY = edgeRect.top + edgeRect.height / 2;

  const markerId = `${edge.source.order}-${order}`;

  // const path = [
  //   `M ${sourceRect.right},${edgeCenterY}`,
  //   `L ${edgeRect.left},${edgeCenterY}`,
  //   `M ${edgeRect.right},${edgeCenterY}`,
  //   `L ${edgeRect.right + 10},${edgeCenterY}`,
  //   `L ${targetRect.left},${targetRect.top}`,
  // ];

  return path ? (
    <g data-viz="edgeGroup" data-viz-edge={edge.id} data-viz-active={isActive}>
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
