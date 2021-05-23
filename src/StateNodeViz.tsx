import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { StateNode, StateNodeDefinition } from 'xstate';
import { TransitionViz } from './TransitionViz';
import './StateNodeViz.scss';
import './InvokeViz.scss';
import './ActionViz.scss';
import { SimulationContext } from './App';
import { useMachine, useService } from '@xstate/react';
import { setRect, useGetRect } from './getRect';

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
  stateNode: StateNode<any, any, any>;
  parent?: StateNodeDef;
}> = ({ stateNode, parent }) => {
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
      setRect(stateNode.id, ref.current);
    }
  }, []);

  console.log(stateNode);

  return (
    <div
      data-viz="stateNodeGroup"
      data-viz-active={
        !!state.context.state.configuration.find(
          (n) => n.id === stateNode.id,
        ) || undefined
      }
      data-viz-previewed={
        previewState?.configuration.find((n) => n.id === stateNode.id) ||
        undefined
      }
      style={{
        // outline: '1px solid blue',
        position: 'absolute',
        // height: `${layout.height!}px`,
        // width: `${layout.width!}px`,
        ...(stateNode.meta && {
          left: `${stateNode.meta.layout.x}px`,
          top: `${stateNode.meta.layout.y}px`,
        }),
      }}
    >
      <div
        ref={ref}
        data-viz="stateNode"
        data-viz-type={stateNode.type}
        data-viz-atomic={
          ['atomic', 'final'].includes(stateNode.type) || undefined
        }
        data-viz-parent-type={parent?.type}
        title={`#${stateNode.id}`}
        style={{
          // position: 'absolute',
          ...(stateNode.meta && {
            width: `${stateNode.meta.layout.width}px`,
            height: `${stateNode.meta.layout.height}px`,
          }),
        }}
      >
        <div data-viz="stateNode-content" data-rect={`${stateNode.id}:content`}>
          <div data-viz="stateNode-header">
            {['history', 'final'].includes(stateNode.type) && (
              <div
                data-viz="stateNode-type"
                data-viz-type={stateNode.type}
              ></div>
            )}
            <div data-viz="stateNode-key">{stateNode.key}</div>
          </div>
          {stateNode.definition.invoke.length > 0 && (
            <div data-viz="stateNode-invocations">
              {stateNode.definition.invoke.map((invocation) => {
                return (
                  <div data-viz="invoke">
                    <div data-viz="invoke-id">{invocation.id}</div>
                  </div>
                );
              })}
            </div>
          )}
          {stateNode.definition.entry.length > 0 && (
            <div data-viz="stateNode-actions" data-viz-actions="entry">
              {stateNode.definition.entry.map((action) => {
                return (
                  <div data-viz="action" data-viz-action="entry">
                    <div data-viz="action-type">{action.type}</div>
                  </div>
                );
              })}
            </div>
          )}
          {stateNode.definition.exit.length > 0 && (
            <div data-viz="stateNode-actions" data-viz-actions="exit">
              {stateNode.definition.exit.map((action) => {
                return (
                  <div data-viz="action" data-viz-action="exit">
                    <div data-viz="action-type">{action.type}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {'states' in stateNode && (
          <div data-viz="stateNode-states">
            {Object.entries(stateNode.states!).map(([key, value]) => {
              return <StateNodeViz key={value.version} stateNode={value} />;
            })}
          </div>
        )}
      </div>
      <div data-viz="transitions">
        {stateNode.transitions.map((transition, i) => {
          return <TransitionViz definition={transition} key={i} index={i} />;
        })}
      </div>
    </div>
  );
};
