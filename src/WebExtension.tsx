import { CommonAppProviders } from './CommonAppProviders';
import { RootContainer } from './RootContainer';
import { CanvasProvider } from './CanvasContext';
import { CanvasView } from './CanvasView';
import { useInterpretCanvas } from './useInterpretCanvas';

export const WebExtension = () => {
  const canvasService = useInterpretCanvas({
    sourceID: null,
    embed: undefined,
  });
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
