import {
  AddIcon,
  MinusIcon,
  RepeatIcon,
  QuestionOutlineIcon,
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
  Text,
  VStack,
} from '@chakra-ui/react';
import { useSelector } from '@xstate/react';
import xstatePkgJson from 'xstate/package.json';
import React, { useMemo } from 'react';
import { CanvasContainer } from './CanvasContainer';
import { useCanvas } from './CanvasContext';
import { canZoom, canZoomIn, canZoomOut } from './canvasMachine';
import { toDirectedGraph } from './directedGraph';
import { Graph } from './Graph';
import { useSimulation, useSimulationMode } from './SimulationContext';
import { CanvasHeader } from './CanvasHeader';
import { Overlay } from './Overlay';
import { useEmbed } from './embedContext';
import { CompressIcon, HandIcon } from './Icons';
import { useSourceActor } from './sourceMachine';
import { WelcomeArea } from './WelcomeArea';

export const CanvasView: React.FC = () => {
  // TODO: refactor this so an event can be explicitly sent to a machine
  // it isn't straightforward to do at the moment cause the target machine lives in a child component
  const [panModeEnabled, setPanModeEnabled] = React.useState(false);
  const embed = useEmbed();
  const simService = useSimulation();
  const canvasService = useCanvas();
  const [sourceState] = useSourceActor();
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

  const shouldEnableZoomOutButton = useSelector(
    canvasService,
    (state) => canZoom(embed) && canZoomOut(state.context),
  );

  const shouldEnableZoomInButton = useSelector(
    canvasService,
    (state) => canZoom(embed) && canZoomIn(state.context),
  );

  const simulationMode = useSimulationMode();

  const canShowWelcomeMessage = sourceState.hasTag('canShowWelcomeMessage');

  const showControls = useMemo(
    () => !embed?.isEmbedded || embed.controls,
    [embed],
  );

  const showZoomButtonsInEmbed = useMemo(
    () => !embed?.isEmbedded || (embed.controls && embed.zoom),
    [embed],
  );
  const showPanButtonInEmbed = useMemo(
    () => !embed?.isEmbedded || (embed.controls && embed.pan),
    [embed],
  );

  return (
    <Box
      display="grid"
      height="100%"
      {...(!embed?.isEmbedded && { gridTemplateRows: '3rem 1fr auto' })}
    >
      {!embed?.isEmbedded && (
        <Box data-testid="canvas-header" bg="gray.800" zIndex={1} padding="0">
          <CanvasHeader />
          <Box
            bg="blue.600"
            px="1"
            py="2"
            color="white"
            textAlign="center"
            fontWeight="600"
          >
            <Text>
              ✨ Our{' '}
              <Link
                href="https://stately.ai/editor?source=viz-banner"
                target="_blank"
                color="blue.50"
                textDecoration="underline"
                className="plausible-event-name=viz+editor-banner"
              >
                new Stately visual editor
              </Link>{' '}
              is out now! ✨
            </Text>
          </Box>
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
        {isEmpty && canShowWelcomeMessage && <WelcomeArea />}
      </CanvasContainer>

      {showControls && (
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
            {showZoomButtonsInEmbed && (
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
            {!embed?.isEmbedded && (
              <IconButton
                aria-label="Reset canvas"
                title="Reset canvas"
                icon={<RepeatIcon />}
                onClick={() => canvasService.send('POSITION.RESET')}
                variant="secondary"
              />
            )}
          </ButtonGroup>
          {showPanButtonInEmbed && (
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
          {!embed?.isEmbedded && (
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
