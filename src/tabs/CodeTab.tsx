import { Tab, TabPanel, TabPanelProps, TabProps } from '@chakra-ui/react';
import { EditorPanel } from '../EditorPanel';
import { useSimulation } from '../SimulationContext';
import { useSourceActor } from '../sourceMachine';
import { SpinnerWithText } from '../SpinnerWithText';

export const CodeTab = {
  Tab: (props: TabProps) => <Tab {...props}>Code</Tab>,
  TabPanel: (props: TabPanelProps) => {
    const [sourceState, sendToSourceService] = useSourceActor();
    const simService = useSimulation();
    return (
      <TabPanel {...props} height="100%" padding={0}>
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
    );
  },
};
