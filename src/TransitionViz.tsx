import { chakra, keyframes } from '@chakra-ui/react';
import { useSelector } from '@xstate/react';
import React, { useMemo } from 'react';
import type { AnyStateNodeDefinition, Guard } from 'xstate';
import { toSCXMLEvent } from 'xstate/lib/utils';
import { ActionViz } from './ActionViz';
import { DelayViz } from './DelayViz';
import { DirectedGraphEdge } from './directedGraph';
import { EventTypeViz, toDelayString } from './EventTypeViz';
import { Point } from './pathUtils';
import { useSimulation } from './SimulationContext';
import { simulationMachine } from './simulationMachine';
import { AnyStateMachine, StateFrom } from './types';

const moveLeft = keyframes`
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
`;

const getGuardType = (guard: Guard<any, any>) => {
  return guard.name; // v4
};

export type DelayedTransitionMetadata =
  | { delayType: 'DELAYED_INVALID' }
  | { delayType: 'DELAYED_VALID'; delay: number; delayString: string };

const getDelayFromEventType = (
  eventType: string,
  delayOptions: AnyStateMachine['options']['delays'],
  context: AnyStateNodeDefinition['context'],
  event: any,
): DelayedTransitionMetadata | undefined => {
  try {
    const isDelayedEvent = eventType.startsWith('xstate.after');

    if (!isDelayedEvent) return undefined;

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
  } catch (err) {
    console.log(err);
    return;
  }
};

const delayOptionsSelector = (state: StateFrom<typeof simulationMachine>) =>
  state.context.serviceDataMap[state.context.currentSessionId!]?.machine.options
    ?.delays;

export const TransitionViz: React.FC<{
  edge: DirectedGraphEdge;
  position?: Point;
  index: number;
}> = ({ edge, index, position }) => {
  const definition = edge.transition;
  const service = useSimulation();
  const state = useSelector(
    service,
    (s) => s.context.serviceDataMap[s.context.currentSessionId!]?.state,
  );
  const delayOptions = useSelector(service, delayOptionsSelector);
  const delay = useMemo(
    () =>
      delayOptions
        ? getDelayFromEventType(
            definition.eventType,
            delayOptions,
            state?.context,
            state?.event,
          )
        : undefined,
    [definition.eventType, delayOptions, state],
  );

  if (!state) {
    return null;
  }

  const isDisabled =
    delay?.delayType === 'DELAYED_INVALID' ||
    !state.nextEvents.includes(definition.eventType);
  const isPotential =
    state.nextEvents.includes(edge.transition.eventType) &&
    !!state.configuration.find((sn) => sn === edge.source);

  return (
    <chakra.button
      data-viz="transition"
      css={{
        '--viz-transition-color': isPotential
          ? 'var(--viz-color-active)'
          : 'gray',
        display: 'block',
        borderRadius: '1rem',
        backgroundColor: 'var(--viz-transition-color)',
        appearance: 'none',
      }}
      _after={
        delay && !isDisabled
          ? {
              animation: `${moveLeft} calc(var(--delay) * 1ms) linear`,
              zIndex: 0,
            }
          : undefined
      }
      data-rect-id={edge.id}
      style={{
        position: 'absolute',
        ...(position && { left: `${position.x}px`, top: `${position.y}px` }),
        // @ts-ignore
        '--delay': delay?.delayType === 'DELAYED_VALID' && delay.delay,
      }}
      disabled={isDisabled}
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
          event: toSCXMLEvent(
            {
              type: definition.eventType,
            },
            { origin: state._sessionid as string },
          ),
        });
      }}
    >
      <chakra.div
        css={{
          alignSelf: 'center',
          flexShrink: 0,
          fontSize: 'var(--viz-font-size-sm)',
          fontWeight: 'bold',
          color: 'white',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflow: 'hidden',
        }}
      >
        <chakra.span
          css={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '1ch',
            padding: '0.25rem 0.5rem',
          }}
        >
          <EventTypeViz eventType={definition.eventType} delay={delay} />
          {delay && delay.delayType === 'DELAYED_VALID' && (
            <DelayViz active={isPotential} duration={delay.delay} />
          )}
        </chakra.span>
        {definition.cond && (
          <chakra.span
            css={{
              padding: '0 0.5rem',
            }}
            _before={{
              content: "'['",
            }}
            _after={{
              content: "']'",
            }}
          >
            {getGuardType(definition.cond)}
          </chakra.span>
        )}
      </chakra.div>
      {definition.actions.length > 0 && (
        <chakra.div
          css={{
            padding: '0rem 0.5rem 0.5rem',
          }}
        >
          {definition.actions.map((action, index) => {
            return <ActionViz key={index} action={action} kind="do" />;
          })}
        </chakra.div>
      )}
      {definition.description && (
        <chakra.div
          css={{
            borderTop: '2px solid var(--chakra-colors-whiteAlpha-300)',
            padding: '0.5rem',
            minWidth: 'max-content',
            fontSize: 'var(--chakra-fontSizes-sm)',
            textAlign: 'left',
          }}
        >
          <chakra.p css={{ maxWidth: '10rem' }}>
            {definition.description}
          </chakra.p>
        </chakra.div>
      )}
    </chakra.button>
  );
};
