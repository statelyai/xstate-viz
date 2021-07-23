import { AddIcon, MinusIcon, RepeatIcon } from '@chakra-ui/icons';
import {
  Avatar,
  Box,
  ButtonGroup,
  ChakraProvider,
  IconButton,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import React from 'react';
import { useAuth } from './authContext';
import { CanvasContainer } from './CanvasContainer';
import { useCanvas } from './CanvasContext';
import { DirectedGraphNode } from './directedGraph';
import { Graph } from './Graph';
import { registryLinks } from './registryLinks';
import { useSimulation } from './SimulationContext';
import { useSourceState } from './sourceMachine';
import { theme } from './theme';

export const CanvasPanel: React.FC<{
  digraph: DirectedGraphNode;
}> = ({ digraph }) => {
  const simService = useSimulation();
  const canvasService = useCanvas();
  const authService = useAuth();

  const [sourceState] = useSourceState(authService);

  return (
    <Box display="grid" gridTemplateRows="auto 1fr">
      <Box zIndex={1} bg="black">
        <ChakraProvider theme={theme}>
          <Stack
            direction="row"
            spacing="4"
            alignItems="center"
            justifyContent="space-between"
          >
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
            {sourceState.context.sourceRegistryData && (
              <Stack direction="row" spacing="3" alignItems="center" pr="4">
                <Text fontWeight="medium" fontSize="sm" color="gray.100">
                  {sourceState.context.sourceRegistryData?.name ||
                    'Unnamed Source'}
                </Text>
                {sourceState.context.sourceRegistryData?.owner && (
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
          </Stack>
        </ChakraProvider>
      </Box>
      <CanvasContainer>
        <Graph digraph={digraph} />
      </CanvasContainer>
    </Box>
  );
};
