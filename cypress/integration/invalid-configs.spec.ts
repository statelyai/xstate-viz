describe('Invalid configurations', () => {
  it('invalid actions should not crash the app', () => {
    cy.setLocalStorage(
      'xstate_viz_raw_source|no_source',
      JSON.stringify({
        date: new Date(),
        sourceRawContent: `
import { createMachine } from 'xstate';

createMachine({
  id: 'invalidEntryAction',
  initial: 'a',
  states: {
    a: {
      // accidentally used guard as an action
      entry: [{
        cond: 'isOdd',
        target: 'b',
      }]
    },
    b: {},
  },
});
`,
      }),
    );

    cy.visit('/viz');

    cy.getCanvas().contains('invalidEntryAction');
  });
});
