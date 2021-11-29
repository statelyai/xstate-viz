import {
  AddIcon,
  MinusIcon,
  QuestionOutlineIcon,
  RepeatIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Spinner,
  VStack,
} from '@chakra-ui/react';
import { useSelector } from '@xstate/react';
import React, { useMemo } from 'react';
import xstatePkgJson from 'xstate/package.json';
import { CanvasContainer } from './CanvasContainer';
import { useCanvas } from './CanvasContext';
import { CanvasHeader } from './CanvasHeader';
import { toDirectedGraph } from './directedGraph';
import { Graph } from './Graph';
import { CompressIcon, HandIcon } from './Icons';
import { Overlay } from './Overlay';
import { useSimulation, useSimulationMode } from './SimulationContext';
import { WelcomeArea } from './WelcomeArea';

export const CanvasView = (props: {
  shouldEnableZoomOutButton?: boolean;
  shouldEnableZoomInButton?: boolean;
  canShowWelcomeMessage?: boolean;
  showControls?: boolean;
  showZoomButtonsInEmbed?: boolean;
  showPanButtonInEmbed?: boolean;
  isEmbedded?: boolean;
  hideHeader: boolean;
}) => {
  // TODO: refactor this so an event can be explicitly sent to a machine
  // it isn't straightforward to do at the moment cause the target machine lives in a child component
  const [panModeEnabled, setPanModeEnabled] = React.useState(false);
  const canvasService = useCanvas();

  const simService = useSimulation();

  const machine = useSelector(simService, (state) => {
    return state.context.currentSessionId
      ? state.context.serviceDataMap[state.context.currentSessionId!]?.machine
      : undefined;
  });

  const simulationMode = useSimulationMode();

  const digraph = useMemo(
    () => (machine ? toDirectedGraph(machine) : undefined),
    [machine],
  );

  const isLayoutPending = useSelector(simService, (state) =>
    state.hasTag('layoutPending'),
  );
  const isEmpty = useSelector(simService, (state) => state.hasTag('empty'));

  return (
    <Box
      display="grid"
      height="100%"
      {...(!props.hideHeader && { gridTemplateRows: '3rem 1fr auto' })}
    >
      {!props.hideHeader && (
        <Box data-testid="canvas-header" bg="gray.800" zIndex={1} padding="0">
          <CanvasHeader />
        </Box>
      )}
      <CanvasContainer panModeEnabled={panModeEnabled}>
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
        {isEmpty && props.canShowWelcomeMessage && <WelcomeArea />}
      </CanvasContainer>

      {props.showControls && (
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
            {props.showZoomButtonsInEmbed && (
              <>
                <IconButton
                  aria-label="Zoom out"
                  title="Zoom out"
                  icon={<MinusIcon />}
                  disabled={!props.shouldEnableZoomOutButton}
                  onClick={() => canvasService.send('ZOOM.OUT')}
                  variant="secondary"
                />
                <IconButton
                  aria-label="Zoom in"
                  title="Zoom in"
                  icon={<AddIcon />}
                  disabled={!props.shouldEnableZoomInButton}
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
            {!props.isEmbedded && (
              <IconButton
                aria-label="Reset canvas"
                title="Reset canvas"
                icon={<RepeatIcon />}
                onClick={() => canvasService.send('POSITION.RESET')}
                variant="secondary"
              />
            )}
          </ButtonGroup>
          {props.showPanButtonInEmbed && (
            <IconButton
              aria-label="Pan mode"
              icon={<HandIcon />}
              size="sm"
              marginLeft={2}
              onClick={() => setPanModeEnabled((v) => !v)}
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
          {!props.isEmbedded && (
            <Menu closeOnSelect={true} placement="top-end">
              <MenuButton
                as={IconButton}
                size="sm"
                isRound
                aria-label="More info"
                marginLeft="auto"
                variant="secondary"
                icon={
                  <QuestionOutlineIcon
                    boxSize={6}
                    css={{ '& circle': { display: 'none' } }}
                  />
                }
              />
              <Portal>
                <MenuList fontSize="sm" padding="0">
                  <MenuItem
                    as={Link}
                    href="https://github.com/statelyai/xstate-viz/issues/new?template=bug_report.md"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Report an issue
                  </MenuItem>
                  <MenuItem
                    as={Link}
                    href="https://github.com/statelyai/xstate"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {`XState version ${xstatePkgJson.version}`}
                  </MenuItem>
                  <MenuItem
                    as={Link}
                    href="https://stately.ai/privacy"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Privacy Policy
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          )}
        </Box>
      )}
    </Box>
  );
};
