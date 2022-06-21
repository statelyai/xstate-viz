import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Tab,
  TabPanel,
  TabPanelProps,
  TabProps,
} from '@chakra-ui/react';
import { useSelector } from '@xstate/react';
import React from 'react';
import { StateFrom } from 'xstate';
import { JSONView } from '../JSONView';
import { useSimulation } from '../SimulationContext';
import { simulationMachine } from '../simulationMachine';

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

const StatePanel: React.FC = () => {
  const state = useSelector(useSimulation(), selectState);

  return <ActorState state={state} />;
};

export const StateTab = {
  Tab: (props: TabProps) => <Tab {...props}>State</Tab>,
  TabPanel: (props: TabPanelProps) => (
    <TabPanel {...props} height="100%" overflowY="auto">
      <StatePanel />
    </TabPanel>
  ),
};
