describe('Events panel', () => {
  it('should list events sent to the visualized machine', () => {
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
    cy.getCanvas().findByRole('button', { name: 'OTHER_EVENT' }).click();

    cy.findByRole('tab', { name: 'Events' }).click();
    cy.findByRole('tabpanel', { name: 'Events' })
      .should('contain', 'MY_EVENT')
      .should('contain', 'OTHER_EVENT');
  });

  it('should reset the list when the viz is resetted', () => {
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
    b: {},
  },
});
`,
      }),
    );

    cy.visit('/viz');

    cy.getCanvas().findByRole('button', { name: 'MY_EVENT' }).click();

    cy.findByRole('tab', { name: 'Events' }).click();
    cy.findByRole('tabpanel', { name: 'Events' }).should('contain', 'MY_EVENT');

    cy.findByRole('button', { name: 'RESET' }).click();
    cy.findByRole('tabpanel', { name: 'Events' }).should(
      'not.contain',
      'MY_EVENT',
    );
  });

  it('should reset the list when the viz is revisualized', () => {
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
    b: {},
  },
});
`,
      }),
    );

    cy.visit('/viz');

    cy.getCanvas().findByRole('button', { name: 'MY_EVENT' }).click();

    cy.findByRole('button', { name: 'Visualize' }).click();

    cy.findByRole('tab', { name: 'Events' }).click();
    cy.findByRole('tabpanel', { name: 'Events' }).should(
      'not.contain',
      'MY_EVENT',
    );
  });

  it('should process events sent to child actors', () => {
    // Plant a fake entry in localStorage
    cy.setLocalStorage(
      'xstate_viz_raw_source|no_source',
      JSON.stringify({
        date: new Date(),
        sourceRawContent: `
import { createMachine } from "xstate";

const child = createMachine({
  id: "child",
  initial: "a",
  states: {
    a: { on: { MY_EVENT: "b" } },
    b: { on: { OTHER_EVENT: "a" } },
  },
});

createMachine({
  id: "parent",
  initial: "p",
  states: {
    p: { 
      invoke: {
        src: child
      }
    },
  },
});

`,
      }),
    );

    cy.visit('/viz');

    cy.getCanvas();

    // Switch to actors tab and select the child actor
    cy.findByRole('tab', { name: /Actors/ }).click();
    cy.findByRole('tabpanel', { name: /Actors/ })
      .findAllByTestId(/actor/)
      .last()
      .click()

    cy.getCanvas().findByRole('button', { name: 'MY_EVENT' }).click();
    cy.getCanvas().findByRole('button', { name: 'OTHER_EVENT' }).click();

    cy.findByRole('tab', { name: 'Events' }).click();
    cy.findByRole('tabpanel', { name: 'Events' })
      .should('contain', 'MY_EVENT')
      .should('contain', 'OTHER_EVENT');
  });
});
