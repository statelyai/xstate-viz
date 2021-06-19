import React, { useCallback, useMemo } from 'react';
import { useSelector } from '@xstate/react';
import { useSimulation } from './useSimulation';
import { State } from 'xstate';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Button,
  Box,
} from '@chakra-ui/react';
import { AnyStateMachine } from './types';

const selectState = (state: any) => state.context.state as State<any, any>; // TODO: select() method on model
const selectMachines = (state: any) =>
  state.context.machines as AnyStateMachine[];

const ActorDetails: React.FC<{ state: any; title: string }> = ({
  state,
  title,
}) => {
  const sim = useSimulation();

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
  const state = useSelector(useSimulation(), selectState);

  return <ActorDetails state={state} title={state._sessionid!} />;
};
