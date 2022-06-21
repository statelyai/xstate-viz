import React from 'react';
import type { InvokeDefinition } from 'xstate/lib/types';
import type { DelayedTransitionMetadata } from './TransitionViz';
import { ActionLabelBeforeElement } from './ActionLabelBeforeElement';
import { SpecificActionLabel } from './SpecificActionLabel';
import { chakra } from '@chakra-ui/react';

export function toDelayString(delay: string | number): string {
  if (typeof delay === 'number' || !isNaN(+delay)) {
    return `${delay}ms`;
  }
  return delay;
}

export function formatInvocationId(id: string): string {
  if (isUnnamed(id)) {
    const match = id.match(/:invocation\[(\d+)\]$/);

    if (!match) {
      return id;
    }

    const [, index] = match;

    return `anonymous [${index}]`;
  }

  return id;
}

function isUnnamed(id: string): boolean {
  return /:invocation\[/.test(id);
}

export function InvokeViz({ invoke }: { invoke: InvokeDefinition<any, any> }) {
  const unnamed = isUnnamed(invoke.id);
  const invokeSrc =
    typeof invoke.src === 'string' ? invoke.src : invoke.src.type;

  const id = unnamed ? 'anonymous' : invoke.id;

  return (
    <ActionLabelBeforeElement kind="invoke" title={`${id} (${invokeSrc})`}>
      <SpecificActionLabel>{unnamed ? <em>{id}</em> : id}</SpecificActionLabel>
    </ActionLabelBeforeElement>
  );
}

function EventTypeWrapper({
  children,
  keyword,
}: {
  children: React.ReactNode;
  keyword?: 'done' | 'error' | 'after' | 'always';
}) {
  return (
    <chakra.div
      css={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: '1ch',
      }}
      _before={
        keyword && {
          content: '""',
          height: '0.5rem',
          width: '0.5rem',
          borderRadius: '0.5rem',
          backgroundColor: {
            done: '#33ff99',
            error: '#e76f4b',
            always: '#fff',
            after: '#fff',
          }[keyword],
          display: 'block',
        }
      }
    >
      {children}
    </chakra.div>
  );
}

export const EventTypeViz: React.FC<{
  eventType: string;
  delay?: DelayedTransitionMetadata;
  onChangeEventType?: (eventType: string) => void;
}> = ({ eventType: event, delay, onChangeEventType }) => {
  if (event.startsWith('done.state.')) {
    return (
      <EventTypeWrapper keyword="done">
        <em>onDone</em>
      </EventTypeWrapper>
    );
  }

  if (event.startsWith('done.invoke.')) {
    const match = event.match(/^done\.invoke\.(.+)$/);
    return (
      <EventTypeWrapper keyword="done">
        <em>done:</em> <div>{match ? formatInvocationId(match[1]) : '??'}</div>
      </EventTypeWrapper>
    );
  }

  if (event.startsWith('error.platform.')) {
    const match = event.match(/^error\.platform\.(.+)$/);
    return (
      <EventTypeWrapper keyword="error">
        <em>error:</em> <div>{match ? match[1] : '??'}</div>
      </EventTypeWrapper>
    );
  }

  if (delay?.delayType === 'DELAYED_INVALID') {
    return <EventTypeWrapper>{event}</EventTypeWrapper>;
  }

  if (delay?.delayType === 'DELAYED_VALID') {
    return (
      <EventTypeWrapper keyword="after">
        <em>after</em> <div>{delay.delayString}</div>
      </EventTypeWrapper>
    );
  }

  if (event === '') {
    return (
      <EventTypeWrapper keyword="always">
        <em>always</em>
      </EventTypeWrapper>
    );
  }

  return (
    <EventTypeWrapper>
      <div>{event}</div>
    </EventTypeWrapper>
  );
};
