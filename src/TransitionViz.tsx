import { useSelector } from '@xstate/react';
import React, { useEffect, useRef, useMemo } from 'react';
import type { AnyStateNodeDefinition, Guard } from 'xstate';
import { DirectedGraphEdge } from './directedGraph';
import { EventTypeViz, toDelayString } from './EventTypeViz';
import { deleteRect, setRect } from './getRect';
import { Point } from './pathUtils';
import './TransitionViz.scss';
import { useSimulation } from './SimulationContext';
import { getActionKeyAndLabelByType } from './utils';
import { AnyStateMachine } from './types';

const getGuardType = (guard: Guard<any, any>) => {
  return guard.name; // v4
};

export type DelayedTransitionMetadata =
  | { delayType: 'NOT_DELAYED' }
  | { delayType: 'DELAYED_INVALID' }
  | { delayType: 'DELAYED_VALID'; delay: number; delayString: string };
const getDelayFromEventType = (
  eventType: string,
  delayOptions: AnyStateMachine['options']['delays'],
  context: AnyStateNodeDefinition['context'],
  event: any,
): DelayedTransitionMetadata => {
  const isDelayedEvent = eventType.startsWith('xstate.after');

  if (!isDelayedEvent) return { delayType: 'NOT_DELAYED' };

  const DELAYED_EVENT_REGEXT = /^xstate\.after\((.*)\)#.*$/;
  // Validate the delay duration
  const match = eventType.match(DELAYED_EVENT_REGEXT);

  if (!match) return { delayType: 'DELAYED_INVALID' };

  let [, delay] = match;

  // normal number or stringified number delays
  let finalDelay = +delay;

  // if configurable delay, get it from the machine options
  if (Number.isNaN(finalDelay)) {
    const delayExpr = delayOptions[delay];
    // if configured delay is a fixed number value
    if (typeof delayExpr === 'number') {
      finalDelay = delayExpr;
    } else {
      // if configured delay is getter function
      // @ts-expect-error
      finalDelay = delayExpr(context, event);
    }
  }

  return {
    delayType: 'DELAYED_VALID',
    delay: finalDelay,
    delayString: toDelayString(delay),
  };
};

const delayOptionsSelector = (state: AnyStateNodeDefinition) =>
  state.context.services[state.context.service!]?.machine.options.delays;

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
  const delayOptions = useSelector(service, delayOptionsSelector);
  const delay = useMemo(
    () =>
      getDelayFromEventType(
        definition.eventType,
        delayOptions,
        state?.context,
        state?.event,
      ),
    [definition.eventType, delayOptions, state],
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
      ref={ref}
    >
      <button
        data-viz="transition-label"
        disabled={
          delay.delayType === 'DELAYED_INVALID' ||
          !state.nextEvents.includes(definition.eventType)
        }
        style={
          {
            '--delay': delay.delayType === 'DELAYED_VALID' && delay.delay,
          } as React.CSSProperties
        }
        data-is-delayed={delay.delayType !== 'NOT_DELAYED'}
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
        <span
          data-viz="transition-event"
          data-is-delayed={delay.delayType !== 'NOT_DELAYED'}
        >
          <EventTypeViz eventType={definition.eventType} delay={delay} />
        </span>
        {definition.cond && (
          <span data-viz="transition-guard">
            {getGuardType(definition.cond)}
          </span>
        )}
      </button>
      {definition.actions.length > 0 && (
        <div data-viz="transition-actions">
          {definition.actions.map((action, index) => {
            const { key, label } = getActionKeyAndLabelByType(action, index);
            return (
              <div data-viz="action" data-viz-action="do" key={key}>
                <span data-viz="action-text">{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
