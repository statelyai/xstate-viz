import { useInterpret } from '@xstate/react';
import { useEffect } from 'react';
import { canvasMachine, canvasModel } from './canvasMachine';
import './Graph';
import { localCache } from './localCache';
import { EmbedContext } from './types';

export const useInterpretCanvas = ({
  sourceID,
  embed,
}: {
  sourceID: string | null;
  embed: EmbedContext;
}) => {
  const canvasService = useInterpret(
    canvasMachine.withContext({
      ...canvasModel.initialContext,
      isEmbedded: embed.isEmbedded,
    }),
    {
      guards: {
        isEmbeddedMode: () => embed.isEmbedded,
      },
      actions: {
        persistPositionToLocalStorage: (context) => {
          localCache.savePosition(sourceID, context);
        },
      },
    },
  );
  useEffect(() => {
    canvasService.onTransition((state, event) => {
      console.log({
        state: state.value,
        event: event.type,
        isEmbedded: state.context.isEmbedded,
      });
    });
  }, []);

  useEffect(() => {
    canvasService.send({
      type: 'SOURCE_CHANGED',
      id: sourceID,
      // isEmbedded: embed.isEmbedded,
    });
  }, [sourceID, canvasService]);

  return canvasService;
};
