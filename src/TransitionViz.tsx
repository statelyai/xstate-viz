import { useSelector } from '@xstate/react';
import React, { useEffect, useRef } from 'react';
import type { Guard } from 'xstate';
import { DirectedGraphEdge } from './directedGraph';
import { EventTypeViz } from './EventTypeViz';
import { deleteRect, setRect } from './getRect';
import { Point } from './pathUtils';
import './TransitionViz.scss';
import { useSimulation } from './SimulationContext';

const getGuardType = (guard: Guard<any, any>) => {
  return guard.name; // v4
};

export const TransitionViz: React.FC<{
  edge: DirectedGraphEdge;
  position?: Point;
  index: number;
}> = ({ edge, index, position }) => {
  const definition = edge.transition;
  const service = useSimulation();
  const state = useSelector(service, (s) =>
    s.context.services[s.context.service!]?.getSnapshot(),
  );

  const ref = useRef<any>(null);
  useEffect(() => {
    if (ref.current) {
      setRect(edge.id, ref.current);
    }
    return () => {
      deleteRect(edge.id);
    };
  }, [edge.id]);

  if (!state) {
    return null;
  }

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
      <button
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
            type: 'SERVICE.SEND',
            event: {
              type: definition.eventType,
            },
          });
        }}
      >
        <span data-viz="transition-event">
          <EventTypeViz eventType={definition.eventType} />
        </span>
        {definition.cond && (
          <span data-viz="transition-guard">
            {getGuardType(definition.cond)}
          </span>
        )}
      </button>
    </div>
  );
};
