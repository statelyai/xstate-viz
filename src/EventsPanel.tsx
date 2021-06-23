import { UnorderedList, ListItem, HStack, Text, Tag } from '@chakra-ui/react';
import { useService } from '@xstate/react';
import React from 'react';
import { useSimulation } from './SimulationContext';

export const EventsPanel: React.FC = () => {
  const [state] = useService(useSimulation());

  return (
    <div>
      <UnorderedList listStyleType="none" margin="0">
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
      </UnorderedList>
      <ul></ul>
    </div>
  );
};
