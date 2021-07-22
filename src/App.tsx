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
import { clientMachine } from './authMachine';
import './base.scss';
import { CanvasProvider } from './CanvasContext';
import { CanvasPanel } from './CanvasPanel';
import { ClientProvider } from './clientContext';
import { toDirectedGraph } from './directedGraph';
import { EditorPanel } from './EditorPanel';
import { EventsPanel } from './EventsPanel';
import './Graph';
import { Login } from './Login';
import { ResizableBox } from './ResizableBox';
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
  const clientService = useInterpret(clientMachine);
  const createdMachine = useSelector(
    clientService,
    (state) => state.context.createdMachine,
  );
  const sourceService = useSelector(
    clientService,
    (state) => state.context.sourceRef,
  );

  const [sourceState] = useActor(sourceService!);

  const isUpdateMode =
    sourceState.context.sourceProvider === 'registry' || !!createdMachine;
  const sourceID =
    sourceState.context.sourceProvider === 'registry'
      ? sourceState.context.sourceID
      : createdMachine?.id;

  const canvasService = useInterpretCanvas({
    sourceID,
  });

  return (
    <SimulationProvider value={simService}>
      <Box
        data-testid="app"
        data-viz-theme="dark"
        as="main"
        display="grid"
        gridTemplateColumns="1fr auto"
        gridTemplateAreas="'canvas tabs'"
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
        <ClientProvider value={clientService}>
          <ChakraProvider theme={theme}>
            <ResizableBox gridArea="tabs">
              <Login />
              <Tabs
                bg="gray.800"
                display="grid"
                gridTemplateRows="auto 1fr"
                height="100vh"
              >
                <TabList>
                  <Tab>Code</Tab>
                  <Tab>State</Tab>
                  <Tab>Events</Tab>
                  <Tab>Actors</Tab>
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
                        isUpdateMode={isUpdateMode}
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
                      />
                    )}
                  </TabPanel>
                  <TabPanel>
                    <StatePanel />
                  </TabPanel>
                  <TabPanel overflow="hidden" height="100%">
                    <EventsPanel />
                  </TabPanel>
                  <TabPanel>
                    <ActorsPanel />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </ResizableBox>
          </ChakraProvider>
        </ClientProvider>
      </Box>
    </SimulationProvider>
  );
}

export default App;
