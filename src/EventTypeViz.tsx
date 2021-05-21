import React from 'react';
import type { InvokeDefinition } from 'xstate/lib/types';
import './EventTypeViz.scss';

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
  const invokeSrc =
    typeof invoke.src === 'string' ? invoke.src : invoke.src.type;

  return (
    <div data-viz="invoke" data-viz-unnamed={isUnnamed(invoke.id) || undefined}>
      <div data-viz="invoke-src">{invokeSrc}</div>
      <div data-viz="invoke-id">
        {/* <ActorRefViz actorRefId={invoke.id}>
          {formatInvocationId(invoke.id)}
        </ActorRefViz> */}
      </div>
    </div>
  );
}

export const EventTypeViz: React.FC<{
  eventType: string;
  onChangeEventType?: (eventType: string) => void;
}> = ({ eventType: event, onChangeEventType }) => {
  if (event.startsWith('done.state.')) {
    return (
      <div data-viz="eventType" data-viz-keyword="done">
        <em data-viz="eventType-keyword">onDone</em>
      </div>
    );
  }

  if (event.startsWith('done.invoke.')) {
    const match = event.match(/^done\.invoke\.(.+)$/);
    return (
      <div data-viz="eventType" data-viz-keyword="done">
        <em data-viz="eventType-keyword">done:</em>{' '}
        <div data-viz="eventType-text">
          {match ? formatInvocationId(match[1]) : '??'}
        </div>
      </div>
    );
  }

  if (event.startsWith('error.platform.')) {
    const match = event.match(/^error\.platform\.(.+)$/);
    return (
      <div data-viz="eventType" data-viz-keyword="error">
        <em data-viz="eventType-keyword">error:</em>{' '}
        <div data-viz="eventType-text">{match ? match[1] : '??'}</div>
      </div>
    );
  }

  if (event.startsWith('xstate.after')) {
    const match = event.match(/^xstate\.after\((.*)\)#.*$/);

    if (!match) {
      return <div data-viz="eventType">{event}</div>;
    }

    const [, delay] = match;

    return (
      <div data-viz="eventType" data-viz-keyword="after">
        <em data-viz="eventType-keyword">after</em>{' '}
        <div data-viz="eventType-text">{toDelayString(delay)}</div>
      </div>
    );
  }

  if (event === '') {
    return (
      <div data-viz="eventType" data-viz-keyword="always">
        <em data-viz="eventType-keyword">always</em>
      </div>
    );
  }

  return (
    <div data-viz="eventType">
      <div data-viz="eventType-text">{event}</div>
    </div>
  );
};
