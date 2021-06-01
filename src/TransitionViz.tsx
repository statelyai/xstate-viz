import { DirectedGraphEdge } from '@xstate/graph';
import { useSelector } from '@xstate/react';
import React, { useContext, useEffect, useRef } from 'react';
import type { Guard, TransitionDefinition } from 'xstate';
import { SimulationContext } from './App';
import { EventTypeViz } from './EventTypeViz';
import { deleteRect, setRect } from './getRect';
import { Point } from './pathUtils';
import './TransitionViz.scss';

const getGuardType = (guard: Guard<any, any>) => {
  return guard.name; // v4
};

export const TransitionViz: React.FC<{
  edge: DirectedGraphEdge;
  position?: Point;
  index: number;
}> = ({ edge, index, position }) => {
  const definition = edge.transition;
  const service = useContext(SimulationContext);
  const state = useSelector(service, (s) => s.context.state);

  const ref = useRef<any>(null);
  useEffect(() => {
    if (ref.current) {
      setRect(edge.id, ref.current);
    }
    return () => {
      deleteRect(edge.id);
    };
  }, [edge.id]);

  return (
    <div
      data-viz="transition"
      data-viz-potential={
        (state.nextEvents.includes(edge.transition.eventType) &&
          !!state.configuration.find((sn) => sn === edge.source)) ||
        undefined
      }
      style={{
        position: 'absolute',
        ...(position && { left: `${position.x}px`, top: `${position.y}px` }),
      }}
    >
      <div
        data-viz="transition-label"
        ref={ref}
        onMouseEnter={() => {
          service.send({
            type: 'EVENT.PREVIEW',
            eventType: definition.eventType,
          });
        }}
        onMouseLeave={() => {
          service.send({
            type: 'PREVIEW.CLEAR',
          });
        }}
        onClick={() => {
          // TODO: only if no parameters/schema
          service.send({
            type: 'EVENT',
            event: {
              type: definition.eventType,
            },
          });
        }}
      >
        <div data-viz="transition-event">
          <EventTypeViz eventType={definition.eventType} />
        </div>
        {definition.cond && (
          <div data-viz="transition-guard">{getGuardType(definition.cond)}</div>
        )}
      </div>
    </div>
  );
};
