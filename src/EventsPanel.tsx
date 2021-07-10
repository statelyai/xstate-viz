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
} from '@chakra-ui/react';
import { useActor } from '@xstate/react';
import React, { useMemo, useState } from 'react';
import ReactJson from 'react-json-view';
import { useSimulation } from './SimulationContext';
import { format } from 'date-fns';
import { SimEvent } from './simulationMachine';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';

const EventConnection: React.FC<{ event: SimEvent }> = ({ event }) => {
  return (
    <Box display="inline-flex" flexDirection="row" gap="1ch">
      {event.origin && <Text whiteSpace="nowrap">{event.origin} →&nbsp;</Text>}
      <Text whiteSpace="nowrap">{event.sessionId}</Text>
    </Box>
  );
};

// To keep the table header sticky, the trick is to make all `th` elements sticky
const stickyProps = {
  position: 'sticky' as any,
  top: 0,
  backgroundColor: 'var(--chakra-colors-gray-800)',
  zIndex: 1,
};

export const EventsPanel: React.FC = () => {
  const [state] = useActor(useSimulation());
  const events = useMemo(() => {
    return state.context.events.filter((event) => event.name !== 'xstate.init');
  }, [state]);
  const [filter, setFilter] = useState('');

  return (
    <Box
      display="grid"
      gridTemplateRows="auto 1fr"
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
              <Th {...stickyProps} width="100%">
                Event type
              </Th>
              <Th {...stickyProps}>To</Th>
              <Th {...stickyProps}>Time</Th>
            </Tr>
          </Thead>
          <Tbody>
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
  console.log(event);
  const matchesFilter = event.name.toUpperCase().includes(filter.toUpperCase());
  const [show, setShow] = useState(false);

  return (
    <>
      <Tr
        hidden={!matchesFilter || undefined}
        cursor="pointer"
        onClick={() => setShow(!show)}
      >
        <Td>
          {show ? <ChevronDownIcon /> : <ChevronRightIcon />}
          {event.name}
        </Td>
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
