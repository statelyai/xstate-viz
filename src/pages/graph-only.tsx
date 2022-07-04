import { AddIcon, MinusIcon, RepeatIcon } from '@chakra-ui/icons';
import { Box, ButtonGroup, ChakraProvider, IconButton } from '@chakra-ui/react';
import { useInterpret, useSelector } from '@xstate/react';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo } from 'react';
import { createMachine, StateFrom } from 'xstate';
import { AppHead } from '../AppHead';
import { CanvasContainer } from '../CanvasContainer';
import { CanvasProvider, createCanvasMachineSelector } from '../CanvasContext';
import {
  canvasMachine,
  getShouldEnableZoomInButton,
  getShouldEnableZoomOutButton,
} from '../canvasMachine';
import { toDirectedGraph } from '../directedGraph';
import { Graph } from '../Graph';
import { isOnClientSide } from '../isOnClientSide';
import { SimulationProvider } from '../SimulationContext';
import { simulationMachine } from '../simulationMachine';
import { theme } from '../theme';
import { CompressIcon } from '../Icons';

const getCurrentSimService = (state: StateFrom<typeof simulationMachine>) => {
  if (!state.context.currentSessionId) return;
  return state.context.serviceDataMap[state.context.currentSessionId];
};

const getIsVisualizing = (state: StateFrom<typeof simulationMachine>) => {
  return state.matches('visualizing.ready');
};

const getIsReadyForFitToScreen = (state: StateFrom<typeof canvasMachine>) => {
  return Boolean(state.context.elkGraph);
};

const GraphOnly = () => {
  const router = useRouter();

  const parseResult = useMemo(() => {
    if (!router.query.config) return undefined;
    const config = JSON.parse((router.query.config as string) || '{}');
    const machine = createMachine(config || {});

    return {
      machine,
      digraph: toDirectedGraph(machine),
    };
  }, [Boolean(router.query.config)]);

  const canvasService = useInterpret(canvasMachine);
  const simService = useInterpret(simulationMachine);

  useEffect(() => {
    if (parseResult?.machine) {
      simService.send({
        type: 'MACHINES.REGISTER',
        machines: [parseResult?.machine],
      });
    }
  }, [Boolean(parseResult?.machine)]);

  const shouldEnableZoomOutButton = useSelector(
    canvasService,
    getShouldEnableZoomOutButton,
  );

  const shouldEnableZoomInButton = useSelector(
    canvasService,
    getShouldEnableZoomInButton,
  );

  const currentSimService = useSelector(simService, getCurrentSimService);

  const isReadyForFitToScreen = useSelector(
    canvasService,
    getIsReadyForFitToScreen,
  );

  useEffect(() => {
    if (isReadyForFitToScreen) {
      canvasService.send('FIT_TO_VIEW');
    }
  }, [isReadyForFitToScreen]);

  return (
    <>
      <AppHead
        importElk
        description=""
        title="Hey"
        ogImageUrl=""
        importPrettier={false}
        ogTitle=""
      ></AppHead>
      {isOnClientSide() && parseResult && (
        <ChakraProvider theme={theme}>
          <SimulationProvider value={simService}>
            <Box data-testid="app" data-viz-theme="dark" height="100vh">
              <CanvasProvider value={canvasService}>
                <Box height="100vh" display="grid">
                  <CanvasContainer>
                    <Box display="grid" height="100vh">
                      {parseResult?.digraph && currentSimService && (
                        <Graph digraph={parseResult?.digraph}></Graph>
                      )}
                    </Box>
                  </CanvasContainer>
                  <Box
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="flex-start"
                    position="absolute"
                    bottom={0}
                    left={0}
                    paddingX={2}
                    paddingY={3}
                    zIndex={1}
                    width="100%"
                  >
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
                        aria-label="Fit to view"
                        title="Fit to view"
                        icon={<CompressIcon />}
                        onClick={() => canvasService.send('FIT_TO_VIEW')}
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
                  </Box>
                </Box>
              </CanvasProvider>
            </Box>
          </SimulationProvider>
        </ChakraProvider>
      )}
    </>
  );
};

export default GraphOnly;
