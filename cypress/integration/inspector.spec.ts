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

  it.only('should list events sent to an inspected machine', () => {
    cy.visitInspector();

    cy.inspectMachine(createMachine({})).then((service) => {
      service.send({ type: 'MY_EVENT' });

      cy.findByRole('tab', { name: 'Events' }).realClick();
      cy.findByRole('tabpanel', { name: 'Events' }).contains('MY_EVENT');
    });
  });
});
