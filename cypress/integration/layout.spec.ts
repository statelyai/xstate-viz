describe('Graph layout', () => {
  it('layout should not fail with self transitions on machine node', () => {
    // Plant a fake entry in localStorage
    cy.setLocalStorage(
      'xstate_viz_raw_source|no_source',
      JSON.stringify({
        date: new Date(),
        sourceRawContent: `
import { createMachine } from 'xstate';
const machine = createMachine({
  on: {
    // These will now display as expected
    LOAD: {},
    UPDATE: {},
  },
  states: {
    something: {},
  },
});
`,
      }),
    );

    cy.visit('/viz');

    // Will time out if visualization fails
    cy.getCanvas();
  });
});
