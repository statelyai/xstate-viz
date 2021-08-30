import { Box, ChakraProvider } from '@chakra-ui/react';
import { useInterpret } from '@xstate/react';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { createMachine } from 'xstate';
import { CanvasContainer } from '../CanvasContainer';
import { CanvasProvider } from '../CanvasContext';
import { canvasMachine } from '../canvasMachine';
import { toDirectedGraph } from '../directedGraph';
import { theme } from '../theme';
import { Graph } from '../Graph';
import { SimulationProvider } from '../SimulationContext';
import { simulationMachine } from '../simulationMachine';
import { AppHead } from '../AppHead';
import { isOnClientSide } from '../isOnClientSide';

const GraphOnly = () => {
  const router = useRouter();

  const config = JSON.parse((router.query.config as string) || '{}');

  const digraph = useMemo(
    () =>
      toDirectedGraph(
        createMachine({
          after: {
            500: {
              actions: 'sayHello',
            },
          },
          initial: 'cool',
          states: {
            cool: {},
          },
        }),
      ),
    [config],
  );

  const canvasService = useInterpret(canvasMachine);
  const simService = useInterpret(simulationMachine);

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
      {isOnClientSide() && (
        <ChakraProvider theme={theme}>
          <SimulationProvider value={simService}>
            <Box
              data-testid="app"
              data-viz-theme="dark"
              as="main"
              display="grid"
              gridTemplateColumns="1fr auto"
              gridTemplateAreas="'canvas panels'"
              height="100vh"
            >
              <CanvasProvider value={canvasService}>
                <CanvasContainer>
                  {digraph && <Graph digraph={digraph}></Graph>}
                </CanvasContainer>
              </CanvasProvider>
            </Box>
          </SimulationProvider>
        </ChakraProvider>
      )}
    </>
  );
};

export default GraphOnly;
