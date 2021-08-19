describe('Forking', () => {
  describe('When you do not own the file', () => {
    it('Should allow you to fork it', () => {
      cy.setMockAuthToken();
      cy.interceptGraphQL({
        getLoggedInUser: {
          id: 'id',
        },
        getSourceFile: {
          id: 'source-file-id',
          owner: {
            id: 'some-other-id',
          },
          text: '// Source file',
        },
        forkSourceFile: {
          id: 'source-file-id-2',
          name: 'Source File',
          owner: {
            id: 'id',
          },
        },
      });

      cy.visit('/viz/source-file-id');

      cy.getMonacoEditor().type(`{enter}{enter} // New Code Changes`);

      cy.findByRole('button', { name: /Fork/ }).click();

      cy.findByLabelText(/Choose a name/i)
        .clear()
        .type('Source File');

      cy.findByRole('button', { name: /Submit/ }).click();

      cy.url().should('contain', 'source-file-id-2');

      cy.contains(/New file saved successfully/i);
    });
  });

  describe('When you do own the file', () => {
    it('Should allow you to fork it', () => {
      cy.setMockAuthToken();
      cy.interceptGraphQL({
        getLoggedInUser: {
          id: 'user-id',
        },
        getSourceFile: {
          id: 'source-file-id',
          owner: {
            id: 'user-id',
          },
          text: '// Source file',
        },
        forkSourceFile: {
          id: 'source-file-id-2',
          name: 'Source File',
          owner: {
            id: 'user-id',
          },
        },
      });

      cy.visit('/viz/source-file-id');

      cy.getMonacoEditor().type(`{enter}{enter} // New Code Changes`);

      cy.findByRole('button', { name: /Fork/ }).click();

      cy.findByLabelText(/Choose a name/i)
        .clear()
        .type('Source File');

      cy.findByRole('button', { name: /Submit/ }).click();

      cy.url().should('contain', 'source-file-id-2');

      cy.contains(/New file saved successfully/i);
    });
  });
});
