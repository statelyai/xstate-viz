describe('Saving', () => {
  it('Should allow you to save a file for the first time', () => {
    cy.setMockAuthToken();
    cy.interceptGraphQL({
      getLoggedInUser: {
        id: 'id',
      },
      createSourceFile: {
        id: 'source-file-id',
        name: 'Source File',
        owner: {
          id: 'id',
        },
      },
    });

    cy.visit('/viz');

    cy.getMonacoEditor().type(`{enter}{enter} // New Code Changes`);

    cy.findByRole('button', { name: /Save/ }).click();

    cy.findByLabelText(/Choose a name/i).type('Source File');

    cy.findByRole('button', { name: /Submit/ }).click();

    cy.url().should('contain', 'source-file-id');

    cy.contains(/New file saved successfully/i);
  });

  it('Should allow you to save an existing file', () => {
    cy.setMockAuthToken();
    cy.interceptGraphQL({
      getLoggedInUser: {
        id: 'id',
      },
      getSourceFile: {
        id: 'source-file-id',
        text: '// New File',
        name: 'Source File',
        owner: {
          id: 'id',
        },
      },
      updateSourceFile: {
        id: 'source-file-id',
        name: 'Source File',
        owner: {
          id: 'id',
        },
      },
    });

    cy.visit('/viz?id=source-file-id');

    cy.getMonacoEditor().type(`{enter}{enter} // New Code Changes`);

    cy.findByRole('button', { name: /Save/ }).click();

    cy.contains(/Saved successfully/i);
  });
});
