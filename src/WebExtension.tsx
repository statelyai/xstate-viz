import { useInterpret } from '@xstate/react';
import { CanvasProvider } from './CanvasContext';
import { canvasMachine } from './canvasMachine';
import { CanvasView } from './CanvasView';
import { CommonAppProviders } from './CommonAppProviders';
import { RootContainer } from './RootContainer';
import { ActorsTab } from './tabs/ActorsTab';
import { EventsTab } from './tabs/EventsTab';
import { SettingsTab } from './tabs/SettingsTab';
import { StateTab } from './tabs/StateTab';

// TODO: implement something nicer
const Empty = () => null;

export const WebExtension = () => {
  const canvasService = useInterpret(canvasMachine);
  return (
    <CommonAppProviders>
      <RootContainer
        canvas={
          <CanvasProvider value={canvasService}>
            <CanvasView Empty={<Empty />} />
          </CanvasProvider>
        }
        panels={[StateTab, EventsTab, ActorsTab, SettingsTab]}
      />
    </CommonAppProviders>
  );
};
