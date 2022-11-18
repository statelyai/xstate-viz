import { LoggedInUser, SourceFile } from '../../src/apiTypes';

describe('Forking', () => {
  describe('When you do not own the file', () => {
    it('Should allow you to fork it', () => {
      cy.setMockAuthToken();
      cy.interceptAPI<LoggedInUser>({
        id: 'id',
      });

      cy.interceptAPI<SourceFile>({
        id: 'source-file-id',
        text: '// Source file',
        project: {
          owner: {
            id: 'some-other-id',
          },
        },
      });
      cy.interceptAPI<SourceFile>({
        id: 'source-file-id-2',
        project: {
          name: 'Source File',
          owner: {
            id: 'id',
          },
        },
      });

      cy.visitVizWithNextPageProps({ id: 'source-file-id' });

      cy.getMonacoEditor().type(`{enter}{enter} // New Code Changes`);

      cy.findByRole('button', { name: /Fork/ }).click();

      cy.findByLabelText(/Choose a name/i)
        .clear()
        .type('Source File');

      cy.findByRole('button', { name: /Submit/ }).click();

      cy.contains(/New file saved successfully/i);

      cy.url().should('contain', 'source-file-id-2');
    });
  });

  describe('When you do own the file', () => {
    it('Should allow you to fork it', () => {
      cy.setMockAuthToken();
      cy.interceptAPI<LoggedInUser>({
        id: 'user-id',
      });

      cy.interceptAPI<SourceFile>({
        id: 'source-file-id',
        text: '// Source file',
        project: {
          owner: {
            id: 'user-id',
          },
        },
      });
      cy.interceptAPI<SourceFile>({
        id: 'source-file-id-2',
        project: {
          name: 'Source File',
          owner: {
            id: 'user-id',
          },
        },
      });

      cy.visitVizWithNextPageProps({ id: 'source-file-id' });

      cy.getMonacoEditor().type(`{enter}{enter} // New Code Changes`);

      cy.findByRole('button', { name: /Fork/ }).click();

      cy.findByLabelText(/Choose a name/i)
        .clear()
        .type('Source File');

      cy.findByRole('button', { name: /Submit/ }).click();

      cy.contains(/New file saved successfully/i);

      cy.url().should('contain', 'source-file-id-2');
    });
  });
});
