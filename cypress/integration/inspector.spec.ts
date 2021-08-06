import { createMachine } from 'xstate';

describe('Inspector', () => {
  it('should visualize an inspected machine', () => {
    cy.visitInspector();

    cy.inspectMachine(
      createMachine({
        id: 'my_inspected_machine',
      }),
    );

    cy.getCanvas().contains('my_inspected_machine');
  });

  it('should list events sent to an inspected machine', () => {
    cy.visitInspector();

    cy.inspectMachine(createMachine({})).then((service) => {
      service.send({ type: 'MY_EVENT' });

      cy.findByRole('tab', { name: 'Events' }).realClick();
      cy.findByRole('tabpanel', { name: 'Events' }).contains('MY_EVENT');
    });
  });

  it('should not come with the RESET button', () => {
    cy.visitInspector();

    cy.inspectMachine(
      createMachine({
        id: 'my_inspected_machine',
      }),
    );

    // wait for the canvas being ready
    cy.getCanvas().contains('my_inspected_machine');

    cy.findByRole('button', { name: 'RESET' }).should('not.exist');
  });
});
