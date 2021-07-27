import { AddIcon, MinusIcon, RepeatIcon } from '@chakra-ui/icons';
import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  ChakraProvider,
  HStack,
  IconButton,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useSelector } from '@xstate/react';
import React from 'react';
import { getLoggedInUserData, useAuth } from './authContext';
import { CanvasContainer } from './CanvasContainer';
import { useCanvas } from './CanvasContext';
import {
  getShouldEnableZoomInButton,
  getShouldEnableZoomOutButton,
} from './canvasMachine';
import { DirectedGraphNode } from './directedGraph';
import { Graph } from './Graph';
import { registryLinks } from './registryLinks';
import { useSimulation } from './SimulationContext';
import { useSourceActor } from './sourceMachine';
import { theme } from './theme';

const ButtonSeparator = () => (
  <Box backgroundColor="gray.700" width={0.5} height="60%" marginX={2} />
);

export const CanvasPanel: React.FC<{
  digraph: DirectedGraphNode;
}> = ({ digraph }) => {
  const simService = useSimulation();
  const canvasService = useCanvas();
  const authService = useAuth();

  const [sourceState] = useSourceActor(authService);

  const loggedInUserData = useSelector(authService, getLoggedInUserData);

  const userOwnsSource =
    loggedInUserData?.id === sourceState.context.sourceRegistryData?.owner?.id;

  const shouldEnableZoomOutButton = useSelector(
    canvasService,
    getShouldEnableZoomOutButton,
  );

  const shouldEnableZoomInButton = useSelector(
    canvasService,
    getShouldEnableZoomInButton,
  );

  return (
    <Box display="grid" gridTemplateRows="auto 1fr">
      <ChakraProvider theme={theme}>
        <HStack bg="black" justifyContent="space-between">
          <Box zIndex={1} display="flex" alignItems="center">
            <ButtonGroup size="sm" spacing={2} padding={2}>
              <IconButton
                aria-label="Zoom out"
                title="Zoom out"
                icon={<MinusIcon />}
                disabled={!shouldEnableZoomOutButton}
                onClick={() => canvasService.send('ZOOM.OUT')}
              />
              <IconButton
                aria-label="Zoom in"
                title="Zoom in"
                icon={<AddIcon />}
                disabled={!shouldEnableZoomInButton}
                onClick={() => canvasService.send('ZOOM.IN')}
              />
              <IconButton
                aria-label="Reset canvas"
                title="Reset canvas"
                icon={<RepeatIcon />}
                onClick={() => canvasService.send('POSITION.RESET')}
              />
            </ButtonGroup>
            <ButtonSeparator />
            <Button
              size="sm"
              margin={2}
              onClick={() => simService.send('MACHINES.RESET')}
            >
              RESET
            </Button>
          </Box>
          {sourceState.context.sourceRegistryData && (
            <Stack direction="row" spacing="3" alignItems="center" pr="4">
              <Text fontWeight="medium" fontSize="sm" color="gray.100">
                {sourceState.context.sourceRegistryData?.name ||
                  'Unnamed Source'}
              </Text>
              {sourceState.context.sourceRegistryData?.owner &&
                !userOwnsSource && (
                  <Link
                    href={registryLinks.viewUserById(
                      sourceState.context.sourceRegistryData?.owner?.id,
                    )}
                  >
                    <Avatar
                      src={
                        sourceState.context.sourceRegistryData.owner
                          ?.avatarUrl || ''
                      }
                      name={
                        sourceState.context.sourceRegistryData.owner
                          ?.displayName || ''
                      }
                      style={{ height: '30px', width: '30px' }}
                    ></Avatar>
                  </Link>
                )}
            </Stack>
          )}
        </HStack>
      </ChakraProvider>
      <CanvasContainer>
        <Graph digraph={digraph} />
      </CanvasContainer>
    </Box>
  );
};
