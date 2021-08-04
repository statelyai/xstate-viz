describe('Autocomplete in the editor', () => {
  it('Should allow you to autocomplete XState imports', () => {
    cy.visit('/');
    cy.getMonacoEditor().type('{enter}{enter}ass');

    // Wait for the autocomplete to show up
    cy.contains('assign', { timeout: 8000 });

    cy.getMonacoEditor().type('{downarrow}{downarrow}{enter}');

    cy.contains(`import { assign, createMachine } from 'xstate';`);
  });

  it('Should allow you to autocomplete from xstate/lib/model', () => {
    cy.visit('/');
    cy.getMonacoEditor().type('{enter}{enter}createMod');

    // Wait for the autocomplete to show up
    cy.contains('createModel', { timeout: 8000 });

    cy.getMonacoEditor().type('{downarrow}{enter}');

    cy.contains(`import { createModel } from 'xstate/lib/model';`);
  });
});
