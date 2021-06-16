import { useContext } from 'react';
import { CanvasContext } from './CanvasContext';

export const useCanvas = () => {
  const canvas = useContext(CanvasContext);
  if (canvas === undefined) {
    throw Error('CanvasContext must be used inside CanvasContext.Provider');
  }
  return canvas;
};
