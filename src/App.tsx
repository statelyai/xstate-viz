import { Box, ChakraProvider } from '@chakra-ui/react';
import { useActor, useInterpret, useSelector } from '@xstate/react';
import { useEffect } from 'react';
import { useAuth } from './authContext';
import { AppHead } from './AppHead';
import { CanvasProvider } from './CanvasContext';
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
import { useInterpretCanvas } from './useInterpretCanvas';
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

function App() {
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

  useEffect(() => {
    sendToSourceService({
      type: 'MACHINE_ID_CHANGED',
      id: machine?.id || '',
    });
  }, [machine?.id, sendToSourceService]);

  const sourceID = sourceState.context.sourceID;

  const canvasService = useInterpretCanvas({
    sourceID,
  });

  if (!isOnClientSide()) return <VizHead />;

  return (
    <>
      <VizHead />
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
                gridTemplateAreas="'canvas panels'"
                height="100vh"
              >
                <CanvasProvider value={canvasService}>
                  <CanvasView />
                </CanvasProvider>
                <PanelsView />
                <MachineNameChooserModal />
              </Box>
            </SimulationProvider>
          </PaletteProvider>
        </EditorThemeProvider>
      </ChakraProvider>
    </>
  );
}

export default App;
