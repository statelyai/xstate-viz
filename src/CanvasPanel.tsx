import {
  AddIcon,
  MinusIcon,
  RepeatIcon,
  HamburgerIcon,
  ExternalLinkIcon,
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
  MenuIcon,
  MenuItem,
  MenuList,
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
import { Heart, HeartOutlined } from './Icons';
import { LikeButton } from './LikeButton';
import { registryLinks } from './registryLinks';
import { ShareButton } from './ShareButton';
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
    <Box display="grid" gridTemplateRows="auto 1fr">
      <ChakraProvider theme={theme}>
        <HStack bg="black" justifyContent="space-between" zIndex={1}>
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
      </ChakraProvider>
      <CanvasContainer>
        <Graph digraph={digraph} />
      </CanvasContainer>
    </Box>
  );
};
