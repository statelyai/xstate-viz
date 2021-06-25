import {
  UnorderedList,
  ListItem,
  HStack,
  Text,
  Tag,
  Accordion,
  AccordionPanel,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  Box,
  Input,
} from '@chakra-ui/react';
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
          {event.origin} {'->'}{' '}
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
    <div>
      <Input placeholder="Filter events" marginBottom="2" />

      <table width="100%">
        <tbody>
          {events.map((event, i) => {
            return (
              <>
                <tr>
                  <td>{event.name}</td>
                  <td>
                    <EventConnection event={event} />
                  </td>
                  <td>{format(event.timestamp, 'hh:mm:ss')}</td>
                </tr>
                <tr>
                  <td colSpan={3}>
                    <ReactJson src={event.data} theme="monokai" />
                  </td>
                </tr>
              </>
            );
          })}
        </tbody>
      </table>
      {/* <UnorderedList listStyleType="none" margin="0">
        {state.context.events.map((event, i) => {
          return (
            <ListItem
              key={i}
              padding="2"
              opacity={event.origin === state.context.service ? 1 : 0.5}
            >
              <HStack spacing="4">
                <Tag>{event.sessionId}</Tag>
                <Text as="strong">{event.name}</Text>
                {event.origin && <em>from {event.origin}</em>}
              </HStack>
            </ListItem>
          );
        })}
      </UnorderedList> */}
      <ul></ul>
    </div>
  );
};
