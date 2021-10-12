import { simulationMachine } from '../simulationMachine';

describe('simulationMachine', () => {
  describe('UrlSearchParams', () => {
    describe('with no search params', () => {
      it.todo('goes to state "visualizing"');
    });
    describe('with /viz?inspect', () => {
      it.todo('goes to state { inspecting: "window" }');
      it.todo('creates a window receiver');
    });
    describe('with /viz?inspect&server=localhost:8080', () => {
      it.todo('goes to state { inspecting: "websocket" }');
      it.todo('creates a websocket receiver');
    });
    describe('with /viz?inspect&server=localhost:8080&protocol=wss', () => {
      it.todo('goes to state { inspecting: "websocket" }');
      it.todo('creates a wss websocket receiver');
    });
  });
});
