import React from 'react';
import { useSelector } from '@xstate/react';
import { StateFrom } from 'xstate';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
} from '@chakra-ui/react';
import { useSimulation } from './SimulationContext';
import { simulationMachine } from './simulationMachine';
import { JSONView } from './JSONView';

const selectState = (state: StateFrom<typeof simulationMachine>) =>
  state.context.currentSessionId
    ? state.context.serviceDataMap[state.context.currentSessionId]?.state
    : undefined; // TODO: select() method on model

const ActorState: React.FC<{ state: any }> = ({ state }) => {
  const value = state?.value;
  const context = state?.context;
  return (
    <Box data-testid="state-panel">
      <JSONView
        src={typeof value === 'string' ? { _: value } : value}
        name="Value"
      />
      <JSONView src={context} name="Context" />
      <JSONView src={state} name="State" />
    </Box>
  );
};

const StateAccordion: React.FC<{ state: any; title: string }> = ({
  state,
  title,
}) => {
  return (
    <Accordion allowMultiple={true} allowToggle={true}>
      <AccordionItem>
        <AccordionButton>
          <AccordionIcon />
          {title}
        </AccordionButton>
        <AccordionPanel>
          <ActorState state={state} />
          {state &&
            'children' in state &&
            Object.keys(state.children).map((key) => {
              const child = state.children[key];
              return (
                <StateAccordion
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

export const StatePanel: React.FC = () => {
  const state = useSelector(useSimulation(), selectState);

  return <ActorState state={state} />;
};
