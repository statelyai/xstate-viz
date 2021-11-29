import { Box, ChakraProvider } from '@chakra-ui/react';
import { useInterpret, useMachine } from '@xstate/react';
import Head from 'next/head';
import { NextRouter, useRouter } from 'next/router';
import React, { useEffect, useMemo } from 'react';
import { createMachine, MachineConfig, sendParent } from 'xstate';
import { CanvasProvider } from '../CanvasContext';
import { CanvasView } from '../CanvasView';
import { EmbedProvider } from '../embedContext';
import { SimulationProvider } from '../SimulationContext';
import { simModel, simulationMachine } from '../simulationMachine';
import { theme } from '../theme';
import { NextComponentWithMeta } from '../types';
import { useInterpretCanvas } from '../useInterpretCanvas';
import { parseEmbedQuery, withoutEmbedQueryParams } from '../utils';
import { withReadyRouter } from '../withReadyRouter';
import lzString from 'lz-string';

const parseMachineFromQuery = (query: NextRouter['query']) => {
  if (!query.machine) {
    throw new Error();
  }

  if (Array.isArray(query.machine)) {
    throw new Error();
  }

  const lzResult = lzString.decompressFromEncodedURIComponent(query.machine);

  if (!lzResult) throw new Error();

  const machineConfig = JSON.parse(lzResult);

  // Tests that the machine is valid
  return createMachine(machineConfig);
};

const viewOnlyPageMachine = createMachine<{
  query: NextRouter['query'];
}>({
  initial: 'checkingIfMachineIsValid',
  states: {
    checkingIfMachineIsValid: {
      invoke: {
        src: async (context) => {
          return parseMachineFromQuery(context.query);
        },
        onDone: {
          target: 'valid',
        },
        onError: {
          target: 'notValid',
        },
      },
    },
    notValid: {
      type: 'final',
      entry: (context, event) => {
        console.error('Could not parse machine.', event);
      },
    },
    valid: {
      type: 'final',
      entry: sendParent((context) =>
        simModel.events['MACHINES.REGISTER']([
          parseMachineFromQuery(context.query),
        ]),
      ),
    },
  },
});

/**
 * Displays a view-only page which can render a machine
 * to the canvas from the URL
 *
 * Use this example URL: http://localhost:3000/viz/view-only?machine=N4IglgdmAuYIYBsQC4QHcD2aQBoQGdo5oBTfFUTbZYAXzwhOrttqA
 *
 * This is for loading OG images quickly, and for many other applications
 *
 * To create the machine hash, use the lzString.compressToEncodedURIComponent
 * function on a JSON.stringified machine config.
 *
 * You can also use the typical embed controls
 */
const ViewOnlyPage = withReadyRouter(() => {
  const canvasService = useInterpretCanvas({
    sourceID: null,
  });
  const simulationService = useInterpret(simulationMachine);
  const router = useRouter();

  useMachine(viewOnlyPageMachine, {
    context: {
      query: router.query,
    },
    parent: simulationService,
  });

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
      <EmbedProvider value={embed}>
        <ChakraProvider theme={theme}>
          <CanvasProvider value={canvasService}>
            <SimulationProvider value={simulationService}>
              <Box
                data-testid="app"
                data-viz-theme="dark"
                as="main"
                height="100vh"
              >
                <CanvasView />
              </Box>
            </SimulationProvider>
          </CanvasProvider>
        </ChakraProvider>
      </EmbedProvider>
    </>
  );
});

const ViewOnlyPageParent: NextComponentWithMeta = () => {
  return (
    <>
      <Head>
        <script src="https://unpkg.com/elkjs@0.7.1/lib/elk.bundled.js"></script>
      </Head>
      <ViewOnlyPage />
    </>
  );
};

ViewOnlyPageParent.preventAuth = true;

export default ViewOnlyPageParent;
