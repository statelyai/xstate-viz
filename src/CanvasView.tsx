import { AddIcon, MinusIcon, RepeatIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Spinner,
  VStack,
} from '@chakra-ui/react';
import { useSelector } from '@xstate/react';
import React, { useMemo } from 'react';
import { CanvasContainer } from './CanvasContainer';
import { useCanvas } from './CanvasContext';
import {
  CanvasDragProvider,
  useCanvasDrag,
  useIsPanModeEnabled,
} from './CanvasDragContext';
import { canZoomIn, canZoomOut } from './canvasMachine';
import { toDirectedGraph } from './directedGraph';
import { Graph } from './Graph';
import { CompressIcon, HandIcon } from './Icons';
import { Overlay } from './Overlay';
import { useSimulation, useSimulationMode } from './SimulationContext';

const CanvasControlButtons = ({
  zoomable,
  pannable,
  AdditionalMenu,
}: {
  pannable: boolean;
  zoomable: boolean;
  AdditionalMenu?: React.ReactNode;
}) => {
  const canvasService = useCanvas();

  const shouldEnableZoomOutButton = useSelector(canvasService, (state) =>
    canZoomOut(state.context),
  );
  const shouldEnableZoomInButton = useSelector(canvasService, (state) =>
    canZoomIn(state.context),
  );

  const canvasDragService = useCanvasDrag();
  const panModeEnabled = useIsPanModeEnabled();

  const simService = useSimulation();
  const simulationMode = useSimulationMode();

  return (
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
      data-testid="controls"
    >
      <ButtonGroup size="sm" spacing={2} isAttached>
        {zoomable && (
          <>
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
          </>
        )}
        <IconButton
          aria-label="Fit to content"
          title="Fit to content"
          icon={<CompressIcon />}
          onClick={() => canvasService.send('FIT_TO_CONTENT')}
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
      {pannable && (
        <IconButton
          aria-label="Pan mode"
          icon={<HandIcon />}
          size="sm"
          marginLeft={2}
          onClick={() => {
            if (panModeEnabled) {
              canvasDragService.send({ type: 'ENABLE_PAN_MODE' });
            } else {
              canvasDragService.send({ type: 'DISABLE_PAN_MODE' });
            }
          }}
          aria-pressed={panModeEnabled}
          variant={panModeEnabled ? 'secondaryPressed' : 'secondary'}
        />
      )}
      {simulationMode === 'visualizing' && (
        <Button
          size="sm"
          marginLeft={2}
          onClick={() => simService.send('MACHINES.RESET')}
          variant="secondary"
        >
          RESET
        </Button>
      )}
      {AdditionalMenu}
    </Box>
  );
};

export const CanvasView = ({
  pannable = true,
  zoomable = true,
  showControls = true,
  Empty,
  Header = null,
  ControlsAdditionalMenu,
}: {
  showControls?: boolean;
  pannable?: boolean;
  zoomable?: boolean;
  Empty: React.ReactNode;
  Header?: React.ReactNode;
  ControlsAdditionalMenu?: React.ReactNode;
}) => {
  const simService = useSimulation();
  const machine = useSelector(simService, (state) => {
    return state.context.currentSessionId
      ? state.context.serviceDataMap[state.context.currentSessionId!]?.machine
      : undefined;
  });
  const isLayoutPending = useSelector(simService, (state) =>
    state.hasTag('layoutPending'),
  );
  const isEmpty = useSelector(simService, (state) => state.hasTag('empty'));
  const digraph = useMemo(
    () => (machine ? toDirectedGraph(machine) : undefined),
    [machine],
  );

  return (
    <CanvasDragProvider pannable={pannable}>
      <Box
        display="grid"
        height="100%"
        gridTemplateRows={Header ? 'auto 1fr' : '1fr'}
      >
        {Header}
        <CanvasContainer pannable={pannable} zoomable={zoomable}>
          {digraph && <Graph digraph={digraph} />}
          {isLayoutPending && (
            <Overlay>
              <Box textAlign="center">
                <VStack spacing="4">
                  <Spinner size="xl" />
                  <Box>Visualizing machine...</Box>
                </VStack>
              </Box>
            </Overlay>
          )}
          {isEmpty && Empty}
        </CanvasContainer>
        {showControls && (
          <CanvasControlButtons
            pannable={pannable}
            zoomable={zoomable}
            AdditionalMenu={ControlsAdditionalMenu}
          />
        )}
      </Box>
    </CanvasDragProvider>
  );
};
