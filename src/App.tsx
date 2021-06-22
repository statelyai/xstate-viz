import { useMemo } from 'react';
import { useInterpret, useSelector } from '@xstate/react';
import './Graph';
import { testMachine } from './testMachine';
import { toDirectedGraph } from './directedGraph';
import { CanvasPanel } from './CanvasPanel';
import { createSimulationMachine } from './simulationMachine';
import { SimulationProvider } from './SimulationContext';
import './base.scss';
import { EditorPanel } from './EditorPanel';
import { Tabs, TabList, TabPanels, Tab, TabPanel, Box } from '@chakra-ui/react';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './theme';
import { StatePanel } from './StatePanel';
import { EventsPanel } from './EventsPanel';
import { ActorsPanel } from './ActorsPanel';
import { devTools } from './devInterface';

function App() {
  const simService = useInterpret(createSimulationMachine(testMachine));
  const machine = useSelector(simService, (state) => {
    return state.context.service
      ? state.context.services[state.context.service!]?.machine
      : undefined;
  });
  const digraph = useMemo(
    () => (machine ? toDirectedGraph(machine) : undefined),
    [machine],
  );

  return (
    <SimulationProvider value={simService}>
      <Box
        data-viz="app"
        data-viz-theme="dark"
        as="main"
        display="grid"
        gridTemplateColumns="1fr minmax(50%, auto)"
        gridTemplateAreas="'canvas tabs'"
      >
        {digraph && <CanvasPanel digraph={digraph} />}
        <ChakraProvider theme={theme}>
          <Tabs
            bg="gray.800"
            display="grid"
            gridTemplateRows="auto 1fr"
            height="100vh"
            gridArea="tabs"
          >
            <TabList>
              <Tab>Code</Tab>
              <Tab>State</Tab>
              <Tab>Events</Tab>
              <Tab>Actors</Tab>
            </TabList>

            <TabPanels overflowY="auto">
              <TabPanel padding={0}>
                <EditorPanel
                  onChange={(machines) => {
                    simService.send({
                      type: 'MACHINES.VERIFY',
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
              <TabPanel>
                <ActorsPanel />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ChakraProvider>
      </Box>
    </SimulationProvider>
  );
}

export default App;
