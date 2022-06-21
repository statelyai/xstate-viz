import { chakra, Link } from '@chakra-ui/react';
import { useActor } from '@xstate/react';
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { StateNode } from 'xstate';
import { ActionViz } from './ActionViz';
import { DirectedGraphNode } from './directedGraph';
import { InvokeViz } from './EventTypeViz';
import { useSimulation } from './SimulationContext';

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

const StateNodeKey: React.FC<{ value: string }> = ({ value }) => {
  return (
    <chakra.div
      css={{
        gridArea: 'key',
        padding: '0.5rem',
        fontWeight: 'bold',
      }}
    >
      <chakra.div
        css={{
          maxWidth: '20ch',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={value}
      >
        {value}
      </chakra.div>
    </chakra.div>
  );
};

export const StateNodeViz: React.FC<{
  node: DirectedGraphNode;
  stateNode: StateNode;
}> = ({ stateNode, node }) => {
  const service = useSimulation();
  const [state] = useActor(service);

  const serviceData =
    state.context.serviceDataMap[state.context.currentSessionId!];
  const simState = serviceData?.state;
  const simMachine = serviceData?.machine;

  const previewState = useMemo(() => {
    if (!state.context.previewEvent) {
      return undefined;
    }
    // Catch exceptions thrown by invalid actions or guards on the transition event
    try {
      return simMachine?.transition(simState, state.context.previewEvent);
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }, [state, simState, simMachine]);

  if (!simState) {
    return null;
  }

  const description = stateNode.description || stateNode.meta?.description;
  const isActive = !!simState.configuration.find((n) => n.id === stateNode.id);
  const isPreviewed = !!previewState?.configuration.find(
    (n) => n.id === stateNode.id,
  );

  return (
    <chakra.div
      css={{
        position: 'absolute',
        '--viz-node-border-color': 'var(--viz-border-color)',
        '--viz-node-active': '0',
        '--viz-transition-color': '#555',
        ...((isActive || isPreviewed) && {
          '--viz-node-border-color': 'var(--viz-color-active)',
        }),
        ...(isActive && {
          '--viz-node-active': '1',
          '--viz-transition-color': 'var(--viz-color-active)',
        }),
      }}
      style={{
        ...(node.layout && {
          left: `${node.layout.x}px`,
          top: `${node.layout.y}px`,
        }),
      }}
    >
      <chakra.div
        data-viz="stateNode"
        data-viz-type={stateNode.type}
        data-viz-atomic={
          ['atomic', 'final'].includes(stateNode.type) || undefined
        }
        data-rect-id={stateNode.id}
        css={{
          color: 'var(--viz-color-fg)',
          alignSelf: 'start',
          opacity:
            'calc(0.7 * (1 - var(--viz-node-active)) + var(--viz-node-active))',
          fontSize: '1em',
          borderRadius: 'var(--viz-radius)',
          overflow: 'hidden',
          '--viz-node-border-style':
            stateNode.parent?.type === 'parallel'
              ? 'var(--viz-node-parallel-border-style)'
              : 'solid',
        }}
        // Border in a pseudoelement to not affect positioning
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'var(--viz-border)',
          borderColor: 'var(--viz-node-border-color)',
          borderStyle: 'var(--viz-node-border-style)',
          borderRadius: 'inherit',
          zIndex: 1,
          pointerEvents: 'none',
        }}
        style={{
          ...(node.layout && {
            width: `${node.layout.width}px`,
            height: `${node.layout.height}px`,
          }),
        }}
      >
        <chakra.div
          css={{
            background: 'var(--viz-node-color-bg)',
          }}
          data-rect-id={`${stateNode.id}:content`}
        >
          <chakra.div
            css={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gridTemplateAreas: "'type key tags'",
              alignItems: 'center',
            }}
          >
            {['history', 'final'].includes(stateNode.type) && (
              <chakra.div
                data-viz="stateNode-type"
                data-viz-type={stateNode.type}
                css={{
                  height: '1.5rem',
                  width: '1.5rem',
                  margin: '0.5rem',
                  marginRight: 0,
                  borderRadius: 'var(--viz-radius)',
                  background: 'var(--viz-color-transparent)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  ...(stateNode.type === 'final' && {
                    border: '2px solid var(--viz-color-transparent)',
                    background: 'transparent',
                  }),
                }}
                _before={{
                  content:
                    stateNode.type === 'final'
                      ? "''"
                      : stateNode.type === 'history' &&
                        stateNode.history === 'deep'
                      ? "'H٭'"
                      : 'H',
                  display: 'block',
                  fontWeight: 'bold',
                  ...(stateNode.type === 'final' && {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: 'inherit',
                    transform: 'scale(0.7)',
                    background: 'var(--viz-color-transparent)',
                  }),
                  ...(stateNode.type === 'history' &&
                    stateNode.history === 'deep' && {
                      fontSize: '80%',
                    }),
                }}
              ></chakra.div>
            )}
            <StateNodeKey value={stateNode.key} />
            {stateNode.tags.length > 0 && (
              <chakra.div
                css={{
                  gridArea: 'tags',
                  display: 'flex',
                  flexDirection: 'row',
                  textOverflow: 'ellipsis',
                  padding: '0.5rem',
                  gap: '1ch',
                }}
              >
                {stateNode.tags.map((tag, i) => {
                  return (
                    <chakra.div
                      css={{
                        display: 'inline-block',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        backgroundColor: '#fff5',
                      }}
                      key={i}
                    >
                      {tag}
                    </chakra.div>
                  );
                })}
              </chakra.div>
            )}
          </chakra.div>
          {stateNode.definition.invoke.length > 0 && (
            <chakra.div css={{ padding: '0.5rem' }}>
              {stateNode.definition.invoke.map((invokeDef) => {
                return <InvokeViz invoke={invokeDef} key={invokeDef.id} />;
              })}
            </chakra.div>
          )}
          {stateNode.definition.entry.length > 0 && (
            <chakra.div
              css={{
                padding: '0.5rem',
              }}
              data-viz-actions="entry"
            >
              {stateNode.definition.entry.map((action, index) => {
                return <ActionViz key={index} action={action} kind="entry" />;
              })}
            </chakra.div>
          )}
          {stateNode.definition.exit.length > 0 && (
            <chakra.div
              css={{
                padding: '0.5rem',
              }}
              data-viz-actions="exit"
            >
              {stateNode.definition.exit.map((action, index) => {
                return <ActionViz key={index} action={action} kind="exit" />;
              })}
            </chakra.div>
          )}
          {description && (
            <chakra.div
              css={{
                borderTop: '2px solid var(--chakra-colors-whiteAlpha-300)',
                padding: '0.5rem',
                minWidth: 'max-content',
                fontSize: 'var(--chakra-fontSizes-sm)',
                '& > p': {
                  maxWidth: '10rem',
                },
              }}
            >
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => <Link {...props} />,
                }}
              >
                {description}
              </ReactMarkdown>
            </chakra.div>
          )}
        </chakra.div>
        {'states' in stateNode && node.children && (
          <chakra.div
            css={{
              padding: '2rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2rem',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            {node.children.map((childNode) => {
              return (
                <StateNodeViz
                  key={childNode.id}
                  stateNode={childNode.data}
                  node={childNode}
                />
              );
            })}
          </chakra.div>
        )}
      </chakra.div>
    </chakra.div>
  );
};
