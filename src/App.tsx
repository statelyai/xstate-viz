import { useMemo } from 'react';
import { useInterpret, useSelector } from '@xstate/react';
import './Graph';
import { testMachine } from './testMachine';
import { toDirectedGraph } from './directedGraph';
import { CanvasPanel } from './CanvasPanel';
import { createSimulationMachine } from './simulationMachine';
import { SimulationContext } from './SimulationContext';
import './base.scss';

function App() {
  const simService = useInterpret(createSimulationMachine(testMachine));
  const machine = useSelector(simService, (state) => state.context.machine);
  const digraph = useMemo(() => toDirectedGraph(machine), [machine]);

  return (
    <SimulationContext.Provider value={simService as any}>
      <main data-viz="app" data-viz-theme="dark">
        <CanvasPanel digraph={digraph} key={JSON.stringify(digraph)} />
        {/* <EditorPanel
          onChange={(machines) => {
            simService.send({
              type: 'MACHINE.UPDATE',
              machine: machines[0],
            });
            console.log(machines);
          }}
        /> */}
      </main>
    </SimulationContext.Provider>
  );
}

export default App;
