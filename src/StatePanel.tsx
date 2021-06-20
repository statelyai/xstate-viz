import React from 'react';
import ReactJson from 'react-json-view';
import { useSelector } from '@xstate/react';
import { State } from 'xstate';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { useSimulation } from './SimulationContext';

const selectState = (state: any) => state.context.state as State<any, any>; // TODO: select() method on model

const ActorState: React.FC<{ state: any }> = ({ state }) => {
  return (
    <ReactJson
      src={state}
      theme="monokai"
      collapsed={1}
      onEdit={false}
      displayDataTypes={false}
      displayObjectSize={false}
    />
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
