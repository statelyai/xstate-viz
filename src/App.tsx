import { Box, ChakraProvider } from '@chakra-ui/react';
import { useEffect, useMemo } from 'react';
import { useActor, useInterpret, useSelector } from '@xstate/react';
import { AppProvider, selectAppMode } from './AppContext';
import { appMachine } from './appMachine';
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
import { SimulationProvider } from './SimulationContext';
import { simulationMachine } from './simulationMachine';
import { getSourceActor, useSourceRegistryData } from './sourceMachine';
import { theme } from './theme';
import { EditorThemeProvider } from './themeContext';
import { EmbedContext, EmbedMode } from './types';
import { useInterpretCanvas } from './useInterpretCanvas';
import { useRouter } from 'next/router';
import { parseEmbedQuery, withoutEmbedQueryParams } from './utils';
import { HeaderView } from './HeaderView';
import { registryLinks } from './registryLinks';

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
      title={[sourceRegistryData.name, defaultHeadProps.title]
        .filter(Boolean)
        .join(' | ')}
      ogTitle={sourceRegistryData.name || defaultHeadProps.ogTitle}
      description={sourceRegistryData.name || defaultHeadProps.description}
      ogImageUrl={registryLinks.sourceFileOgImage(sourceRegistryData.id)}
    />
  );
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
  const { query } = useRouter();
  const embed = useMemo(
    () => ({
      ...parseEmbedQuery(query),
      isEmbedded,
      originalUrl: withoutEmbedQueryParams(query),
    }),
    [query],
  );
  const paletteService = useInterpret(paletteMachine);
  // don't use `devTools: true` here as it would freeze your browser
  const simService = useInterpret(simulationMachine);
  const appService = useInterpret(appMachine);
  const machine = useSelector(simService, (state) => {
    return state.context.currentSessionId
      ? state.context.serviceDataMap[state.context.currentSessionId!]?.machine
      : undefined;
  });

  const sourceService = useSelector(useAuth(), getSourceActor);
  const [sourceState, sendToSourceService] = useActor(sourceService!);

  useEffect(() => {
    sendToSourceService({
      type: 'MACHINE_ID_CHANGED',
      id: machine?.id || '',
    });
  }, [machine?.id, sendToSourceService]);

  const sourceID = sourceState!.context.sourceID;

  const canvasService = useInterpretCanvas({
    sourceID,
    embed,
  });

  const appMode = useSelector(appService, selectAppMode);

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
                <AppProvider value={appService}>
                  <Box
                    data-testid="app"
                    data-viz="app"
                    data-viz-theme="dark"
                    data-viz-mode={appMode || embed.mode}
                    as="main"
                    display="grid"
                    // gridTemplateColumns="1fr auto"
                    // gridTemplateAreas={`"${getGridArea(embed)}"`}
                    height="100vh"
                  >
                    <HeaderView gridArea="header" />
                    {!(
                      embed?.isEmbedded && embed.mode === EmbedMode.Panels
                    ) && (
                      <CanvasProvider value={canvasService}>
                        <CanvasView />
                      </CanvasProvider>
                    )}
                    <PanelsView />
                    <MachineNameChooserModal />
                  </Box>
                </AppProvider>
              </SimulationProvider>
            </PaletteProvider>
          </EditorThemeProvider>
        </ChakraProvider>
      </EmbedProvider>
    </>
  );
}

export default App;
