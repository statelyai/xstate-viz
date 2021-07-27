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
import { useActor, useInterpret, useSelector } from '@xstate/react';
import { useMemo } from 'react';
import { ActorsPanel } from './ActorsPanel';
import { AuthProvider } from './authContext';
import { authMachine } from './authMachine';
import './base.scss';
import { CanvasProvider } from './CanvasContext';
import { CanvasPanel } from './CanvasPanel';
import { toDirectedGraph } from './directedGraph';
import { EditorPanel } from './EditorPanel';
import { EventsPanel } from './EventsPanel';
import { Footer } from './Footer';
import './Graph';
import { Login } from './Login';
import { PaletteProvider } from './PaletteContext';
import { paletteMachine } from './paletteMachine';
import { ResizableBox } from './ResizableBox';
import { SettingsPanel } from './SettingsPanel';
import { SimulationProvider } from './SimulationContext';
import { simulationMachine } from './simulationMachine';
import { SpinnerWithText } from './SpinnerWithText';
import { StatePanel } from './StatePanel';
import { theme } from './theme';
import { useInterpretCanvas } from './useInterpretCanvas';

const initialMachineCode = `
import { createMachine } from 'xstate';
`.trim();

function App() {
  const paletteService = useInterpret(paletteMachine);
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
  const sourceService = useSelector(
    authService,
    (state) => state.context.sourceRef,
  );

  const [sourceState] = useActor(sourceService!);

  const sourceID = sourceState.context.sourceID;

  const canvasService = useInterpretCanvas({
    sourceID,
  });

  return (
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
          {digraph ? (
            <CanvasProvider value={canvasService}>
              <CanvasPanel digraph={digraph} />
            </CanvasProvider>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center">
              <Text textAlign="center">
                No machines to display yet...
                <br />
                Create one!
              </Text>
            </Box>
          )}
          <AuthProvider value={authService}>
            <ChakraProvider theme={theme}>
              <ResizableBox gridArea="panels">
                <Tabs
                  bg="gray.800"
                  display="grid"
                  gridTemplateRows="auto 1fr"
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
                    <TabPanel padding={0} height="100%">
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
                          immediateUpdate={Boolean(
                            sourceState.context.sourceRawContent,
                          )}
                          defaultValue={
                            sourceState.context.sourceRawContent ||
                            initialMachineCode
                          }
                          onChangedCodeValue={(code) => {
                            sourceService?.send({
                              type: 'CODE_UPDATED',
                              code,
                              sourceID: sourceState.context.sourceID,
                            });
                          }}
                          onSave={(code: string) => {
                            sourceService?.send({
                              type: 'SAVE',
                              rawSource: code,
                            });
                          }}
                          onChange={(machines) => {
                            simService.send({
                              type: 'MACHINES.REGISTER',
                              machines,
                            });
                          }}
                          onCreateNew={(code) => {
                            sourceService?.send({
                              type: 'CREATE_NEW',
                              rawSource: code,
                            });
                          }}
                        />
                      )}
                    </TabPanel>
                    <TabPanel height="100%">
                      <StatePanel />
                    </TabPanel>
                    <TabPanel overflow="hidden" height="100%">
                      <EventsPanel />
                    </TabPanel>
                    <TabPanel height="100%">
                      <ActorsPanel />
                    </TabPanel>
                    <TabPanel height="100%">
                      <SettingsPanel />
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </ResizableBox>
              <Footer />
            </ChakraProvider>
          </AuthProvider>
        </Box>
      </SimulationProvider>
    </PaletteProvider>
  );
}

export default App;
