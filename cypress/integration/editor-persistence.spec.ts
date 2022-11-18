import { LoggedInUser, SourceFile } from '../../src/apiTypes';

describe('Editor persistence', () => {
  const setup = () => {
    cy.setMockAuthToken();
    cy.interceptAPI<LoggedInUser>({
      id: 'id',
    });
  };

  describe('When you have unsaved changes', () => {
    it('Should show the changes when you re-enter the page', () => {
      setup();
      cy.visit('/viz');

      cy.getMonacoEditor().type(`{enter}{enter}// Code changes`);
      /**
       * There's a good reason for this specific wait!
       * We wait for the throttle of the code cache to catch up
       */
      cy.wait(500);
      cy.reload();
      cy.contains('Code changes');
    });
  });

  describe('When you have changes in localStorage that are newer than the registry', () => {
    it('Should use your localStorage changes', () => {
      cy.setMockAuthToken();

      // Plant a fake entry in localStorage
      cy.setLocalStorage(
        'xstate_viz_raw_source|source-file-id',
        JSON.stringify({
          date: new Date(),
          sourceRawContent: `// Old machine`,
        }),
      );

      cy.interceptAPI<LoggedInUser>({
        id: 'id',
      });

      cy.interceptAPI<SourceFile>({
        id: 'source-file-id',
        updatedAt: new Date('2018-04-02'),
        text: `// Changes from the registry!`,
      });

      cy.visitVizWithNextPageProps({
        id: 'source-file-id',
      });

      cy.contains('// Old machine');
    });
  });

  describe('When there are changes in the registry that are more recent than your localStorage', () => {
    it('Should override localStorage', () => {
      cy.setMockAuthToken();

      cy.setLocalStorage(
        'xstate_viz_raw_source|source-file-id',
        JSON.stringify({
          date: new Date(),
          sourceRawContent: `// Old machine`,
        }),
      );

      cy.interceptAPI({
        getLoggedInUser: {
          id: 'id',
        },
        getSourceFile: {
          id: 'source-file-id',
          /**
           * This test will work for the next 9 years ;)
           */
          updatedAt: '2030-04-02',
          text: `// Changes from the registry!`,
        },
      });

      cy.visitVizWithNextPageProps({
        id: 'source-file-id',
      });

      cy.contains('Changes from the registry!');
    });
  });
});
