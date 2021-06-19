import React, { useEffect, useMemo, useRef } from 'react';
import type { StateNode } from 'xstate';
import './StateNodeViz.scss';
import './InvokeViz.scss';
import './ActionViz.scss';

import { useService } from '@xstate/react';
import { deleteRect, setRect } from './getRect';
import { useSimulation } from './useSimulation';
import { DirectedGraphNode } from './directedGraph';

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
  node: DirectedGraphNode;
  stateNode: StateNode;
  parent?: StateNodeDef;
}> = ({ stateNode, node, parent }) => {
  const service = useSimulation();
  const [state] = useService(service);
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
    return () => {
      deleteRect(stateNode.id);
    };
  }, [stateNode]);

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
        ...(node.layout && {
          left: `${node.layout.x}px`,
          top: `${node.layout.y}px`,
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
          ...(node.layout && {
            width: `${node.layout.width}px`,
            height: `${node.layout.height}px`,
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
            <div data-viz="stateNode-tags">
              {stateNode.tags.map((tag, i) => {
                return (
                  <div data-viz="stateNode-tag" key={i}>
                    {tag}
                  </div>
                );
              })}
            </div>
          </div>
          {stateNode.definition.invoke.length > 0 && (
            <div data-viz="stateNode-invocations">
              {stateNode.definition.invoke.map((invocation) => {
                return (
                  <div data-viz="invoke" key={invocation.id}>
                    <div data-viz="invoke-id">{invocation.id}</div>
                  </div>
                );
              })}
            </div>
          )}
          {stateNode.definition.entry.length > 0 && (
            <div data-viz="stateNode-actions" data-viz-actions="entry">
              {stateNode.definition.entry.map((action, idx) => {
                return (
                  <div data-viz="action" data-viz-action="entry" key={idx}>
                    <div data-viz="action-type">{action.type}</div>
                  </div>
                );
              })}
            </div>
          )}
          {stateNode.definition.exit.length > 0 && (
            <div data-viz="stateNode-actions" data-viz-actions="exit">
              {stateNode.definition.exit.map((action, idx) => {
                return (
                  <div data-viz="action" data-viz-action="exit" key={idx}>
                    <div data-viz="action-type">{action.type}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {'states' in stateNode && (
          <div data-viz="stateNode-states">
            {node.children.map((childNode) => {
              return (
                <StateNodeViz
                  key={childNode.id}
                  stateNode={childNode.data}
                  node={childNode}
                />
              );
            })}
          </div>
        )}
      </div>
      <div data-viz="transitions"></div>
    </div>
  );
};
