import { Box, ChakraProvider } from '@chakra-ui/react';
import { useActor, useInterpret, useSelector } from '@xstate/react';
import { useEffect } from 'react';
import { useAuth } from './authContext';
import { AppHead, AppHeadProps } from './AppHead';
import { CanvasProvider } from './CanvasContext';
import { CanvasView } from './CanvasView';
import { isOnClientSide } from './isOnClientSide';
import { MachineNameChooserModal } from './MachineNameChooserModal';
import { PaletteProvider } from './PaletteContext';
import { paletteMachine } from './paletteMachine';
import { PanelsView } from './PanelsView';
import { SimulationProvider } from './SimulationContext';
import { simulationMachine } from './simulationMachine';
import { getSourceActor } from './sourceMachine';
import { theme } from './theme';
import { EditorThemeProvider } from './themeContext';
import { useInterpretCanvas } from './useInterpretCanvas';

function App({ headProps }: { headProps: AppHeadProps }) {
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

  if (!isOnClientSide()) return <AppHead {...headProps} />;

  return (
    <>
      <AppHead {...headProps} />
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
