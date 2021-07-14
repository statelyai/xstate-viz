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
} from '@chakra-ui/react';
import { useActor, useMachine } from '@xstate/react';
import React, { useMemo, useState } from 'react';
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
      {event.origin && <Text whiteSpace="nowrap">{event.origin} →&nbsp;</Text>}
      <Text whiteSpace="nowrap">{event.sessionId}</Text>
    </Box>
  );
};

const eventCreatorModel = createModel(
  {
    value: {
      type: '',
    } as { type: string; [key: string]: any },
  },
  {
    events: {
      update: (value: { [key: string]: any }) => ({ value }),
    },
  },
);

const eventCreatorMachine = eventCreatorModel.createMachine({
  on: {
    update: {
      actions: eventCreatorModel.assign({
        value: (ctx, e) => {
          return { ...ctx.value, ...e.value };
        },
      }),
    },
  },
});

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
            <NewEventRow
              onSend={(event) => send({ type: 'SERVICE.SEND', event })}
            />
            {events.map((event, i) => {
              return <EventRow event={event} filter={filter} key={i} />;
            })}
          </Tbody>
        </Table>
      </Box>
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

const NewEventRow: React.FC<{
  onSend: (scxmlEvent: SCXML.Event<any>) => void;
}> = ({ onSend }) => {
  const [show, setShow] = useState(false);
  const [text, setText] = useState('');

  return (
    <>
      <Tr>
        <Td>
          <Input onChange={(e) => setText(e.target.value)} />
          <Button onClick={() => setShow(true)}>Add payload</Button>
          <Button onClick={() => onSend(toSCXMLEvent({ type: text }))}>
            Send
          </Button>
        </Td>
        <Td color="gray.500" textAlign="right"></Td>
        <Td color="gray.500"></Td>
      </Tr>
      {show && (
        <Tr>
          <Td colSpan={3}>
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
              defaultValue={text}
              onChange={(text) => {
                if (text) {
                  setText(text);
                }
              }}
            />
          </Td>
        </Tr>
      )}
    </>
  );
};
