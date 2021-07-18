import { useMemo } from 'react';
import { useInterpret, useMachine, useSelector } from '@xstate/react';
import './Graph';
import { toDirectedGraph } from './directedGraph';
import { CanvasPanel } from './CanvasPanel';
import { SimulationProvider } from './SimulationContext';
import './base.scss';
import { EditorPanel } from './EditorPanel';
import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
  Text,
} from '@chakra-ui/react';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './theme';
import { StatePanel } from './StatePanel';
import { EventsPanel } from './EventsPanel';
import { ActorsPanel } from './ActorsPanel';
import { Login } from './Login';

import { clientMachine } from './clientMachine';
import { ClientProvider } from './clientContext';
import { sourceMachine } from './sourceMachine';
import { SpinnerWithText } from './SpinnerWithText';
import { ResizableBox } from './ResizableBox';
import { simulationMachine } from './simulationMachine';
import { SettingsIcon } from '@chakra-ui/icons';

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
  const [sourceState] = useMachine(sourceMachine);

  const isUpdateMode =
    sourceState.context.sourceProvider === 'registry' || !!createdMachine;
  const sourceID =
    sourceState.context.sourceProvider === 'registry'
      ? sourceState.context.sourceID
      : createdMachine?.id;
  const isSourceLoaded = useMemo(
    () => sourceState.matches({ with_source: 'source_loaded' }),
    [sourceState],
  );

  return (
    <SimulationProvider value={simService}>
      <Box
        data-viz-theme="dark"
        as="main"
        display="grid"
        gridTemplateColumns="1fr auto"
        gridTemplateAreas="'canvas tabs'"
      >
        {digraph ? (
          <CanvasPanel digraph={digraph} />
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
                        immediateUpdate={isSourceLoaded}
                        defaultValue={
                          isSourceLoaded
                            ? (sourceState.context.sourceRawContent as string)
                            : initialMachineCode
                        }
                        isUpdateMode={isUpdateMode}
                        onPersist={(code: string) => {
                          if (isUpdateMode) {
                            clientService.send({
                              type: 'UPDATE',
                              id: sourceID,
                              rawSource: code,
                            });
                          } else {
                            clientService.send({
                              type: 'SAVE',
                              rawSource: code,
                            });
                          }
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
