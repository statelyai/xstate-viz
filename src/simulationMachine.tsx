import produce from 'immer';
import { ActorRefFrom, AnyInterpreter, InterpreterStatus, SCXML } from 'xstate';
import { AnyEventObject, assign, interpret, send, spawn } from 'xstate';
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
    serviceDataMap: {} as Record<string, ServiceData | undefined>,
    currentSessionId: null as string | null,
    events: [] as SimEvent[],
    previewEvent: undefined as string | undefined,
  },
  {
    events: {
      'SERVICE.SEND': (event: SCXML.Event<AnyEventObject>) => ({ event }),
      'MACHINES.REGISTER': (machines: Array<AnyStateMachine>) => ({
        machines,
      }),

      'MACHINES.RESET': () => ({}),
      'EVENT.PREVIEW': (eventType: string) => ({ eventType }),
      'PREVIEW.CLEAR': () => ({}),
      'SERVICE.REGISTER': (serviceData: Omit<ServiceData, 'status'>) => ({
        ...serviceData,
        // machines are always registered from within `.start()` call
        status: InterpreterStatus.Running,
      }),
      'SERVICE.STATE': (sessionId: string, state: AnyState) => ({
        sessionId,
        state,
      }),
      'SERVICE.UNREGISTER': (sessionId: string) => ({ sessionId }),
      'SERVICE.STOP': (sessionId: string) => ({ sessionId }),
      'SERVICE.FOCUS': (sessionId: string) => ({ sessionId }),
      ERROR: (message: string) => ({ message }),
    },
  },
);

export const simulationMachine = simModel.createMachine({
  context: simModel.initialContext,
  initial: new URLSearchParams(window.location.search).has('inspect')
    ? 'inspecting'
    : 'visualizing',
  entry: assign({ notifRef: () => spawn(notifMachine) }),
  invoke: {
    src: () => (sendBack) => {
      devTools.onRegister((service) => {
        sendBack(
          simModel.events['SERVICE.REGISTER']({
            sessionId: service.sessionId,
            machine: service.machine,
            state: service.state || service.initialState,
            source: 'in-app',
          }),
        );

        service.subscribe((state) => {
          // `onRegister`'s callback gets called from within `.start()`
          // `subscribe` calls the callback immediately with the current state
          // but the `service.state` state has not yet been set when this gets called for the first time from within `.start()`
          if (!state) {
            return;
          }

          sendBack(simModel.events['SERVICE.STATE'](service.sessionId, state));
        });

        service.onStop(() => {
          sendBack(simModel.events['SERVICE.STOP'](service.sessionId));
        });
      });
    },
  },
  states: {
    inspecting: {
      tags: 'inspecting',
      invoke: {
        id: 'proxy',
        src: () => (sendBack, onReceive) => {
          const receiver = createWindowReceiver({
            // for some random reason the `window.top` is being rewritten to `window.self`
            // looks like maybe some webpack replacement plugin (or similar) plays tricks on us
            // this breaks the auto-detection of the correct `targetWindow` in the `createWindowReceiver`
            // so we pass it explicitly here
            targetWindow: window.opener || window.parent,
          });

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
              case 'service.stop':
                sendBack(simModel.events['SERVICE.STOP'](event.sessionId));
                break;
              default:
                break;
            }
          }).unsubscribe;
        },
      },
    },
    visualizing: {
      tags: 'visualizing',
      invoke: {
        id: 'proxy',
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

            sendBack(
              simModel.events['SERVICE.REGISTER']({
                sessionId: rootService.sessionId,
                machine: rootService.machine,
                state: rootService.machine.initialState,
                source: 'visualizer',
              }),
            );

            rootService.subscribe((state) => {
              sendBack(
                simModel.events['SERVICE.STATE'](rootService.sessionId, state),
              );
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
        },
      },
      on: {
        'MACHINES.REGISTER': {
          actions: [
            send(
              (_, e) => ({
                type: 'INTERPRET',
                machine: e.machines[0],
              }),
              { to: 'proxy' },
            ),
          ],
        },
        'MACHINES.RESET': {
          actions: [
            simModel.assign({
              events: [],
              previewEvent: undefined,
              currentSessionId: null,
            }),
            send('RESET', { to: 'proxy' }),
          ],
        },
      },
    },
  },
  on: {
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
          events: (ctx, e) =>
            produce(ctx.events, (draft) => {
              draft.push({
                ...e.state._event,
                timestamp: Date.now(),
                sessionId: e.sessionId,
              });
            }),
        }),
      ],
    },
    'SERVICE.SEND': {
      actions: [
        (ctx, e) => {
          const eventSchema =
            ctx.serviceDataMap[ctx.currentSessionId!]!.machine.schema?.events?.[
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
              sessionId: ctx.currentSessionId,
            };
          },
          { to: 'proxy' },
        ),
      ],
    },
    'SERVICE.REGISTER': {
      actions: simModel.assign({
        serviceDataMap: (ctx, { type, ...data }) => {
          return produce(ctx.serviceDataMap, (draft) => {
            draft[data.sessionId] = data;
          });
        },
        currentSessionId: (ctx, e) => {
          return ctx.currentSessionId ?? e.sessionId;
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
    'SERVICE.FOCUS': {
      actions: simModel.assign({
        currentSessionId: (_, e) => e.sessionId,
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
});
