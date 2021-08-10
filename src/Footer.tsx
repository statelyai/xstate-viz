import { Box } from '@chakra-ui/layout';
import { useActor } from '@xstate/react';
import React from 'react';
import { useSimulation } from './SimulationContext';

export const Footer: React.FC = () => {
  const sim = useSimulation();
  const [state] = useActor(sim);

  return (
    <Box padding="8" background="black" gridArea="footer">
      {JSON.stringify(state.value)}
    </Box>
  );
};
