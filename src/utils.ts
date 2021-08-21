import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import * as React from 'react';
import {
  ActionObject,
  ActionTypes,
  AnyEventObject,
  CancelAction,
  Interpreter,
  SendAction,
  StateNode,
  TransitionDefinition,
} from 'xstate';
import { AnyState, AnyStateMachine } from './types';
import { print } from 'graphql';
import { useSelector } from '@xstate/react';

export function isNullEvent(eventName: string) {
  return eventName === ActionTypes.NullEvent;
}

export function isInternalEvent(eventName: string) {
  const allInternalEventsButNullEvent = Object.values(ActionTypes).filter(
    (prefix) => !isNullEvent(prefix),
  );
  return allInternalEventsButNullEvent.some((prefix) =>
    eventName.startsWith(prefix),
  );
}

export function createInterpreterContext<
  TInterpreter extends Interpreter<any, any, any>,
>(displayName: string) {
  const [Provider, useContext] =
    createRequiredContext<TInterpreter>(displayName);

  const createUseSelector =
    <Data>(selector: (state: TInterpreter['state']) => Data) =>
    () => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useSelector(useContext(), selector);
    };

  return [Provider, useContext, createUseSelector] as const;
}

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

export const isStringifiedFunction = (str: string): boolean =>
  /^function\s*\(/.test(str) || str.includes('=>');

const testPlatform = (re: RegExp): boolean =>
  re.test(window.navigator.platform);

export const isMac = () => testPlatform(/^Mac/);

export const isWithPlatformMetaKey = (event: {
  metaKey: boolean;
  ctrlKey: boolean;
}) => (isMac() ? event.metaKey : event.ctrlKey);

export const getPlatformMetaKeyLabel = () => (isMac() ? 'CMD' : 'Ctrl');

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
  fetch(process.env.NEXT_PUBLIC_GRAPHQL_API_URL, {
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
      if (res.errors) {
        throw new Error(res.errors[0]!.message);
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

export function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function isDelayedTransitionAction(
  action: ActionObject<any, any>,
): boolean {
  switch (action.type) {
    case ActionTypes.Send: {
      const sendAction = action as SendAction<
        unknown,
        AnyEventObject,
        AnyEventObject
      >;
      return (
        typeof sendAction.event === 'object' &&
        sendAction.event.type.startsWith('xstate.after')
      );
    }
    case ActionTypes.Cancel:
      return `${(action as CancelAction).sendId}`.startsWith('xstate.after');
    default:
      return false;
  }
}

export const isInputLikeElement = (el: HTMLElement) =>
  el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
