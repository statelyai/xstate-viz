import { Text, Box, Input, Table, Tbody, Tr, Td } from '@chakra-ui/react';
import { useService } from '@xstate/react';
import React, { useMemo } from 'react';
import ReactJson from 'react-json-view';
import { useSimulation } from './SimulationContext';
import { format } from 'date-fns';
import { SimEvent } from './simulationMachine';

const EventConnection: React.FC<{ event: SimEvent }> = ({ event }) => {
  return (
    <Box display="flex" flexDirection="row" gap="1ch">
      {event.origin && (
        <Text whiteSpace="nowrap">
          {event.origin} →{'\u00A0'}
        </Text>
      )}
      <Text whiteSpace="nowrap">{event.sessionId}</Text>
    </Box>
  );
};

export const EventsPanel: React.FC = () => {
  const [state] = useService(useSimulation());
  const events = useMemo(() => {
    return state.context.events.filter((event) => event.name !== 'xstate.init');
  }, [state]);

  return (
    <Box display="grid" gridTemplateRows="auto 1fr" gridRowGap="2">
      <Box>
        <Input placeholder="Filter events" />
      </Box>
      <Box overflowY="auto">
        <Table width="100%">
          <Tbody>
            {events.map((event, i) => {
              return (
                <>
                  <Tr>
                    <Td>{event.name}</Td>
                    <Td color="gray.500">
                      <EventConnection event={event} />
                    </Td>
                    <Td color="gray.500">
                      {format(event.timestamp, 'hh:mm:ss')}
                    </Td>
                  </Tr>
                  <Tr>
                    <Td colSpan={3}>
                      <ReactJson src={event.data} theme="monokai" />
                    </Td>
                  </Tr>
                </>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};
