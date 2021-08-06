import { AddIcon, MinusIcon, RepeatIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  ButtonGroup,
  ChakraProvider,
  HStack,
  IconButton,
  Text,
} from '@chakra-ui/react';
import { useSelector } from '@xstate/react';
import React, { useMemo } from 'react';
import { CanvasContainer } from './CanvasContainer';
import { useCanvas } from './CanvasContext';
import {
  getShouldEnableZoomInButton,
  getShouldEnableZoomOutButton,
} from './canvasMachine';
import { toDirectedGraph } from './directedGraph';
import { Graph } from './Graph';
import { useSimulation, useSimulationMode } from './SimulationContext';
import { theme } from './theme';
import { CanvasPanelHeader } from './CanvasPanelHeader';

export const CanvasPanel: React.FC = () => {
  const simService = useSimulation();
  const canvasService = useCanvas();
  const machine = useSelector(simService, (state) => {
    return state.context.currentSessionId
      ? state.context.serviceDataMap[state.context.currentSessionId!]?.machine
      : undefined;
  });
  const digraph = useMemo(
    () => (machine ? toDirectedGraph(machine) : undefined),
    [machine],
  );

  const shouldEnableZoomOutButton = useSelector(
    canvasService,
    getShouldEnableZoomOutButton,
  );

  const shouldEnableZoomInButton = useSelector(
    canvasService,
    getShouldEnableZoomInButton,
  );

  const simulationMode = useSimulationMode();

  return (
    <ChakraProvider theme={theme}>
      <Box display="grid" gridTemplateRows="3rem 1fr">
        <HStack bg="gray.800" justifyContent="space-between" zIndex={1}>
          <CanvasPanelHeader />
        </HStack>
        <CanvasContainer>
          {digraph ? (
            <Graph digraph={digraph} />
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              padding="8"
            >
              <Text textAlign="center">
                No machines to display yet...
                <br />
                Create one!
              </Text>
            </Box>
          )}
        </CanvasContainer>
        <HStack position="absolute" bottom={0} left={0} padding="2" zIndex={1}>
          <ButtonGroup size="sm" spacing={2} isAttached>
            <IconButton
              aria-label="Zoom out"
              title="Zoom out"
              icon={<MinusIcon />}
              disabled={!shouldEnableZoomOutButton}
              onClick={() => canvasService.send('ZOOM.OUT')}
              variant="secondary"
            />
            <IconButton
              aria-label="Zoom in"
              title="Zoom in"
              icon={<AddIcon />}
              disabled={!shouldEnableZoomInButton}
              onClick={() => canvasService.send('ZOOM.IN')}
              variant="secondary"
            />
            <IconButton
              aria-label="Reset canvas"
              title="Reset canvas"
              icon={<RepeatIcon />}
              onClick={() => canvasService.send('POSITION.RESET')}
              variant="secondary"
            />
          </ButtonGroup>
          {simulationMode === 'visualizing' && (
            <Button
              size="sm"
              margin={2}
              onClick={() => simService.send('MACHINES.RESET')}
              variant="secondary"
            >
              RESET
            </Button>
          )}
        </HStack>
      </Box>
    </ChakraProvider>
  );
};
