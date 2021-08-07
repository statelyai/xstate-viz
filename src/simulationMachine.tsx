import produce from 'immer';
import { ActorRefFrom, AnyInterpreter, InterpreterStatus, SCXML } from 'xstate';
import { AnyEventObject, assign, interpret, send, spawn, State } from 'xstate';
import { createWindowReceiver } from '@xstate/inspect';

import { createModel } from 'xstate/lib/model';
import { devTools } from './devInterface';
import { notifMachine } from './notificationMachine';
import { AnyState, AnyStateMachine, ServiceData } from './types';

export interface SimEvent extends SCXML.Event<any> {
  timestamp: number;
  sessionId: string;
}

export const simModel = createModel(
  {
    state: undefined as AnyState | undefined,
    notifRef: undefined! as ActorRefFrom<typeof notifMachine>,
    serviceDataMap: {} as Partial<Record<string, ServiceData>>,
    currentSessionId: null as string | null,
    events: [] as SimEvent[],
    previewEvent: undefined as string | undefined,
  },
  {
    events: {
      'STATE.UPDATE': (state: State<any, any, any, any>) => ({ state }),
      'SERVICE.SEND': (event: SCXML.Event<AnyEventObject>) => ({ event }),
      'MACHINES.UPDATE': (machines: Array<AnyStateMachine>) => ({
        machines,
      }),
      'MACHINES.REGISTER': (machines: Array<AnyStateMachine>) => ({
        machines,
      }),
      'MACHINES.RESET': () => ({}),
      'MACHINES.SET': (index: number) => ({ index }),
      'EVENT.PREVIEW': (eventType: string) => ({ eventType }),
      'PREVIEW.CLEAR': () => ({}),
      'SERVICE.REGISTER': (service: ServiceData) => ({ service }),
      'SERVICE.UNREGISTER': (sessionId: string) => ({ sessionId }),
      'SERVICE.STOP': (sessionId: string) => ({ sessionId }),
      'SERVICE.FOCUS': (sessionId: string) => ({ sessionId }),
      'SERVICE.EVENT': (event: SCXML.Event<any>, sessionId: string) => ({
        event,
        sessionId,
      }),
      'SERVICE.STATE': (sessionId: string, state: AnyState) => ({
        sessionId,
        state,
      }),
      ERROR: (message: string) => ({ message }),
    },
  },
);

