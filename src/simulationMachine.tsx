import { ActorRefFrom } from 'xstate';
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
import { notifMachine } from './notificationMachine';
import { AnyStateMachine } from './types';

export const createSimModel = (machine: StateMachine<any, any, any>) =>
  createModel(
    {
      state: machine.initialState,
      notifRef: undefined as ActorRefFrom<typeof notifMachine>,
      machine,
      machines: [] as AnyStateMachine[],
      events: [] as EventObject[],
      previewEvent: undefined as string | undefined,
    },
    {
      events: {
        'STATE.UPDATE': (state: State<any, any, any, any>) => ({ state }),
        EVENT: (event: AnyEventObject) => ({ event }),
        'MACHINES.UPDATE': (machines: Array<AnyStateMachine>) => ({
          machines,
        }),
        'MACHINES.VERIFY': (machines: Array<AnyStateMachine>) => ({
          machines,
        }),
        'MACHINES.RESET': () => ({}),
        'EVENT.PREVIEW': (eventType: string) => ({ eventType }),
        'PREVIEW.CLEAR': () => ({}),
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
        invoke: {
          id: 'machine',
          src: (ctx) => (sendBack, onReceive) => {
            const service = interpret(ctx.machine)
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
        on: {
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
          'EVENT.PREVIEW': {
            actions: simModel.assign({
              previewEvent: (_, event) => event.eventType,
            }),
          },
          'PREVIEW.CLEAR': {
            actions: simModel.assign({ previewEvent: undefined }),
          },
        },
      },
    },
    on: {
      'STATE.UPDATE': {
        actions: assign({ state: (_, e) => e.state }),
      },

      EVENT: {
        actions: [
          simModel.assign({
            events: (ctx, e) => ctx.events.concat(e.event),
          }),
          send(
            (ctx, e) => {
              const eventSchema = ctx.machine.schema?.events?.[e.event.type];
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
            { to: 'machine' },
          ),
        ],
      },
    },
  });
};
