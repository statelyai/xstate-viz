import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  ButtonGroup,
  FormLabel,
  IconButton,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import Editor from '@monaco-editor/react';
import { useActor, useMachine, useSelector } from '@xstate/react';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { assign, SCXML, send, StateFrom } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { toSCXMLEvent } from 'xstate/lib/utils';
import { JSONView } from './JSONView';
import { useSimulation } from './SimulationContext';
import { SimEvent, simulationMachine } from './simulationMachine';
import { isInternalEvent, isNullEvent } from './utils';

const EventConnection: React.FC<{ event: SimEvent }> = ({ event }) => {
  const sim = useSimulation();
  const originId = useSelector(
    sim,
    (state) =>
      event.origin && state.context.serviceDataMap[event.origin]?.machine.id,
  );
  const targetId = useSelector(
    sim,
    (state) => state.context.serviceDataMap[event.sessionId]?.machine.id,
  );

  return (
    <Box display="inline-flex" flexDirection="row" gap="1ch" fontSize="sm">
      {originId && <Text whiteSpace="nowrap">{originId} →&nbsp;</Text>}
      <Text whiteSpace="nowrap">{targetId}</Text>
    </Box>
  );
};

// To keep the table header sticky, the trick is to make all `th` elements sticky
const stickyProps = {
  position: 'sticky',
  top: 0,
  backgroundColor: 'var(--chakra-colors-gray-800)',
  zIndex: 1,
} as const;

const sortByCriteria = {
  ASC: (events: SimEvent[]) =>
    events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
  DESC: (events: SimEvent[]) =>
    events.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1)),
};
type SortCriteria = keyof typeof sortByCriteria;
const eventsModel = createModel(
  {
    sortCriteria: null as SortCriteria | null,
    filterKeyword: '',
    showBuiltins: false,
    rawEvents: [] as SimEvent[],
  },
  {
    events: {
      SORT_BY_TIMESTAMP: (sortCriteria: SortCriteria) => ({ sortCriteria }),
      FILTER_BY_KEYWORD: (keyword: string) => ({ keyword }),
      TOGGLE_BUILTIN_EVENTS: (showBuiltins: boolean) => ({ showBuiltins }),
      EVENTS_UPDATED: (events: SimEvent[]) => ({ events }),
    },
  },
);
const eventsMachine = eventsModel.createMachine({
  initial: 'raw',
  context: eventsModel.initialContext,
  states: {
    raw: {},
    modified: {},
  },
  on: {
    SORT_BY_TIMESTAMP: {
      target: 'modified',
      actions: [
        eventsModel.assign((_, e) => ({
          sortCriteria: e.sortCriteria,
        })),
      ],
    },
    FILTER_BY_KEYWORD: {
      target: 'modified',
      actions: [
        eventsModel.assign((_, e) => ({
          filterKeyword: e.keyword,
        })),
      ],
    },
    EVENTS_UPDATED: {
      actions: [
        eventsModel.assign((_, e) => ({
          rawEvents: e.events,
        })),
      ],
    },
    TOGGLE_BUILTIN_EVENTS: {
      target: 'modified',
      actions: [
        eventsModel.assign((_, e) => ({
          showBuiltins: e.showBuiltins,
        })),
      ],
    },
  },
});

const deriveFinalEvents = (ctx: typeof eventsModel.initialContext) => {
  let finalEvents = ctx.rawEvents;
  if (!ctx.showBuiltins) {
    finalEvents = finalEvents.filter((event) => {
      return !isInternalEvent(event.name) && !isNullEvent(event.name);
    });
  }
  if (ctx.filterKeyword) {
    finalEvents = finalEvents.filter((evt) =>
      evt.name.toUpperCase().includes(ctx.filterKeyword.toUpperCase()),
    );
  }
  if (ctx.sortCriteria) {
    finalEvents = sortByCriteria[ctx.sortCriteria](finalEvents.slice());
  }
  return finalEvents;
};

