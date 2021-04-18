import React from 'react';
import type { TransitionDefinition } from 'xstate';
import './TransitionViz.scss';

export const EventViz: React.FC<{
  definition: TransitionDefinition<any, any>;
}> = ({ definition }) => {
  return (
    <div data-viz="transition">
      <div data-viz="transition-label">{definition.eventType}</div>
    </div>
  );
};
