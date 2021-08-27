import { Box, ChakraProvider } from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { useActor, useInterpret, useSelector } from '@xstate/react';
import { AuthProvider } from './authContext';
import { authMachine } from './authMachine';
import { CanvasProvider } from './CanvasContext';
import { EmbedProvider } from './embedContext';
import { CanvasView } from './CanvasView';
import './Graph';
import { MachineNameChooserModal } from './MachineNameChooserModal';
import { PaletteProvider } from './PaletteContext';
import { paletteMachine } from './paletteMachine';
import { PanelsView } from './PanelsView';
import { SimulationProvider } from './SimulationContext';
import { simulationMachine } from './simulationMachine';
import { getSourceActor } from './sourceMachine';
import { theme } from './theme';
import { EditorThemeProvider } from './themeContext';
import { EmbedContext, EmbedMode } from './types';
import { useInterpretCanvas } from './useInterpretCanvas';
import { Visibility } from './Visibility';

const getGridArea = (embed: EmbedContext) => {
  if (embed.isEmbedded && embed.mode === EmbedMode.Viz) {
    return 'canvas';
  }

  if (embed.isEmbedded && embed.mode === EmbedMode.Panels) {
    return 'panels';
  }

  return 'canvas panels';
};

const App: React.FC<{ embed: EmbedContext }> = ({ embed }) => {
  const paletteService = useInterpret(paletteMachine);
  // don't use `devTools: true` here as it would freeze your browser
  const simService = useInterpret(simulationMachine);
  const machine = useSelector(simService, (state) => {
    return state.context.currentSessionId
      ? state.context.serviceDataMap[state.context.currentSessionId!]?.machine
      : undefined;
  });
  const authService = useInterpret(authMachine);

  const sourceService = useSelector(authService, getSourceActor);
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
    embed,
  });

  return (
    <EmbedProvider value={embed}>
      <ChakraProvider theme={theme}>
        <EditorThemeProvider>
          <AuthProvider value={authService}>
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
                  <Visibility
                    isHidden={embed.isEmbedded && embed.mode === 'panels'}
                  >
                    <CanvasProvider value={canvasService}>
                      <CanvasView />
                    </CanvasProvider>
                  </Visibility>
                  <PanelsView data-testid="panels-view" />
                  <MachineNameChooserModal />
                </Box>
              </SimulationProvider>
            </PaletteProvider>
          </AuthProvider>
        </EditorThemeProvider>
      </ChakraProvider>
    </EmbedProvider>
  );
};

export default App;
