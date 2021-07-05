import produce from 'immer';
import { ActorRefFrom, SCXML } from 'xstate';
import {
  AnyEventObject,
  assign,
  createMachine,
  interpret,
  send,
  spawn,
  State,
} from 'xstate';
import { createWindowReceiver } from '@xstate/inspect';

import { createModel } from 'xstate/lib/model';
import { devTools } from './devInterface';
import { notifMachine } from './notificationMachine';
import { AnyState, AnyStateMachine, ServiceRef } from './types';

export interface SimEvent extends SCXML.Event<any> {
  timestamp: number;
  sessionId: string;
}

export const createSimModel = () =>
  createModel(
    {
      state: undefined as AnyState | undefined,
      notifRef: undefined! as ActorRefFrom<typeof notifMachine>,
      machineIndex: undefined as number | undefined,
      machines: [] as AnyStateMachine[],
      services: {} as Partial<Record<string, ServiceRef>>,
      service: null as string | null,
      events: [] as SimEvent[],
      previewEvent: undefined as string | undefined,
    },
    {
      events: {
        'STATE.UPDATE': (state: State<any, any, any, any>) => ({ state }),
        'SERVICE.SEND': (event: AnyEventObject) => ({ event }),
        'MACHINES.UPDATE': (machines: Array<AnyStateMachine>) => ({
          machines,
        }),
        'MACHINES.VERIFY': (machines: Array<AnyStateMachine>) => ({
          machines,
        }),
        'MACHINES.RESET': () => ({}),
        'MACHINES.SET': (index: number) => ({ index }),
        'EVENT.PREVIEW': (eventType: string) => ({ eventType }),
        'PREVIEW.CLEAR': () => ({}),
        'SERVICE.REGISTER': (service: ServiceRef) => ({ service }),
        'SERVICE.UNREGISTER': (sessionId: string) => ({ sessionId }),
        'SERVICE.FOCUS': (sessionId: string) => ({ sessionId }),
        'SERVICE.EVENT': (event: SCXML.Event<any>, sessionId: string) => ({
          event,
          sessionId,
        }),
      },
    },
  );

