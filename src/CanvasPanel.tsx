import {
  AddIcon,
  MinusIcon,
  RepeatIcon,
  HamburgerIcon,
  EditIcon,
} from '@chakra-ui/icons';
import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  ChakraProvider,
  HStack,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useSelector } from '@xstate/react';
import React, { useMemo } from 'react';
import { useLoggedInUserData, useAuth } from './authContext';
import { CanvasContainer } from './CanvasContainer';
import { useCanvas } from './CanvasContext';
import {
  getShouldEnableZoomInButton,
  getShouldEnableZoomOutButton,
} from './canvasMachine';
import { toDirectedGraph } from './directedGraph';
import { Graph } from './Graph';
import { LikeButton } from './LikeButton';
import { registryLinks } from './registryLinks';
import { ShareButton } from './ShareButton';
import { useSimulation } from './SimulationContext';
import { useSourceActor } from './sourceMachine';
import { theme } from './theme';
import { Logo } from './Logo';

const CanvasHeader: React.FC = () => {
  return (
    <Box zIndex={1} display="flex" alignItems="center" height="3rem">
      <Link
        href="https://github.com/statelyai/xstate"
        title="XState GitHub Repo"
        display="block"
        height="100%"
        _hover={{
          opacity: 0.8,
        }}
        target="_blank"
        rel="noreferrer"
      >
        <Logo
          fill="white"
          style={{
            // @ts-ignore
            '--fill': 'white',
            height: '100%',
            padding: '0 .5rem',
          }}
        />
      </Link>
    </Box>
  );
};

export const CanvasPanel: React.FC = () => {
  const simService = useSimulation();
  const canvasService = useCanvas();
  const authService = useAuth();
  const machine = useSelector(simService, (state) => {
    return state.context.currentSessionId
      ? state.context.serviceDataMap[state.context.currentSessionId!]?.machine
      : undefined;
  });
  const digraph = useMemo(
    () => (machine ? toDirectedGraph(machine) : undefined),
    [machine],
  );

  const [sourceState] = useSourceActor(authService);

  const loggedInUserData = useLoggedInUserData();

  const shouldEnableZoomOutButton = useSelector(
    canvasService,
    getShouldEnableZoomOutButton,
  );

  const shouldEnableZoomInButton = useSelector(
    canvasService,
    getShouldEnableZoomInButton,
  );

  const registryData = sourceState.context.sourceRegistryData;
  const userOwnsSource = loggedInUserData?.id === registryData?.owner?.id;

  return (
    <ChakraProvider theme={theme}>
      <Box display="grid" gridTemplateRows="3rem 1fr">
        <HStack bg="gray.800" justifyContent="space-between" zIndex={1}>
          <CanvasHeader />
          {registryData && (
            <Stack direction="row" spacing="4" alignItems="center" pr="4">
              <Text fontWeight="semibold" fontSize="sm" color="gray.100">
                {registryData?.name || 'Unnamed Source'}
              </Text>
              <HStack>
                <LikeButton />
                <ShareButton />
                <Menu closeOnSelect>
                  <MenuButton>
                    <IconButton
                      aria-label="Menu"
                      icon={<HamburgerIcon />}
                      size="sm"
                    ></IconButton>
                  </MenuButton>
                  <MenuList>
                    {userOwnsSource && sourceState.context.sourceID && (
                      <MenuItem
                        as="a"
                        href={registryLinks.editSourceFile(
                          sourceState.context.sourceID,
                        )}
                      >
                        <HStack spacing="3">
                          <EditIcon />
                          <Text>Edit</Text>
                        </HStack>
                      </MenuItem>
                    )}
                    {registryData.owner && (
                      <MenuItem
                        as="a"
                        href={registryLinks.viewUserById(
                          registryData?.owner?.id,
                        )}
                      >
                        <HStack spacing="3">
                          <Avatar
                            src={registryData.owner?.avatarUrl || ''}
                            name={registryData.owner?.displayName || ''}
                            size="xs"
                            height="24px"
                            width="24px"
                          ></Avatar>
                          <Text>View Author</Text>
                        </HStack>
                      </MenuItem>
                    )}
                  </MenuList>
                </Menu>
              </HStack>
            </Stack>
          )}
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
              variant="canvas"
            />
            <IconButton
              aria-label="Zoom in"
              title="Zoom in"
              icon={<AddIcon />}
              disabled={!shouldEnableZoomInButton}
              onClick={() => canvasService.send('ZOOM.IN')}
              variant="canvas"
            />
            <IconButton
              aria-label="Reset canvas"
              title="Reset canvas"
              icon={<RepeatIcon />}
              onClick={() => canvasService.send('POSITION.RESET')}
              variant="canvas"
            />
          </ButtonGroup>
          <Button
            size="sm"
            margin={2}
            onClick={() => simService.send('MACHINES.RESET')}
            variant="canvas"
          >
            RESET
          </Button>
        </HStack>
      </Box>
    </ChakraProvider>
  );
};
