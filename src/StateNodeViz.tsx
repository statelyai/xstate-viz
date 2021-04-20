import React, { useContext, useEffect, useMemo, useRef } from 'react';
import type { StateNodeDefinition } from 'xstate';
import { TransitionViz } from './TransitionViz';
import './StateNodeViz.scss';
import './InvokeViz.scss';
import './ActionViz.scss';
import { SimulationContext } from './App';
import { useMachine, useService } from '@xstate/react';
import { setRect } from './getRect';

interface BaseStateNodeDef {
  key: string;
  id: string;
}

interface AtomicStateNodeDef extends BaseStateNodeDef {
  type: 'atomic';
}
interface CompoundStateNodeDef extends BaseStateNodeDef {
  type: 'compound';
  initial: string;
  states?: {
    [key: string]: StateNodeDef;
  };
}
interface ParallelStateNodeDef extends BaseStateNodeDef {
  type: 'parallel';
  states?: {
    [key: string]: StateNodeDef;
  };
}
interface FinalStateNodeDef extends BaseStateNodeDef {
  type: 'final';
}
interface HistoryStateNodeDef extends BaseStateNodeDef {
  type: 'history';
}

type StateNodeDef =
  | AtomicStateNodeDef
  | CompoundStateNodeDef
  | ParallelStateNodeDef
  | FinalStateNodeDef
  | HistoryStateNodeDef;

export const StateNodeViz: React.FC<{
  definition: StateNodeDefinition<any, any, any>;
  parent?: StateNodeDef;
}> = ({ definition, parent }) => {
  const service = useContext(SimulationContext);
  const [state, send] = useService(service);
  const ref = useRef<HTMLDivElement>(null);

  const previewState = useMemo(() => {
    if (!state.context.previewEvent) {
      return undefined;
    }
    return state.context.machine.transition(
      state.context.state,
      state.context.previewEvent,
    );
  }, [state]);

  useEffect(() => {
    if (ref.current) {
      setRect(definition.id, ref.current);
    }
  }, []);

  return (
    <div data-viz="stateNodeGroup" ref={ref}>
      <div
        data-viz="stateNode"
        data-viz-type={definition.type}
        data-viz-atomic={
          ['atomic', 'final'].includes(definition.type) || undefined
        }
        data-viz-parent-type={parent?.type}
        data-viz-active={
          state.context.state.configuration.find(
            (n) => n.id === definition.id,
          ) || undefined
        }
        data-viz-previewed={
          previewState?.configuration.find((n) => n.id === definition.id) ||
          undefined
        }
        title={`#${definition.id}`}
      >
        <div data-viz="stateNode-header">
          {['history', 'final'].includes(definition.type) && (
            <div
              data-viz="stateNode-type"
              data-viz-type={definition.type}
            ></div>
          )}
          <div data-viz="stateNode-key">{definition.key}</div>
        </div>
        <div data-viz="stateNode-content">
          <div data-viz="stateNode-invocations">
            {definition.invoke.map((invocation) => {
              return (
                <div data-viz="invoke">
                  <div data-viz="invoke-id">{invocation.id}</div>
                </div>
              );
            })}
          </div>
          <div data-viz="stateNode-actions" data-viz-actions="entry">
            {definition.entry.map((action) => {
              return (
                <div data-viz="action" data-viz-action="entry">
                  <div data-viz="action-type">{action.type}</div>
                </div>
              );
            })}
          </div>
          <div data-viz="stateNode-actions" data-viz-actions="exit">
            {definition.exit.map((action) => {
              return (
                <div data-viz="action" data-viz-action="exit">
                  <div data-viz="action-type">{action.type}</div>
                </div>
              );
            })}
          </div>
        </div>
        {'states' in definition && (
          <div data-viz="stateNode-states">
            {Object.entries(definition.states!).map(([key, value]) => {
              return (
                <StateNodeViz
                  key={key}
                  definition={value}
                  parent={definition}
                />
              );
            })}
          </div>
        )}
      </div>
      <div data-viz="transitions">
        {definition.transitions.map((transition, i) => {
          return <TransitionViz definition={transition} key={i} />;
        })}
      </div>
    </div>
  );
};
