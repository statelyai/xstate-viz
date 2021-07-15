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
  PopoverHeader,
  PopoverTrigger,
  Portal,
  PopoverFooter,
  ButtonGroup,
} from '@chakra-ui/react';
import { useActor } from '@xstate/react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import ReactJson from 'react-json-view';
import { useSimulation } from './SimulationContext';
import { format } from 'date-fns';
import { SimEvent } from './simulationMachine';
import { toSCXMLEvent } from 'xstate/lib/utils';
import { SCXML } from 'xstate';
import { createModel } from 'xstate/lib/model';
import Editor from '@monaco-editor/react';

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

export const EventsPanel: React.FC = () => {
  const [state, send] = useActor(useSimulation());
  const events = useMemo(() => {
    return state.context.events.filter((event) => event.name !== 'xstate.init');
  }, [state]);
  const [filter, setFilter] = useState('');

  return (
    <Box
      display="grid"
      gridTemplateRows="auto 1fr auto"
      gridRowGap="2"
      height="100%"
    >
      <Box>
        <Input
          placeholder="Filter events"
          onChange={(e) => setFilter(e.target.value)}
        />
      </Box>
      <Box overflowY="auto">
        <Table width="100%">
          <Thead>
            <Tr>
              <Th width="100%">Event type</Th>
              <Th>To</Th>
              <Th>Time</Th>
            </Tr>
          </Thead>
          <Tbody>
            {events.map((event, i) => {
              return <EventRow event={event} filter={filter} key={i} />;
            })}
          </Tbody>
        </Table>
      </Box>
      <NewEvent onSend={(event) => send({ type: 'SERVICE.SEND', event })} />
    </Box>
  );
};

const EventRow: React.FC<{ event: SimEvent; filter: string }> = ({
  event,
  filter,
}) => {
  const matchesFilter = event.name.toUpperCase().includes(filter.toUpperCase());
  const [show, setShow] = useState(false);

  return (
    <>
      <Tr hidden={!matchesFilter || undefined}>
        <Td onClick={() => setShow(!show)}>{event.name}</Td>
        <Td color="gray.500" textAlign="right">
          <EventConnection event={event} />
        </Td>
        <Td color="gray.500">{format(event.timestamp, 'hh:mm:ss')}</Td>
      </Tr>
      {matchesFilter && show ? (
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
                        if (text) {
                          setEditorValue(text);
                        }
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
