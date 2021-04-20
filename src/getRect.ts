import { useEffect, useState } from 'react';

type RectListener = (rect: ClientRect) => void;

const rectMap: Map<
  string,
  {
    rect?: ClientRect;
    listeners: Set<RectListener>;
  }
> = new Map();

(window as any).rectMap = rectMap;

export const getRect = (id: string): ClientRect | undefined => {
  return rectMap.get(id)?.rect;
};

export const readRect = (id: string): ClientRect | undefined => {
  const el = document.querySelector(`[data-rect="${id}"]`);
  if (el) {
    setRect(id, el as HTMLElement);
  }

  return getRect(id);
};

export const setRect = (id: string, el: HTMLElement) => {
  el.dataset.rect = id;
  const currentConfig = rectMap.get(id);
  const rect = el.getBoundingClientRect();
  const nextConfig = {
    rect,
    listeners: currentConfig?.listeners ?? new Set(),
  };
  rectMap.set(id, nextConfig);
  nextConfig.listeners.forEach((listener) => listener(rect));
};

export const onRect = (id: string, listener: RectListener) => {
  let config = rectMap.get(id);
  if (!config) {
    config = { listeners: new Set() };
    rectMap.set(id, config);
  }
  config.listeners.add(listener);
  config.rect && listener(config.rect);
};

export function useGetRect(id: string) {
  const [rect, setRect] = useState(getRect(id));

  useEffect(() => {
    let af: number;
    const getNextRect = () => {
      const nextRect = readRect(id);
      if (rect?.left !== nextRect?.left || rect?.top !== nextRect?.top) {
        setRect(nextRect);
      }
      af = requestAnimationFrame(getNextRect);
    };
    af = requestAnimationFrame(getNextRect);

    return () => {
      cancelAnimationFrame(af);
    };
  }, [id]);

  return rect;
}