export const createSimulationMachine = () => {
  const simModel = createSimModel();
  return createMachine<typeof simModel>({
    context: simModel.initialContext,
    initial: 'pending',
    entry: assign({ notifRef: () => spawn(notifMachine) }),
    invoke: [
      {
        id: 'services',
        src: () => (sendBack) => {
          devTools.onRegister((service) => {
            sendBack(simModel.events['SERVICE.REGISTER'](service));

            service.subscribe((state) => {
              if (!state) {
                return;
              }

              sendBack(
                simModel.events['SERVICE.EVENT'](
                  state._event,
                  service.sessionId,
                ),
              );
            });

            service.onStop(() => {
              // sendBack(simModel.events['SERVICE.UNREGISTER'](service.sessionId));
            });
          });
        },
      },
      {
        id: 'receiver',
        src: () => (sendBack) => {
          const receiver = createWindowReceiver();

          return receiver.subscribe((event) => {
            console.log(event);
            switch (event.type) {
              case 'service.register':
                const resolvedState = event.machine.resolveState(event.state);
                sendBack(
                  simModel.events['SERVICE.REGISTER']({
                    send: () => void 0,
                    subscribe: () => {
                      return { unsubscribe: () => void 0 };
                    },
                    sessionId: event.sessionId,
                    machine: event.machine,
                    getSnapshot: () => resolvedState,
                    id: event.id,
                  }),
                );
                break;
              default:
                break;
            }
          }).unsubscribe;
        },
      },
    ],
    states: {
      pending: {
        always: {
          target: 'active',
          cond: (ctx) => {
            return Object.values(ctx.services).length > 0;
          },
        },
      },
      verifying: {
        invoke: {
          src: (_, e) =>
            new Promise((resolve, reject) => {
              const machines = (e as any).machines;
              try {
                // TODO: verify without interpreting
                interpret(machines[0]).start().stop();
                resolve(machines);
              } catch (err) {
                console.error(err);
                reject(err);
              }
            }),
          onDone: {
            target: 'active',
            actions: [
              simModel.assign((_, e) => ({
                machineIndex: (e as any).data.length - 1,
                machines: (e as any).data,
              })) as any,
            ],
          },
          onError: {
            target: 'active',
            actions: [
              send(
                (_, e) => ({
                  type: 'BROADCAST',
                  status: 'error',
                  message: e.data.toString(),
                }),
                { to: (ctx) => ctx.notifRef },
              ),
            ],
          },
        },
      },
      active: {
        invoke: [
          {
            id: 'machine',
            src: (ctx) => (sendBack, onReceive) => {
              // const service = interpret(ctx.machines[ctx.machineIndex!], {
              //   devTools: true,
              // })
              //   .onTransition((state) => {
              //     sendBack({
              //       type: 'STATE.UPDATE',
              //       state,
              //     });
              //   })
              //   .start();
              const service = ctx.services[ctx.service!]!;

              sendBack(simModel.events['SERVICE.FOCUS'](service.sessionId));

              onReceive((event) => {
                service.send(event);
              });

              return () => {
                // service.stop();
              };
            },
          },
        ],
        on: {
          'MACHINES.UPDATE': {
            target: 'active',
            internal: false,
            actions: [
              simModel.assign({
                machineIndex: (_, e) => e.machines.length - 1,
                machines: (_, e) => e.machines,
              }),
            ],
          },
          'MACHINES.VERIFY': {
            target: 'verifying',
          },
          'MACHINES.RESET': {
            target: 'active',
            internal: false,
            actions: [
              simModel.assign({
                events: [],
                previewEvent: undefined,
              }),
            ],
          },
          'MACHINES.SET': {
            actions: simModel.assign({
              machineIndex: (_, e) => e.index,
            }),
          },
          'EVENT.PREVIEW': {
            actions: simModel.assign({
              previewEvent: (_, event) => event.eventType,
            }),
          },
          'PREVIEW.CLEAR': {
            actions: simModel.assign({ previewEvent: undefined }),
          },

          'SERVICE.FOCUS': {
            actions: simModel.assign({
              service: (_, e) => e.sessionId,
            }),
          },
        },
      },
    },
    on: {
      'STATE.UPDATE': {
        actions: assign({
          state: (_, e) => e.state,
        }),
      },
      'SERVICE.EVENT': {
        actions: assign({
          events: (ctx, e) =>
            produce(ctx.events, (draft) => {
              draft.push({
                ...e.event,
                timestamp: Date.now(),
                sessionId: e.sessionId,
              });
            }),
        }),
      },
      'SERVICE.SEND': {
        actions: [
          (ctx, e) => {
            const eventSchema =
              ctx.machines[ctx.machineIndex!].schema?.events?.[e.event.type];
            const eventToSend = { ...e.event };

            if (eventSchema) {
              Object.keys(eventSchema.properties).forEach((prop) => {
                const value = prompt(
                  `Enter value for "${prop}" (${eventSchema.properties[prop].type}):`,
                );

                eventToSend[prop] = value;
              });
            }

            ctx.services[ctx.service!]!.send(eventToSend);
          },
        ],
      },
      'SERVICE.REGISTER': {
        actions: simModel.assign({
          services: (ctx, e) => {
            return produce(ctx.services, (draft) => {
              draft[e.service.sessionId] = e.service;
            });
          },
          service: (ctx, e) => {
            return ctx.service ?? e.service.sessionId;
          },
        }),
      },
      'SERVICE.UNREGISTER': {
        actions: simModel.assign({
          services: (ctx, e) => {
            return produce(ctx.services, (draft) => {
              delete draft[e.sessionId];
            });
          },
        }),
      },
    },
  });
};
