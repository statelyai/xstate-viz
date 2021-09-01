describe('Reset button', () => {
  it('should reset the visualized machine', () => {
    // Plant a fake entry in localStorage
    cy.setLocalStorage(
      'xstate_viz_raw_source|no_source',
      JSON.stringify({
        date: new Date(),
        sourceRawContent: `
import { createMachine } from 'xstate';

createMachine({
  initial: 'a',
  states: {
    a: { on: { MY_EVENT: 'b' } },
    b: { on: { OTHER_EVENT: 'a' } },
  },
});
`,
      }),
    );

    cy.visit('/viz');

    cy.getCanvas().findByRole('button', { name: 'MY_EVENT' }).click();
    cy.getCanvas()
      .findByRole('button', { name: 'OTHER_EVENT' })
      .should('not.be.disabled');

    cy.findByRole('button', { name: 'RESET' }).click();

    cy.getCanvas()
      .findByRole('button', { name: 'MY_EVENT' })
      .should('not.be.disabled');
    cy.getCanvas()
      .findByRole('button', { name: 'OTHER_EVENT' })
      .should('be.disabled');
  });
});
