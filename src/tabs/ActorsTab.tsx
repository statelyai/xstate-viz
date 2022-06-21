import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  List,
  ListIcon,
  ListItem,
  Tab,
  TabPanel,
  TabPanelProps,
  TabProps,
  Text,
} from '@chakra-ui/react';
import { useSelector } from '@xstate/react';
import React from 'react';
import { InterpreterStatus, StateFrom } from 'xstate';
import { useSimulation } from '../SimulationContext';
import { simulationMachine } from '../simulationMachine';

const selectServices = (state: StateFrom<typeof simulationMachine>) => {
  return state.context.serviceDataMap;
};

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

const ActorsPanel: React.FC = () => {
  const simActor = useSimulation();
  const services = useSelector(simActor, selectServices);
  const currentSessionId = useSelector(
    simActor,
    (s) => s.context.currentSessionId,
  );

  return (
    <List>
      {Object.entries(services).map(([sessionId, serviceData]) => {
        return (
          <ListItem
            key={sessionId}
            display="flex"
            flexDirection="row"
            alignItems="center"
            padding={2}
            marginTop="0"
            opacity={currentSessionId === sessionId ? 1 : 0.5}
            onClick={() => {
              simActor.send({ type: 'SERVICE.FOCUS', sessionId });
            }}
            background={
              currentSessionId === sessionId ? 'whiteAlpha.200' : 'transparent'
            }
            borderRadius="md"
            _hover={{
              background: 'whiteAlpha.100',
            }}
            marginBottom="2"
            cursor="pointer"
          >
            <ListIcon as={ArrowForwardIcon} />
            <Text
              flexGrow={1}
              textDecoration={
                serviceData?.status === InterpreterStatus.Stopped
                  ? 'line-through'
                  : undefined
              }
              data-testid={`actor:${sessionId}`}
            >
              {serviceData?.parent && services[serviceData!.parent] && (
                <span>
                  {services[serviceData!.parent]!.machine.id} (
                  {serviceData!.parent}) →{' '}
                </span>
              )}
              <strong>{serviceData!.machine.id ?? '(machine)'}</strong> (
              {sessionId})
            </Text>
          </ListItem>
        );
      })}
    </List>
  );
};

export const ActorsTab = {
  Tab: (props: TabProps) => {
    const simService = useSimulation();
    const services = useSelector(simService, selectServices);
    return (
      <Tab {...props}>
        Actors{' '}
        <Badge fontSize="x-small" marginLeft="1" colorScheme="blue">
          {Object.values(services).length}
        </Badge>
      </Tab>
    );
  },
  TabPanel: (props: TabPanelProps) => (
    <TabPanel {...props} height="100%" overflowY="auto">
      <ActorsPanel />
    </TabPanel>
  ),
};
