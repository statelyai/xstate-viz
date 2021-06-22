import produce from 'immer';
import { ActorRefFrom, AnyInterpreter } from 'xstate';
import {
  AnyEventObject,
  assign,
  createMachine,
  EventObject,
  interpret,
  send,
  spawn,
  State,
  StateMachine,
} from 'xstate';

import { createModel } from 'xstate/lib/model';
import { devTools } from './devInterface';
import { notifMachine } from './notificationMachine';
import { AnyStateMachine } from './types';

export const createSimModel = (machine: AnyStateMachine) =>
  createModel(
    {
      state: machine.initialState,
      notifRef: undefined! as ActorRefFrom<typeof notifMachine>,
      machine: 0,
      machines: [machine],
      services: {} as Record<string, AnyInterpreter>,
      service: null as string | null,
      events: [] as EventObject[],
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
        'SERVICE.REGISTER': (service: any) => ({ service }),
        'SERVICE.UNREGISTER': (sessionId: string) => ({ sessionId }),
        'SERVICE.FOCUS': (sessionId: string) => ({ sessionId }),
      },
    },
  );

export const createSimulationMachine = (
  machine: StateMachine<any, any, any>,
) => {
  const simModel = createSimModel(machine);
  return createMachine<typeof simModel>({
    context: simModel.initialContext,
    initial: 'active',
    entry: assign({ notifRef: () => spawn(notifMachine) }),
    states: {
      verifying: {
        invoke: {
          src: (_, e) =>
            new Promise((resolve, reject) => {
              const machines = (e as any).machines;
              try {
                interpret(machines[0]).start();
                resolve(machines);
              } catch (err) {
                reject(err);
              }
            }),
          onDone: {
            target: 'active',
            actions: [
              simModel.assign((_, e) => ({
                machine: (e as any).data[0],
                machines: (e as any).data,
              })) as any,
            ],
          },
          onError: {
            target: 'active',
            actions: [
              send(
                (_, e) => ({
                  type: 'ERROR',
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
              const service = interpret(ctx.machines[ctx.machine], {
                devTools: true,
              })
                .onTransition((state) => {
                  sendBack({
                    type: 'STATE.UPDATE',
                    state,
                  });
                })
                .start();

              onReceive((event) => {
                service.send(event);
              });

              return () => {
                service.stop();
              };
            },
          },
          {
            id: 'services',
            src: (ctx) => (sendBack) => {
              devTools.onRegister((service) => {
                sendBack(simModel.events['SERVICE.REGISTER'](service));

                service.onStop(() => {
                  sendBack(
                    simModel.events['SERVICE.UNREGISTER'](service.sessionId),
                  );
                });
              });
            },
          },
        ],
        on: {
          'MACHINES.UPDATE': {
            target: 'active',
            internal: false,
            actions: [
              simModel.assign({
                machine: (_, e) => e.machines.length - 1,
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
              machine: (_, e) => e.index,
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
        actions: assign({ state: (_, e) => e.state }),
      },

      'SERVICE.SEND': {
        actions: [
          simModel.assign({
            events: (ctx, e) => ctx.events.concat(e.event),
          }),
          send(
            (ctx, e) => {
              const eventSchema =
                ctx.machines[ctx.machine].schema?.events?.[e.event.type];
              const eventToSend = { ...e.event };

              if (eventSchema) {
                Object.keys(eventSchema.properties).forEach((prop) => {
                  const value = prompt(
                    `Enter value for "${prop}" (${eventSchema.properties[prop].type}):`,
                  );

                  eventToSend[prop] = value;
                });
              }
              return eventToSend;
            },
            { to: (ctx) => ctx.services[ctx.service!] },
          ),
        ],
      },
    },
  });
};
