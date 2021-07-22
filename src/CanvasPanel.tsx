import { AddIcon, MinusIcon, RepeatIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  ButtonGroup,
  ChakraProvider,
  IconButton,
} from '@chakra-ui/react';
import React from 'react';
import { CanvasContainer } from './CanvasContainer';
import { useCanvas } from './CanvasContext';
import { DirectedGraphNode } from './directedGraph';
import { Graph } from './Graph';
import { useSimulation } from './SimulationContext';
import { theme } from './theme';

export const CanvasPanel: React.FC<{
  digraph: DirectedGraphNode;
}> = ({ digraph }) => {
  const simService = useSimulation();
  const canvasService = useCanvas();

  return (
    <Box display="grid" gridTemplateRows="auto 1fr">
      <Box zIndex={1} bg="black">
        <ChakraProvider theme={theme}>
          <Box display="flex" justifyContent="space-between">
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
                aria-label="Reset canvas"
                title="Reset canvas"
                icon={<RepeatIcon />}
                onClick={() => canvasService.send('POSITION.RESET')}
              />
            </ButtonGroup>
            <Button
              size="sm"
              margin={2}
              onClick={() => simService.send('MACHINES.RESET')}
            >
              {'Reset machine'}
            </Button>
          </Box>
        </ChakraProvider>
      </Box>
      <CanvasContainer>
        <Graph digraph={digraph} />
      </CanvasContainer>
    </Box>
  );
};
