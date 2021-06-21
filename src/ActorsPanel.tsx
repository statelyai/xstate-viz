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
} from '@chakra-ui/react';

const selectServices = (state: any) =>
  state.context.services as Record<string, AnyInterpreter>; // TODO: select() method on model

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

  return (
    <ul>
      {Object.entries(services).map(([sessionId, service]) => {
        return (
          <li key={sessionId}>
            <span>{sessionId}</span>
            <Button
              onClick={() => {
                simActor.send({ type: 'SERVICE.FOCUS', sessionId });
              }}
            >
              Focus
            </Button>
          </li>
        );
      })}
    </ul>
  );
};
