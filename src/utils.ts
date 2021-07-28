import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import * as React from 'react';
import type {
  ActionObject,
  AnyEventObject,
  Interpreter,
  StateFrom,
  StateMachine,
  StateNode,
  TransitionDefinition,
} from 'xstate';
import { AnyState, AnyStateMachine } from './types';
import { print } from 'graphql';

export function createRequiredContext<
  TInterpreter extends Interpreter<any, any, any>,
>(displayName: string) {
  const context = React.createContext<TInterpreter | null>(null);
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

  /**
   * A way to create a typesafe selector you can pass into
   * useSelector
   */
  const createSelector = <Data>(
    selector: (state: TInterpreter['state']) => Data,
  ) => selector;

  return [context.Provider, useContext, createSelector] as const;
}

export interface Edge<
  TContext,
  TEvent extends AnyEventObject,
  TEventType extends TEvent['type'] = string,
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

export const getActionLabel = (action: ActionObject<any, any>) => {
  if (action.type !== 'xstate.assign') {
    return action.type;
  }

  switch (typeof action.assignment) {
    case 'object':
      const keys = Object.keys(action.assignment).join();
      return `assign ${keys}`;
    default:
      return 'assign';
  }
};

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

export const gQuery = <Data, Variables>(
  query: TypedDocumentNode<Data, Variables>,
  variables: Variables,
  accessToken?: string,
): Promise<{ data?: Data }> =>
  fetch(process.env.REACT_APP_GRAPHQL_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(accessToken && { authorization: 'Bearer ' + accessToken }),
    },
    body: JSON.stringify({
      query: print(query),
      variables,
    }),
  })
    .then((resp) => resp.json())
    .then((res) => {
      /**
       * Throw the GQL error if it comes - this
       * doesn't happen by default
       */
      if (res.errors?.[0]?.message) {
        throw new Error(res.errors?.[0].message);
      }
      return res;
    });

export function willChange(
  machine: AnyStateMachine,
  state: AnyState,
  event: AnyEventObject,
): boolean {
  return !!machine.transition(state, event).changed;
}