export const simulationMachine = simModel.createMachine(
  {
    preserveActionOrder: true,
    context: simModel.initialContext,
    initial: 'pending',
    entry: assign({ notifRef: () => spawn(notifMachine) }),
    invoke: [
      {
        id: 'services',
        src: () => (sendBack, onReceive) => {
          const serviceMap: Map<string, AnyInterpreter> = new Map();
          let rootMachine: AnyStateMachine;
          let rootService: AnyInterpreter;

          function locallyInterpret(machine: AnyStateMachine) {
            rootMachine = machine;
            // stop all existing services
            Array.from(serviceMap.values()).forEach((runningService) => {
              runningService.stop();
              sendBack({
                type: 'SERVICE.UNREGISTER',
                sessionId: runningService.sessionId,
              });
            });
            serviceMap.clear();

            rootService = interpret(machine);
            serviceMap.set(rootService.sessionId, rootService);

            sendBack({
              type: 'SERVICE.REGISTER',
              service: {
                sessionId: rootService.sessionId,
                machine: rootService.machine,
                state: rootService.machine.initialState,
              },
            });

            rootService.subscribe((state) => {
              sendBack({
                type: 'SERVICE.STATE',
                state,
                sessionId: rootService.sessionId,
              });
            });
            rootService.start();
          }

          onReceive((event) => {
            if (event.type === 'INTERPRET') {
              try {
                locallyInterpret(event.machine);
              } catch (e) {
                sendBack(simModel.events.ERROR((e as Error).message));
              }
            } else if (event.type === 'xstate.event') {
              const service = serviceMap.get(event.sessionId);
              if (service) {
                try {
                  service.send(event.event);
                } catch (err) {
                  console.error(err);
                  sendBack(simModel.events.ERROR((err as Error).message));
                }
              }
            } else if (event.type === 'RESET') {
              rootService?.stop();
              locallyInterpret(rootMachine);
            }
          });

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
              sendBack(simModel.events['SERVICE.STOP'](service.sessionId));
            });
          });
        },
      },
      {
        id: 'receiver',
        src: () => (sendBack, onReceive) => {
          const receiver = createWindowReceiver({
            // for some random reason the `window.top` is being rewritten to `window.self`
            // looks like maybe some webpack replacement plugin (or similar) plays tricks on us
            // this breaks the auto-detection of the correct `targetWindow` in the `createWindowReceiver`
            // so we pass it explicitly here
            targetWindow: window.opener || window.parent,
          });
          (window as any).receiver = receiver;

          onReceive((event) => {
            if (event.type === 'xstate.event') {
              receiver.send({
                ...event,
                type: 'xstate.event',
                event: JSON.stringify(event.event),
              });
            }
          });

          return receiver.subscribe((event) => {
            switch (event.type) {
              case 'service.register':
                let state = event.machine.resolveState(event.state);

                sendBack(
                  simModel.events['SERVICE.REGISTER']({
                    sessionId: event.sessionId,
                    machine: event.machine,
                    state,
                    source: 'inspector',
                  }),
                );
                break;
              case 'service.state':
                sendBack(
                  simModel.events['SERVICE.STATE'](
                    event.sessionId,
                    event.state,
                  ),
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
            return Object.values(ctx.serviceDataMap).length > 0;
          },
        },
      },
      active: {
        initial: 'visualizing',
        states: {
          inspecting: {
            tags: 'inspecting',
          },
          visualizing: {
            tags: 'visualizing',
            always: {
              // Whenever any of the services are sourced from the inspector, we are actually in inspecting mode
              cond: (ctx) =>
                Object.values(ctx.serviceDataMap).some(
                  (serviceData) => serviceData!.source === 'inspector',
                ),
              target: 'inspecting',
            },
          },
        },
        on: {
          'MACHINES.UPDATE': {},
          'MACHINES.RESET': {
            target: 'active',
            internal: false,
            actions: 'resetVisualizationState',
          },
          'MACHINES.SET': {},
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
              currentSessionId: (_, e) => e.sessionId,
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
      'SERVICE.STATE': {
        actions: [
          simModel.assign({
            serviceDataMap: (ctx, e) =>
              produce(ctx.serviceDataMap, (draft) => {
                const service = ctx.serviceDataMap[e.sessionId]!;
                draft[e.sessionId]!.state = service?.machine.resolveState(
                  e.state,
                );
              }),
          }),
          send((_, e) => ({
            type: 'SERVICE.EVENT',
            event: e.state._event,
            sessionId: e.sessionId,
          })),
        ],
      },
      'SERVICE.SEND': {
        actions: [
          (ctx, e) => {
            const eventSchema =
              ctx.serviceDataMap[ctx.currentSessionId!]!.machine.schema
                ?.events?.[e.event.type];
            const eventToSend = { ...e.event };

            if (eventSchema) {
              Object.keys(eventSchema.properties).forEach((prop) => {
                const value = prompt(
                  `Enter value for "${prop}" (${eventSchema.properties[prop].type}):`,
                );

                eventToSend.data[prop] = value;
              });
            }
          },
          send(
            (ctx, e) => {
              return {
                type: 'xstate.event',
                event: e.event,
                sessionId: ctx.currentSessionId,
              };
            },
            { to: 'services' },
          ),
          send(
            (ctx, e) => {
              return {
                type: 'xstate.event',
                event: e.event,
                sessionId: ctx.currentSessionId,
              };
            },
            { to: 'receiver' },
          ),
        ],
      },
      'SERVICE.REGISTER': {
        actions: simModel.assign({
          serviceDataMap: (ctx, e) => {
            return produce(ctx.serviceDataMap, (draft) => {
              draft[e.service.sessionId] = e.service;
            });
          },
          currentSessionId: (ctx, e) => {
            return ctx.currentSessionId ?? e.service.sessionId;
          },
        }),
      },
      'SERVICE.UNREGISTER': {
        actions: simModel.assign({
          serviceDataMap: (ctx, e) => {
            return produce(ctx.serviceDataMap, (draft) => {
              delete draft[e.sessionId];
            });
          },
          currentSessionId: (ctx, e) => {
            if (ctx.currentSessionId === e.sessionId) {
              return null;
            }

            return ctx.currentSessionId;
          },
        }),
      },
      'SERVICE.STOP': {
        actions: simModel.assign({
          serviceDataMap: (ctx, e) =>
            produce(ctx.serviceDataMap, (draft) => {
              draft[e.sessionId]!.status = InterpreterStatus.Stopped;
            }),
        }),
      },
      'MACHINES.REGISTER': {
        actions: [
          'resetVisualizationState',
          send(
            (_, e) => ({
              type: 'INTERPRET',
              machine: e.machines[0],
            }),
            { to: 'services' },
          ),
        ],
      },
      ERROR: {
        actions: send(
          (_, e) => ({
            type: 'BROADCAST',
            status: 'error',
            message: e.message,
          }),
          { to: (ctx) => ctx.notifRef! },
        ),
      },
    },
  },
  {
    actions: {
      resetVisualizationState: simModel.assign<any>({
        events: [],
        previewEvent: undefined,
        currentSessionId: null,
      }),
    },
  },
);
