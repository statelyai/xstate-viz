import {
  Text,
  Box,
  Input,
  Table,
  Tbody,
  Tr,
  Td,
  Thead,
  Th,
  Button,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Portal,
  PopoverFooter,
  ButtonGroup,
  FormLabel,
  Switch,
} from '@chakra-ui/react';
import { useActor, useMachine } from '@xstate/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactJson from 'react-json-view';
import { useSimulation } from './SimulationContext';
import { format } from 'date-fns';
import { SimEvent } from './simulationMachine';
import { toSCXMLEvent } from 'xstate/lib/utils';
import { SCXML } from 'xstate';
import Editor from '@monaco-editor/react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from '@chakra-ui/icons';
import { createMachine } from 'xstate';
import { createModel } from 'xstate/lib/model';

const EventConnection: React.FC<{ event: SimEvent }> = ({ event }) => {
  return (
    <Box display="inline-flex" flexDirection="row" gap="1ch">
      {event.origin && event.origin !== event.sessionId && (
        <Text whiteSpace="nowrap">{event.origin} →&nbsp;</Text>
      )}
      <Text whiteSpace="nowrap">{event.sessionId}</Text>
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
const eventsMachine = createMachine<typeof eventsModel>({
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
    finalEvents = finalEvents.filter(
      (event) => !event.name.startsWith('xstate.'),
    );
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

export const EventsPanel: React.FC = () => {
  const [state, send] = useActor(useSimulation());
  const rawEvents = state.context!.events;

  const [eventsState, sendToEventsMachine] = useMachine(() =>
    eventsMachine.withContext({
      ...eventsModel.initialContext,
      rawEvents: rawEvents,
    }),
  );

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
                  <Button
                    variant="unstyled"
                    size="xs"
                    title="sort by timestamp descending"
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
                  >
                    <ChevronUpIcon />
                  </Button>
                  <Button
                    variant="unstyled"
                    size="xs"
                    title="sort by timestamp ascending"
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
                  >
                    <ChevronDownIcon />
                  </Button>
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
      <NewEvent onSend={(event) => send({ type: 'SERVICE.SEND', event })} />
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
        <Td color="gray.500">{format(event.timestamp, 'hh:mm:ss')}</Td>
      </Tr>
      {show ? (
        <Tr>
          <Td colSpan={3}>
            <ReactJson src={event.data} theme="monokai" />
          </Td>
        </Tr>
      ) : null}
    </>
  );
};

const NewEvent: React.FC<{
  onSend: (scxmlEvent: SCXML.Event<any>) => void;
}> = ({ onSend }) => {
  const [editorValue, setEditorValue] = useState('');

  const sendEvent = useCallback(
    (eventJSONString: string) => {
      try {
        const scxmlEvent = toSCXMLEvent(JSON.parse(eventJSONString));

        onSend(scxmlEvent);
      } catch (e) {
        console.error(e);
      }
    },
    [onSend],
  );

  return (
    <Box
      display="flex"
      flexDirection="row"
      css={{
        gap: '.5rem',
      }}
    >
      <Input
        onChange={(e) => {
          setEditorValue(`{\n\t"type": "${e.target.value}"\n}`);
        }}
        placeholder="New event"
      />
      <ButtonGroup isAttached>
        <Popover>
          {({ onClose }) => (
            <>
              <PopoverTrigger>
                <Button variant="outline">Add payload</Button>
              </PopoverTrigger>
              <Portal>
                <PopoverContent>
                  <PopoverArrow />
                  <PopoverCloseButton />
                  <PopoverBody>
                    <Editor
                      language="json"
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        lineNumbers: 'off',
                        tabSize: 2,
                      }}
                      height="150px"
                      width="auto"
                      value={editorValue}
                      onChange={(text) => {
                        text !== undefined && setEditorValue(text);
                      }}
                    />
                  </PopoverBody>
                  <PopoverFooter>
                    <Button
                      onClick={() => {
                        sendEvent(editorValue);
                        onClose();
                      }}
                    >
                      Send
                    </Button>
                  </PopoverFooter>
                </PopoverContent>
              </Portal>
            </>
          )}
        </Popover>
        <Button onClick={() => sendEvent(editorValue)}>Send</Button>
      </ButtonGroup>
    </Box>
  );
};
