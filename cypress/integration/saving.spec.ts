describe('Saving', () => {
  it('Should allow you to save a file for the first time', () => {
    cy.setMockAuthToken();

    const sourceFileToBeCreated = {
      id: 'source-file-id',
      name: 'My awesome source file',
      system: {
        owner: {
          id: 'id',
        },
      },
    };

    cy.intercept('source-file-id.json?sourceFileId=source-file-id', {
      pageProps: {
        id: sourceFileToBeCreated.id,
        data: sourceFileToBeCreated,
      },
    });
    cy.interceptAPI({
      getLoggedInUser: {
        id: 'id',
      },
      createSourceFile: {
        id: 'source-file-id',
        project: {
          name: 'Source File',
          owner: {
            id: 'id',
          },
        },
      },
    });

    cy.visit('/viz');

    cy.getMonacoEditor().type(`{enter}{enter} // New Code Changes`);

    cy.findByRole('button', { name: /Save/ }).click();

    cy.findByLabelText(/Choose a name/i).type('Source File');

    cy.findByRole('button', { name: /Submit/ }).click();

    cy.contains(/New file saved successfully/i);

    cy.url().should('contain', 'source-file-id');
  });

  it('Should allow you to save an existing file', () => {
    cy.setMockAuthToken();
    cy.interceptAPI({
      getLoggedInUser: {
        id: 'id',
      },
      getSourceFile: {
        id: 'source-file-id',
        text: '// New File',
        project: {
          name: 'Source File',
          owner: {
            id: 'id',
          },
        },
      },
      updateSourceFile: {
        id: 'source-file-id',
        project: {
          name: 'Source File',
          owner: {
            id: 'id',
          },
        },
      },
    });

    cy.visitVizWithNextPageProps({ id: 'source-file-id' });

    cy.getMonacoEditor().type(`{enter}{enter} // New Code Changes`);

    cy.findByRole('button', { name: /Save/ }).click();

    cy.contains(/Saved successfully/i);
  });
});
