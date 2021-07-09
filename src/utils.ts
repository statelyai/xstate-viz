import * as React from 'react';
import type { AnyEventObject, StateNode, TransitionDefinition } from 'xstate';

export function createRequiredContext<T>(displayName: string) {
  const context = React.createContext<T | null>(null);
  context.displayName = displayName;

  const useContext = () => {
    const ctx = React.useContext(context);
    if (!ctx) {
      throw new Error(
        `use${displayName} must be used inside ${displayName}Provider`,
      );
    }
    return ctx;
  };

  return [context.Provider, useContext] as const;
}

export interface Edge<
  TContext,
  TEvent extends AnyEventObject,
  TEventType extends TEvent['type'] = string
> {
  event: TEventType;
  source: StateNode<TContext, any, TEvent>;
  target: StateNode<TContext, any, TEvent>;
  transition: TransitionDefinition<TContext, TEvent>;
  order: number;
}

export function getChildren(stateNode: StateNode): StateNode[] {
  if (!stateNode.states) {
    return [];
  }

  const children = Object.keys(stateNode.states).map((key) => {
    return stateNode.states[key];
  });

  children.sort((a, b) => b.order - a.order);

  return children;
}

export function getEdges(stateNode: StateNode): Array<Edge<any, any, any>> {
  const edges: Array<Edge<any, any, any>> = [];

  Object.keys(stateNode.on).forEach((eventType, order) => {
    const transitions = stateNode.on[eventType];

    transitions.forEach((t) => {
      const targets = t.target && t.target.length > 0 ? t.target : [stateNode];
      targets.forEach((target) => {
        edges.push({
          event: eventType,
          source: stateNode,
          target,
          transition: t,
          order,
        });
      });
    });
  });

  return edges;
}

// export function getAllEdges(stateNode: StateNode): Array<Edge<any, any, any>> {
//   const children = getChildren(stateNode);

//   return flatten([
//     ...getEdges(stateNode),
//     ...children.map((child) => getAllEdges(child)),
//   ]);
// }

export const updateQueryParamsWithoutReload = (
  mutator: (queries: URLSearchParams) => void,
) => {
  const newURL = new URL(window.location.href);
  mutator(newURL.searchParams);
  window.history.pushState({ path: newURL.href }, '', newURL.href);
};

export const gQuery = (query: string, accessToken?: string) =>
  fetch(process.env.REACT_APP_GRAPHQL_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(accessToken && { authorization: 'Bearer ' + accessToken }),
    },
    body: JSON.stringify({
      query,
    }),
  }).then((resp) => resp.json());