const selectMachine = (state: StateFrom<typeof simulationMachine>) =>
  state.context.currentSessionId
    ? state.context.serviceDataMap[state.context.currentSessionId]
    : undefined; // TODO: select() method on model

export const EventsPanel: React.FC = () => {
  const sim = useSimulation();
  const [state, send] = useActor(sim);
  const rawEvents = state.context!.events;
  const nextEvents = useSelector(
    sim,
    (state) => selectMachine(state)?.state.nextEvents,
    (a, b) => JSON.stringify(a) === JSON.stringify(b),
  );

  const [eventsState, sendToEventsMachine] = useMachine(() => eventsMachine, {
    context: {
      ...eventsModel.initialContext,
      rawEvents: rawEvents,
    },
  });

  const finalEvents = deriveFinalEvents(eventsState.context);

  useEffect(() => {
    sendToEventsMachine({
      type: 'EVENTS_UPDATED',
      events: rawEvents,
    });
  }, [rawEvents, sendToEventsMachine]);

  return (
    <Box
      display="grid"
      gridTemplateRows="auto 1fr auto"
      gridRowGap="2"
      height="100%"
    >
      <Box display="flex" justifyContent="flex-end" alignItems="center">
        <Input
          placeholder="Filter events"
          type="search"
          onChange={(e) => {
            sendToEventsMachine({
              type: 'FILTER_BY_KEYWORD',
              keyword: e.target.value,
            });
          }}
          marginRight="auto"
          width="40%"
        />

        <Box display="flex" alignItems="center">
          <FormLabel marginBottom="0" marginRight="1" htmlFor="builtin-toggle">
            Show built-in events
          </FormLabel>
          <Switch
            id="builtin-toggle"
            onChange={(e) => {
              sendToEventsMachine({
                type: 'TOGGLE_BUILTIN_EVENTS',
                showBuiltins: e.target.checked,
              });
            }}
          />
        </Box>
      </Box>
      <Box overflowY="auto">
        <Table width="100%">
          <Thead>
            <Tr>
              <Th {...stickyProps} width="100%">
                Event type
              </Th>
              <Th {...stickyProps}>To</Th>
              <Th {...stickyProps} whiteSpace="nowrap">
                Time
                <Box
                  display="inline-flex"
                  flexDirection="column"
                  verticalAlign="middle"
                  marginLeft="1"
                >
                  <IconButton
                    aria-label="sort by timestamp descending"
                    title="sort by timestamp descending"
                    icon={<ChevronUpIcon />}
                    variant="unstyled"
                    size="xs"
                    bg={
                      eventsState.context.sortCriteria === 'DESC'
                        ? 'var(--chakra-colors-gray-700)'
                        : undefined
                    }
                    onClick={() => {
                      sendToEventsMachine({
                        type: 'SORT_BY_TIMESTAMP',
                        sortCriteria: 'DESC',
                      });
                    }}
                  />
                  <IconButton
                    aria-label="sort by timestamp ascending"
                    title="sort by timestamp ascending"
                    icon={<ChevronDownIcon />}
                    variant="unstyled"
                    size="xs"
                    bg={
                      eventsState.context.sortCriteria === 'ASC'
                        ? 'var(--chakra-colors-gray-700)'
                        : undefined
                    }
                    onClick={() => {
                      sendToEventsMachine({
                        type: 'SORT_BY_TIMESTAMP',
                        sortCriteria: 'ASC',
                      });
                    }}
                  />
                </Box>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {finalEvents.map((event, i) => {
              return <EventRow event={event} key={i} />;
            })}
          </Tbody>
        </Table>
      </Box>
      <NewEvent
        onSend={(event) => send({ type: 'SERVICE.SEND', event })}
        nextEvents={nextEvents}
      />
    </Box>
  );
};

