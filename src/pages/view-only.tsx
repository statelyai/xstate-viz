import { Box, ChakraProvider } from '@chakra-ui/react';
import { useInterpret } from '@xstate/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo } from 'react';
import { createMachine } from 'xstate';
import { CanvasProvider } from '../CanvasContext';
import { CanvasView } from '../CanvasView';
import { EmbedProvider } from '../embedContext';
import { SimulationProvider } from '../SimulationContext';
import { simulationMachine } from '../simulationMachine';
import { theme } from '../theme';
import { NextComponentWithMeta } from '../types';
import { useInterpretCanvas } from '../useInterpretCanvas';
import { parseEmbedQuery, withoutEmbedQueryParams } from '../utils';

const machine = createMachine({
  initial: 'wow',
  states: {
    wow: {
      on: {
        NEXT: {
          target: 'new',
        },
      },
    },
    new: {},
  },
});

const ViewOnlyPage: NextComponentWithMeta = () => {
  const canvasService = useInterpretCanvas({
    sourceID: null,
  });
  const simulationService = useInterpret(simulationMachine);
  const router = useRouter();

  useEffect(() => {
    simulationService.send({
      type: 'MACHINES.REGISTER',
      machines: [machine],
    });
  }, []);

  const embed = useMemo(
    () => ({
      ...parseEmbedQuery(router.query),
      isEmbedded: true,
      originalUrl: withoutEmbedQueryParams(router.query),
    }),
    [router.query],
  );
  return (
    <>
      <Head>
        <script src="https://unpkg.com/elkjs@0.7.1/lib/elk.bundled.js"></script>
      </Head>
      <EmbedProvider value={embed}>
        <ChakraProvider theme={theme}>
          <CanvasProvider value={canvasService}>
            <SimulationProvider value={simulationService}>
              <Box
                data-testid="app"
                data-viz-theme="dark"
                as="main"
                display="grid"
                gridTemplateColumns="1fr auto"
                gridTemplateAreas={`"canvas"`}
                height="100vh"
              >
                <CanvasView
                  hideHeader
                  showControls
                  isEmbedded
                  shouldEnableZoomInButton
                  shouldEnableZoomOutButton
                  showPanButtonInEmbed
                  showZoomButtonsInEmbed
                />
              </Box>
            </SimulationProvider>
          </CanvasProvider>
        </ChakraProvider>
      </EmbedProvider>
    </>
  );
};

ViewOnlyPage.preventAuth = true;

export default ViewOnlyPage;
