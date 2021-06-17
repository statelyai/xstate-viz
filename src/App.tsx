import { useMemo } from 'react';
import { useInterpret, useSelector } from '@xstate/react';
import './Graph';
import { testMachine } from './testMachine';
import { toDirectedGraph } from './directedGraph';
import { CanvasPanel } from './CanvasPanel';
import { createSimulationMachine } from './simulationMachine';
import { SimulationContext } from './SimulationContext';
import './base.scss';
import { EditorPanel } from './EditorPanel';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './theme';
import { StatePanel } from './StatePanel';
import { EventsPanel } from './EventsPanel';

function App() {
  const simService = useInterpret(createSimulationMachine(testMachine));
  const machine = useSelector(simService, (state) => state.context.machine);
  const digraph = useMemo(() => toDirectedGraph(machine), [machine]);

  return (
    <SimulationContext.Provider value={simService as any}>
      <main data-viz="app" data-viz-theme="dark">
        <CanvasPanel digraph={digraph} />
        <ChakraProvider theme={theme}>
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
            </TabList>

            <TabPanels overflowY="auto">
              <TabPanel padding={0}>
                <EditorPanel
                  onChange={(machines) => {
                    simService.send({
                      type: 'MACHINES.UPDATE',
                      machines,
                    });
                  }}
                />
              </TabPanel>
              <TabPanel>
                <StatePanel />
              </TabPanel>
              <TabPanel>
                <EventsPanel />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ChakraProvider>
      </main>
    </SimulationContext.Provider>
  );
}

export default App;
