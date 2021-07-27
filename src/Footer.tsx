import { Box, Text } from '@chakra-ui/react';
import { useSelector } from '@xstate/react';
import { useSimulation } from './SimulationContext';
import { SimMode } from './types';

export const Footer = () => {
  const simService = useSimulation();
  const mode: SimMode = useSelector(simService, (state) =>
    state.hasTag('inspecting') ? 'inspecting' : 'visualizing',
  );

  return (
    <Box
      gridArea="footer"
      background={mode === 'inspecting' ? 'orange.500' : 'black'}
      paddingInline="2"
      paddingBlock="1"
    >
      <Text fontSize="sm">
        {mode === 'inspecting' ? 'Inspecting' : 'Visualizing'}
      </Text>
    </Box>
  );
};
