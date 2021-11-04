import { interpret } from 'xstate';
import { simulationMachine } from '../simulationMachine';

describe('simulationMachine', () => {
  const service = interpret(simulationMachine);
  afterEach(() => service.stop());

  describe('UrlSearchParams', () => {
    const paramsGetSpy = jest.spyOn(URLSearchParams.prototype, 'get');
    const paramsHasSpy = jest.spyOn(URLSearchParams.prototype, 'has');

    describe('with no search params', () => {
      it('goes to state "visualizing"', () => {
        paramsGetSpy.mockReturnValue(null);
        paramsHasSpy.mockReturnValue(false);

        service.start();

        expect(service.getSnapshot().matches('visualizing')).toBe(true);
      });
    });
    describe('with /viz?inspect', () => {
      it.todo('goes to state "inspecting"');
      it.todo('creates a window receiver');
    });
    describe('with /viz?inspect&server=ws://localhost:8080', () => {
      it.todo('goes to state "inspecting"');
      it.todo('creates a websocket receiver');
    });
  });
});
