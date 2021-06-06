import { useEffect, useState } from 'react';

type RectListener = (rect: ClientRect | undefined) => void;

export const rectMap: Map<string, ClientRect> = new Map();
const rectListenersMap = new Map<string, Set<RectListener>>();

(window as any).rectMap = rectMap;

const run = () => {
  document.querySelectorAll('[data-rect]').forEach((el) => {
    const rectId = (el as HTMLElement).dataset.rect!;
    readRect(rectId);
  });

  requestAnimationFrame(run);
};

requestAnimationFrame(run);

export const getRect = (id: string): ClientRect | undefined => {
  return rectMap.get(id);
};

export const readRect = (id: string): ClientRect | undefined => {
  const el = document.querySelector(`[data-rect="${id}"]`);
  if (el) {
    setRect(id, el as HTMLElement);
  }

  return getRect(id);
};

export function rectsEqual(a: ClientRect, b: ClientRect): boolean {
  return (
    a.left === b.left &&
    a.right === b.right &&
    a.top === b.top &&
    a.bottom === b.bottom
  );
}

export const setRect = (id: string, el: HTMLElement) => {
  const prevRect = getRect(id);
  el.dataset.rect = id;
  const rect = el.getBoundingClientRect();
  rectMap.set(id, rect);

  if (!prevRect || !rectsEqual(prevRect, rect)) {
    rectListenersMap.get(id)?.forEach((listener) => listener(rect));
  }
};

export const deleteRect = (id: string) => {
  rectMap.delete(id);
  rectListenersMap.get(id)?.forEach((listener) => listener(undefined));
};

export const onRect = (id: string, listener: RectListener) => {
  let set = rectListenersMap.get(id);
  if (!set) {
    set = new Set();
    rectListenersMap.set(id, set);
  }
  set.add(listener);

  const currentRect = rectMap.get(id);

  if (currentRect) {
    listener(currentRect);
  }

  return {
    unsubscribe: () => {
      rectListenersMap.get(id)?.delete(listener);
    },
  };
};

export function useGetRect(id: string) {
  const [rect, setRect] = useState(getRect(id));

  useEffect(() => {
    const sub = onRect(id, setRect);

    return sub.unsubscribe;
  }, [id]);

  return rect;
}
