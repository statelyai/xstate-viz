import { useInterpret } from '@xstate/react';
import { CanvasProvider } from './CanvasContext';
import { canvasMachine } from './canvasMachine';
import { CanvasView } from './CanvasView';
import { CommonAppProviders } from './CommonAppProviders';
import { RootContainer } from './RootContainer';

export const WebExtension = () => {
  const canvasService = useInterpret(canvasMachine);
  return (
    <CommonAppProviders>
      <RootContainer
        canvas={
          <CanvasProvider value={canvasService}>
            <CanvasView />
          </CanvasProvider>
        }
        panels={null}
      />
    </CommonAppProviders>
  );
};
