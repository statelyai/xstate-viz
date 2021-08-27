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
      embed,
    }),
    {
      actions: {
        persistPositionToLocalStorage: (context) => {
          // TODO: This can be more elegant when we have system actor
          const { zoom, pan, embed } = context;
          if (!embed?.isEmbedded) {
            localCache.savePosition(sourceID, { zoom, pan });
          }
        },
      },
    },
  );

  useEffect(() => {
    canvasService.send({
      type: 'SOURCE_CHANGED',
      id: sourceID,
    });
  }, [sourceID, canvasService]);

  return canvasService;
};
