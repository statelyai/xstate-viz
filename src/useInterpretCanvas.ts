import { useInterpret } from '@xstate/react';
import { useEffect } from 'react';
import { canvasMachine } from './canvasMachine';
import './Graph';
import { localCache } from './localCache';

export const useInterpretCanvas = ({
  sourceID,
}: {
  sourceID: string | null;
}) => {
  const canvasService = useInterpret(canvasMachine, {
    actions: {
      persistPositionToLocalStorage: (context) => {
        localCache.savePosition(sourceID, context);
      },
    },
  });

  useEffect(() => {
    canvasService.send({
      type: 'SOURCE_CHANGED',
      id: sourceID,
    });
  }, [sourceID, canvasService]);

  return canvasService;
};
