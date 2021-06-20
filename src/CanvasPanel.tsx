import { DirectedGraphNode } from './directedGraph';
import React from 'react';
import { CanvasContainer } from './CanvasContainer';
import { Graph } from './Graph';
import { useInterpret } from '@xstate/react';
import { canvasMachine } from './canvasMachine';
import { MinusIcon, AddIcon, RepeatIcon } from '@chakra-ui/icons';
import { ChakraProvider, ButtonGroup, IconButton, Box } from '@chakra-ui/react';
import { theme } from './theme';

import { CanvasProvider } from './CanvasContext';
import { useSimulation } from './SimulationContext';

export const CanvasPanel: React.FC<{ digraph: DirectedGraphNode }> = ({
  digraph,
}) => {
  const canvasService = useInterpret(canvasMachine);
  const simService = useSimulation();

  return (
    <Box>
      <CanvasProvider value={canvasService}>
        <Box zIndex={1} bg="black">
          <ChakraProvider theme={theme}>
            <ButtonGroup size="sm" spacing={2} padding={2}>
              <IconButton
                aria-label="Zoom out"
                title="Zoom out"
                icon={<MinusIcon />}
                onClick={() => canvasService.send('ZOOM.OUT')}
              />
              <IconButton
                aria-label="Zoom in"
                title="Zoom in"
                icon={<AddIcon />}
                onClick={() => canvasService.send('ZOOM.IN')}
              />
              <IconButton
                aria-label="Reset"
                title="Reset"
                icon={<RepeatIcon />}
                onClick={() => simService.send('MACHINES.RESET')}
              />
            </ButtonGroup>
          </ChakraProvider>
        </Box>
        <CanvasContainer>
          <Graph digraph={digraph} />
        </CanvasContainer>
      </CanvasProvider>
    </Box>
  );
};