const EventRow: React.FC<{ event: SimEvent }> = ({ event }) => {
  const [show, setShow] = useState(false);

  return (
    <>
      <Tr cursor="pointer" onClick={() => setShow(!show)}>
        <Td>
          {show ? <ChevronDownIcon /> : <ChevronRightIcon />}
          {event.name}
        </Td>
        <Td color="gray.500" textAlign="right">
          <EventConnection event={event} />
        </Td>
        <Td color="gray.500">{format(event.timestamp, 'H:mm:ss')}</Td>
      </Tr>
      {show ? (
        <Tr>
          <Td colSpan={3}>
            <JSONView src={event.data} />
          </Td>
        </Tr>
      ) : null}
    </>
  );
};

const newEventModel = createModel(
  {
    eventString: `{\n\t"type": ""\n}`,
  },
  {
    events: {
      'EVENT.PAYLOAD': (value: string) => ({ value }),
      'EVENT.SEND': () => ({}),
      'EVENT.RESET': () => ({}),
    },
  },
);

const newEventMachine = newEventModel.createMachine({
  type: 'parallel',
  states: {
    validity: {
      initial: 'invalid',
      states: {
        invalid: {},
        valid: {
          tags: 'valid',
        },
      },
      on: {
        '*': [
          {
            cond: (ctx) => {
              try {
                const eventObject = JSON.parse(ctx.eventString);
                return typeof eventObject.type === 'string';
              } catch (e) {
                return false;
              }
            },
            target: '.valid',
          },
          { target: '.invalid' },
        ],
      },
    },
    editing: {
      on: {
        'EVENT.PAYLOAD': {
          actions: assign({ eventString: (_, e) => e.value }),
        },
        'EVENT.SEND': {
          actions: ['sendEvent', send('EVENT.RESET')],
        },
        'EVENT.RESET': {
          actions: newEventModel.reset(),
        },
      },
    },
  },
});

const NewEvent: React.FC<{
  onSend: (scxmlEvent: SCXML.Event<any>) => void;
  nextEvents?: string[];
}> = ({ onSend, nextEvents }) => {
  const [state, send] = useMachine(newEventMachine, {
    actions: {
      sendEvent: (ctx) => {
        try {
          const scxmlEvent = toSCXMLEvent(JSON.parse(ctx.eventString));

          onSend(scxmlEvent);
        } catch (e) {
          console.error(e);
        }
      },
    },
  });

  return (
    <Box
      display="flex"
      flexDirection="row"
      css={{
        gap: '.5rem', // TODO: source from Chakra
      }}
    >
      <Popover>
        {({ onClose }) => (
          <>
            <PopoverTrigger>
              <Button variant="outline">Send event</Button>
            </PopoverTrigger>
            <Portal>
              <PopoverContent>
                <PopoverArrow />
                <PopoverHeader
                  display="flex"
                  flexWrap="wrap"
                  css={{
                    gap: '.5rem',
                  }}
                >
                  {nextEvents &&
                    nextEvents.map((nextEvent) => (
                      <Button
                        key={nextEvent}
                        size="xs"
                        colorScheme="blue"
                        onClick={() =>
                          send(
                            newEventModel.events['EVENT.PAYLOAD'](
                              `{\n\t"type": "${nextEvent}"\n}`,
                            ),
                          )
                        }
                      >
                        {nextEvent}
                      </Button>
                    ))}
                </PopoverHeader>
                <PopoverBody bg="gray.800">
                  <Editor
                    language="json"
                    options={{
                      minimap: { enabled: false },
                      lineNumbers: 'off',
                      tabSize: 2,
                    }}
                    height="150px"
                    width="auto"
                    value={state.context.eventString}
                    onChange={(text) => {
                      text && send(newEventModel.events['EVENT.PAYLOAD'](text));
                    }}
                  />
                </PopoverBody>
                <PopoverFooter display="flex" justifyContent="flex-end">
                  <ButtonGroup spacing={2}>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        send(newEventModel.events['EVENT.RESET']());
                        onClose();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!state.hasTag('valid')}
                      onClick={() => {
                        send(newEventModel.events['EVENT.SEND']());
                        onClose();
                      }}
                    >
                      Send
                    </Button>
                  </ButtonGroup>
                </PopoverFooter>
              </PopoverContent>
            </Portal>
          </>
        )}
      </Popover>
    </Box>
  );
};
