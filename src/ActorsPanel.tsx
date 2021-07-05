import React from 'react';
import { useSelector } from '@xstate/react';
import { useSimulation } from './SimulationContext';
import { AnyInterpreter } from 'xstate';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Button,
  Box,
  List,
  ListItem,
  ListIcon,
  Text,
  Link,
} from '@chakra-ui/react';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { ServiceRef } from './types';

const selectServices = (state: any) =>
  state.context.services as Record<string, ServiceRef>; // TODO: select() method on model

const ActorDetails: React.FC<{ state: any; title: string }> = ({
  state,
  title,
}) => {
  return (
    <Accordion allowMultiple={true} allowToggle={true}>
      <AccordionItem>
        <AccordionButton>
          <AccordionIcon />
          <Box
            flexGrow={1}
            textAlign="left"
            textOverflow="ellipsis"
            overflow="hidden"
            whiteSpace="nowrap"
            title={title}
          >
            {title}
          </Box>
          <Button
            colorScheme="blue"
            size="xs"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            Button
          </Button>
        </AccordionButton>
        <AccordionPanel>
          {state &&
            'children' in state &&
            Object.keys(state.children).map((key) => {
              const child = state.children[key];
              return (
                <ActorDetails
                  key={key}
                  state={(child as any).getSnapshot()}
                  title={child.id}
                />
              );
            })}
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};

export const ActorsPanel: React.FC = () => {
  const simActor = useSimulation();
  const services = useSelector(simActor, selectServices);
  const currentSessionId = useSelector(simActor, (s) => s.context.service);

  return (
    <List>
      {Object.entries(services).map(([sessionId, service]) => {
        return (
          <ListItem
            key={sessionId}
            display="flex"
            flexDirection="row"
            alignItems="center"
            padding={2}
            borderBottom="1px solid"
            borderBottomColor="gray.500"
            marginTop="0"
            opacity={currentSessionId === sessionId ? 1 : 0.5}
          >
            <ListIcon as={ArrowForwardIcon} />
            <Text flexGrow={1}>
              <Link
                onClick={() => {
                  simActor.send({ type: 'SERVICE.FOCUS', sessionId });
                }}
              >
                {service.id ?? service.machine.id}
              </Link>{' '}
              ({sessionId})
            </Text>
          </ListItem>
        );
      })}
    </List>
  );
};
