import { createMachine } from 'xstate';

describe('Inspector', () => {
  it('should visualize an inspected machine', () => {
    cy.visitInspector();

    cy.inspectMachine(
      createMachine({
        id: 'my_inspected_machine',
        initial: 'a',
        states: {
          a: {},
        },
      }),
    );

    cy.getCanvas().contains('my_inspected_machine');
  });
});
