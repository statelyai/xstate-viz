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
import { AppHead } from '../AppHead';

const parseMachineFromQuery = (query: NextRouter['query']) => {
  if (!query.machine) {
    throw new Error('`machine` query param is required');
  }

  if (Array.isArray(query.machine)) {
    throw new Error("`machine` query param can't be an array");
  }

  const lzResult = lzString.decompressFromEncodedURIComponent(query.machine);

  if (!lzResult)
    throw new Error("`machine` query param couldn't be decompressed");

  const machineConfig = JSON.parse(lzResult);

  // Tests that the machine is valid
  try {
    return createMachine(machineConfig);
  } catch {
    throw new Error(
      "decompressed `machine` couldn't be used to `createMachine`",
    );
  }
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
  );
});

const ViewOnlyPageParent: NextComponentWithMeta = () => {
  return (
    <>
      <AppHead
        description="A visualisation of a state machine"
        title="XState Visualizer"
        ogImageUrl={null}
        ogTitle="XState Visualizer"
        importElk
      />
      <ViewOnlyPage />
    </>
  );
};

ViewOnlyPageParent.preventAuth = true;

export default ViewOnlyPageParent;
