import { useInterpret } from '@xstate/react';
import { useEffect } from 'react';
import { canvasMachine, canvasModel } from './canvasMachine';
import { useEmbed } from './embedContext';
import './Graph';
import { localCache } from './localCache';

export const useInterpretCanvas = ({
  sourceID,
}: {
  sourceID: string | null;
}) => {
  const embed = useEmbed();
  const canvasService = useInterpret(
    canvasMachine.withContext({
      ...canvasModel.initialContext,
      isEmbedded: embed.isEmbedded,
    }),
    {
      actions: {
        persistPositionToLocalStorage: (context) => {
          localCache.savePosition(sourceID, context);
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
