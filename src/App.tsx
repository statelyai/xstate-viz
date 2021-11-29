import { Box, ChakraProvider } from '@chakra-ui/react';
import React, { useEffect, useMemo } from 'react';
import { useActor, useInterpret, useSelector } from '@xstate/react';
import { useAuth } from './authContext';
import { AppHead } from './AppHead';
import { CanvasProvider } from './CanvasContext';
import { EmbedProvider } from './embedContext';
import { CanvasView } from './CanvasView';
import { isOnClientSide } from './isOnClientSide';
import { MachineNameChooserModal } from './MachineNameChooserModal';
import { PaletteProvider } from './PaletteContext';
import { paletteMachine } from './paletteMachine';
import { PanelsView } from './PanelsView';
import { SimulationProvider, useSimulationMode } from './SimulationContext';
import { simulationMachine } from './simulationMachine';
import { getSourceActor, useSourceRegistryData } from './sourceMachine';
import { theme } from './theme';
import { EditorThemeProvider } from './themeContext';
import { EmbedContext, EmbedMode } from './types';
import { useInterpretCanvas } from './useInterpretCanvas';
import router, { useRouter } from 'next/router';
import { parseEmbedQuery, withoutEmbedQueryParams } from './utils';
import { registryLinks } from './registryLinks';
import { canZoom, canZoomIn, canZoomOut } from './canvasMachine';

const defaultHeadProps = {
  title: 'XState Visualizer',
  ogTitle: 'XState Visualizer',
  description: 'Visualizer for XState state machines and statecharts',
  // TODO - get an OG image for the home page
  ogImageUrl: null,
};

const VizHead = () => {
  const sourceRegistryData = useSourceRegistryData();

  if (!sourceRegistryData) {
    return <AppHead {...defaultHeadProps} />;
  }

  return (
    <AppHead
      title={[sourceRegistryData.system?.name, defaultHeadProps.title]
        .filter(Boolean)
        .join(' | ')}
      ogTitle={sourceRegistryData.system?.name || defaultHeadProps.ogTitle}
      description={
        sourceRegistryData.system?.name || defaultHeadProps.description
      }
      ogImageUrl={registryLinks.sourceFileOgImage(sourceRegistryData.id)}
    />
  );
};

const useReceiveMessage = (
  eventHandlers?: Record<string, (data: any) => void>,
) => {
  useEffect(() => {
    window.onmessage = async (message) => {
      const { data } = message;
      eventHandlers && eventHandlers[data.type]?.(data);
    };
  }, []);
};

const getGridArea = (embed?: EmbedContext) => {
  if (embed?.isEmbedded && embed.mode === EmbedMode.Viz) {
    return 'canvas';
  }

  if (embed?.isEmbedded && embed.mode === EmbedMode.Panels) {
    return 'panels';
  }

  return 'canvas panels';
};

function App({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const { query, asPath } = useRouter();
  const embed = useMemo(
    () => ({
      ...parseEmbedQuery(query),
      isEmbedded,
      originalUrl: withoutEmbedQueryParams(query),
    }),
    [query, asPath],
  );

  const paletteService = useInterpret(paletteMachine);
  // don't use `devTools: true` here as it would freeze your browser
  const simService = useInterpret(simulationMachine);

  const machine = useSelector(simService, (state) => {
    return state.context.currentSessionId
      ? state.context.serviceDataMap[state.context.currentSessionId!]?.machine
      : undefined;
  });

  const sourceService = useSelector(useAuth(), getSourceActor);
  const [sourceState, sendToSourceService] = useActor(sourceService!);

  useReceiveMessage({
    // used to receive messages from the iframe in embed preview
    EMBED_PARAMS_CHANGED: (data) => {
      router.replace(data.url, data.url);
    },
  });

  useEffect(() => {
    sendToSourceService({
      type: 'MACHINE_ID_CHANGED',
      id: machine?.id || '',
    });
  }, [machine?.id, sendToSourceService]);

  // TODO: Subject to refactor into embedActor

  const sourceID = sourceState!.context.sourceID;

  const canvasService = useInterpretCanvas({
    sourceID,
    embed,
  });

  const shouldEnableZoomOutButton = useSelector(
    canvasService,
    (state) => canZoom(embed) && canZoomOut(state.context),
  );

  const shouldEnableZoomInButton = useSelector(
    canvasService,
    (state) => canZoom(embed) && canZoomIn(state.context),
  );

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

  // This is because we're doing loads of things on client side anyway
  if (!isOnClientSide()) return <VizHead />;

  return (
    <>
      <VizHead />
      <EmbedProvider value={embed}>
        <ChakraProvider theme={theme}>
          <EditorThemeProvider>
            <PaletteProvider value={paletteService}>
              <SimulationProvider value={simService}>
                <Box
                  data-testid="app"
                  data-viz-theme="dark"
                  as="main"
                  display="grid"
                  gridTemplateColumns="1fr auto"
                  gridTemplateAreas={`"${getGridArea(embed)}"`}
                  height="100vh"
                >
                  {!(embed?.isEmbedded && embed.mode === EmbedMode.Panels) && (
                    <CanvasProvider value={canvasService}>
                      <CanvasView
                        shouldEnableZoomOutButton={shouldEnableZoomOutButton}
                        shouldEnableZoomInButton={shouldEnableZoomInButton}
                        canShowWelcomeMessage={canShowWelcomeMessage}
                        showControls={showControls}
                        showZoomButtonsInEmbed={showZoomButtonsInEmbed}
                        showPanButtonInEmbed={showPanButtonInEmbed}
                        isEmbedded={embed?.isEmbedded}
                        hideHeader={false}
                      />
                    </CanvasProvider>
                  )}
                  <PanelsView />
                  <MachineNameChooserModal />
                </Box>
              </SimulationProvider>
            </PaletteProvider>
          </EditorThemeProvider>
        </ChakraProvider>
      </EmbedProvider>
    </>
  );
}

export default App;
