import { useSelector } from '@xstate/react';
import React, { CSSProperties, useEffect } from 'react';
import { useCanvas } from './CanvasContext';
import { canvasModel, ZoomFactor } from './canvasMachine';
import {
  isAcceptingArrowKey,
  isTextInputLikeElement,
  isWithPlatformMetaKey,
} from './utils';

import { useCanvasDrag } from './CanvasDragContext';
import { AnyState } from './types';

const getCursorByState = (state: AnyState) =>
  (
    Object.values(state.meta).find((m) =>
      Boolean((m as { cursor?: CSSProperties['cursor'] }).cursor),
    ) as { cursor?: CSSProperties['cursor'] }
  )?.cursor;

export const CanvasContainer = ({
  children,
  pannable,
  zoomable,
}: {
  children: React.ReactNode;
  pannable: boolean;
  zoomable: boolean;
}) => {
  const canvasService = useCanvas();
  const canvasDragService = useCanvasDrag();
  const canvasRef = canvasDragService.state.context.ref;
  const cursor = useSelector(canvasDragService, getCursorByState);

  /**
   * Observes the canvas's size and reports it to the canvasService
   */
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];

      // entry contains `contentRect` but we are interested in the `clientRect`
      // height/width are going to be the same but not the offsets
      const clientRect = entry.target.getBoundingClientRect();

      canvasService.send({
        type: 'CANVAS_RECT_CHANGED',
        height: clientRect.height,
        width: clientRect.width,
        offsetX: clientRect.left,
        offsetY: clientRect.top,
      });
    });

    resizeObserver.observe(canvasRef.current!);

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasService]);

  useEffect(() => {
    function keydownListener(e: KeyboardEvent) {
      const target = e.target as HTMLElement | SVGElement;

      if (isTextInputLikeElement(target)) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          if (isAcceptingArrowKey(target)) {
            return;
          }
          e.preventDefault();
          canvasService.send(canvasModel.events['PAN.DOWN'](e.shiftKey));
          return;
        case 'ArrowLeft':
          if (isAcceptingArrowKey(target)) {
            return;
          }
          e.preventDefault();
          canvasService.send(canvasModel.events['PAN.RIGHT'](e.shiftKey));
          return;
        case 'ArrowDown':
          if (isAcceptingArrowKey(target)) {
            return;
          }
          e.preventDefault();
          canvasService.send(canvasModel.events['PAN.UP'](e.shiftKey));
          return;
        case 'ArrowRight':
          if (isAcceptingArrowKey(target)) {
            return;
          }
          e.preventDefault();
          canvasService.send(canvasModel.events['PAN.LEFT'](e.shiftKey));
          return;
        // can come from numpad
        case '+':
        // this corresponds to the =/+ key, we expect it to be pressed without a Shift
        case '=':
          // allow to zoom the whole page
          if (isWithPlatformMetaKey(e)) {
            return;
          }
          if (e.shiftKey) {
            return;
          }
          e.preventDefault();
          canvasService.send('ZOOM.IN');
          return;
        // this corresponds to the -/_ key, we expect it to be pressed without a Shift
        // it apparently also corresponds to the minus sign on the numpad, even though it inputs the actual minus sign (char code 8722)
        case '-':
          // allow to zoom the whole page
          if (isWithPlatformMetaKey(e)) {
            return;
          }
          if (e.shiftKey) {
            return;
          }
          e.preventDefault();
          canvasService.send('ZOOM.OUT');
          return;
        // can come from numpad
        case '1':
        // this corresponds to the 1/! key
        case '!':
          if (!e.shiftKey) {
            return;
          }
          e.preventDefault();
          canvasService.send('FIT_TO_CONTENT');
          return;
      }
    }

    window.addEventListener('keydown', keydownListener);
    return () => {
      window.removeEventListener('keydown', keydownListener);
    };
  }, []);

  /**
   * Tracks Wheel Event on canvas
   */
  useEffect(() => {
    const onCanvasWheel = (e: WheelEvent) => {
      if (zoomable && isWithPlatformMetaKey(e)) {
        e.preventDefault();
        if (e.deltaY > 0) {
          canvasService.send(
            canvasModel.events['ZOOM.OUT'](
              { x: e.clientX, y: e.clientY },
              ZoomFactor.slow,
            ),
          );
        } else if (e.deltaY < 0) {
          canvasService.send(
            canvasModel.events['ZOOM.IN'](
              { x: e.clientX, y: e.clientY },
              ZoomFactor.slow,
            ),
          );
        }
      } else if (pannable && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        canvasService.send(canvasModel.events.PAN(e.deltaX, e.deltaY));
      }
    };

    const canvasEl = canvasRef.current!;
    canvasEl.addEventListener('wheel', onCanvasWheel);
    return () => {
      canvasEl.removeEventListener('wheel', onCanvasWheel);
    };
  }, [canvasService, zoomable, pannable]);

  return (
    <div
      ref={canvasRef}
      style={{
        cursor,
        WebkitFontSmoothing: 'auto',
      }}
    >
      {children}
    </div>
  );
};
