import { Box } from '@chakra-ui/layout';
import { Text } from '@chakra-ui/react';
import { useActor } from '@xstate/react';
import React from 'react';
import { useSimulation } from './SimulationContext';

export const Footer: React.FC = () => {
  const sim = useSimulation();
  const [state] = useActor(sim);

  return (
    <Box padding="1" paddingInline="2" background="gray.900" gridArea="footer">
      <Text
        fontSize="sm"
        title={JSON.stringify(state.value, null, 2)}
        color="whiteAlpha.800"
      >
        {Array.from(state.tags).join(', ') ?? '&nbsp;'}
      </Text>
    </Box>
  );
};
