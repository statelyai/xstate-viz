import { DoneInvokeEvent, EventObject, InvokeConfig } from 'xstate';

export const createTypedInvoke = <TContext, TEvent extends EventObject, TData>(
  src: (context: TContext, event: TEvent) => Promise<TData>,
  config?: Omit<InvokeConfig<TContext, DoneInvokeEvent<TData>>, 'src'>,
): InvokeConfig<TContext, TEvent> => {
  return {
    ...config,
    src,
  };
};
