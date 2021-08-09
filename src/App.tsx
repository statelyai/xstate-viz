import { SettingsIcon } from '@chakra-ui/icons';
import {
  Box,
  ChakraProvider,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { useInterpret, useSelector } from '@xstate/react';
import { useEffect, useMemo } from 'react';
import { ActorsPanel } from './ActorsPanel';
import { AuthProvider } from './authContext';
import { authMachine } from './authMachine';
import './base.scss';
import { CanvasProvider } from './CanvasContext';
import { CanvasPanel } from './CanvasPanel';
import { toDirectedGraph } from './directedGraph';
import { EditorPanel } from './EditorPanel';
import { EventsPanel } from './EventsPanel';
import './Graph';
import { Login } from './Login';
import { MachineNameChooserModal } from './MachineNameChooserModal';
import { PaletteProvider } from './PaletteContext';
import { paletteMachine } from './paletteMachine';
import { ResizableBox } from './ResizableBox';
import { SettingsPanel } from './SettingsPanel';
import { SimulationProvider } from './SimulationContext';
import { simulationMachine } from './simulationMachine';
import { useSourceActor } from './sourceMachine';
import { SpinnerWithText } from './SpinnerWithText';
import { StatePanel } from './StatePanel';
import { theme } from './theme';
import { EditorThemeProvider } from './themeContext';
import { useInterpretCanvas } from './useInterpretCanvas';

function App() {
  const paletteService = useInterpret(paletteMachine);
  // don't use `devTools: true` here as it would freeze your browser
  const simService = useInterpret(simulationMachine);
  const machine = useSelector(simService, (state) => {
    return state.context.currentSessionId
      ? state.context.serviceDataMap[state.context.currentSessionId!]?.machine
      : undefined;
  });
  const digraph = useMemo(
    () => (machine ? toDirectedGraph(machine) : undefined),
    [machine],
  );
  const authService = useInterpret(authMachine);

  const [sourceState, sendToSourceService] = useSourceActor(authService);

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

  return (
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
              gridTemplateRows="1fr auto"
              gridTemplateAreas="'canvas panels' 'footer footer'"
              height="100vh"
            >
              <CanvasProvider value={canvasService}>
                <CanvasPanel />
              </CanvasProvider>
              <ChakraProvider theme={theme}>
                <ResizableBox gridArea="panels" minHeight={0}>
                  <Tabs
                    bg="gray.800"
                    display="grid"
                    gridTemplateRows="3rem 1fr"
                    height="100%"
                  >
                    <TabList>
                      <Tab>Code</Tab>
                      <Tab>State</Tab>
                      <Tab>Events</Tab>
                      <Tab>Actors</Tab>
                      <Tab marginLeft="auto" marginRight="2">
                        <SettingsIcon />
                      </Tab>
                      <Login />
                    </TabList>

                    <TabPanels minHeight={0}>
                      <TabPanel height="100%" padding={0}>
                        {sourceState.matches({
                          with_source: 'loading_content',
                        }) && (
                          <SpinnerWithText
                            text={`Loading source from ${sourceState.context.sourceProvider}`}
                          />
                        )}
                        {!sourceState.matches({
                          with_source: 'loading_content',
                        }) && (
                          <EditorPanel
                            onChangedCodeValue={(code) => {
                              sendToSourceService({
                                type: 'CODE_UPDATED',
                                code,
                                sourceID: sourceState.context.sourceID,
                              });
                            }}
                            onCreateNew={() =>
                              sendToSourceService({
                                type: 'CREATE_NEW',
                              })
                            }
                            onSave={() => {
                              sendToSourceService({
                                type: 'SAVE',
                              });
                            }}
                            onChange={(machines) => {
                              simService.send({
                                type: 'MACHINES.REGISTER',
                                machines,
                              });
                            }}
                            onFork={() => {
                              sendToSourceService({
                                type: 'FORK',
                              });
                            }}
                          />
                        )}
                      </TabPanel>
                      <TabPanel height="100%" overflowY="auto">
                        <StatePanel />
                      </TabPanel>
                      <TabPanel height="100%" overflow="hidden">
                        <EventsPanel />
                      </TabPanel>
                      <TabPanel height="100%" overflowY="auto">
                        <ActorsPanel />
                      </TabPanel>
                      <TabPanel height="100%" overflowY="auto">
                        <SettingsPanel />
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </ResizableBox>
                <MachineNameChooserModal />
              </ChakraProvider>
            </Box>
          </SimulationProvider>
        </PaletteProvider>
      </AuthProvider>
    </EditorThemeProvider>
  );
}

export default App;
