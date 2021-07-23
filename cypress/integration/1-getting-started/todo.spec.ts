// TODO - rewrite this based on actual user stories
describe('When the user is logged in', () => {
  it('Should allow you to fork the app', () => {
    cy.login();
    cy.interceptGraphQL({
      getLoggedInUser: {
        id: 'user-id',
      },
      getSourceFile: {
        id: 'source-file-id',
        text: `import { createMachine } from 'xstate'; createMachine({});`,
        name: 'Source File Name',
      },
      createSourceFile: {
        id: 'new-source-file-id',
        text: `import { createMachine } from 'xstate'; createMachine({});`,
      },
    });
    // TODO - configure this to use baseUrl
    cy.visit('http://localhost:3000?id=source-file-id');
    cy.contains('Source File Name', {
      timeout: 6000,
    });
    cy.contains('createMachine({})');

    cy.contains('(machine)');

    cy.contains('Fork').click();

    cy.findByPlaceholderText(/Unnamed source/i).type('New Source Name');
    cy.contains('Submit').click();

    cy.url().should('include', 'new-source-file-id');
  });
});
