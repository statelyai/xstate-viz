describe('Actors panel', () => {
  it('should show all spawned and invoked actors', () => {
    // Plant a fake entry in localStorage
    cy.setLocalStorage(
      'xstate_viz_raw_source|no_source',
      JSON.stringify({
        date: new Date(),
        sourceRawContent: `
import { createMachine, assign, spawn } from 'xstate';

const a1 = createMachine({});
const a2 = createMachine({});
const a = createMachine({
  context: {},
  invoke: {
    src: a1
  },
  entry: assign({
    ref: () => spawn(a2)
  })
});
`,
      }),
    );

    cy.visit('/viz');

    cy.getCanvas();

    cy.findByRole('tab', { name: /Actors/ }).click();

    // Should show 5:
    // - a1 (from createMachine)
    // - a2 (from createMachine)
    // - a  (from createMachine)
    // - a -> a1
    // - a -> a2
    cy.findByRole('tabpanel', { name: /Actors/ })
      .findAllByTestId(/actor:/)
      .should('have.length', 5);
  });
});
