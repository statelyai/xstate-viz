import produce from 'immer';
import { ActorRefFrom, AnyInterpreter, SCXML } from 'xstate';
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

export const createSimModel = () =>
  createModel(
    {
      state: undefined as AnyState | undefined,
      notifRef: undefined! as ActorRefFrom<typeof notifMachine>,
      services: {} as Partial<Record<string, ServiceData>>,
      service: null as string | null,
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
        'SERVICE.FOCUS': (sessionId: string) => ({ sessionId }),
        'SERVICE.EVENT': (event: SCXML.Event<any>, sessionId: string) => ({
          event,
          sessionId,
        }),
        'SERVICE.STATE': (sessionId: string, state: AnyState) => ({
          sessionId,
          state,
        }),
      },
    },
  );

export const createSimulationMachine = () => {
  const simModel = createSimModel();
  return simModel.createMachine({
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
              locallyInterpret(event.machine);
            } else if (event.type === 'xstate.event') {
              const service = serviceMap.get(event.sessionId);

              if (service) {
                service.send(event.event);
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
              // sendBack(simModel.events['SERVICE.UNREGISTER'](service.sessionId));
            });
          });
        },
      },
      {
        id: 'receiver',
        src: () => (sendBack, onReceive) => {
          const receiver = createWindowReceiver();
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

          const stateMap: Map<string, AnyState> = new Map();

          return receiver.subscribe((event) => {
            console.log('>>>', event);
            switch (event.type) {
              case 'service.register':
                stateMap.set(event.sessionId, event.state);
                let state = event.machine.resolveState(event.state);

                sendBack(
                  simModel.events['SERVICE.REGISTER']({
                    sessionId: event.sessionId,
                    machine: event.machine,
                    state,
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
                // stateMap.set(event.sessionId, event.state);
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
      active: {
        on: {
          'MACHINES.UPDATE': {},
          'MACHINES.RESET': {
            target: 'active',
            internal: false,
            actions: [
              simModel.assign({
                events: [],
                previewEvent: undefined,
                service: null,
              }),
              send('RESET', { to: 'services' }),
            ],
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
      'SERVICE.STATE': {
        actions: [
          simModel.assign({
            services: (ctx, e) =>
              produce(ctx.services, (draft) => {
                const service = ctx.services[e.sessionId]!;
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
              ctx.services[ctx.service!]!.machine.schema?.events?.[
                e.event.type
              ];
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
                sessionId: ctx.service,
              };
            },
            { to: 'services' },
          ),
          send(
            (ctx, e) => {
              return {
                type: 'xstate.event',
                event: e.event,
                sessionId: ctx.service,
              };
            },
            { to: 'receiver' },
          ),
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
          service: (ctx, e) => {
            if (ctx.service === e.sessionId) {
              return null;
            }

            return ctx.service;
          },
        }),
      },
      'MACHINES.REGISTER': {
        actions: [
          send(
            (_, e) => ({
              type: 'INTERPRET',
              machine: e.machines[0],
            }),
            { to: 'services' },
          ),
        ],
      },
    },
  });
};
